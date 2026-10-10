-- =====================================================================
-- SATU AKUN: pembeli + penyedia jasa + lapak barter (jalankan SEKALI di Supabase > SQL Editor,
-- setelah supabase-keamanan-akun.sql dan supabase-keamanan-tahap2a.sql)
--
--  * Akun induk = akun pembeli. Lapak barter (pasar.html) sudah memakai akun pembeli.
--  * Profil jasa yang nomor WA-nya SAMA dengan akun pembeli memakai PIN pembeli (satu PIN).
--  * Profil jasa tanpa akun pembeli tetap memakai PIN jasanya sendiri, sampai pemiliknya membuat akun pembeli.
--  * PERHATIAN: bila pemilik punya akun pembeli DAN akun jasa dengan PIN berbeda, sejak SQL ini
--    yang berlaku adalah PIN pembeli. Lupa PIN? Reset lewat admin seperti biasa.
--  * Aman dijalankan ulang.
-- =====================================================================

-- 1) Apakah profil jasa untuk WA ini mengikuti akun pembeli?
create or replace function public.ks_jasa_ikut_pembeli(p_wa text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select s.value ? p_wa from public.store_settings s where s.key = 'jasa_accounts'), false)
     and coalesce((select s.value ? p_wa from public.store_settings s where s.key = 'pembeli_accounts'), false)
     and exists (select 1 from public.akun_pin where peran = 'pembeli' and wa = p_wa)
$$;
revoke all on function public.ks_jasa_ikut_pembeli(text) from public, anon, authenticated;

-- 2) Simpan fungsi lama (sekali saja), lalu pasang pembungkus
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'ks_cek_pin_asli' and pronamespace = 'public'::regnamespace) then
    alter function public.ks_cek_pin(text, text, text) rename to ks_cek_pin_asli;
  end if;
  if not exists (select 1 from pg_proc where proname = 'ganti_pin_akun_asli' and pronamespace = 'public'::regnamespace) then
    alter function public.ganti_pin_akun(text, text, text, text) rename to ganti_pin_akun_asli;
  end if;
end $$;
revoke all on function public.ks_cek_pin_asli(text, text, text) from public, anon, authenticated;
revoke all on function public.ganti_pin_akun_asli(text, text, text, text) from public, anon, authenticated;

-- 3) Cek PIN: jasa ikut PIN pembeli bila akun pembeli ada (kunci 5x salah juga ikut akun pembeli)
create or replace function public.ks_cek_pin(p_peran text, p_wa text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text := public.ks_wa(p_wa);
begin
  if p_peran = 'jasa' and public.ks_jasa_ikut_pembeli(v_wa) then
    return public.ks_cek_pin_asli('pembeli', v_wa, p_pin);
  end if;
  return public.ks_cek_pin_asli(p_peran, v_wa, p_pin);
end $$;
revoke all on function public.ks_cek_pin(text, text, text) from public, anon, authenticated;

-- 4) Ganti PIN: untuk jasa yang ikut pembeli, PIN diubah dari akun pembeli (satu sumber PIN)
create or replace function public.ganti_pin_akun(p_peran text, p_wa text, p_pin_lama text, p_pin_baru text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if p_peran = 'jasa' and public.ks_jasa_ikut_pembeli(public.ks_wa(p_wa)) then
    return jsonb_build_object('ok', false, 'pesan', 'PIN profil jasa mengikuti akun pembeli. Ubah PIN lewat menu Akun & PIN di akun pembeli.');
  end if;
  return public.ganti_pin_akun_asli(p_peran, p_wa, p_pin_lama, p_pin_baru);
end $$;
revoke all on function public.ganti_pin_akun(text, text, text, text) from public;
grant execute on function public.ganti_pin_akun(text, text, text, text) to anon, authenticated;
