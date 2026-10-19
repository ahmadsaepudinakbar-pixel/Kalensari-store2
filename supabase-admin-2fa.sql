-- =====================================================================
-- KALENSARI STORE • VERIFIKASI 2 LANGKAH (2FA) UNTUK ADMIN
-- Jalankan SETELAH supabase-admin-auth.sql. Aman dijalankan ulang.
-- Sudah termasuk aturan admin "lihat saja" (supabase-admin-lihat.sql).
--
-- URUTAN AMAN:
--   1. Unggah admin-2fa.js + file html/js baru ke GitHub, tunggu Actions ✅.
--   2. Masuk admin.html -> pasang 2FA (pindai QR dengan Google Authenticator).
--   3. Baru jalankan file ini.
--
-- Aturan: akun admin yang SUDAH memasang 2FA hanya diakui admin bila masuk
-- dengan kode 2FA (sesi "aal2"). Kata sandi saja tidak cukup lagi, walau
-- kata sandinya bocor.
-- =====================================================================

alter table public.admins add column if not exists peran text not null default 'penuh';
alter table public.admins drop constraint if exists admins_peran_cek;
alter table public.admins add constraint admins_peran_cek check (peran in ('penuh', 'lihat'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
     where a.user_id = auth.uid()
       -- admin "lihat saja": hanya di transaksi baca
       and (a.peran = 'penuh' or current_setting('transaction_read_only', true) = 'on')
       -- 2FA: bila akun sudah memasang 2FA, sesi wajib tingkat aal2
       and (coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
            or not exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified'))
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.admin_peran()
returns text language sql stable security definer set search_path = public as $$
  select peran from public.admins where user_id = auth.uid();
$$;
revoke all on function public.admin_peran() from public;
grant execute on function public.admin_peran() to authenticated;

-- Cek: daftar admin, peran, dan apakah 2FA sudah terpasang
select a.email, a.peran,
       exists (select 1 from auth.mfa_factors f where f.user_id = a.user_id and f.status = 'verified') as dua_fa_aktif
  from public.admins a order by a.created_at;

-- HP HILANG / GANTI HP? Hapus 2FA akun itu (lalu pasang ulang saat masuk berikutnya):
--   delete from auth.mfa_factors where user_id = (select id from auth.users where lower(email) = lower('email@anda.com'));
