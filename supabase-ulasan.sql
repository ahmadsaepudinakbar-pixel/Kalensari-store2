-- =====================================================================
-- KALENSARI • Ulasan pembeli untuk toko
-- Ulasan TIDAK tampil di Kalensari Store: hanya dibaca penjual & admin.
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- =====================================================================

create table if not exists public.ulasan (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  order_code  text not null,
  toko        text not null,                 -- nama toko huruf kecil (kunci)
  toko_nama   text not null default '',
  bintang     smallint not null check (bintang between 1 and 5),
  isi         text not null default '',
  nama        text not null default '',      -- nama pembeli
  wa          text not null default '',
  balasan     text,                          -- balasan penjual
  balas_at    timestamptz,
  sembunyi    boolean not null default false, -- disembunyikan admin (mis. kata kasar)
  unique (order_code, toko)                  -- 1 ulasan per toko per pesanan
);
create index if not exists ulasan_toko_idx on public.ulasan (toko, created_at desc);

alter table public.ulasan enable row level security;

drop policy if exists "ulasan_baca"  on public.ulasan;
drop policy if exists "ulasan_tulis" on public.ulasan;
drop policy if exists "ulasan_ubah"  on public.ulasan;
drop policy if exists "ulasan_hapus" on public.ulasan;

create policy "ulasan_baca" on public.ulasan for select using (true);
-- Ulasan hanya bisa dikirim untuk pesanan yang sudah SELESAI
create policy "ulasan_tulis" on public.ulasan for insert with check (
  length(isi) <= 500
  and exists (select 1 from public.orders o where o.order_code = ulasan.order_code and o.status = 'selesai')
);
create policy "ulasan_ubah"  on public.ulasan for update using (true) with check (length(coalesce(balasan,'')) <= 500);
create policy "ulasan_hapus" on public.ulasan for delete using (true);

grant select, insert, update, delete on public.ulasan to anon, authenticated;
grant usage, select on sequence public.ulasan_id_seq to anon, authenticated;
