-- =====================================================================
-- KALENSARI STORE - Penghitung pemakaian Google Maps
-- Mencatat berapa kali peta Google dibuka per hari (waktu WIB) supaya
-- admin bisa memantau batas gratis 10.000 / bulan. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-admin-auth.sql dan supabase-jasa-admin.sql.
-- =====================================================================

-- 1) Tabel jumlah buka peta per hari
create table if not exists public.map_usage (
  day   date primary key,
  loads integer not null default 0
);
alter table public.map_usage enable row level security;

drop policy if exists "map_usage_read" on public.map_usage;
create policy "map_usage_read" on public.map_usage
  for select to anon, authenticated using (true);
grant select on public.map_usage to anon, authenticated;
-- Tidak ada izin insert/update langsung: penambahan hanya lewat fungsi di bawah.

-- 2) Fungsi "catat 1x buka peta" (dipanggil otomatis oleh ojek.html)
create or replace function public.catat_buka_peta()
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.map_usage (day, loads)
  values ((now() at time zone 'Asia/Jakarta')::date, 1)
  on conflict (day) do update set loads = public.map_usage.loads + 1
  returning loads;
$$;
revoke all on function public.catat_buka_peta() from public;
grant execute on function public.catat_buka_peta() to anon, authenticated;

-- 3) Pengaturan Google Maps (kunci API, batas harian) hanya bisa diubah admin
create or replace function public.is_admin_setting_key(k text)
returns boolean
language sql
immutable
as $$
  select k in ('categories','removed_categories','shipping_fees',
               'whatsapp_number','closed_sellers','seller_schedule',
               'admin_pin_hash','jasa_categories','jasa_providers',
               'transport_tariff','transport_places','google_maps',
               'admin_push');
$$;

-- Cek: harus menampilkan 1 baris (hari ini) dan true
select public.catat_buka_peta() as uji_catat,
       public.is_admin_setting_key('google_maps') as google_maps_khusus_admin;
-- Hapus hitungan uji tadi supaya angka tetap akurat
update public.map_usage set loads = greatest(loads - 1, 0)
 where day = (now() at time zone 'Asia/Jakarta')::date;
