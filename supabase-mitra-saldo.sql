-- KALENSARI STORE - SALDO PENJUALAN MITRA LUAR KOTA (jalankan SEKALI di Supabase > SQL Editor)
-- Syarat: supabase-mitra-luar-kota.sql sudah dijalankan.
-- Saldo = penjualan pesanan berstatus 'selesai' (harga x jumlah produk milik mitra) - komisi - penarikan.
-- Ubah komisi di fungsi mitra_komisi() di bawah (angka persen, 0 = tanpa potongan).

create or replace function public.mitra_komisi() returns numeric language sql immutable as $$ select 0::numeric $$;
create or replace function public.mitra_min_tarik() returns integer language sql immutable as $$ select 50000 $$;

create table if not exists public.mitra_tarik (
  id bigint generated always as identity primary key,
  mitra_id bigint not null references public.mitra_luar_kota(id) on delete cascade,
  jumlah integer not null check (jumlah > 0),
  bank text not null, rekening text not null, atas_nama text not null,
  status text not null default 'menunggu' check (status in ('menunggu','selesai','ditolak')),
  catatan text, dibuat timestamptz not null default now(), selesai_t timestamptz);
alter table public.mitra_tarik enable row level security;
revoke all on public.mitra_tarik from anon, authenticated;

-- hitung penjualan per pesanan untuk satu mitra
create or replace function public.mitra_hitung(p_id bigint) returns jsonb language sql stable security definer set search_path = public as $$
  with b as (
    select o.order_code kode, o.created_at tgl, lower(coalesce(o.status, '')) st,
           sum(case when it->>'qty' ~ '^[0-9]+(\.[0-9]+)?$' then (it->>'qty')::numeric else 1 end
             * case when it->>'price' ~ '^[0-9]+(\.[0-9]+)?$' then (it->>'price')::numeric else p.price end)::bigint kotor
      from public.orders o
      cross join lateral jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) it
      join public.products p on p.mitra_id = p_id and p.id = case when it->>'id' ~ '^[0-9]+$' then (it->>'id')::bigint end
     group by o.order_code, o.created_at, o.status),
  n as (select kode, tgl, st, kotor - round(kotor * public.mitra_komisi() / 100)::bigint bersih from b)
  select jsonb_build_object(
    'total',  coalesce((select sum(bersih) from n where st = 'selesai'), 0),
    'proses', coalesce((select sum(bersih) from n where st not in ('selesai','batal','dibatalkan','ditolak','gagal')), 0),
    'riwayat', coalesce((select jsonb_agg(jsonb_build_object('kode', kode, 'tgl', tgl, 'nominal', bersih, 'status', st) order by tgl desc)
                           from (select * from n order by tgl desc limit 30) x), '[]'::jsonb)) $$;
revoke all on function public.mitra_hitung(bigint) from public, anon, authenticated;

create or replace function public.mitra_saldo(p_sesi text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi); h jsonb; ditarik bigint;
begin
  h := public.mitra_hitung(m.id);
  select coalesce(sum(jumlah), 0) into ditarik from public.mitra_tarik where mitra_id = m.id and status <> 'ditolak';
  return jsonb_build_object('ok', true, 'total', h->'total', 'proses', h->'proses', 'riwayat', h->'riwayat',
    'ditarik', ditarik, 'tersedia', greatest((h->>'total')::bigint - ditarik, 0),
    'komisi', public.mitra_komisi(), 'min_tarik', public.mitra_min_tarik(),
    'tarik', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'jumlah', t.jumlah, 'bank', t.bank, 'rekening', t.rekening,
                       'atas_nama', t.atas_nama, 'status', t.status, 'catatan', t.catatan, 'dibuat', t.dibuat) order by t.id desc)
                         from (select * from public.mitra_tarik where mitra_id = m.id order by id desc limit 20) t), '[]'::jsonb));
end $$;

create or replace function public.mitra_tarik_ajukan(p_sesi text, p_jumlah integer, p_bank text, p_rekening text, p_nama text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi); tersedia bigint;
begin
  perform pg_advisory_xact_lock(m.id);
  if m.status <> 'aktif' then return jsonb_build_object('ok', false, 'pesan', 'Akun mitra belum disetujui admin'); end if;
  if coalesce(p_jumlah, 0) < public.mitra_min_tarik() then
    return jsonb_build_object('ok', false, 'pesan', 'Penarikan minimal Rp' || to_char(public.mitra_min_tarik(), 'FM999G999G999')); end if;
  if btrim(coalesce(p_bank, '')) = '' or btrim(coalesce(p_nama, '')) = '' or regexp_replace(coalesce(p_rekening, ''), '\D', '', 'g') = '' then
    return jsonb_build_object('ok', false, 'pesan', 'Lengkapi bank / e-wallet, nomor rekening, dan atas nama'); end if;
  if exists (select 1 from public.mitra_tarik where mitra_id = m.id and status = 'menunggu') then
    return jsonb_build_object('ok', false, 'pesan', 'Masih ada penarikan yang menunggu diproses admin'); end if;
  tersedia := (public.mitra_saldo(p_sesi)->>'tersedia')::bigint;
  if p_jumlah > tersedia then return jsonb_build_object('ok', false, 'pesan', 'Saldo tidak cukup'); end if;
  insert into public.mitra_tarik (mitra_id, jumlah, bank, rekening, atas_nama)
  values (m.id, p_jumlah, left(btrim(p_bank), 40), left(regexp_replace(p_rekening, '\D', '', 'g'), 30), left(btrim(p_nama), 60));
  return jsonb_build_object('ok', true);
end $$;

-- ADMIN
create or replace function public.mitra_admin_tarik_daftar() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Khusus admin'; end if;
  return coalesce((select jsonb_agg(to_jsonb(t) || jsonb_build_object('toko', k.toko, 'wa', k.wa) order by t.id desc)
                     from public.mitra_tarik t join public.mitra_luar_kota k on k.id = t.mitra_id), '[]'::jsonb);
end $$;
create or replace function public.mitra_admin_tarik_atur(p_id bigint, p_status text, p_catatan text default null) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Khusus admin'; end if;
  if p_status not in ('menunggu','selesai','ditolak') then raise exception 'Status tidak valid'; end if;
  update public.mitra_tarik set status = p_status, catatan = left(p_catatan, 200), selesai_t = case when p_status = 'menunggu' then null else now() end where id = p_id;
  return jsonb_build_object('ok', true);
end $$;

do $$ declare f text; begin
  foreach f in array array['mitra_saldo(text)','mitra_tarik_ajukan(text,integer,text,text,text)','mitra_admin_tarik_daftar()','mitra_admin_tarik_atur(bigint,text,text)'] loop
    execute 'revoke all on function public.' || f || ' from public';
    execute 'grant execute on function public.' || f || ' to anon, authenticated';
  end loop; end $$;
select to_regclass('public.mitra_tarik') is not null as tabel_siap;
