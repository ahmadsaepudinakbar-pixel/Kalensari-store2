-- =====================================================================
-- KALENSARI STORE - GAGAL ANTAR AMAN (anti kurir & pembeli bersekongkol)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Syarat: supabase-saldo-kurir.sql, supabase-cod-saldo.sql, supabase-keamanan-*.sql dan
--         supabase-multitoko-adil.sql sudah dijalankan sebelumnya.
--
-- Aturan baru saat kurir menandai pesanan TOKO "gagal antar":
--  1) BARANG WAJIB KEMBALI KE TOKO. Dicatat di store_settings 'retur_<kode>':
--       status 'di_kurir'  -> barang masih dibawa kurir
--       status 'kembali'   -> toko menekan "Barang sudah kembali" (aplikasi Mitra Toko)
--       status 'diteruskan'-> lewat 24 jam / diputuskan admin: barang dianggap dibeli kurir
--     Kecuali kategori "ditanggung kurir" (bawaan: Makanan, Minuman, Es Krim & Buah-buahan, bisa diubah admin di
--     store_settings 'gagal_aturan'): tidak dikembalikan; pesanan COD -> saldo kurir langsung
--     dipotong harga barang itu (mutasi 'ganti_gagal') dan uangnya menjadi saldo toko.
--  Berlaku untuk COD (aturan baru) DAN pesanan yang sudah dibayar (QRIS / saldo voucher, lunas).
--  Pesanan yang sudah dibayar: uang pembeli dikembalikan otomatis sebagai saldo voucher.
--  2) JAMINAN SALDO (Saldo Kurir aktif):
--       saldo kurir langsung dipotong harga produk (mutasi 'jaminan_gagal').
--       - Toko konfirmasi barang kembali dalam 24 jam -> jaminan dikembalikan ke kurir ('jaminan_kembali').
--       - Lewat 24 jam tanpa konfirmasi -> uang jaminan menjadi saldo toko (dihitung aplikasi Mitra Toko).
--     Jadi bila kurir "menggratiskan" barang untuk temannya, kurir sendiri yang membayar barangnya.
--  3) BUKTI WAJIB: gagal antar dari aplikasi kurir harus disertai foto berlokasi GPS
--     (store_settings 'foto_<kode>' dengan "gagal": true, dibuat maksimal 3 jam sebelumnya).
--     Admin (Supabase Auth), fungsi server (service_role) dan SQL Editor tidak terkena aturan ini.
--  Ojek & kirim paket (tanpa toko) tidak membuat catatan retur.
-- Tidak mengubah fungsi lama. Tidak berisi kode rahasia.
-- =====================================================================

-- 0) Satu jaminan & satu pengembalian per pesanan
create unique index if not exists kurir_mutasi_jaminan_gagal_unik
  on public.kurir_mutasi(order_code) where jenis = 'jaminan_gagal';
create unique index if not exists kurir_mutasi_jaminan_kembali_unik
  on public.kurir_mutasi(order_code) where jenis = 'jaminan_kembali';

