-- =====================================================================
-- KALENSARI STORE • Ajak Tetangga: bonus pengundang CAIR SAAT DAFTAR (OTP)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH: supabase-voucher-pembeli.sql, supabase-otp-pembeli.sql,
--                   supabase-keamanan-akun.sql, supabase-keamanan-tahap2a.sql
--
-- Perubahan:
--  * Tetangga mendaftar memakai kode ajak (PB0012 / nomor WA pengundang). Begitu kode OTP
--    WhatsApp benar dan akun berhasil dibuat, bonus pengundang LANGSUNG masuk saldo voucher.
--  * Semua dicek di server (fungsi daftar_pembeli), tidak bisa dipicu dari halaman web.
--  * 1 nomor WA hanya bisa sekali diajak, tidak bisa memakai kode sendiri,
--    dan bonus pengundang tetap dibatasi "Maks. bonus pengundang / bulan".
--  * Bonus pembeli baru (bila diisi admin) tetap cair saat pesanan pertamanya selesai.
--  * Kode ajak yang dimasukkan BELAKANGAN dari dashboard (akun lama) tetap memakai aturan lama:
--    kedua bonus cair setelah pesanan pertama selesai.
--  * Pemberitahuan ke pengundang tampil di dashboard pembeli (tanpa pesan WhatsApp).
-- =====================================================================

-- 1) Kolom tambahan: kapan bonus pengundang cair
alter table public.pembeli_ajak add column if not exists cair_t timestamptz;

-- 2) Nilai bawaan: bonus pengundang Rp2.000 (admin tetap bisa mengubah di menu Voucher)
create or replace function public.ks_voucher()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('aktif', true, 'kompensasi', 2000,
           'ajak', jsonb_build_object('aktif', true, 'pengundang', 2000, 'baru', 5000, 'min', 20000, 'maksBulan', 10, 'hari', 30))
         || coalesce((select value from public.store_settings where key = 'voucher_aturan'), '{}'::jsonb)
$$;

-- 3) Internal: cairkan bonus pengundang untuk akun yang BARU SAJA lolos OTP
create or replace function public.ks_ajak_cair_daftar(p_wa text, p_kode text, p_nama text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb := public.ks_voucher(); aj jsonb := v->'ajak';
        kode text := upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'));
        v_peng text; bulan int; bonus int; awal_bulan timestamptz;
begin
  if kode = '' then return null; end if;
  if coalesce((aj->>'aktif')::boolean, true) is not true then
    return jsonb_build_object('ok', false, 'pesan', 'Program ajak tetangga sedang tidak aktif');
  end if;

  -- kode = ID akun (PB0012) atau nomor WA pengundang
  v_peng := public.ks_id_ke_wa('pembeli', kode);
  if v_peng is null then v_peng := public.ks_wa(kode); end if;
  if coalesce(v_peng, '') = '' or not coalesce((select value ? v_peng from public.store_settings where key = 'pembeli_accounts'), false) then
    return jsonb_build_object('ok', false, 'pesan', 'Kode ajak tidak ditemukan');
  end if;
  if v_peng = p_wa then return jsonb_build_object('ok', false, 'pesan', 'Tidak bisa memakai kode sendiri'); end if;
  if exists (select 1 from public.pembeli_ajak where wa = p_wa) then
    return jsonb_build_object('ok', false, 'pesan', 'Nomor ini sudah pernah diajak sebelumnya');
  end if;

  bonus := greatest(coalesce((aj->>'pengundang')::int, 0), 0);
  awal_bulan := date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  perform 1 from public.pembeli_saldo where wa = v_peng for update;   -- antre per pengundang
  select count(*) into bulan from public.pembeli_ajak
   where pengundang = v_peng and coalesce(cair_t, case when status = 'selesai' and ket is null then selesai_t end) >= awal_bulan;

  if bonus > 0 and bulan < coalesce((aj->>'maksBulan')::int, 10) then
    insert into public.pembeli_ajak (wa, pengundang, status, cair_t, ket)
    values (p_wa, v_peng, 'cair', now(), 'Bonus pengundang cair saat daftar (OTP)');
    perform public.ks_saldo_pembeli(v_peng, bonus, 'ajak',
      'Bonus ajak tetangga: ' || coalesce(nullif(trim(p_nama), ''), 'tetangga') || ' (' || left(p_wa, 4) || '****' || right(p_wa, 3) || ') sudah bergabung',
      null);
  else
    -- batas bulan ini tercapai / bonus 0: tetap tercatat, bonus pembeli baru tetap jalan
    insert into public.pembeli_ajak (wa, pengundang, status, ket)
    values (p_wa, v_peng, 'cair', 'Batas bonus pengundang bulan ini tercapai');
    bonus := 0;
  end if;
  return jsonb_build_object('ok', true, 'bonus_pengundang', bonus,
                            'baru', greatest(coalesce((aj->>'baru')::int, 0), 0), 'min', coalesce((aj->>'min')::int, 0));
end $$;
revoke all on function public.ks_ajak_cair_daftar(text, text, text) from public, anon, authenticated;

-- 4) DAFTAR pembeli (OTP) + kode ajak opsional
--    (isi sama dengan supabase-keamanan-tahap2a.sql, ditambah p_ajak)
drop function if exists public.daftar_pembeli(text, text, text, text);
create or replace function public.daftar_pembeli(p_wa text, p_nama text, p_pin text, p_otp text, p_ajak text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare wa text := public.ks_wa(p_wa); nama text := left(trim(coalesce(p_nama, '')), 60); id text; salah text; hasil_ajak jsonb;
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

  -- OTP benar + akun dibuat => bonus pengundang langsung cair.
  -- Bila kode ajak bermasalah, pendaftaran TETAP berhasil.
  if coalesce(trim(p_ajak), '') <> '' then
    begin
      hasil_ajak := public.ks_ajak_cair_daftar(wa, p_ajak, nama);
    exception when others then
      hasil_ajak := jsonb_build_object('ok', false, 'pesan', 'Kode ajak belum bisa diproses');
    end;
  end if;

  return jsonb_build_object('ok', true, 'id', id, 'wa', wa, 'sesi', public.ks_buat_sesi('pembeli', wa), 'ajak', hasil_ajak);
end $$;
revoke all on function public.daftar_pembeli(text, text, text, text, text) from public;
grant execute on function public.daftar_pembeli(text, text, text, text, text) to anon, authenticated;

-- 5) Pesanan pertama SELESAI:
--    status 'menunggu' (kode dipakai belakangan) -> bonus pembeli baru + pengundang (aturan lama)
--    status 'cair'     (kode dipakai saat daftar) -> hanya bonus pembeli baru (pengundang sudah cair)
create or replace function public.ks_voucher_ajak()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb := public.ks_voucher(); aj jsonb := v->'ajak'; r public.pembeli_ajak%rowtype; v_wa text := nullif(new.customer_phone_normalized, '');
        bulan int;
