-- KALENSARI STORE v11.8: kolom menu prasmanan (topping)
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
alter table public.products add column if not exists toppings text;
alter table public.products add column if not exists topping_limit integer;
