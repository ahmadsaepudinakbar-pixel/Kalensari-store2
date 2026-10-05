-- =====================================================================
-- KALENSARI STORE • Keamanan akun tahap 2A
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-akun.sql (tahap 1).
--
-- Isi:
--  * Sesi masuk: setelah PIN benar, server memberi "kunci sesi" acak. Mengubah data akun
--    (profil, alamat, toko) hanya bisa dengan kunci sesi itu, bukan cukup tahu nomor WA.
--  * Data pembeli (nama, WA, alamat, titik rumah) dan daftar akun pembeli TIDAK bisa lagi
--    dibaca dari web. Pembeli hanya bisa melihat & mengubah datanya sendiri. Admin tetap bisa semua.
--  * Data penjual / kurir / jasa tetap tampil (nama toko, lokasi toko, dll), tetapi dari web:
--      - tidak bisa mengubah / menghapus data akun orang lain,
--      - tidak bisa menyetujui diri sendiri (status "menunggu persetujuan" & tampil/sembunyi hanya admin).
--  * Masuk pakai ID akun (PB-0001 dst.) diperiksa di server.
--  * Setelah PIN diganti / direset, semua sesi lama otomatis keluar.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- 1) Tabel sesi (tertutup dari web)
create table if not exists public.akun_sesi (
  token_hash text primary key,
  peran      text not null,
  wa         text not null,
  dibuat     timestamptz not null default now(),
  dipakai    timestamptz not null default now(),
  exp        timestamptz not null default now() + interval '180 days'
);
create index if not exists akun_sesi_wa_idx on public.akun_sesi(peran, wa);
alter table public.akun_sesi enable row level security;
revoke all on public.akun_sesi from anon, authenticated;

