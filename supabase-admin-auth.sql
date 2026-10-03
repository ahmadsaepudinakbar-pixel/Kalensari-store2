-- =====================================================================
-- KALENSARI STORE - Login Admin pakai Supabase Auth (ganti PIN 1234)
-- =====================================================================
-- LANGKAH SEBELUM MENJALANKAN FILE INI:
--   1. Supabase > Authentication > Users > "Add user" > "Create new user"
--      Isi email & kata sandi admin, centang "Auto Confirm User".
--   2. Ganti email di baris paling bawah file ini dengan email tadi.
--   3. Jalankan seluruh file ini di Supabase > SQL Editor.
-- File ini aman dijalankan ulang.
-- =====================================================================

-- 1) Daftar akun yang boleh jadi admin
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

-- Admin hanya boleh melihat barisnya sendiri; tidak ada yang bisa menambah
-- admin lewat website (hanya lewat SQL Editor ini).
drop policy if exists "admins_read_self" on public.admins;
create policy "admins_read_self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- 2) Fungsi cek "apakah yang login ini admin?"
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 3) Pengaturan toko yang hanya boleh diubah admin
--    (kategori, ongkir, nomor WhatsApp, buka/tutup & jadwal penjual).
--    Kunci lain (akun penjual/kurir/jasa/pembeli, data kurir) tetap
--    bisa disimpan seperti biasa supaya pendaftaran tidak rusak.
create or replace function public.is_admin_setting_key(k text)
returns boolean
language sql
immutable
as $$
  select k in ('categories','removed_categories','shipping_fees',
               'whatsapp_number','closed_sellers','seller_schedule',
               'admin_pin_hash');
$$;

grant select, insert, update on public.store_settings to anon, authenticated;

drop policy if exists "store_settings_public_insert" on public.store_settings;
drop policy if exists "store_settings_public_update" on public.store_settings;
drop policy if exists "store_settings_insert" on public.store_settings;
drop policy if exists "store_settings_update" on public.store_settings;

create policy "store_settings_insert" on public.store_settings
  for insert to anon, authenticated
  with check (not public.is_admin_setting_key(key) or public.is_admin());

create policy "store_settings_update" on public.store_settings
  for update to anon, authenticated
  using      (not public.is_admin_setting_key(key) or public.is_admin())
  with check (not public.is_admin_setting_key(key) or public.is_admin());

-- 4) Hapus hash PIN lama (tidak dipakai lagi)
delete from public.store_settings where key = 'admin_pin_hash';

-- 5) Jadikan akun Anda admin  >>> GANTI EMAIL DI BAWAH <<<
insert into public.admins (user_id, email)
select id, email from auth.users where lower(email) = lower('GANTI_DENGAN_EMAIL_ADMIN@gmail.com')
on conflict (user_id) do nothing;

-- Cek hasil: harus muncul 1 baris berisi email admin Anda.
select * from public.admins;
