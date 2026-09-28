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
