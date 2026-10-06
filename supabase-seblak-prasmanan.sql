-- =====================================================================
-- KALENSARI STORE • Tambah produk: 🌶️ SEBLAK PRASMANAN (pilih topping sesukamu)
-- Jalankan di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang (tidak dobel).
-- Butuh kolom toppings & topping_limit (supabase-topping-produk.sql).
--
-- Harga dasar Rp3.000 = kuah seblak + bumbu dasar (wajib). Topping dihitung sesuai pilihan.
-- Baris "# ..." = judul kelompok. "(pilih 1)" = pembeli memilih salah satu (Level pedas, gratis).
-- Toko penjual: Teh Liya. Foto bisa ditambahkan lewat Admin > Produk > Seblak Prasmanan.
-- =====================================================================
alter table public.products add column if not exists toppings text;
alter table public.products add column if not exists topping_limit integer;

-- Bila "Seblak Prasmanan" sudah ada: toko, daftar topping & harga dasarnya diperbarui (foto tidak diubah).
update public.products
   set price = 3000, sale = null, unit = '1 porsi • kuah seblak + bumbu dasar, pilih topping sesukamu',
       seller = 'Teh Liya',
       toppings = '# 🥬 SAYUR & PELENGKAP
Sawi | 1000
Kol | 1000
Daun bawang | 1000
Tauge | 1000
Jamur | 2000
# 🍜 KERUPUK
Kerupuk merah | 1000
Kerupuk putih | 1000
Kerupuk bawang | 1000
Kerupuk aci | 1000
Kerupuk mawar | 1000
# 🍢 TOPPING
Bakso | 2000
Bakso ikan | 2000
Sosis | 2000
Cikuwa | 2000
Crab stick | 2000
Fish roll | 2000
Otak-otak | 2000
Tempura | 2000
Dumpling ayam | 2500
Dumpling keju | 2500
Kembang cumi | 2500
# 🥚 TELUR
Telur puyuh | 2000
Telur ayam | 3000
# 🍗 TOPPING AYAM
Ceker | 2000
Sayap ayam | 5000
Tulang ayam | 3000
Suwir ayam | 4000
# 🌶️ LEVEL PEDAS (pilih 1)
Level 0 (tidak pedas) | 0
Level 1 | 0
Level 2 | 0
Level 3 | 0
Level 4 | 0
Level 5 (pedas banget) | 0', topping_limit = null
 where lower(name) = 'seblak prasmanan';

-- Bila belum ada: dibuat baru.
insert into public.products (id, name, price, sale, category, unit, seller, status, image, toppings, topping_limit)
select coalesce((select max(id) from public.products), 0) + 1,
       'Seblak Prasmanan', 3000, null, 'Makanan',
       '1 porsi • kuah seblak + bumbu dasar, pilih topping sesukamu',
       'Teh Liya', 'Show', null,
'# 🥬 SAYUR & PELENGKAP
Sawi | 1000
Kol | 1000
Daun bawang | 1000
Tauge | 1000
Jamur | 2000
# 🍜 KERUPUK
Kerupuk merah | 1000
Kerupuk putih | 1000
Kerupuk bawang | 1000
Kerupuk aci | 1000
Kerupuk mawar | 1000
# 🍢 TOPPING
Bakso | 2000
Bakso ikan | 2000
Sosis | 2000
Cikuwa | 2000
Crab stick | 2000
Fish roll | 2000
Otak-otak | 2000
Tempura | 2000
Dumpling ayam | 2500
Dumpling keju | 2500
Kembang cumi | 2500
# 🥚 TELUR
Telur puyuh | 2000
Telur ayam | 3000
# 🍗 TOPPING AYAM
Ceker | 2000
Sayap ayam | 5000
Tulang ayam | 3000
Suwir ayam | 4000
# 🌶️ LEVEL PEDAS (pilih 1)
Level 0 (tidak pedas) | 0
Level 1 | 0
Level 2 | 0
Level 3 | 0
Level 4 | 0
Level 5 (pedas banget) | 0', null
where not exists (select 1 from public.products where lower(name) = 'seblak prasmanan');

-- Cek
select id, name, price, seller, status from public.products where lower(name) = 'seblak prasmanan';
