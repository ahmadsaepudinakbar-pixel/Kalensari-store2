-- =====================================================================
-- KALENSARI STORE • OTP WhatsApp (Fonnte) untuk akun pembeli
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-voucher-pembeli.sql.
--
-- Isi:
--  * Kode OTP disimpan teracak (tidak bisa dibaca dari web), berlaku 5 menit, maks 5x coba.
--  * Batas kirim: 1x per 60 detik per nomor, 5x per jam per nomor, 300x per jam untuk semua.
--  * Daftar akun & lupa PIN WAJIB pakai OTP (fungsi daftar_pembeli / reset_pin_pembeli).
--  * Ganti PIN lewat fungsi ganti_pin_pembeli (cek PIN lama di server).
--  * Akun pembeli (store_settings "pembeli_accounts") tidak bisa lagi dibuat / diubah langsung
--    dari halaman web. Admin tetap bisa (fitur Reset PIN Warga).
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.pembeli_otp (
  id        bigserial primary key,
  wa        text not null,
  tujuan    text not null,                 -- daftar | lupa
  kode_hash text not null,
  exp       timestamptz not null,
  coba      integer not null default 0,
  dipakai   boolean not null default false,
  t         timestamptz not null default now()
);
create index if not exists pembeli_otp_wa_idx on public.pembeli_otp(wa, t desc);
alter table public.pembeli_otp enable row level security;          -- tanpa policy: tertutup dari web
revoke all on public.pembeli_otp from anon, authenticated;

create or replace function public.ks_wa(p text)
returns text language sql immutable as $$
  select regexp_replace(regexp_replace(coalesce(p, ''), '\D', '', 'g'), '^0', '62')
$$;

create or replace function public.ks_hash_pin_pembeli(p_wa text, p_pin text)
returns text language sql immutable set search_path = public, extensions as $$
  select encode(extensions.digest('kalensari-pembeli:' || p_wa || ':' || p_pin, 'sha256'), 'hex')
$$;

-- 1) Membuat kode OTP (hanya untuk fungsi server otp-wa / service_role)
create or replace function public.ks_buat_otp(p_wa text, p_tujuan text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text := public.ks_wa(p_wa); kode text; ada boolean;
begin
  if length(v_wa) < 10 or length(v_wa) > 15 then raise exception 'Nomor WhatsApp tidak valid'; end if;
  if p_tujuan not in ('daftar', 'lupa') then raise exception 'Tujuan tidak valid'; end if;
  select coalesce((select value ? v_wa from public.store_settings where key = 'pembeli_accounts'), false) into ada;
  if p_tujuan = 'daftar' and ada then raise exception 'Nomor ini sudah terdaftar. Silakan masuk.'; end if;
  if p_tujuan = 'lupa' and not ada then raise exception 'Nomor ini belum terdaftar. Silakan daftar.'; end if;
  if exists (select 1 from public.pembeli_otp where pembeli_otp.wa = v_wa and t > now() - interval '60 seconds') then
    raise exception 'Tunggu 1 menit sebelum minta kode lagi';
  end if;
  if (select count(*) from public.pembeli_otp where pembeli_otp.wa = v_wa and t > now() - interval '1 hour') >= 5 then
    raise exception 'Terlalu sering minta kode. Coba lagi 1 jam lagi';
  end if;
  if (select count(*) from public.pembeli_otp where t > now() - interval '1 hour') >= 300 then
    raise exception 'Layanan kode sedang sibuk. Coba lagi nanti';
  end if;
  kode := lpad((floor(random() * 1000000))::int::text, 6, '0');
  update public.pembeli_otp set dipakai = true where pembeli_otp.wa = v_wa and tujuan = p_tujuan and not dipakai;
  insert into public.pembeli_otp (wa, tujuan, kode_hash, exp)
  values (v_wa, p_tujuan, encode(extensions.digest(v_wa || ':' || p_tujuan || ':' || kode, 'sha256'), 'hex'), now() + interval '5 minutes');
  delete from public.pembeli_otp where t < now() - interval '2 days';
  return kode;
end $$;
revoke all on function public.ks_buat_otp(text, text) from public, anon, authenticated;
grant execute on function public.ks_buat_otp(text, text) to service_role;

-- 2) Memeriksa kode OTP (internal)
drop function if exists public.ks_cek_otp(text, text, text);
create or replace function public.ks_cek_otp(p_wa text, p_tujuan text, p_kode text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare r public.pembeli_otp%rowtype;
begin
  select * into r from public.pembeli_otp
   where wa = p_wa and tujuan = p_tujuan and not dipakai and exp > now()
   order by t desc limit 1 for update;
  if not found then return 'Kode tidak berlaku. Minta kode baru'; end if;
  if r.kode_hash <> encode(extensions.digest(p_wa || ':' || p_tujuan || ':' || coalesce(p_kode, ''), 'sha256'), 'hex') then
    update public.pembeli_otp set coba = coba + 1, dipakai = (coba + 1 >= 5) where id = r.id;
    return case when r.coba + 1 >= 5 then 'Terlalu banyak salah. Minta kode baru' else 'Kode salah (sisa ' || (4 - r.coba) || ' kali)' end;
  end if;
  update public.pembeli_otp set dipakai = true where id = r.id;
  return null;
end $$;
revoke all on function public.ks_cek_otp(text, text, text) from public, anon, authenticated;

-- 3) DAFTAR akun pembeli (wajib OTP)
drop function if exists public.daftar_pembeli(text, text, text, text);
create or replace function public.daftar_pembeli(p_wa text, p_nama text, p_pin text, p_otp text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare wa text := public.ks_wa(p_wa); nama text := left(trim(coalesce(p_nama, '')), 60); id text; salah text;
begin
  if nama = '' then raise exception 'Nama wajib diisi'; end if;
  if coalesce(p_pin, '') !~ '^\d{4,8}$' then raise exception 'PIN harus 4–8 angka'; end if;
  if (select value ? wa from public.store_settings where key = 'pembeli_accounts') then raise exception 'Nomor ini sudah terdaftar. Silakan masuk.'; end if;
  salah := public.ks_cek_otp(wa, 'daftar', p_otp);
  if salah is not null then return jsonb_build_object('ok', false, 'pesan', salah); end if;
  insert into public.store_settings (key, value) values ('pembeli_accounts', '{}'::jsonb) on conflict (key) do nothing;
  perform 1 from public.store_settings where key = 'pembeli_accounts' for update;
  if (select value ? wa from public.store_settings where key = 'pembeli_accounts') then raise exception 'Nomor ini sudah terdaftar. Silakan masuk.'; end if;
  id := 'u' || to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint) || substr(md5(random()::text), 1, 4);
  update public.store_settings set value = value || jsonb_build_object(wa, jsonb_build_object('h', public.ks_hash_pin_pembeli(wa, p_pin), 'id', id, 'otp', true))
   where key = 'pembeli_accounts';
  insert into public.store_settings (key, value) values ('pembeli_members', '[]'::jsonb) on conflict (key) do nothing;
  update public.store_settings
     set value = (case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end)
                 || jsonb_build_array(jsonb_build_object('id', id, 'nama', nama, 'wa', wa, 'alamat', '', 'dusun', '', 'catatan', '', 'updated', (extract(epoch from now()) * 1000)::bigint))
   where key = 'pembeli_members';
  return jsonb_build_object('ok', true, 'id', id);