create or replace function public.ks_buat_sesi(p_peran text, p_wa text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare tok text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  insert into public.akun_sesi (token_hash, peran, wa) values (encode(extensions.digest(tok, 'sha256'), 'hex'), p_peran, p_wa);
  delete from public.akun_sesi where peran = p_peran and wa = p_wa and token_hash in (
    select token_hash from public.akun_sesi where peran = p_peran and wa = p_wa order by dibuat desc offset 10);
  delete from public.akun_sesi where exp < now();
  return tok;
end $$;
revoke all on function public.ks_buat_sesi(text, text) from public, anon, authenticated;

-- Hasil: nomor WA pemilik sesi, atau null bila sesi tidak berlaku
create or replace function public.ks_sesi_wa(p_sesi text, p_peran text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text;
begin
  if coalesce(p_sesi, '') = '' then return null; end if;
  update public.akun_sesi set dipakai = now()
   where token_hash = encode(extensions.digest(p_sesi, 'sha256'), 'hex') and peran = p_peran and exp > now()
  returning wa into v_wa;
  if v_wa is not null and not coalesce((select s.value ? v_wa from public.store_settings s where s.key = p_peran || '_accounts'), false) then
    return null;   -- akun sudah dihapus admin
  end if;
  return v_wa;
end $$;
revoke all on function public.ks_sesi_wa(text, text) from public, anon, authenticated;

-- PIN baru (reset admin / lupa PIN) => semua sesi lama dihapus
create or replace function public.ks_akun_pin_set(p_peran text, p_wa text, p_h text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() < 1 then raise exception 'Tidak diizinkan'; end if;
  if exists (select 1 from public.akun_pin where peran = p_peran and wa = p_wa and h <> p_h) then
    delete from public.akun_sesi where peran = p_peran and wa = p_wa;
  end if;
  insert into public.akun_pin (peran, wa, h) values (p_peran, p_wa, p_h)
  on conflict (peran, wa) do update set h = excluded.h, gagal = 0, kunci_sampai = null, updated_at = now();
end $$;

create or replace function public.ks_akun_pin_hapus(p_peran text, p_wa text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() < 1 then raise exception 'Tidak diizinkan'; end if;
  delete from public.akun_pin where peran = p_peran and wa = p_wa;
  delete from public.akun_sesi where peran = p_peran and wa = p_wa;
end $$;

-- 2) Penjaga data akun (tahap 1) + tidak boleh mendaftar memakai ID akun orang lain
create or replace function public.ks_jaga_akun()
returns trigger language plpgsql set search_path = public as $$
declare v_peran text := public.ks_peran_akun(NEW.key); v_lama jsonb; v_baru jsonb := '{}'::jsonb;
        v_kuasa boolean; k text; v jsonb;
begin
  if v_peran is null then return NEW; end if;
  v_kuasa := current_user not in ('anon', 'authenticated') or coalesce(public.is_admin(), false);
  if TG_OP = 'UPDATE' then v_lama := OLD.value;
  elsif exists (select 1 from public.store_settings s where s.key = NEW.key) then
    return NEW;
  end if;
  if v_lama is null or jsonb_typeof(v_lama) <> 'object' then v_lama := '{}'::jsonb; end if;
  if NEW.value is null or jsonb_typeof(NEW.value) <> 'object' then
    if v_kuasa then NEW.value := '{}'::jsonb; else raise exception 'Data akun tidak valid'; end if;
  end if;
  for k, v in select * from jsonb_each(NEW.value) loop
    if jsonb_typeof(v) <> 'object' then continue; end if;
    if v_kuasa or not (v_lama ? k) then
      if not v_kuasa and exists (select 1 from jsonb_each(v_lama) e where e.value->>'id' = v->>'id') then
        raise exception 'ID akun sudah dipakai';
      end if;
      if coalesce(v->>'h', '') <> '' then perform public.ks_akun_pin_set(v_peran, k, v->>'h'); end if;
      v_baru := v_baru || jsonb_build_object(k, v - 'h');
    else
      v_baru := v_baru || jsonb_build_object(k, (v - 'h' - 'id') || jsonb_build_object('id', v_lama->k->'id'));
    end if;
  end loop;
  for k, v in select * from jsonb_each(v_lama) loop
    if not (v_baru ? k) then
      if v_kuasa then perform public.ks_akun_pin_hapus(v_peran, k);
      else v_baru := v_baru || jsonb_build_object(k, v - 'h'); end if;
    end if;
  end loop;
  NEW.value := v_baru;
  return NEW;
end $$;

-- 3) Penjaga data anggota (penjual / kurir / jasa / pembeli)
--    Dari web (bukan admin): hanya boleh MENAMBAH anggota baru (otomatis "menunggu persetujuan").
--    Mengubah data sendiri harus lewat fungsi simpan_anggota (pakai sesi).
create or replace function public.ks_jaga_anggota()
returns trigger language plpgsql set search_path = public as $$
declare v_lama jsonb; v_baru jsonb := '[]'::jsonb; el jsonb; ada jsonb; ids text[] := '{}';
begin
  if NEW.key not in ('pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members') then return NEW; end if;
  if current_user not in ('anon', 'authenticated') or coalesce(public.is_admin(), false) then return NEW; end if;
  if TG_OP = 'UPDATE' then v_lama := OLD.value;
  elsif exists (select 1 from public.store_settings s where s.key = NEW.key) then
    return NEW;
  end if;
  if v_lama is null or jsonb_typeof(v_lama) <> 'array' then v_lama := '[]'::jsonb; end if;
  if NEW.value is null or jsonb_typeof(NEW.value) <> 'array' then raise exception 'Data anggota tidak valid'; end if;
  -- anggota lama tetap persis seperti semula
  for el in select e from jsonb_array_elements(v_lama) e loop
    v_baru := v_baru || jsonb_build_array(el);
    if jsonb_typeof(el) = 'object' then ids := ids || coalesce(el->>'id', ''); end if;
  end loop;
  -- anggota baru boleh ditambah, selalu menunggu persetujuan admin
  for el in select e from jsonb_array_elements(NEW.value) e loop
    if jsonb_typeof(el) <> 'object' or coalesce(el->>'id', '') = '' or (el->>'id') = any(ids) then continue; end if;
    el := el || jsonb_build_object('pending', true);
    if NEW.key = 'jasa_members' then el := el || jsonb_build_object('status', 'Hide'); end if;
    v_baru := v_baru || jsonb_build_array(el);
    ids := ids || (el->>'id');
  end loop;
  NEW.value := v_baru;
  return NEW;
end $$;
drop trigger if exists ks_jaga_anggota on public.store_settings;
create trigger ks_jaga_anggota before insert or update on public.store_settings
  for each row execute function public.ks_jaga_anggota();

-- 4) Kunci data pembeli & daftar permintaan reset PIN: tidak bisa dibaca / diubah dari web (admin & fungsi server tetap bisa)
drop policy if exists "ks_rahasia_pembeli_sel" on public.store_settings;
create policy "ks_rahasia_pembeli_sel" on public.store_settings as restrictive for select to anon, authenticated
  using (key not in ('pembeli_members', 'pembeli_accounts', 'reset_pin') or public.is_admin());
drop policy if exists "ks_rahasia_pembeli_ins" on public.store_settings;
create policy "ks_rahasia_pembeli_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key not in ('pembeli_members', 'reset_pin') or public.is_admin());
drop policy if exists "ks_rahasia_pembeli_upd" on public.store_settings;
create policy "ks_rahasia_pembeli_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key not in ('pembeli_members', 'reset_pin') or public.is_admin()) with check (key not in ('pembeli_members', 'reset_pin') or public.is_admin());
drop policy if exists "ks_rahasia_pembeli_del" on public.store_settings;
create policy "ks_rahasia_pembeli_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key not in ('pembeli_members', 'reset_pin') or public.is_admin());

-- 5) MASUK (semua peran). p_wa boleh nomor WA atau ID akun (PB-0001 / PJ-0001 / KR-0001 / JS-0001)
--    Hasil: {ok:true, wa, id, tmp, sesi} atau {ok:false, pesan, kunci}
create or replace function public.ks_id_ke_wa(p_peran text, p_kode text)
returns text language plpgsql stable security definer set search_path = public as $$
declare m text := upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g')); awal text; mid text; v_wa text;
begin
  awal := case p_peran when 'pembeli' then 'PB' when 'penjual' then 'PJ' when 'kurir' then 'KR' when 'jasa' then 'JS' end;
  if m !~ ('^' || awal || '-?[0-9]{1,6}$') then return null; end if;
  m := awal || '-' || lpad(regexp_replace(m, '\D', '', 'g')::int::text, 4, '0');
  select x->>'id' into mid from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = p_peran || '_members' and upper(x->>'kode') = m limit 1;
  if mid is null then return ''; end if;
  select e.key into v_wa from public.store_settings s, jsonb_each(case when jsonb_typeof(s.value) = 'object' then s.value else '{}'::jsonb end) e
   where s.key = p_peran || '_accounts' and e.value->>'id' = mid limit 1;
  return coalesce(v_wa, '');
