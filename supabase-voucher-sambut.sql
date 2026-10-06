-- =====================================================================
-- KALENSARI STORE • Voucher SELAMAT DATANG untuk akun pembeli baru
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH: supabase-voucher-pembeli.sql, supabase-ajak-cair-otp.sql
--                   (dan supabase-id-tanpa-strip.sql bila dipakai).
--
--  * Begitu pembeli baru berhasil daftar (kode OTP WhatsApp benar), saldo voucher
--    Rp2.000 langsung masuk ke akunnya. Nilainya bisa diubah / dimatikan admin di menu Voucher.
--  * 1 nomor WhatsApp hanya bisa sekali mendapat voucher selamat datang.
--  * Akun lama tidak mendapat voucher ini (hanya pendaftaran baru setelah SQL ini dijalankan).
-- =====================================================================

-- 1) Nilai bawaan: voucher selamat datang Rp2.000 (admin bisa mengubah di menu Voucher)
create or replace function public.ks_voucher()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('aktif', true, 'kompensasi', 2000,
           'ajak', jsonb_build_object('aktif', true, 'pengundang', 2000, 'baru', 5000, 'min', 20000, 'maksBulan', 10, 'hari', 30),
           'sambut', jsonb_build_object('aktif', true, 'jumlah', 2000))
         || coalesce((select value from public.store_settings where key = 'voucher_aturan'), '{}'::jsonb)
$$;

-- 2) Internal: beri voucher selamat datang (sekali per nomor WA)
create or replace function public.ks_voucher_sambut(p_wa text)
returns integer language plpgsql security definer set search_path = public as $$
declare s jsonb := coalesce(public.ks_voucher()->'sambut', '{}'::jsonb); jml int;
begin
  if coalesce((s->>'aktif')::boolean, true) is not true then return 0; end if;
  jml := greatest(coalesce((s->>'jumlah')::int, 2000), 0);
  if jml = 0 or coalesce(p_wa, '') = '' then return 0; end if;
  perform pg_advisory_xact_lock(hashtext('ks_sambut:' || p_wa));
  if exists (select 1 from public.pembeli_mutasi where wa = p_wa and jenis = 'sambut') then return 0; end if;
  perform public.ks_saldo_pembeli(p_wa, jml, 'sambut', 'Voucher selamat datang di Kalensari Store', null);
  return jml;
end $$;
revoke all on function public.ks_voucher_sambut(text) from public, anon, authenticated;

-- 3) DAFTAR pembeli (OTP) + kode ajak opsional + voucher selamat datang
--    (isi sama dengan supabase-ajak-cair-otp.sql, ditambah voucher sambut)
create or replace function public.daftar_pembeli(p_wa text, p_nama text, p_pin text, p_otp text, p_ajak text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare wa text := public.ks_wa(p_wa); nama text := left(trim(coalesce(p_nama, '')), 60); id text; salah text; hasil_ajak jsonb; sambut int := 0;
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

  -- Kode ajak (bila ada): bonus pengundang langsung cair. Bila bermasalah, pendaftaran TETAP berhasil.
  if coalesce(trim(p_ajak), '') <> '' then
    begin
      hasil_ajak := public.ks_ajak_cair_daftar(wa, p_ajak, nama);
    exception when others then
      hasil_ajak := jsonb_build_object('ok', false, 'pesan', 'Kode ajak belum bisa diproses');
    end;
  end if;

  -- Voucher selamat datang. Bila gagal, pendaftaran TETAP berhasil.
  begin
    sambut := public.ks_voucher_sambut(wa);
  exception when others then
    sambut := 0;
  end;

  return jsonb_build_object('ok', true, 'id', id, 'wa', wa, 'sesi', public.ks_buat_sesi('pembeli', wa), 'ajak', hasil_ajak, 'sambut', sambut);
end $$;
revoke all on function public.daftar_pembeli(text, text, text, text, text) from public;
grant execute on function public.daftar_pembeli(text, text, text, text, text) to anon, authenticated;

-- Cek: harus muncul aktif = true, jumlah = 2000
select public.ks_voucher()->'sambut' as voucher_selamat_datang;
