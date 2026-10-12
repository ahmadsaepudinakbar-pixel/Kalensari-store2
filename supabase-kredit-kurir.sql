-- =====================================================================
-- KALENSARI STORE - KREDIT KURIR (saldo bonus yang TIDAK BISA DICAIRKAN)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Syarat: supabase-saldo-kurir.sql, supabase-potongan-persen.sql, dan supabase-cod-saldo.sql sudah dijalankan.
--
-- Aturan:
--  1) Kredit = bonus untuk kurir (mis. bonus misi). TIDAK bisa dicairkan, hanya dipakai otomatis.
--  2) Saat pesanan SELESAI, setiap potongan (potongan ongkir, dan harga produk pada pesanan COD)
--     diambil dari KREDIT lebih dulu, sisanya baru dari SALDO.
--     Contoh COD: harga produk 50.000, Kredit 20.000, saldo 100.000 -> Kredit habis, saldo 100.000 - 30.000 = 70.000.
--  3) Pencairan hanya membaca kolom saldo, jadi Kredit otomatis tidak ikut bisa dicairkan.
--  4) Kredit masuk lewat fungsi ks_beri_kredit() (dipanggil sistem misi/bonus) atau beri_kredit() (admin).
-- Tidak berisi kode rahasia.
-- =====================================================================

-- 1) Kolom Kredit (terpisah dari saldo)
alter table public.kurir_saldo add column if not exists kredit integer not null default 0;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kurir_saldo_kredit_tak_minus') then
    alter table public.kurir_saldo add constraint kurir_saldo_kredit_tak_minus check (kredit >= 0);
  end if;
end $$;
grant select (kredit) on public.kurir_saldo to anon, authenticated;
-- satu bonus (referensi yang sama) hanya masuk sekali ke satu kurir
create unique index if not exists kurir_mutasi_kredit_ref_unik
  on public.kurir_mutasi(kurir_id, order_code) where jenis = 'kredit_masuk' and order_code is not null;

