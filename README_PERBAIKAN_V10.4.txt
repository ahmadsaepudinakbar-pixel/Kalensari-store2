KALENSARI STORE V10.4 - PERBAIKAN PESANAN

PERBAIKAN:
1. Pesanan disimpan ke Supabase SEBELUM keranjang dikosongkan.
2. Jika Supabase gagal, keranjang TIDAK dihapus.
3. Nomor pesanan dibuat otomatis, contoh KS1234567890.
4. Nomor pesanan ikut dikirim ke WhatsApp.
5. Pesanan Saya mengambil data online berdasarkan nomor WhatsApp.
6. Kelola Status Pesanan Admin membaca data online.
7. Admin bisa mengubah status: Menunggu, Diproses, Dikirim, Selesai, Dibatalkan.
8. Status dan pesanan dapat dilihat dari HP maupun komputer selama keduanya memakai config.js Supabase yang sama.

PENTING:
File config.js pada ZIP ini masih mengikuti file Anda. Pada file yang Anda kirim, CLOUD_CONFIG saat ini:
enabled: false
supabaseUrl: ""
supabaseAnonKey: ""

Agar sinkron HP <-> komputer:
- Isi config.js dengan URL Supabase project dan anon key yang sama.
- Set enabled: true.
- Jalankan supabase-fix-orders-v10.4.sql satu kali di Supabase SQL Editor.
- Upload script.js dan SQL tersebut ke project/GitHub.
- Setelah deploy, lakukan Ctrl+F5 di komputer dan refresh di HP.

JANGAN kosongkan keranjang secara manual untuk menguji sebelum database aktif.