end $$;
revoke all on function public.daftar_pembeli(text, text, text, text) from public;
grant execute on function public.daftar_pembeli(text, text, text, text) to anon, authenticated;

-- 4) LUPA PIN: atur PIN baru dengan OTP
drop function if exists public.reset_pin_pembeli(text, text, text);
create or replace function public.reset_pin_pembeli(p_wa text, p_otp text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare wa text := public.ks_wa(p_wa); salah text;
begin
  if coalesce(p_pin, '') !~ '^\d{4,8}$' then raise exception 'PIN harus 4–8 angka'; end if;
  salah := public.ks_cek_otp(wa, 'lupa', p_otp);
  if salah is not null then return jsonb_build_object('ok', false, 'pesan', salah); end if;
  update public.store_settings
     set value = jsonb_set(value, array[wa], (value->wa) - 'tmp' || jsonb_build_object('h', public.ks_hash_pin_pembeli(wa, p_pin), 'reset_at', (extract(epoch from now()) * 1000)::bigint))
   where key = 'pembeli_accounts' and value ? wa;
  if not found then raise exception 'Akun tidak ditemukan'; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.reset_pin_pembeli(text, text, text) from public;
grant execute on function public.reset_pin_pembeli(text, text, text) to anon, authenticated;

-- 5) GANTI PIN (cek PIN lama / PIN sementara dari admin)
create or replace function public.ganti_pin_pembeli(p_wa text, p_pin_lama text, p_pin_baru text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare wa text := public.ks_wa(p_wa); h text;
begin
  if coalesce(p_pin_baru, '') !~ '^\d{4,8}$' then raise exception 'PIN baru harus 4–8 angka'; end if;
  select value->wa->>'h' into h from public.store_settings where key = 'pembeli_accounts';
  if h is null or h <> public.ks_hash_pin_pembeli(wa, coalesce(p_pin_lama, '')) then raise exception 'PIN lama salah'; end if;
  update public.store_settings
     set value = jsonb_set(value, array[wa], (value->wa) - 'tmp' || jsonb_build_object('h', public.ks_hash_pin_pembeli(wa, p_pin_baru)))
   where key = 'pembeli_accounts';
  return true;
end $$;
revoke all on function public.ganti_pin_pembeli(text, text, text) from public;
grant execute on function public.ganti_pin_pembeli(text, text, text) to anon, authenticated;

-- 6) Kunci akun pembeli: tidak bisa dibuat / diubah / dihapus langsung dari halaman web (admin tetap bisa)
drop policy if exists "ks_kunci_akun_pembeli_ins" on public.store_settings;
create policy "ks_kunci_akun_pembeli_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key <> 'pembeli_accounts' or public.is_admin());
drop policy if exists "ks_kunci_akun_pembeli_upd" on public.store_settings;
create policy "ks_kunci_akun_pembeli_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key <> 'pembeli_accounts' or public.is_admin()) with check (key <> 'pembeli_accounts' or public.is_admin());
drop policy if exists "ks_kunci_akun_pembeli_del" on public.store_settings;
create policy "ks_kunci_akun_pembeli_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key <> 'pembeli_accounts' or public.is_admin());

-- Cek: harus menampilkan true semua
select exists (select 1 from pg_proc where proname = 'daftar_pembeli')    as daftar_otp,
       exists (select 1 from pg_proc where proname = 'reset_pin_pembeli') as lupa_pin_otp,
       exists (select 1 from pg_policy where polname = 'ks_kunci_akun_pembeli_upd') as akun_terkunci;
