-- =====================================================================
-- KALENSARI STORE • ADMIN "LIHAT SAJA" (admin ke-2 yang tidak bisa mengubah apa pun)
-- Jalankan SETELAH supabase-admin-auth.sql. Aman dijalankan ulang.
--
-- LANGKAH:
--   1. Supabase > Authentication > Users > Add user > Create new user
--      Isi email & kata sandi admin ke-2, centang "Auto Confirm User".
--   2. Ganti email di bagian (3) paling bawah dengan email tadi.
--   3. Supabase > SQL Editor > New query > tempel seluruh file ini > Run.
--
-- Cara kerja:
--   * Tabel admins mendapat kolom "peran": 'penuh' (admin biasa) atau 'lihat'.
--   * is_admin() untuk peran 'lihat' hanya bernilai benar di transaksi BACA SAJA
--     (permintaan GET dari panel admin). Semua perintah yang mengubah data
--     (simpan, hapus, ACC, koreksi saldo, pencairan, dst.) ditolak database.
--   * Admin lama otomatis tetap 'penuh'.
-- =====================================================================

-- 1) Kolom peran
alter table public.admins add column if not exists peran text not null default 'penuh';
alter table public.admins drop constraint if exists admins_peran_cek;
alter table public.admins add constraint admins_peran_cek check (peran in ('penuh', 'lihat'));

-- 2) Cek admin: peran 'lihat' hanya boleh membaca
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
       and (a.peran = 'penuh' or current_setting('transaction_read_only', true) = 'on')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- peran akun yang sedang masuk (dipakai admin.html untuk menampilkan "Mode lihat saja")
create or replace function public.admin_peran()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select peran from public.admins where user_id = auth.uid();
$$;
revoke all on function public.admin_peran() from public;
grant execute on function public.admin_peran() to authenticated;

-- 3) Jadikan akun ke-2 sebagai admin LIHAT SAJA  >>> GANTI EMAIL DI BAWAH <<<
insert into public.admins (user_id, email, peran)
select id, email, 'lihat' from auth.users where lower(email) = lower('GANTI_DENGAN_EMAIL_ADMIN_KE2@gmail.com')
on conflict (user_id) do update set peran = 'lihat';

-- Cek hasil: admin Anda = penuh, admin ke-2 = lihat
select email, peran from public.admins order by created_at;

-- Mencabut admin ke-2:        delete from public.admins where lower(email) = lower('email@ke2.com');
-- Menjadikannya admin penuh:  update public.admins set peran = 'penuh' where lower(email) = lower('email@ke2.com');
