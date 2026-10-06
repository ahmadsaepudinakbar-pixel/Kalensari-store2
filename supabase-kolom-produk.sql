-- =====================================================================
-- KALENSARI STORE • Lengkapi kolom tabel produk
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Memperbaiki pesan "Could not find the '...' column of 'products'" saat menyimpan produk.
-- =====================================================================
alter table public.products add column if not exists category      text;
alter table public.products add column if not exists unit          text;
alter table public.products add column if not exists seller        text;
alter table public.products add column if not exists status        text default 'Show';
alter table public.products add column if not exists image         text;
alter table public.products add column if not exists sale          integer;
alter table public.products add column if not exists sale_until    timestamptz;
alter table public.products add column if not exists stock         integer;
alter table public.products add column if not exists description   text;
alter table public.products add column if not exists open_time     text;
alter table public.products add column if not exists close_time    text;
alter table public.products add column if not exists product_group text;
alter table public.products add column if not exists variant       text;
alter table public.products add column if not exists variants      text;
alter table public.products add column if not exists toppings      text;
alter table public.products add column if not exists topping_limit integer;
alter table public.products add column if not exists min_order     integer;

-- muat ulang daftar kolom di server API supaya langsung terbaca
notify pgrst, 'reload schema';

-- Cek: harus muncul semua nama kolom di atas
select column_name, data_type from information_schema.columns
 where table_schema = 'public' and table_name = 'products' order by ordinal_position;
