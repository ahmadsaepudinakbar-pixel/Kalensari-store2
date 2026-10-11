-- =====================================================================
-- KALENSARI • Semangat kurir: tip dari pembeli & kurir terbaik minggu ini
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- (butuh supabase-kurir-riwayat.sql: kolom orders.kurir_id / kurir_nama / selesai_at)
-- =====================================================================

-- 1) TIP dari pembeli untuk kurir (dicatat setelah pesanan SELESAI; 1 tip per pesanan)
--    Uang tip diberikan pembeli langsung ke kurir (tunai / transfer lewat WhatsApp kurir).
--    Aplikasi hanya mencatat; kurir menekan "Sudah diterima" bila uangnya sudah masuk.
create table if not exists public.kurir_tip (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  order_code  text not null unique,
  kurir_id    text not null,
  kurir_nama  text not null default '',
  jumlah      integer not null check (jumlah between 1000 and 100000),
  pesan       text not null default '' check (length(pesan) <= 140),
  nama        text not null default '',          -- nama pembeli
  diterima    boolean not null default false,    -- dikonfirmasi kurir
  diterima_at timestamptz
);
create index if not exists kurir_tip_kurir_idx on public.kurir_tip (kurir_id, created_at desc);

alter table public.kurir_tip enable row level security;
drop policy if exists "kurir_tip_baca"  on public.kurir_tip;
drop policy if exists "kurir_tip_tulis" on public.kurir_tip;
drop policy if exists "kurir_tip_ubah"  on public.kurir_tip;

create policy "kurir_tip_baca" on public.kurir_tip for select using (true);
create policy "kurir_tip_ubah" on public.kurir_tip for update using (true) with check (true);

revoke all on public.kurir_tip from anon, authenticated;
grant select on public.kurir_tip to anon, authenticated;
grant update (diterima, diterima_at) on public.kurir_tip to anon, authenticated;   -- nominal tidak bisa diubah

-- Tip dicatat lewat fungsi ini (bukan insert langsung): kurir diambil dari pesanan itu sendiri
create or replace function public.kurir_tip_beri(p_kode text, p_jumlah integer, p_pesan text default '')
returns jsonb language plpgsql security definer set search_path = public as $$
declare o record;
begin
  if p_jumlah is null or p_jumlah < 1000 or p_jumlah > 100000 then raise exception 'Tip minimal Rp1.000 dan maksimal Rp100.000'; end if;
  if length(coalesce(p_pesan, '')) > 140 then raise exception 'Pesan maksimal 140 huruf'; end if;
  select order_code, status, kurir_id, kurir_nama, customer_name into o from public.orders where order_code = p_kode;
  if not found then raise exception 'Pesanan tidak ditemukan'; end if;
  if o.status <> 'selesai' then raise exception 'Tip bisa diberikan setelah pesanan selesai'; end if;
  if coalesce(o.kurir_id, '') = '' then raise exception 'Pesanan ini tidak punya data kurir'; end if;
  insert into public.kurir_tip (order_code, kurir_id, kurir_nama, jumlah, pesan, nama)
  values (o.order_code, o.kurir_id, coalesce(o.kurir_nama, ''), p_jumlah, trim(coalesce(p_pesan, '')), coalesce(o.customer_name, ''))
  on conflict (order_code) do nothing;
  if not found then raise exception 'Tip untuk pesanan ini sudah pernah dicatat'; end if;
  return jsonb_build_object('ok', true, 'kurir', o.kurir_nama, 'jumlah', p_jumlah);
end $$;
revoke all on function public.kurir_tip_beri(text, integer, text) from public;
grant execute on function public.kurir_tip_beri(text, integer, text) to anon, authenticated;

-- 2) KURIR TERBAIK MINGGU INI (Senin 00.00 WIB s/d sekarang; urut antaran selesai terbanyak)
create or replace function public.kurir_terbaik_minggu()
returns table (kurir_id text, nama text, antaran integer)
language sql stable security definer set search_path = public as $$
  select o.kurir_id,
         coalesce(nullif(max(o.kurir_nama), ''), 'Kurir') as nama,
         count(*)::int as antaran
    from public.orders o
   where o.status = 'selesai'
     and coalesce(o.kurir_id, '') <> ''
     and coalesce(o.selesai_at, o.updated_at) >= (date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')
   group by o.kurir_id
   order by count(*) desc, min(coalesce(o.selesai_at, o.updated_at)) asc
   limit 10
$$;
revoke all on function public.kurir_terbaik_minggu() from public;
grant execute on function public.kurir_terbaik_minggu() to anon, authenticated;
