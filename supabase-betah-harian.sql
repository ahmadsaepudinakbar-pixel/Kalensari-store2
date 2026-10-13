-- =====================================================================
-- Kalensari Store • PROGRAM HARIAN PEMBELI
--   1) Absen harian beruntun  -> hadiah saldo voucher setiap N hari berturut-turut
--   2) Promo ongkir jam tertentu -> CASHBACK ongkir ke saldo voucher setelah pesanan selesai
--      (pembeli tetap bayar ongkir biasa, kurir tetap terima penuh; alur uang tidak berubah)
--
-- Aturan diatur admin (Admin > Absen & Promo Ongkir), disimpan di store_settings 'harian_aturan':
--   {"absen":{"aktif":true,"hari":7,"hadiah":1000},
--    "promo":{"aktif":false,"mulai":"11:00","selesai":"13:00","persen":100,"maks":5000,"kuota":20,"hari":[]}}
--   promo.hari = hari berlaku (0=Minggu ... 6=Sabtu), kosong = setiap hari. kuota = klaim per hari (0 = tanpa batas).
-- Kabar Desa disimpan di store_settings 'kabar_desa' (hanya admin yang bisa menulis; tidak perlu SQL).
--
-- Jalankan SETELAH supabase-voucher-pembeli.sql dan supabase-keamanan-tahap2a.sql.
-- Supabase > SQL Editor > New query > tempel > Run. Aman dijalankan berulang kali.
-- =====================================================================

-- ---------- 0) Bantuan ----------
create or replace function public.ks_harian_aturan()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select value from public.store_settings where key = 'harian_aturan' and jsonb_typeof(value) = 'object'), '{}'::jsonb)
$$;
revoke all on function public.ks_harian_aturan() from public, anon, authenticated;

create or replace function public.ks_hari_ini()
returns date language sql stable as $$ select (now() at time zone 'Asia/Jakarta')::date $$;

create or replace function public.ks_angka(v text, def integer, lo integer, hi integer)
returns integer language sql immutable as $$
  select greatest(lo, least(hi, coalesce(nullif(regexp_replace(coalesce(v, ''), '[^0-9]', '', 'g'), '')::bigint, def)::int))
$$;


-- ---------- 1) ABSEN HARIAN ----------
create table if not exists public.pembeli_absen (
  wa         text primary key,
  terakhir   date,                          -- tanggal absen terakhir (WIB)
  beruntun   integer not null default 0,    -- hari berturut-turut sampai 'terakhir'
  total      integer not null default 0,    -- total hari absen
  hadiah     integer not null default 0,    -- total hadiah yang sudah diterima (Rp)
  updated_at timestamptz not null default now()
);
alter table public.pembeli_absen enable row level security;
drop policy if exists "ks_absen_admin" on public.pembeli_absen;
create policy "ks_absen_admin" on public.pembeli_absen for select to authenticated using (public.is_admin());

