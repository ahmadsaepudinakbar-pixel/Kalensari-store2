-- =====================================================================
-- KALENSARI STORE • Tambah produk: 🌶️ SEBLAK PRASMANAN (pilih topping sesukamu)
-- Jalankan di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang (tidak dobel).
-- Butuh kolom toppings & topping_limit (supabase-topping-produk.sql).
--
-- Harga dasar Rp2.000 = kuah seblak + bumbu dasar (wajib). Topping dihitung sesuai pilihan.
-- Minimal order Rp15.000 per porsi. Topping yang kosong ditandai "| habis" (atur lewat sakelar di admin / aplikasi penjual).
-- Baris "# ..." = judul kelompok. "(pilih 1)" = pembeli memilih salah satu (Level pedas, gratis).
-- Toko penjual: Teh Liya. Foto produk (3: 2 foto seblak + poster menu) & foto tiap topping ada di folder img/seblak/
-- (unggah folder itu ke GitHub juga).
-- =====================================================================
alter table public.products add column if not exists toppings text;
alter table public.products add column if not exists topping_limit integer;
alter table public.products add column if not exists min_order integer;   -- minimal order per porsi (menu racik)

-- Bila "Seblak Prasmanan" sudah ada: toko, daftar topping & harga dasarnya diperbarui .
update public.products
   set price = 2000, min_order = 15000, sale = null, unit = '1 porsi • kuah seblak + bumbu dasar, pilih topping sesukamu',
       seller = 'Teh Liya',
       image = 'img/seblak/seblak-prasmanan-1.jpg | img/seblak/seblak-prasmanan-2.jpg | img/seblak/seblak-prasmanan-menu.jpg',
       toppings = '# 🥬 SAYUR & PELENGKAP
Sawi | 1000 | img/seblak/t-sawi.jpg
Kol | 1000 | img/seblak/t-kol.jpg
Daun bawang | 1000 | img/seblak/t-daun-bawang.jpg
Tauge | 1000 | img/seblak/t-tauge.jpg
Jamur | 2000 | img/seblak/t-jamur.jpg
# 🍜 KERUPUK
Kerupuk merah | 1000 | img/seblak/t-kerupuk-merah.jpg
Kerupuk putih | 1000 | img/seblak/t-kerupuk-putih.jpg
Kerupuk bawang | 1000 | img/seblak/t-kerupuk-bawang.jpg
Kerupuk aci | 1000 | img/seblak/t-kerupuk-aci.jpg
Kerupuk mawar | 1000 | img/seblak/t-kerupuk-mawar.jpg
# 🍢 TOPPING
Bakso | 2000 | img/seblak/t-bakso.jpg
Bakso ikan | 2000 | img/seblak/t-bakso-ikan.jpg
Sosis | 2000 | img/seblak/t-sosis.jpg
Cikuwa | 2000 | img/seblak/t-cikuwa.jpg
Crab stick | 2000 | img/seblak/t-crab-stick.jpg
Fish roll | 2000 | img/seblak/t-fish-roll.jpg
Otak-otak | 2000 | img/seblak/t-otak-otak.jpg
Tempura | 2000 | img/seblak/t-tempura.jpg
Dumpling ayam | 2500 | img/seblak/t-dumpling-ayam.jpg
Dumpling keju | 2500 | img/seblak/t-dumpling-keju.jpg
Kembang cumi | 2500 | img/seblak/t-kembang-cumi.jpg
# 🥚 TELUR
Telur puyuh | 2000 | img/seblak/t-telur-puyuh.jpg
Telur ayam | 3000 | img/seblak/t-telur-ayam.jpg
# 🍗 TOPPING AYAM
Ceker | 2000 | img/seblak/t-ceker.jpg
Sayap ayam | 5000 | img/seblak/t-sayap-ayam.jpg
Tulang ayam | 3000 | img/seblak/t-tulang-ayam.jpg
Suwir ayam | 4000 | img/seblak/t-suwir-ayam.jpg
# 🌶️ LEVEL PEDAS (pilih 1)
Level 0 (tidak pedas) | 0
Level 1 | 0
Level 2 | 0
Level 3 | 0
Level 4 | 0
Level 5 (pedas banget) | 0', topping_limit = null
 where lower(name) = 'seblak prasmanan';

-- Bila belum ada: dibuat baru.
insert into public.products (id, name, price, sale, category, unit, seller, status, image, toppings, topping_limit, min_order)
select coalesce((select max(id) from public.products), 0) + 1,
       'Seblak Prasmanan', 2000, null, 'Makanan',
       '1 porsi • kuah seblak + bumbu dasar, pilih topping sesukamu',
       'Teh Liya', 'Show', 'img/seblak/seblak-prasmanan-1.jpg | img/seblak/seblak-prasmanan-2.jpg | img/seblak/seblak-prasmanan-menu.jpg',
'# 🥬 SAYUR & PELENGKAP
Sawi | 1000 | img/seblak/t-sawi.jpg
Kol | 1000 | img/seblak/t-kol.jpg
Daun bawang | 1000 | img/seblak/t-daun-bawang.jpg
Tauge | 1000 | img/seblak/t-tauge.jpg
Jamur | 2000 | img/seblak/t-jamur.jpg
# 🍜 KERUPUK
Kerupuk merah | 1000 | img/seblak/t-kerupuk-merah.jpg
Kerupuk putih | 1000 | img/seblak/t-kerupuk-putih.jpg
Kerupuk bawang | 1000 | img/seblak/t-kerupuk-bawang.jpg
Kerupuk aci | 1000 | img/seblak/t-kerupuk-aci.jpg
Kerupuk mawar | 1000 | img/seblak/t-kerupuk-mawar.jpg
# 🍢 TOPPING
Bakso | 2000 | img/seblak/t-bakso.jpg
Bakso ikan | 2000 | img/seblak/t-bakso-ikan.jpg
Sosis | 2000 | img/seblak/t-sosis.jpg
Cikuwa | 2000 | img/seblak/t-cikuwa.jpg
Crab stick | 2000 | img/seblak/t-crab-stick.jpg
Fish roll | 2000 | img/seblak/t-fish-roll.jpg
Otak-otak | 2000 | img/seblak/t-otak-otak.jpg
Tempura | 2000 | img/seblak/t-tempura.jpg
Dumpling ayam | 2500 | img/seblak/t-dumpling-ayam.jpg
Dumpling keju | 2500 | img/seblak/t-dumpling-keju.jpg
Kembang cumi | 2500 | img/seblak/t-kembang-cumi.jpg
# 🥚 TELUR
Telur puyuh | 2000 | img/seblak/t-telur-puyuh.jpg
Telur ayam | 3000 | img/seblak/t-telur-ayam.jpg
# 🍗 TOPPING AYAM
Ceker | 2000 | img/seblak/t-ceker.jpg
Sayap ayam | 5000 | img/seblak/t-sayap-ayam.jpg
Tulang ayam | 3000 | img/seblak/t-tulang-ayam.jpg
Suwir ayam | 4000 | img/seblak/t-suwir-ayam.jpg
# 🌶️ LEVEL PEDAS (pilih 1)
Level 0 (tidak pedas) | 0
Level 1 | 0
Level 2 | 0
Level 3 | 0
Level 4 | 0
Level 5 (pedas banget) | 0', null, 15000
where not exists (select 1 from public.products where lower(name) = 'seblak prasmanan');

-- Cek
select id, name, price, min_order, seller, status from public.products where lower(name) = 'seblak prasmanan';
