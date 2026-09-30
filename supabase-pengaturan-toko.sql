-- KALENSARI STORE v11.9: pengaturan toko (kategori custom & status buka/tutup penjual)
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
create table if not exists public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.store_settings enable row level security;

drop policy if exists "store_settings_public_read" on public.store_settings;
create policy "store_settings_public_read" on public.store_settings for select using (true);

drop policy if exists "store_settings_public_insert" on public.store_settings;
create policy "store_settings_public_insert" on public.store_settings for insert with check (true);

drop policy if exists "store_settings_public_update" on public.store_settings;
create policy "store_settings_public_update" on public.store_settings for update using (true) with check (true);