-- p_klaim = false : hanya melihat status (dipakai saat dashboard dibuka)
-- p_klaim = true  : absen hari ini (sekali sehari); hadiah cair otomatis tiap kelipatan N hari
create or replace function public.absen_harian(p_sesi text, p_klaim boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_wa text; a jsonb; aktif boolean; n int; hadiah int; hari_ini date := public.ks_hari_ini();
  r public.pembeli_absen%rowtype; b int; dapat int := 0; sudah boolean;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  a := coalesce(public.ks_harian_aturan()->'absen', '{}'::jsonb);
  aktif  := coalesce(a->>'aktif', 'true') in ('true', '1');
  n      := public.ks_angka(a->>'hari', 7, 2, 30);
  hadiah := public.ks_angka(a->>'hadiah', 1000, 0, 50000);
  if not aktif then return jsonb_build_object('ok', true, 'aktif', false); end if;

  perform pg_advisory_xact_lock(hashtext('ks_absen:' || v_wa));          -- cegah ketuk dobel
  select * into r from public.pembeli_absen where wa = v_wa;
  -- beruntun masih berlaku bila terakhir absen hari ini atau kemarin; selain itu putus (mulai dari 0)
  b := case when r.terakhir in (hari_ini, hari_ini - 1) then coalesce(r.beruntun, 0) else 0 end;
  sudah := coalesce(r.terakhir = hari_ini, false);

  if p_klaim and not sudah then
    b := b + 1;
    if hadiah > 0 and b % n = 0 then dapat := hadiah; end if;
    insert into public.pembeli_absen as x (wa, terakhir, beruntun, total, hadiah)
    values (v_wa, hari_ini, b, 1, dapat)
    on conflict (wa) do update set terakhir = hari_ini, beruntun = b, total = x.total + 1,
                                   hadiah = x.hadiah + dapat, updated_at = now();
    if dapat > 0 then
      perform public.ks_saldo_pembeli(v_wa, dapat, 'absen', 'Hadiah absen ' || n || ' hari berturut-turut', null);
    end if;
    sudah := true;
  end if;

  return jsonb_build_object('ok', true, 'aktif', true, 'hari', n, 'hadiah', hadiah,
    'beruntun', b, 'siklus', case when b = 0 then 0 when b % n = 0 then n else b % n end,
    'sudah', sudah, 'dapat', dapat,
    'total', coalesce((select total from public.pembeli_absen where wa = v_wa), 0));
end $$;
revoke all on function public.absen_harian(text, boolean) from public;
grant execute on function public.absen_harian(text, boolean) to anon, authenticated;


-- ---------- 2) PROMO ONGKIR JAM TERTENTU (CASHBACK) ----------
create table if not exists public.promo_ongkir_klaim (
  kunci   text primary key,                 -- kode grup (nota multi toko) atau kode pesanan
  wa      text not null,
  tanggal date not null,                    -- tanggal pesanan (WIB)
  persen  integer not null default 100,     -- aturan saat pesanan dibuat (dipegang walau admin mengubah aturan)
  maks    integer not null default 0,
  jumlah  integer not null default 0,       -- cashback yang cair
  status  text not null default 'tunggu',   -- tunggu | cair | batal
  t       timestamptz not null default now(),
  cair_t  timestamptz
);
create index if not exists promo_ongkir_klaim_tgl on public.promo_ongkir_klaim (tanggal, status);
create index if not exists promo_ongkir_klaim_wa  on public.promo_ongkir_klaim (wa, tanggal);
alter table public.promo_ongkir_klaim enable row level security;
drop policy if exists "ks_promo_admin" on public.promo_ongkir_klaim;
create policy "ks_promo_admin" on public.promo_ongkir_klaim for select to authenticated using (public.is_admin());

-- Info promo untuk toko & dashboard (boleh dibaca siapa saja)
create or replace function public.promo_ongkir_info()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  p jsonb := coalesce(public.ks_harian_aturan()->'promo', '{}'::jsonb);
  aktif boolean := coalesce(p->>'aktif', 'false') in ('true', '1');
  w timestamp := now() at time zone 'Asia/Jakarta';
  mulai text := coalesce(nullif(p->>'mulai', ''), '11:00'); selesai text := coalesce(nullif(p->>'selesai', ''), '13:00');
  hari jsonb := case when jsonb_typeof(p->'hari') = 'array' then p->'hari' else '[]'::jsonb end;
  kuota int := public.ks_angka(p->>'kuota', 0, 0, 100000);
  pakai int; hari_ok boolean; jam_ok boolean := false;
begin
  if mulai !~ '^\d{1,2}:\d{2}$' then mulai := '11:00'; end if;
  if selesai !~ '^\d{1,2}:\d{2}$' then selesai := '13:00'; end if;
  hari_ok := jsonb_array_length(hari) = 0 or hari @> to_jsonb(extract(dow from w)::int);
  begin jam_ok := w::time >= mulai::time and w::time < selesai::time; exception when others then jam_ok := false; end;
  select count(*) into pakai from public.promo_ongkir_klaim where tanggal = public.ks_hari_ini() and status <> 'batal';
  return jsonb_build_object('aktif', aktif, 'berlangsung', aktif and hari_ok and jam_ok,
    'hari_ini', aktif and hari_ok, 'mulai', mulai, 'selesai', selesai, 'hari', hari,
    'persen', public.ks_angka(p->>'persen', 100, 1, 100), 'maks', public.ks_angka(p->>'maks', 0, 0, 1000000),
    'kuota', kuota, 'sisa', case when kuota > 0 then greatest(0, kuota - pakai) else null end,
    'sekarang', to_char(w, 'HH24:MI'));
end $$;
revoke all on function public.promo_ongkir_info() from public;
grant execute on function public.promo_ongkir_info() to anon, authenticated;

-- Catat klaim saat pesanan toko dibuat di jam promo (1x per pembeli per hari, selama kuota ada)
create or replace function public.ks_promo_ongkir_catat()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_wa text := nullif(new.customer_phone_normalized, ''); k text := coalesce(nullif(new.grup, ''), new.order_code);
        info jsonb; hari_ini date := public.ks_hari_ini();
