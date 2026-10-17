-- KALENSARI STORE - Mitra Luar Kota (jalankan SEKALI di Supabase > SQL Editor)
-- Menambah kolom pada tabel produk. Fungsi produk_simpan otomatis ikut menyimpan kolom baru ini.
alter table public.products add column if not exists luar_kota  boolean default false;
alter table public.products add column if not exists berat_gram integer;
alter table public.products add column if not exists asal_kota  text;
alter table public.products add column if not exists izin_edar  text;
select count(*) filter (where column_name in ('luar_kota','berat_gram','asal_kota','izin_edar')) = 4 as kolom_siap
  from information_schema.columns where table_schema='public' and table_name='products';
