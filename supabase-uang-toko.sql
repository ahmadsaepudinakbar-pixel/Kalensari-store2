-- KALENSARI • Bukti toko sudah menerima uang barang COD dari kurir
-- Jalankan sekali di Supabase > SQL Editor > Run
alter table public.orders add column if not exists uang_toko jsonb default '{}'::jsonb;