begin
  if v_wa is null or k is null then return null; end if;
  if jsonb_typeof(new.items) <> 'array' or coalesce(new.items->0->>'layanan', '') <> '' then return null; end if;   -- ojek / paket tidak ikut
  if coalesce(new.status, 'menunggu') in ('dibatalkan', 'gagal') then return null; end if;
  if exists (select 1 from public.promo_ongkir_klaim where kunci = k) then return null; end if;               -- nota lain di grup yang sama
  info := public.promo_ongkir_info();
  if not coalesce((info->>'berlangsung')::boolean, false) then return null; end if;
  perform pg_advisory_xact_lock(hashtext('ks_promo:' || hari_ini::text));                                       -- kuota tidak terlewati
  info := public.promo_ongkir_info();
  if info->>'sisa' is not null and (info->>'sisa')::int <= 0 then return null; end if;
  if exists (select 1 from public.promo_ongkir_klaim where wa = v_wa and tanggal = hari_ini and status <> 'batal') then return null; end if;
  insert into public.promo_ongkir_klaim (kunci, wa, tanggal, persen, maks)
  values (k, v_wa, hari_ini, (info->>'persen')::int, (info->>'maks')::int)
  on conflict (kunci) do nothing;
  return null;
end $$;
revoke all on function public.ks_promo_ongkir_catat() from public;
drop trigger if exists ks_promo_ongkir_catat on public.orders;
create trigger ks_promo_ongkir_catat after insert on public.orders
  for each row execute function public.ks_promo_ongkir_catat();

-- Cairkan cashback setelah SEMUA nota di grup selesai / batal (ongkir dihitung dari nota yang selesai)
create or replace function public.ks_promo_ongkir_cair()
returns trigger language plpgsql security definer set search_path = public as $$
declare k text := coalesce(nullif(new.grup, ''), new.order_code); r public.promo_ongkir_klaim%rowtype; ong bigint; jml int;
begin
  select * into r from public.promo_ongkir_klaim where kunci = k and status = 'tunggu' for update;
  if not found then return null; end if;
  if exists (select 1 from public.orders o where (o.grup = k or o.order_code = k)
              and coalesce(o.status, 'menunggu') not in ('selesai', 'dibatalkan', 'gagal')) then
    return null;                                                    -- masih ada nota yang berjalan
  end if;
  select coalesce(sum(o.shipping), 0) into ong from public.orders o
   where (o.grup = k or o.order_code = k) and o.status = 'selesai';
  jml := floor(ong * r.persen / 100.0)::int;
  if r.maks > 0 then jml := least(jml, r.maks); end if;
  if jml <= 0 then
    update public.promo_ongkir_klaim set status = 'batal', cair_t = now() where kunci = k;
    return null;
  end if;
  perform public.ks_saldo_pembeli(r.wa, jml, 'cashback', 'Cashback ongkir promo • ' || k, new.order_code);
  update public.promo_ongkir_klaim set status = 'cair', jumlah = jml, cair_t = now() where kunci = k;
  return null;
end $$;
revoke all on function public.ks_promo_ongkir_cair() from public;
drop trigger if exists ks_promo_ongkir_cair on public.orders;
create trigger ks_promo_ongkir_cair after update of status on public.orders
  for each row when (new.status in ('selesai', 'dibatalkan', 'gagal') and old.status is distinct from new.status)
  execute function public.ks_promo_ongkir_cair();

-- Cashback milik pembeli (30 hari terakhir) untuk label di kartu pesanan
create or replace function public.cashback_saya(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli');
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('kunci', kunci, 'status', status, 'jumlah', jumlah,
                                                       'persen', persen, 'maks', maks, 'tanggal', tanggal) order by t desc)
                     from public.promo_ongkir_klaim where wa = v_wa and tanggal >= public.ks_hari_ini() - 30), '[]'::jsonb);
end $$;
revoke all on function public.cashback_saya(text) from public;
grant execute on function public.cashback_saya(text) to anon, authenticated;


-- Cek: harus menampilkan true semua
select exists (select 1 from pg_proc where proname = 'absen_harian')      as absen,
       exists (select 1 from pg_proc where proname = 'promo_ongkir_info') as promo_info,
       exists (select 1 from pg_trigger where tgname = 'ks_promo_ongkir_catat') as promo_catat,
       exists (select 1 from pg_trigger where tgname = 'ks_promo_ongkir_cair')  as promo_cair;