-- 2) Kredit MASUK (internal; dipanggil sistem misi/bonus atau admin). p_ref = kode unik bonus, mis. 'misi-2026-10-12'.
--    Bila p_ref sudah pernah dipakai untuk kurir itu, tidak ditambah lagi (hasil: null).
create or replace function public.ks_beri_kredit(p_kurir text, p_jumlah integer, p_ket text, p_ref text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare akhir integer; sal integer;
begin
  if p_kurir is null or p_kurir = '' or p_jumlah is null or p_jumlah <= 0 then return null; end if;
  if p_ref is not null and exists (select 1 from public.kurir_mutasi where kurir_id = p_kurir and jenis = 'kredit_masuk' and order_code = p_ref) then
    return null;
  end if;
  insert into public.kurir_saldo (kurir_id, saldo, kredit) values (p_kurir, 0, p_jumlah)
  on conflict (kurir_id) do update set kredit = public.kurir_saldo.kredit + p_jumlah, updated_at = now()
  returning saldo, kredit into sal, akhir;
  insert into public.kurir_mutasi (kurir_id, jumlah, jenis, ket, order_code, saldo_akhir)
  values (p_kurir, p_jumlah, 'kredit_masuk', coalesce(nullif(p_ket, ''), 'Kredit bonus'), p_ref, sal);
  return akhir;
end;
$$;
revoke all on function public.ks_beri_kredit(text, integer, text, text) from public, anon, authenticated;

-- 3) Bayar potongan: KREDIT dulu, sisanya SALDO (saldo boleh minus, sama seperti aturan COD yang berlaku)
--    Baris asli (jenis 'potong' / 'barang_cod') SELALU dicatat, walau jumlahnya 0 (lunas oleh Kredit),
--    supaya pesanan yang sama tidak pernah dipotong dua kali.
create or replace function public.ks_bayar(p_kurir text, p_jumlah integer, p_jenis text, p_ket text, p_order text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare k integer; s integer; k_pakai integer; s_pakai integer; akhir integer; ket_utama text;
begin
  if p_jumlah is null or p_jumlah <= 0 then
    return (select saldo from public.kurir_saldo where kurir_id = p_kurir);
  end if;
  insert into public.kurir_saldo (kurir_id, saldo, kredit) values (p_kurir, 0, 0) on conflict (kurir_id) do nothing;
  select saldo, kredit into s, k from public.kurir_saldo where kurir_id = p_kurir for update;
  k_pakai := least(greatest(coalesce(k, 0), 0), p_jumlah);
  s_pakai := p_jumlah - k_pakai;
  update public.kurir_saldo
     set kredit = kredit - k_pakai, saldo = saldo - s_pakai, updated_at = now()
   where kurir_id = p_kurir
   returning saldo into akhir;
  if k_pakai > 0 then
    insert into public.kurir_mutasi (kurir_id, jumlah, jenis, ket, order_code, saldo_akhir)
    values (p_kurir, -k_pakai, 'kredit_' || p_jenis, p_ket || ' • dibayar dari Kredit', p_order, akhir);
  end if;
  ket_utama := p_ket || case when k_pakai = 0 then ''
                             when s_pakai = 0 then ' • lunas dari Kredit'
                             else ' • Kredit Rp' || k_pakai || ' + saldo Rp' || s_pakai end;
  insert into public.kurir_mutasi (kurir_id, jumlah, jenis, ket, order_code, saldo_akhir)
  values (p_kurir, -s_pakai, p_jenis, ket_utama, p_order, akhir);
  return akhir;
end;
$$;
revoke all on function public.ks_bayar(text, integer, text, text, text) from public, anon, authenticated;

-- 4) Admin memberi / mengurangi Kredit (minus = kurangi, tidak bisa melebihi Kredit yang ada). Hasil: Kredit sekarang.
create or replace function public.beri_kredit(p_kurir_id text, p_jumlah integer, p_ket text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare k integer; pot integer; akhir integer; sal integer;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_kurir_id is null or p_kurir_id = '' then raise exception 'Kurir tidak valid'; end if;
  if p_jumlah is null or p_jumlah = 0 then raise exception 'Jumlah tidak boleh 0'; end if;
  if abs(p_jumlah) > 5000000 then raise exception 'Jumlah terlalu besar'; end if;
  if p_jumlah > 0 then
    return public.ks_beri_kredit(p_kurir_id, p_jumlah, coalesce(nullif(p_ket, ''), 'Kredit dari admin'), null);
  end if;
  insert into public.kurir_saldo (kurir_id, saldo, kredit) values (p_kurir_id, 0, 0) on conflict (kurir_id) do nothing;
  select kredit into k from public.kurir_saldo where kurir_id = p_kurir_id for update;
  pot := least(-p_jumlah, greatest(coalesce(k, 0), 0));
  if pot <= 0 then raise exception 'Kredit kurir ini sudah Rp0'; end if;
  update public.kurir_saldo set kredit = kredit - pot, updated_at = now() where kurir_id = p_kurir_id returning saldo, kredit into sal, akhir;
  insert into public.kurir_mutasi (kurir_id, jumlah, jenis, ket, saldo_akhir)
  values (p_kurir_id, -pot, 'kredit_koreksi', coalesce(nullif(p_ket, ''), 'Koreksi Kredit oleh admin'), sal);
  return akhir;
end;
$$;
revoke all on function public.beri_kredit(text, integer, text) from public, anon;
grant execute on function public.beri_kredit(text, integer, text) to authenticated;

-- 5) Potongan ongkir saat pesanan selesai: sekarang Kredit dulu, lalu saldo (isi fungsi lama + 1 baris diganti)
create or replace function public.ks_potong_saldo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare b jsonb := public.ks_biaya(); kid text; potong integer; ongkir integer; persen numeric; ket text;
begin
  if coalesce((b->>'aktif')::boolean, false) is not true then return null; end if;
  select coalesce(
           (select value->>'id' from public.store_settings where key = 'antar_' || new.order_code),
           (select value->'acc'->>'id' from public.store_settings where key = 'kurir_ord_' || new.order_code))
    into kid;
  if kid is null or kid = '' then return null; end if;
  if exists (select 1 from public.kurir_mutasi where order_code = new.order_code and jenis = 'potong') then return null; end if;
  if coalesce(b->>'mode', 'nominal') = 'persen' then
    -- ongkir yang diterima kurir: ojek/kirim paket = total; belanja = ongkir pesanan
    ongkir := case when jsonb_typeof(new.items) = 'array' and (new.items->0) ? 'layanan'
                   then coalesce(new.total, 0) else coalesce(new.shipping, 0) end;
    persen := least(greatest(coalesce((b->>'persen')::numeric, 10), 0), 100);
    potong := (round(ongkir * persen / 100.0 / 100.0) * 100)::int;          -- dibulatkan ke Rp100 terdekat
    ket := 'Potongan ' || trim(to_char(persen, 'FM990.##')) || '% dari ongkir Rp' || ongkir || ' (' || new.order_code || ')';
  else
    potong := coalesce((b->>'potong')::int, 1000);
    ket := 'Potongan pesanan ' || new.order_code;
  end if;
  if potong is null or potong <= 0 then return null; end if;
  perform public.ks_bayar(kid, potong, 'potong', ket, new.order_code);   -- Kredit dipakai lebih dulu, sisanya dari saldo
  return null;