-- 1) Bantuan
-- pesanan COD yang memakai aturan saldo baru?
create or replace function public.ks_cod_baru(p_payment text, p_created timestamptz)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare v jsonb; mulai timestamptz;
begin
  if lower(btrim(coalesce(p_payment, ''))) !~ '^cod' then return false; end if;
  select value into v from public.store_settings where key = 'cod_saldo_mulai';
  begin
    mulai := case when jsonb_typeof(v) = 'object' then (v->>'t')::timestamptz
                  when jsonb_typeof(v) = 'string' then (v #>> '{}')::timestamptz end;
  exception when others then mulai := null;
  end;
  return mulai is not null and p_created >= mulai;
end $$;

-- dipanggil dari web (anon / authenticated) dan bukan admin?
create or replace function public.ks_dari_web()
returns boolean language plpgsql stable as $$
declare r text;
begin
  begin r := coalesce(current_setting('request.jwt.claims', true)::jsonb->>'role', ''); exception when others then r := ''; end;
  if r = '' then begin r := coalesce(current_setting('request.jwt.claim.role', true), ''); exception when others then r := ''; end; end if;
  if r not in ('anon', 'authenticated') then return false; end if;
  begin if public.is_admin() then return false; end if; exception when others then null; end;
  return true;
end $$;

-- 2) PENJAGA: gagal antar dari aplikasi wajib foto berlokasi
create or replace function public.ks_gagal_wajib_bukti()
returns trigger language plpgsql security definer set search_path = public as $$
declare f jsonb; t numeric;
begin
  if not public.ks_dari_web() then return new; end if;
  select value into f from public.store_settings where key = 'foto_' || new.order_code;
  if f is null or coalesce((f->>'gagal')::boolean, false) is not true then
    raise exception 'Gagal antar wajib disertai foto bukti berlokasi. Perbarui aplikasi kurir lalu coba lagi.';
  end if;
  t := coalesce((f->>'t')::numeric, 0);
  if t < extract(epoch from now() - interval '3 hours') * 1000 then
    raise exception 'Foto bukti gagal antar sudah kedaluwarsa. Ambil foto lagi di lokasi.';
  end if;
  return new;
end $$;

drop trigger if exists ks_gagal_wajib_bukti on public.orders;
create trigger ks_gagal_wajib_bukti
  before update on public.orders
  for each row when (new.status = 'gagal' and old.status is distinct from 'gagal')
  execute function public.ks_gagal_wajib_bukti();

-- 3) Saat pesanan TOKO gagal antar.
--    Aturan per barang (diatur admin: store_settings 'gagal_aturan' = {"tanggung_kurir":["Makanan","Minuman","Es Krim","Buah-buahan"]}):
--      * kategori "ditanggung kurir" (bawaan: Makanan, Minuman) -> TIDAK dikembalikan. Pesanan COD: saldo kurir langsung
--        dipotong harga barang (mutasi 'ganti_gagal'), uangnya menjadi saldo toko.
--      * kategori lain (mis. Mainan, Aksesoris, Pakaian) -> WAJIB kembali ke toko. Pesanan COD: jaminan dipotong,
--        dikembalikan setelah toko konfirmasi (impas). Lewat 24 jam -> jaminan menjadi saldo toko.
create unique index if not exists kurir_mutasi_ganti_gagal_unik
  on public.kurir_mutasi(order_code) where jenis = 'ganti_gagal';

create or replace function public.ks_kat_norm(t text)
returns text language sql immutable as $$
  select case k
           when 'escream' then 'eskrim' when 'escrim' then 'eskrim' when 'icecream' then 'eskrim'
           when 'buah' then 'buahbuahan'
           else k end
    from (select regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]', '', 'g') k) z
$$;

-- Daftar kategori yang ditanggung kurir (dari admin 'gagal_aturan'; bawaan 4 kategori)
create or replace function public.ks_tanggung_kurir()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(
    (select array_agg(public.ks_kat_norm(x)) from public.store_settings s, jsonb_array_elements_text(s.value->'tanggung_kurir') x
      where s.key = 'gagal_aturan' and jsonb_typeof(s.value->'tanggung_kurir') = 'array' and btrim(x) <> ''),
    array['makanan', 'minuman', 'eskrim', 'buahbuahan'])
$$;

