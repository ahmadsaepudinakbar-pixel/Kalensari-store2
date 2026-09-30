KALENSARI STORE V7 — CLOUD READY

V7 menambahkan sinkronisasi produk dan penyimpanan pesanan online menggunakan Supabase (opsional). Jika belum dikonfigurasi, toko tetap berjalan memakai localStorage seperti V6.

FILE:
- index.html
- style.css
- script.js
- config.js

CARA AKTIFKAN DATABASE ONLINE (GRATIS):
1. Buat project di Supabase.
2. Buka SQL Editor lalu jalankan isi file supabase.sql.
3. Buka Project Settings > API dan salin Project URL + anon/public key.
4. Isi config.js:
   enabled: true
   supabaseUrl: "https://...supabase.co"
   supabaseAnonKey: "..."
5. Upload index.html, style.css, script.js, dan config.js ke GitHub Pages.

CATATAN KEAMANAN:
- Jangan pernah memasukkan service_role key ke website.
- V7 menggunakan anon/public key + RLS pada database.
- PIN admin di JavaScript bukan mekanisme keamanan server. Untuk toko yang sudah ramai, langkah berikutnya adalah Supabase Auth untuk login admin yang benar-benar aman.


KALENSARI STORE V8
- Keranjang belanja tetap tersimpan di browser.
- Tombol tambah/kurang jumlah produk.
- Hapus satu produk dari keranjang.
- Kosongkan seluruh keranjang.
- Checkout WhatsApp tetap tersedia.
- Tombol X pencarian cepat menutup panel dan mengembalikan kondisi pasif.


KALENSARI STORE V9
- Nomor pesanan singkat otomatis: KS + 4 digit (contoh KS4512)
- Riwayat pesanan pelanggan di perangkat
- Status pesanan: Menunggu, Diproses, Dikirim, Selesai, Dibatalkan
- Admin dapat mengubah status pesanan jika Supabase aktif
- Checkout WhatsApp menyertakan nomor pesanan
- Jalankan bagian V9 pada supabase.sql jika database Supabase sudah pernah dibuat di V8.


=== V10 - DASHBOARD STATUS PESANAN ===

Fitur V10:
1. Admin membuka ⚙️ Dashboard Admin dengan PIN 1234.
2. Setelah login, bagian "Kelola Status Pesanan" menampilkan pesanan.
3. Status dapat diubah: Menunggu, Diproses, Dikirim, Selesai, Dibatalkan.
4. Jika Supabase BELUM aktif, status tetap bisa diuji dan tersimpan di browser perangkat admin.
5. Jika Supabase aktif, perubahan status dikirim ke database online.
6. Pelanggan membuka 📦 Pesanan Saya untuk melihat status terbaru.
7. Tombol Refresh mengambil data terbaru.

PENTING UNTUK STATUS ANTAR PERANGKAT:
- Pastikan Supabase aktif dan config.js berisi supabaseUrl + supabaseAnonKey.
- Jalankan supabase.sql di SQL Editor Supabase.
- Untuk produksi, jangan gunakan PIN 1234; ganti ADMIN_PIN di script.js dan gunakan autentikasi admin yang lebih aman.


=== V10.1 - SINKRON STATUS PESANAN ===
- Pelanggan memiliki tombol "Perbarui" di Pesanan Saya.
- Jika Supabase aktif, status diambil dari database online.
- Saat modal Pesanan Saya terbuka, status online diperiksa otomatis setiap 10 detik.
- Pesanan menampilkan alur Menunggu -> Diproses -> Dikirim -> Selesai.
- Status Dibatalkan ditampilkan sebagai status khusus.
- Admin memperbarui status dan waktu updated_at disimpan saat Supabase aktif.
- Jika Supabase belum aktif, mode lokal tetap dapat digunakan untuk pengujian pada perangkat yang sama.

=== AKTIVASI ANTAR PERANGKAT ===
Edit config.js dan isi supabaseUrl + supabaseAnonKey dari project Supabase Anda, lalu jalankan supabase.sql terbaru di SQL Editor.
