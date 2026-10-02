-- Aplikasi Penjual: kolom stok & deskripsi produk (jalankan sekali di Supabase > SQL Editor)
alter table public.products add column if not exists stock integer;
alter table public.products add column if not exists description text;