-- Pemisahan barang gagal antar memakai nama kategori yang sudah disamakan
create or replace function public.ks_pisah_gagal(p_items jsonb)
returns table(tanggung boolean, toko text, nilai int)
language sql stable security definer set search_path = public as $$
  select public.ks_kat_norm(coalesce(
           (select p.category from public.products p where p.id::text = x->>'id' limit 1),
           x->>'category', '')) = any(public.ks_tanggung_kurir()),
         lower(regexp_replace(btrim(split_part(coalesce(x->>'seller', ''), ',', 1)), '\s+', ' ', 'g')),
         round(case when coalesce((x->>'sale')::numeric, 0) > 0
                         and coalesce((x->>'sale')::numeric, 0) < coalesce((x->>'price')::numeric, 0)
                    then (x->>'sale')::numeric else coalesce((x->>'price')::numeric, 0) end
               * coalesce(nullif((x->>'qty')::numeric, 0), 1))::int
    from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) x
$$;

create or replace function public.ks_gagal_retur()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  kid text; knama text; cod boolean; lunas boolean; aktif boolean; berlaku boolean; sek timestamptz := now(); f jsonb;
  barang int := 0; per jsonb := '{}'::jsonb; hangus int := 0; per_h jsonb := '{}'::jsonb; jaminan int := 0; ganti int := 0;