end $$;
revoke all on function public.ks_id_ke_wa(text, text) from public, anon, authenticated;

create or replace function public.masuk_akun(p_peran text, p_wa text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_salah text; a jsonb;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  v_wa := public.ks_id_ke_wa(p_peran, p_wa);
  if v_wa = '' then return jsonb_build_object('ok', false, 'pesan', 'ID akun tidak ditemukan. Periksa lagi atau masuk dengan nomor WhatsApp.', 'kunci', false); end if;
  v_wa := coalesce(v_wa, public.ks_wa(p_wa));
  v_salah := public.ks_cek_pin(p_peran, v_wa, p_pin);
  if v_salah is not null then
    return jsonb_build_object('ok', false, 'pesan', v_salah, 'kunci', v_salah like 'Akun dikunci%' or v_salah like 'PIN salah 5 kali%');
  end if;
  select s.value->v_wa into a from public.store_settings s where s.key = p_peran || '_accounts';
  return jsonb_build_object('ok', true, 'wa', v_wa, 'id', a->>'id', 'tmp', coalesce((a->>'tmp')::boolean, false),
                            'sesi', public.ks_buat_sesi(p_peran, v_wa));
end $$;
revoke all on function public.masuk_akun(text, text, text) from public;
grant execute on function public.masuk_akun(text, text, text) to anon, authenticated;

-- 6) GANTI PIN: semua sesi lama keluar, perangkat ini mendapat sesi baru
create or replace function public.ganti_pin_akun(p_peran text, p_wa text, p_pin_lama text, p_pin_baru text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text := public.ks_wa(p_wa); v_salah text;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  if coalesce(p_pin_baru, '') !~ '^\d{4,8}$' then raise exception 'PIN baru harus 4–8 angka'; end if;
  v_salah := public.ks_cek_pin(p_peran, v_wa, p_pin_lama);
  if v_salah is not null then
    return jsonb_build_object('ok', false, 'pesan', replace(v_salah, 'Nomor atau PIN salah', 'PIN lama salah'));
  end if;
  update public.akun_pin set h = encode(extensions.digest('kalensari-' || p_peran || ':' || v_wa || ':' || p_pin_baru, 'sha256'), 'hex'),
         gagal = 0, kunci_sampai = null, updated_at = now()
   where peran = p_peran and wa = v_wa;
  update public.store_settings set value = jsonb_set(value, array[v_wa], (value->v_wa) - 'tmp')
   where key = p_peran || '_accounts' and value->v_wa ? 'tmp';
  delete from public.akun_sesi where peran = p_peran and wa = v_wa;
  return jsonb_build_object('ok', true, 'sesi', public.ks_buat_sesi(p_peran, v_wa));
end $$;

-- 7) KELUAR: hapus sesi perangkat ini
create or replace function public.keluar_akun(p_sesi text)
returns void language sql security definer set search_path = public, extensions as $$
  delete from public.akun_sesi where token_hash = encode(extensions.digest(coalesce(p_sesi, ''), 'sha256'), 'hex')
