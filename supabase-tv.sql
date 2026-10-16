-- =====================================================================
-- KALENSARI TV - tabel video & kategori (halaman tv.html)
-- =====================================================================
-- Syarat: supabase-admin-auth.sql sudah pernah dijalankan (fungsi is_admin()).
-- Jalankan seluruh file ini di Supabase > SQL Editor > New query > Run.
-- Aman dijalankan ulang.
-- =====================================================================

-- 1) Kategori (bisa ditambah / dihapus dari tv.html > Kelola video)
create table if not exists public.tv_kategori (
  id         bigint generated always as identity primary key,
  nama       text not null unique check (char_length(nama) between 1 and 30),
  urutan     int  not null default 0,
  created_at timestamptz not null default now()
);

-- 2) Video (hanya menyimpan ID YouTube, bukan file videonya)
create table if not exists public.tv_video (
  id            bigint generated always as identity primary key,
  yt_id         text not null check (yt_id ~ '^[A-Za-z0-9_-]{11}$'),
  judul         text not null check (char_length(judul) between 1 and 120),
  kategori      text,
  sematkan      boolean not null default false,
  tayang_sampai timestamptz,                -- kosong = tayang terus sampai dihapus
  created_at    timestamptz not null default now()
);
create index if not exists tv_video_urut on public.tv_video (sematkan desc, created_at desc);

alter table public.tv_kategori enable row level security;
alter table public.tv_video    enable row level security;

-- 3) Semua orang boleh menonton; hanya admin yang boleh mengubah
grant select on public.tv_kategori, public.tv_video to anon, authenticated;
grant insert, update, delete on public.tv_kategori, public.tv_video to authenticated;

drop policy if exists "tv_kategori_baca"  on public.tv_kategori;
drop policy if exists "tv_kategori_admin" on public.tv_kategori;
create policy "tv_kategori_baca" on public.tv_kategori
  for select to anon, authenticated using (true);
create policy "tv_kategori_admin" on public.tv_kategori
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tv_video_baca"  on public.tv_video;
drop policy if exists "tv_video_admin" on public.tv_video;
-- pengunjung hanya melihat video yang masa tayangnya belum habis; admin melihat semua
create policy "tv_video_baca" on public.tv_video
  for select to anon, authenticated
  using (tayang_sampai is null or tayang_sampai > now() or public.is_admin());
create policy "tv_video_admin" on public.tv_video
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 4) Kategori awal
insert into public.tv_kategori (nama, urutan) values
  ('Drama China', 1), ('Drama Indo', 2), ('Movie', 3)
on conflict (nama) do nothing;

-- Cek hasil: harus muncul 3 kategori.
select nama, urutan from public.tv_kategori order by urutan;
