-- =====================================================================
-- KALENSARI STORE - ATURAN COD BARU: lewat SALDO (tanpa kurir menalangi toko)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Syarat: supabase-saldo-kurir.sql (dan potongan ongkir persen) sudah dijalankan,
--         dan "Saldo kurir" sudah AKTIF di admin.html > Pengaturan.
--
-- Aturan:
--  1) Pembeli bayar tunai ke kurir. Kurir TIDAK membayar uang barang ke toko lagi.
--  2) Saat pesanan COD SELESAI:
--       - saldo TOKO bertambah sebesar harga produk (dihitung aplikasi, sama seperti QRIS)
--       - saldo KURIR dikurangi harga produk  (baris mutasi jenis 'barang_cod')
--       - saldo KURIR dikurangi potongan ongkir admin (trigger lama ks_potong_saldo, misal 10%)
--     Contoh: saldo 10.000, produk 20.000, ongkir 10.000 -> 10.000 - 20.000 - 1.000 = -11.000
--  3) Saldo kurir BOLEH minus. Selama saldo < 0, kurir tidak bisa menerima pesanan COD
--     (ditolak oleh database, bukan hanya aplikasi) sampai saldo kembali plus.
--  4) Hanya pesanan COD yang dibuat SETELAH SQL ini dijalankan yang memakai aturan baru
--     (waktunya disimpan di store_settings 'cod_saldo_mulai'). Pesanan COD lama tetap
--     memakai cara lama (kurir sudah menalangi, toko menekan "Uang sudah diterima").
--  5) Pesanan gagal antar tidak memotong saldo apa pun.
-- Tidak mengubah fungsi ks_potong_saldo yang sudah ada. Tidak berisi kode rahasia.
-- =====================================================================

-- 1) Waktu mulai aturan baru (hanya diisi sekali; tidak ditimpa bila dijalankan ulang)
insert into public.store_settings (key, value)
values ('cod_saldo_mulai',
        jsonb_build_object('t', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))
on conflict (key) do nothing;

-- 2) Satu potongan harga produk per pesanan COD
create unique index if not exists kurir_mutasi_barang_cod_unik
  on public.kurir_mutasi(order_code) where jenis = 'barang_cod';

-- 3) Saat pesanan COD selesai: kurir dipotong harga produk (boleh membuat saldo minus)
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

  perform public.ks_ubah_saldo(kid, -(round(barang)::int), 'barang_cod',
                               'Harga produk COD ' || new.order_code, new.order_code);
  return null;
end;
$$;

-- nama trigger sengaja lebih awal dari ks_potong_saldo, jadi urutannya: harga produk dulu, lalu potongan ongkir
drop trigger if exists ks_cod_barang on public.orders;
create trigger ks_cod_barang
  after update on public.orders
  for each row when (new.status = 'selesai' and old.status is distinct from new.status)
  execute function public.ks_cod_barang();

-- 4) Penjaga: kurir yang saldonya minus tidak bisa MENERIMA pesanan COD (cek di database)
create or replace function public.ks_cod_jaga_terima()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kode text; kid text; o public.orders; sal integer; v jsonb; mulai timestamptz;
begin
  if jsonb_typeof(new.value->'acc') is distinct from 'object' then return new; end if;   -- bukan penerimaan
  kid := new.value->'acc'->>'id';
  if kid is null or kid = '' then return new; end if;
  -- kurir yang SUDAH memegang pesanan ini tidak diperiksa ulang
  if tg_op = 'UPDATE' then
    if jsonb_typeof(old.value->'acc') = 'object' and old.value->'acc'->>'id' = kid then return new; end if;
  end if;
  if coalesce((public.ks_biaya()->>'aktif')::boolean, false) is not true then return new; end if;

  kode := substr(new.key, 11);   -- setelah 'kurir_ord_'
  select * into o from public.orders where order_code = kode;
  if not found then return new; end if;
  if lower(btrim(coalesce(o.payment, ''))) !~ '^cod' then return new; end if;
  if jsonb_typeof(o.items) = 'array' and (o.items->0) ? 'layanan' then return new; end if;

  select value into v from public.store_settings where key = 'cod_saldo_mulai';
  begin
    mulai := case when jsonb_typeof(v) = 'object' then (v->>'t')::timestamptz
                  when jsonb_typeof(v) = 'string' then (v #>> '{}')::timestamptz end;
  exception when others then mulai := null;
  end;
  if mulai is null or o.created_at < mulai then return new; end if;

  select saldo into sal from public.kurir_saldo where kurir_id = kid;
  if coalesce(sal, 0) < 0 then
    raise exception 'Saldo Anda minus. Isi saldo dulu supaya bisa menerima pesanan COD.';
  end if;
  return new;
end;
$$;

drop trigger if exists ks_cod_jaga_terima on public.store_settings;
create trigger ks_cod_jaga_terima
  before insert or update on public.store_settings
  for each row when (new.key like 'kurir\_ord\_%')
  execute function public.ks_cod_jaga_terima();

-- Cek: harus menampilkan true, true, true
select exists (select 1 from pg_trigger where tgname = 'ks_cod_barang')      as potong_barang_cod,
       exists (select 1 from pg_trigger where tgname = 'ks_cod_jaga_terima') as jaga_saldo_minus,
       exists (select 1 from public.store_settings where key = 'cod_saldo_mulai') as waktu_mulai_ada;