$$;
revoke all on function public.keluar_akun(text) from public;
grant execute on function public.keluar_akun(text) to anon, authenticated;

-- 8) DATA SAYA (semua peran): {ok, wa, id, tmp, kode, data}
create or replace function public.akun_saya(p_sesi text, p_peran text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; a jsonb; m jsonb;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  v_wa := public.ks_sesi_wa(p_sesi, p_peran);
  if v_wa is null then return jsonb_build_object('ok', false, 'sesi_habis', true, 'pesan', 'Sesi berakhir. Silakan masuk lagi.'); end if;
  select s.value->v_wa into a from public.store_settings s where s.key = p_peran || '_accounts';
  select x into m from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = p_peran || '_members' and x->>'id' = a->>'id' limit 1;
  return jsonb_build_object('ok', true, 'wa', v_wa, 'id', a->>'id', 'tmp', coalesce((a->>'tmp')::boolean, false),
                            'kode', m->>'kode', 'data', coalesce(m, jsonb_build_object('id', a->>'id', 'wa', v_wa)));
end $$;
revoke all on function public.akun_saya(text, text) from public;
grant execute on function public.akun_saya(text, text) to anon, authenticated;

-- 9) SIMPAN DATA SAYA (semua peran). Kolom yang hanya boleh diatur admin tidak ikut berubah.
create or replace function public.simpan_anggota(p_sesi text, p_peran text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; arr jsonb; hasil jsonb := '[]'::jsonb; el jsonb; baru jsonb; ketemu boolean := false;
        jaga text[] := array['id', 'kode', 'wa', 'pending', 'status', 'dibuatAdmin', 'joined_admin'];
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data tidak valid'; end if;
  if length(p_data::text) > 900000 then raise exception 'Data terlalu besar (foto terlalu besar?)'; end if;
  v_wa := public.ks_sesi_wa(p_sesi, p_peran);
  if v_wa is null then return jsonb_build_object('ok', false, 'sesi_habis', true, 'pesan', 'Sesi berakhir. Silakan masuk lagi.'); end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = p_peran || '_accounts';
  if v_id is null then return jsonb_build_object('ok', false, 'pesan', 'Akun tidak ditemukan'); end if;
  insert into public.store_settings (key, value) values (p_peran || '_members', '[]'::jsonb) on conflict (key) do nothing;
  select value into arr from public.store_settings where key = p_peran || '_members' for update;
  if jsonb_typeof(arr) <> 'array' then arr := '[]'::jsonb; end if;
  for el in select e from jsonb_array_elements(arr) e loop
    if not ketemu and jsonb_typeof(el) = 'object' and el->>'id' = v_id then
      baru := el || (p_data - jaga);
      ketemu := true;
      hasil := hasil || jsonb_build_array(baru);
    else
      hasil := hasil || jsonb_build_array(el);
    end if;
  end loop;
  if not ketemu then
    baru := (p_data - jaga) || jsonb_build_object('id', v_id, 'wa', v_wa, 'pending', p_peran <> 'pembeli');
    hasil := hasil || jsonb_build_array(baru);
  end if;
  update public.store_settings set value = hasil where key = p_peran || '_members';
  select x into baru from public.store_settings s, jsonb_array_elements(s.value) x
   where s.key = p_peran || '_members' and x->>'id' = v_id limit 1;
  return jsonb_build_object('ok', true, 'data', baru);
end $$;
revoke all on function public.simpan_anggota(text, text, jsonb) from public;
grant execute on function public.simpan_anggota(text, text, jsonb) to anon, authenticated;

-- 10) DAFTAR pembeli (OTP) sekarang langsung memberi sesi
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
  return jsonb_build_object('ok', true, 'id', id, 'wa', wa, 'sesi', public.ks_buat_sesi('pembeli', wa));
