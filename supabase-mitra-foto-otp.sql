-- KALENSARI STORE - UPDATE FORM MITRA: alamat toko, ongkos kirim ke desa Kalensari, foto profil toko, OTP WhatsApp
-- Jalankan SEKALI di Supabase > SQL Editor. Syarat: supabase-mitra-luar-kota.sql dan supabase-otp-pembeli.sql sudah pernah dijalankan
-- dan fungsi server otp-wa sudah aktif (dipakai juga oleh pendaftaran pembeli). Aman dijalankan ulang.
alter table public.mitra_luar_kota add column if not exists alamat_toko text;
alter table public.mitra_luar_kota add column if not exists ongkir_desa integer;
alter table public.mitra_luar_kota add column if not exists foto text;

create or replace function public.mitra_data(m public.mitra_luar_kota) returns jsonb language sql immutable as $$
  select jsonb_build_object('id', m.id, 'wa', m.wa, 'nama', m.nama, 'toko', m.toko, 'kota', m.kota, 'provinsi', m.provinsi,
                            'jenis', m.jenis, 'izin', m.izin, 'alamat', m.alamat, 'alamat_toko', m.alamat_toko, 'ongkir_desa', m.ongkir_desa, 'foto', m.foto, 'status', m.status) $$;

drop function if exists public.mitra_daftar(text,text,text,text,text,text,text,text,text);
drop function if exists public.mitra_daftar(text,text,text,text,text,text,text,text,text,text);
create or replace function public.mitra_daftar(p_wa text, p_pin text, p_nama text, p_toko text, p_kota text, p_provinsi text, p_jenis text, p_izin text, p_alamat_toko text, p_ongkir text, p_foto text, p_otp text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare w text := public.mitra_wa(p_wa); t text := btrim(coalesce(p_toko, '')); salah text;
begin
  if length(w) < 10 or length(w) > 15 then return jsonb_build_object('ok', false, 'pesan', 'Nomor WhatsApp tidak valid'); end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then return jsonb_build_object('ok', false, 'pesan', 'PIN harus 4-8 angka'); end if;
  if btrim(coalesce(p_nama, '')) = '' or t = '' or btrim(coalesce(p_kota, '')) = '' or btrim(coalesce(p_izin, '')) = '' then
    return jsonb_build_object('ok', false, 'pesan', 'Nama, nama toko, kota, dan nomor izin edar wajib diisi'); end if;
  if btrim(coalesce(p_alamat_toko, '')) = '' then return jsonb_build_object('ok', false, 'pesan', 'Alamat toko wajib diisi'); end if;
  if regexp_replace(coalesce(p_ongkir, ''), '\D', '', 'g') = '' or length(regexp_replace(p_ongkir, '\D', '', 'g')) > 9 then
    return jsonb_build_object('ok', false, 'pesan', 'Ongkos kirim ke desa Kalensari wajib diisi (angka)'); end if;
  if length(t) > 60 or position(',' in t) > 0 then return jsonb_build_object('ok', false, 'pesan', 'Nama toko maksimal 60 huruf dan tanpa koma'); end if;
  if exists (select 1 from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
              where s.key = 'penjual_members' and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = public.ks_k(t))
     or exists (select 1 from public.products p where public.ks_milik_toko(p.seller, t)) then
    return jsonb_build_object('ok', false, 'pesan', 'Nama toko sudah dipakai, pilih nama lain'); end if;
  if coalesce(p_foto, '') !~ '^data:image/(jpeg|png|webp);base64,' then return jsonb_build_object('ok', false, 'pesan', 'Foto profil toko wajib diisi'); end if;
  if length(p_foto) > 400000 then return jsonb_build_object('ok', false, 'pesan', 'Foto profil terlalu besar'); end if;
  if exists (select 1 from public.mitra_luar_kota where wa = w) then return jsonb_build_object('ok', false, 'pesan', 'Nomor WhatsApp sudah terdaftar. Silakan masuk.'); end if;
  -- OTP WhatsApp (kode dikirim fungsi server otp-wa, tabel pembeli_otp dari supabase-otp-pembeli.sql)
  salah := public.ks_cek_otp(w, 'daftar', p_otp);
  if salah is not null then return jsonb_build_object('ok', false, 'pesan', salah); end if;
  insert into public.mitra_luar_kota (wa, pin_hash, nama, toko, kota, provinsi, jenis, izin, alamat_toko, ongkir_desa, foto)
  values (w, extensions.crypt(p_pin, extensions.gen_salt('bf')), left(btrim(p_nama), 60), t, left(btrim(p_kota), 60), left(btrim(coalesce(p_provinsi, '')), 40),
          left(btrim(coalesce(p_jenis, '')), 40), left(btrim(p_izin), 80), left(btrim(p_alamat_toko), 200), regexp_replace(p_ongkir, '\D', '', 'g')::integer, p_foto);
  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'pesan', 'Nomor WhatsApp atau nama toko sudah terdaftar');
end $$;

revoke all on function public.mitra_daftar(text,text,text,text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.mitra_daftar(text,text,text,text,text,text,text,text,text,text,text,text) to anon, authenticated;
