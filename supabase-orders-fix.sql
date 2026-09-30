-- KALENSARI STORE - perbaikan tabel/policy pesanan
-- Jalankan seluruh script ini di Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text,
  customer_phone text,
  address text,
  note text,
  payment text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  total numeric not null default 0,
  status text not null default 'baru',
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists note text;
alter table public.orders add column if not exists payment text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric default 0;
alter table public.orders add column if not exists shipping numeric default 0;
alter table public.orders add column if not exists total numeric default 0;
alter table public.orders add column if not exists status text default 'baru';
alter table public.orders add column if not exists created_at timestamptz default now();

alter table public.orders enable row level security;

grant insert, select on public.orders to anon, authenticated;

drop policy if exists "Kalensari public can insert orders" on public.orders;
create policy "Kalensari public can insert orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Kalensari admin can read orders" on public.orders;
create policy "Kalensari admin can read orders"
on public.orders
for select
to anon, authenticated
using (true);

create index if not exists orders_created_at_idx
on public.orders (created_at desc);