end $$;

-- 11) Minta bantuan admin (lupa PIN tanpa OTP): tidak perlu membaca data akun dari web
create or replace function public.minta_reset_pin(p_peran text, p_wa text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_wa(p_wa); a jsonb; nama text; r jsonb;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  select s.value->v_wa into a from public.store_settings s where s.key = p_peran || '_accounts';
  if a is null then return jsonb_build_object('ok', false, 'pesan', 'Nomor ini belum terdaftar.'); end if;
  select x->>'nama' into nama from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = p_peran || '_members' and x->>'id' = a->>'id' limit 1;
  insert into public.store_settings (key, value) values ('reset_pin', '{}'::jsonb) on conflict (key) do nothing;
  select value into r from public.store_settings where key = 'reset_pin' for update;
  if jsonb_typeof(r) <> 'object' then r := '{}'::jsonb; end if;
  if (r->v_wa->>'t')::bigint > (extract(epoch from now()) * 1000)::bigint - 600000 then
    return jsonb_build_object('ok', true, 'nama', nama);   -- sudah diminta < 10 menit lalu
  end if;
  update public.store_settings set value = r || jsonb_build_object(v_wa, jsonb_build_object('peran', p_peran, 'nama', coalesce(nama, ''), 't', (extract(epoch from now()) * 1000)::bigint, 'status', 'baru'))
   where key = 'reset_pin';
  return jsonb_build_object('ok', true, 'nama', nama);
end $$;
revoke all on function public.minta_reset_pin(text, text) from public;
grant execute on function public.minta_reset_pin(text, text) to anon, authenticated;

-- Cek: semua harus true
select exists (select 1 from pg_proc where proname = 'akun_saya')      as data_saya,
       exists (select 1 from pg_proc where proname = 'simpan_anggota') as simpan_aman,
       exists (select 1 from pg_trigger where tgname = 'ks_jaga_anggota') as penjaga_anggota,
       exists (select 1 from pg_policy where polname = 'ks_rahasia_pembeli_sel') as data_pembeli_rahasia;
