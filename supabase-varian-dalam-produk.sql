-- =====================================================================
-- KALENSARI STORE • Varian di dalam produk (mis. Biasa / + Nasi / Jumbo)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
--
-- Kolom "variants": satu baris = "Nama varian | Harga | habis (opsional)", contoh:
--   Lele saja | 15000
--   + Nasi | 20000
--   + Nasi + Es teh | 23000 | habis
-- Diisi lewat Admin > Produk > Edit (🔀 Pilihan varian) atau aplikasi penjual.
-- Produk lama yang memakai "Nama grup" tetap tampil seperti biasa; gabungkan lewat
-- Admin > Produk (tombol 🔀 Gabungkan) bila ingin pindah ke cara baru.
-- =====================================================================
alter table public.products add column if not exists variants text;

select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'products' and column_name = 'variants';
