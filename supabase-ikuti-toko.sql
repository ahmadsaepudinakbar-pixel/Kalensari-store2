-- =====================================================================
-- Kalensari Store • IKUTI TOKO + NOTIFIKASI HP "MENU BARU"
--   * pembeli_ikuti      : toko yang diikuti tiap pembeli (tombol "🔔 Ikuti toko")
--   * products.tayang_at : kapan produk pertama kali tampil (Show) -> dipakai kirim-notif
--     untuk mengabari pengikut toko. Maksimal 1 notifikasi per toko per pembeli per hari.
-- Jalankan SETELAH supabase-keamanan-tahap2a.sql. Aman dijalankan berulang kali.
-- Setelah ini, deploy ulang Edge Function "kirim-notif" (versi baru di zip).
-- =====================================================================

-- 1) Waktu tayang produk
alter table public.products add column if not exists tayang_at timestamptz;
-- produk yang SUDAH ada saat SQL ini dijalankan dianggap lama (tidak memicu notifikasi)
update public.products set tayang_at = now() - interval '7 days' where tayang_at is null;

create or replace function public.ks_tayang_produk()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'Show' and new.tayang_at is null then new.tayang_at := now(); end if;
  return new;
end $$;
revoke all on function public.ks_tayang_produk() from public;
drop trigger if exists ks_tayang_produk on public.products;
create trigger ks_tayang_produk before insert or update of status on public.products
  for each row execute function public.ks_tayang_produk();

-- 2) Toko yang diikuti pembeli
create table if not exists public.pembeli_ikuti (
  wa   text not null,
  toko text not null,                       -- nama toko huruf kecil (sama dengan kunci toko di web)
  t    timestamptz not null default now(),
  primary key (wa, toko)
);
create index if not exists pembeli_ikuti_toko on public.pembeli_ikuti (toko);
alter table public.pembeli_ikuti enable row level security;
drop policy if exists "ks_ikuti_admin" on public.pembeli_ikuti;
create policy "ks_ikuti_admin" on public.pembeli_ikuti for select to authenticated using (public.is_admin());

-- p_toko = null  : hanya membaca daftar toko yang diikuti
-- p_toko = [...] : mengganti daftar dengan isi baru (maks. 50 toko)
create or replace function public.ikuti_toko(p_sesi text, p_toko text[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli'); l text[];
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  if p_toko is not null then
    select coalesce(array_agg(distinct k), array[]::text[]) into l
      from (select left(lower(btrim(x)), 80) as k from unnest(p_toko) x) s where k <> '';
    if coalesce(array_length(l, 1), 0) > 50 then l := l[1:50]; end if;
    delete from public.pembeli_ikuti where wa = v_wa and not (toko = any(l));
    insert into public.pembeli_ikuti (wa, toko) select v_wa, unnest(l) on conflict do nothing;
  end if;
  return coalesce((select jsonb_agg(toko order by t) from public.pembeli_ikuti where wa = v_wa), '[]'::jsonb);
end $$;
revoke all on function public.ikuti_toko(text, text[]) from public;
grant execute on function public.ikuti_toko(text, text[]) to anon, authenticated;

-- Cek: harus menampilkan true semua
select exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'tayang_at') as kolom_tayang,
       exists (select 1 from pg_trigger where tgname = 'ks_tayang_produk') as trigger_tayang,
       exists (select 1 from pg_proc where proname = 'ikuti_toko') as fungsi_ikuti;
