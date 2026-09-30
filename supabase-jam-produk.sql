-- KALENSARI STORE v11.5: kolom jam tersedia produk
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
alter table public.products add column if not exists open_time text;
alter table public.products add column if not exists close_time text;