begin
  -- ojek / kirim paket tidak punya toko
  if jsonb_typeof(new.items) = 'array' and (new.items->0) ? 'layanan' then return null; end if;
  if exists (select 1 from public.store_settings where key = 'retur_' || new.order_code) then return null; end if;

  kid := coalesce(nullif(new.kurir_id, ''), public.ks_kurir_pegang(new.order_code));
  if kid is null or kid = '' then return null; end if;
  knama := coalesce(nullif(new.kurir_nama, ''), '');

  select coalesce(sum(nilai) filter (where not tanggung), 0), coalesce(sum(nilai) filter (where tanggung), 0)
    into barang, hangus from public.ks_pisah_gagal(new.items);
  select coalesce(jsonb_object_agg(toko, v), '{}'::jsonb) into per
    from (select toko, sum(nilai)::int v from public.ks_pisah_gagal(new.items) where not tanggung and toko <> '' group by toko) s;
  select coalesce(jsonb_object_agg(toko, v), '{}'::jsonb) into per_h
    from (select toko, sum(nilai)::int v from public.ks_pisah_gagal(new.items) where tanggung and toko <> '' group by toko) s;

  cod := public.ks_cod_baru(new.payment, new.created_at);
  -- QRIS / saldo yang sudah LUNAS: aturannya sama dengan COD (uang pembeli dikembalikan, lihat ks_gagal_refund)
  lunas := coalesce(new.pay_status, '') = 'lunas' and lower(btrim(coalesce(new.payment, ''))) !~ '^cod';
  aktif := coalesce((public.ks_biaya()->>'aktif')::boolean, false);
  berlaku := (cod or lunas) and aktif;
  if not berlaku then hangus := 0; per_h := '{}'::jsonb; end if;
  if barang <= 0 and hangus <= 0 then return null; end if;
  select value into f from public.store_settings where key = 'foto_' || new.order_code;

  if berlaku and hangus > 0
     and not exists (select 1 from public.kurir_mutasi where order_code = new.order_code and jenis = 'ganti_gagal') then
    perform public.ks_ubah_saldo(kid, -hangus, 'ganti_gagal',
      'Ganti rugi makanan/minuman gagal antar ' || new.order_code || ' (untuk toko)', new.order_code);
    ganti := hangus;
  end if;
  if berlaku and barang > 0
     and not exists (select 1 from public.kurir_mutasi where order_code = new.order_code and jenis = 'jaminan_gagal') then
    perform public.ks_ubah_saldo(kid, -barang, 'jaminan_gagal',
      'Jaminan barang gagal antar ' || new.order_code || ' (kembali setelah toko konfirmasi)', new.order_code);
    jaminan := barang;
  end if;

  insert into public.store_settings (key, value) values ('retur_' || new.order_code, jsonb_build_object(
    'kode', new.order_code, 'kurir_id', kid, 'kurir_nama', knama,
    'toko', (select coalesce(jsonb_agg(distinct k), '[]'::jsonb) from (select jsonb_object_keys(per) k union select jsonb_object_keys(per_h)) z),
    'per_toko', per, 'barang', barang, 'jaminan', jaminan,
    'hangus', ganti, 'hangus_per_toko', case when ganti > 0 then per_h else '{}'::jsonb end,
    'cod', cod, 'lunas', lunas,
    'pembeli', coalesce(new.customer_name, ''), 'hp', coalesce(nullif(to_jsonb(new)->>'customer_phone_normalized', ''), new.customer_phone, ''),
    'lok', case when f is not null then f->'lok' else null end,
    't', to_char(sek at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'batas', to_char((sek + interval '24 hours') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'status', case when barang > 0 then 'di_kurir' else 'tanpa_retur' end))
  on conflict (key) do nothing;
  return null;
end $$;

drop trigger if exists ks_gagal_retur on public.orders;
create trigger ks_gagal_retur
  after update on public.orders
  for each row when (new.status = 'gagal' and old.status is distinct from 'gagal')
  execute function public.ks_gagal_retur();


-- 3b) Pesanan yang SUDAH DIBAYAR (QRIS / saldo voucher) lalu gagal antar -> uang pembeli kembali sebagai saldo voucher.
--     Sama seperti COD: pembeli tidak membayar apa pun; kerugian makanan ditanggung kurir, barang lain kembali ke toko.
--     Saldo voucher yang sempat dipakai di pesanan COD juga dikembalikan.
--     Butuh fitur saldo voucher pembeli (supabase-voucher-pembeli.sql); bila belum dipasang, langkah ini dilewati.
create or replace function public.ks_gagal_refund()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_wa text; jml int := 0; pakai int;
begin
  if jsonb_typeof(new.items) = 'array' and (new.items->0) ? 'layanan' then return null; end if;
  if to_regclass('public.pembeli_mutasi') is null
     or to_regprocedure('public.ks_saldo_pembeli(text,integer,text,text,text)') is null then return null; end if;
  pakai := coalesce(nullif(to_jsonb(old)->>'potong_saldo', '')::numeric, 0)::int;
  if coalesce(new.pay_status, '') = 'lunas' and lower(btrim(coalesce(new.payment, ''))) !~ '^cod' then
    jml := coalesce(old.total, 0) + pakai;
  else
    jml := pakai;
  end if;
  v_wa := nullif(to_jsonb(new)->>'customer_phone_normalized', '');
  if v_wa is null then v_wa := regexp_replace(regexp_replace(coalesce(new.customer_phone, ''), '\D', '', 'g'), '^0', '62'); end if;
  if jml > 0 and v_wa <> '' and not exists (select 1 from public.pembeli_mutasi where order_code = new.order_code and jenis = 'refund') then
    execute 'select public.ks_saldo_pembeli($1, $2, $3, $4, $5)'
      using v_wa, jml, 'refund', 'Pengembalian ' || new.order_code || ' (gagal diantar)', new.order_code;
    update public.orders set refund = coalesce(refund, '{}'::jsonb) || jsonb_build_object('jumlah', jml, 'status', 'saldo', 'saldo_t', now(), 'ket', 'gagal antar')
     where id = new.id;
  end if;
  return null;
end $$;

drop trigger if exists ks_gagal_refund on public.orders;
create trigger ks_gagal_refund
  after update on public.orders
  for each row when (new.status = 'gagal' and old.status is distinct from 'gagal')
  execute function public.ks_gagal_refund();

-- 4) Mitra Toko: "Barang sudah kembali" (hanya toko pemilik barang, maksimal 24 jam)
create or replace function public.toko_retur_kembali(p_sesi text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  toko text := public.ks_toko_sesi(p_sesi);   -- error "Sesi berakhir" bila sesi tidak sah
  r jsonb; o public.orders; jam int;
begin
  select * into o from public.orders where order_code = p_kode;
  if not found then raise exception 'Pesanan tidak ditemukan'; end if;
  if not public.ks_pesanan_toko(o.items, toko) then raise exception 'Pesanan ini bukan untuk toko Anda'; end if;
  select value into r from public.store_settings where key = 'retur_' || p_kode for update;
  if r is null then raise exception 'Pesanan ini tidak sedang menunggu barang kembali'; end if;
  if r->>'status' = 'kembali' then return jsonb_build_object('ok', true, 'sudah', true); end if;
  if r->>'status' = 'tanpa_retur' then raise exception 'Barang pesanan ini (makanan/minuman) tidak perlu dikembalikan.'; end if;
  jam := coalesce((r->>'jaminan')::int, 0);
  if r->>'status' <> 'di_kurir' or now() > (r->>'batas')::timestamptz then
    if jam > 0 then
      raise exception 'Sudah lewat 24 jam: barang dianggap dibeli kurir dan uangnya sudah masuk saldo toko. Hubungi admin bila barang ternyata kembali.';
    end if;
    raise exception 'Sudah lewat 24 jam. Hubungi admin untuk mencatat barang yang kembali.';
  end if;
  if jam > 0 and not exists (select 1 from public.kurir_mutasi where order_code = p_kode and jenis = 'jaminan_kembali') then
    perform public.ks_ubah_saldo(r->>'kurir_id', jam, 'jaminan_kembali', 'Barang ' || p_kode || ' sudah kembali ke toko', p_kode);
  end if;
  update public.store_settings set value = value || jsonb_build_object('status', 'kembali', 'oleh', toko,
         't_kembali', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   where key = 'retur_' || p_kode;
  return jsonb_build_object('ok', true, 'jaminan_kembali', jam);
end $$;
revoke all on function public.toko_retur_kembali(text, text) from public;
grant execute on function public.toko_retur_kembali(text, text) to anon, authenticated;

-- 5) Admin: putuskan retur kapan saja.  p_aksi = 'kembali' (kembalikan jaminan ke kurir) | 'diteruskan' (barang dianggap dibeli kurir)
create or replace function public.admin_retur(p_kode text, p_aksi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb; jam int;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select value into r from public.store_settings where key = 'retur_' || p_kode for update;
  if r is null then raise exception 'Catatan retur tidak ditemukan'; end if;
  jam := coalesce((r->>'jaminan')::int, 0);
  if p_aksi = 'kembali' then
    if jam > 0 and not exists (select 1 from public.kurir_mutasi where order_code = p_kode and jenis = 'jaminan_kembali') then
      perform public.ks_ubah_saldo(r->>'kurir_id', jam, 'jaminan_kembali', 'Barang ' || p_kode || ' kembali (diputuskan admin)', p_kode);
    end if;
  elsif p_aksi <> 'diteruskan' then raise exception 'Aksi tidak dikenal';
  end if;
  update public.store_settings set value = value || jsonb_build_object('status', p_aksi, 'oleh', 'admin',
         't_kembali', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
   where key = 'retur_' || p_kode;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.admin_retur(text, text) from public;
grant execute on function public.admin_retur(text, text) to authenticated;

revoke all on function public.ks_cod_baru(text, timestamptz) from public, anon, authenticated;

-- Cek: harus menampilkan true, true, true, true, true, {makanan,minuman,eskrim,buahbuahan}
select exists (select 1 from pg_trigger where tgname = 'ks_gagal_wajib_bukti') as wajib_foto_gagal,
       exists (select 1 from pg_trigger where tgname = 'ks_gagal_retur')       as catat_retur_jaminan,
       exists (select 1 from pg_trigger where tgname = 'ks_gagal_refund')      as refund_qris_pembeli,
       exists (select 1 from pg_proc where proname = 'toko_retur_kembali')     as tombol_toko,
       exists (select 1 from pg_proc where proname = 'admin_retur')            as tombol_admin,
       public.ks_tanggung_kurir()                                              as kategori_ditanggung_kurir;
