KALENSARI STORE - VERSI RINGAN / SIAP GITHUB

Isi paket ini mempertahankan:
- 25 produk bawaan
- Supabase online
- keranjang dan checkout
- pencarian produk utama
- tombol Cari Produk pojok kanan bawah
- tombol X pencarian yang menutup/mematikan pencarian
- Pesanan Saya dan Kelola Pesanan

PERBAIKAN VERSI INI:
1. Tidak lagi DELETE semua produk saat website pertama kali dibuka.
2. Sinkronisasi produk memakai UPSERT, sehingga lebih cepat dan aman.
3. Hapus produk hanya menghapus produk yang dipilih.
4. Gambar produk memakai lazy-load + decoding async + prioritas rendah.
5. Jika cloud sementara kurang dari 25 produk, website tetap menampilkan katalog bawaan tanpa melakukan sinkronisasi destruktif otomatis.

UPLOAD KE GITHUB:
- Upload/replace index.html, style.css, script.js, config.js, favicon.ico.
- Pastikan file berada di root repository yang dipakai GitHub Pages.
- Setelah upload, buka website dan tekan Ctrl+F5.

PENTING SUPABASE:
- Jalankan Kalensari-Restore-25-Produk.sql jika tabel products masih hanya berisi 7 produk.
- Setelah jumlah products = 25, refresh website.
- Jangan gunakan tombol Reset berulang-ulang; gunakan hanya jika memang ingin mengembalikan katalog bawaan.