begin
  if v_wa is null then return null; end if;
  select * into r from public.pembeli_ajak where pembeli_ajak.wa = v_wa and status in ('menunggu', 'cair') for update;
  if not found then return null; end if;
  if r.t < now() - make_interval(days => coalesce((aj->>'hari')::int, 30)) then
    update public.pembeli_ajak set status = case when r.status = 'cair' then 'selesai' else 'kedaluwarsa' end,
           ket = case when r.status = 'cair' then coalesce(ket, '') || ' • bonus pembeli baru kedaluwarsa' else ket end
     where pembeli_ajak.wa = v_wa;
    return null;
  end if;
  if coalesce((aj->>'aktif')::boolean, true) is not true then return null; end if;
  if coalesce(new.subtotal, 0) < coalesce((aj->>'min')::int, 0) then return null; end if;   -- tunggu pesanan yang cukup besar
  if coalesce((aj->>'baru')::int, 0) > 0 then
    perform public.ks_saldo_pembeli(v_wa, (aj->>'baru')::int, 'ajak_baru', 'Bonus pembeli baru (diajak tetangga)', new.order_code);
  end if;
  if r.status = 'cair' then
    update public.pembeli_ajak set status = 'selesai', order_code = new.order_code, selesai_t = coalesce(selesai_t, now()) where pembeli_ajak.wa = v_wa;
    return null;
  end if;
  select count(*) into bulan from public.pembeli_ajak where pengundang = r.pengundang
     and coalesce(cair_t, case when status = 'selesai' and ket is null then selesai_t end)
         >= date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  if coalesce((aj->>'pengundang')::int, 0) > 0 and bulan < coalesce((aj->>'maksBulan')::int, 10) then
    perform public.ks_saldo_pembeli(r.pengundang, (aj->>'pengundang')::int, 'ajak', 'Bonus ajak tetangga (' || left(v_wa, 4) || '****' || right(v_wa, 3) || ')', new.order_code);
    update public.pembeli_ajak set status = 'selesai', order_code = new.order_code, selesai_t = now(), cair_t = now() where pembeli_ajak.wa = v_wa;
  else
    update public.pembeli_ajak set status = 'selesai', order_code = new.order_code, selesai_t = now(), ket = 'Batas bonus pengundang bulan ini tercapai' where pembeli_ajak.wa = v_wa;
  end if;
  return null;
end $$;
drop trigger if exists ks_voucher_ajak on public.orders;
create trigger ks_voucher_ajak after update on public.orders
  for each row when (new.status = 'selesai' and old.status is distinct from new.status)
  execute function public.ks_voucher_ajak();

-- Cek: harus menampilkan true semua
select exists (select 1 from pg_proc where proname = 'ks_ajak_cair_daftar') as cair_saat_daftar,
       exists (select 1 from information_schema.parameters where specific_schema = 'public'
                 and specific_name like 'daftar_pembeli%' and parameter_name = 'p_ajak') as daftar_dengan_kode,
       exists (select 1 from pg_trigger where tgname = 'ks_voucher_ajak') as bonus_pembeli_baru;