end;
$$;

-- 6) Harga produk COD saat pesanan selesai: sekarang Kredit dulu, lalu saldo (isi fungsi lama + 1 baris diganti)
create or replace function public.ks_cod_barang()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  b jsonb := public.ks_biaya();
  v jsonb;
  mulai timestamptz;
  kid text;
  barang numeric := 0;
begin
  -- ikut pengaturan Saldo Kurir (bila dimatikan admin, tidak ada potongan apa pun)
  if coalesce((b->>'aktif')::boolean, false) is not true then return null; end if;
  if lower(btrim(coalesce(new.payment, ''))) !~ '^cod' then return null; end if;
  -- ojek / kirim paket tidak punya toko -> tidak ada harga produk
  if jsonb_typeof(new.items) = 'array' and (new.items->0) ? 'layanan' then return null; end if;

  select value into v from public.store_settings where key = 'cod_saldo_mulai';
  begin
    mulai := case when jsonb_typeof(v) = 'object' then (v->>'t')::timestamptz
                  when jsonb_typeof(v) = 'string' then (v #>> '{}')::timestamptz end;
  exception when others then mulai := null;
  end;
  if mulai is null or new.created_at < mulai then return null; end if;   -- COD lama: cara lama

  select coalesce(
           (select value->>'id' from public.store_settings where key = 'antar_' || new.order_code),
           (select value->'acc'->>'id' from public.store_settings where key = 'kurir_ord_' || new.order_code))
    into kid;
  if kid is null or kid = '' then return null; end if;
  if exists (select 1 from public.kurir_mutasi where order_code = new.order_code and jenis = 'barang_cod') then return null; end if;

  -- harga produk = harga promo (bila ada) atau harga normal x jumlah, sama dengan hitungan di aplikasi toko
  if jsonb_typeof(new.items) = 'array' then
    select coalesce(sum(
             case when coalesce((x->>'sale')::numeric, 0) > 0
                       and coalesce((x->>'sale')::numeric, 0) < coalesce((x->>'price')::numeric, 0)
                  then (x->>'sale')::numeric
                  else coalesce((x->>'price')::numeric, 0) end
             * coalesce(nullif((x->>'qty')::numeric, 0), 1)), 0)
      into barang
      from jsonb_array_elements(new.items) x;
  end if;
  if barang <= 0 then barang := coalesce(new.subtotal, 0); end if;
  if barang <= 0 then return null; end if;

  perform public.ks_bayar(kid, round(barang)::int, 'barang_cod',
                          'Harga produk COD ' || new.order_code, new.order_code);   -- Kredit dipakai lebih dulu, sisanya dari saldo
  return null;
end;
$$;

-- Trigger lama (ks_cod_barang, ks_potong_saldo) tetap dipakai; urutannya tetap: harga produk dulu, lalu potongan ongkir.

-- Cek: harus menampilkan true, true, true, true
select exists (select 1 from information_schema.columns where table_name = 'kurir_saldo' and column_name = 'kredit') as kolom_kredit,
       exists (select 1 from pg_proc where proname = 'ks_bayar')       as bayar_kredit_dulu,
       exists (select 1 from pg_proc where proname = 'beri_kredit')    as admin_beri_kredit,
       exists (select 1 from pg_proc where proname = 'ks_beri_kredit') as sistem_beri_kredit;
