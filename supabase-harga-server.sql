-- =====================================================================
-- Kalensari Store • HARGA PESANAN DIHITUNG ULANG DI SERVER
-- Jalankan SETELAH semua SQL keamanan sebelumnya. Aman dijalankan berulang kali.
--
-- Sebelum: harga produk, subtotal, ongkir & total dikirim dari HP pembeli dan
--          langsung disimpan -> orang bisa membuat pesanan Rp1 lalu bayar QRIS Rp1.
-- Sesudah: setiap pesanan baru dari web dihitung ulang dari data server:
--   * harga produk / harga promo (sale & sale_until) / varian / topping
--   * batas topping per porsi (topping_limit) & minimal order (min_order)
--   * produk harus tampil (Show), varian & topping tidak habis, toko harus benar
--   * ongkir = ongkir pertama toko (shipping_fees) + tambahan per km dari toko
--     terakhir ke titik pembeli (garis lurus, sama seperti di keranjang)
--   * ojek / kirim paket: ongkos dari transport_tariff & jarak jemput -> tujuan
-- Angka dari HP pembeli diabaikan. Admin (login) tidak terpengaruh.
-- =====================================================================

-- ---------- 1) Bantuan ----------
create or replace function public.ks_kunci_toko(t text)
returns text language sql immutable as $$ select lower(regexp_replace(coalesce(t, ''), '^\s+|\s+$', '', 'g')) $$;

create or replace function public.ks_km(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
returns float8 language sql immutable as $$
  select 2 * 6371 * asin(least(1, sqrt(power(sin(radians(lat2 - lat1) / 2), 2)
         + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2))))
$$;

-- Varian: satu baris = "Nama | Harga | habis (opsional)"  (sama dengan parseVariants di script.js)
create or replace function public.ks_varian(p_text text)
returns table (nama text, harga integer, habis boolean) language plpgsql immutable as $$
declare l text; ps text[]; i int;
begin
  foreach l in array regexp_split_to_array(coalesce(p_text, ''), '\r?\n') loop
    ps := regexp_split_to_array(l, '\|');
    for i in 1 .. coalesce(array_length(ps, 1), 0) loop ps[i] := regexp_replace(ps[i], '^\s+|\s+$', '', 'g'); end loop;
    if coalesce(array_length(ps, 1), 0) < 2 or ps[1] = '' or ps[2] = '' then continue; end if;
    nama := ps[1];
    harga := coalesce(nullif(regexp_replace(ps[2], '\D', '', 'g'), '')::bigint, 0)::int;
    habis := exists (select 1 from unnest(ps[3:]) x where x ~* '^habis$');
    return next;
  end loop;
end $$;

-- Topping: satu baris = "Nama | Harga | foto (opsional) | habis (opsional)"  (sama dengan parseToppings)
create or replace function public.ks_topping(p_text text)
returns table (nama text, harga integer, habis boolean) language plpgsql immutable as $$
declare l text; pos int; n text; rest text; segs text[]; ok boolean;
begin
  foreach l in array regexp_split_to_array(coalesce(p_text, ''), '\r?\n') loop
    l := regexp_replace(l, '^\s+|\s+$', '', 'g');
    if l = '' or l ~ '^#' then continue; end if;
    ok := false;
    for pos in 2 .. length(l) loop
      if substr(l, pos, 1) not in ('|', '=') then continue; end if;
      n := regexp_replace(left(l, pos - 1), '^\s+|\s+$', '', 'g');
      rest := substr(l, pos + 1);
      segs := regexp_split_to_array(rest, '\|');
      if n <> '' and segs[1] ~* '^\s*(rp\.?\s*)?[0-9.,]+\s*$' then
        nama := n;
        harga := coalesce(nullif(regexp_replace(segs[1], '[^0-9]', '', 'g'), '')::bigint, 0)::int;
        habis := exists (select 1 from unnest(segs[2:]) x where x ~* '^\s*habis\s*$');
        ok := true; exit;
      end if;
    end loop;
    if ok then return next; end if;
  end loop;
end $$;

-- Ongkir pertama toko & tarif per km dari pengaturan "shipping_fees"
create or replace function public.ks_ongkir_dasar(p_toko text)
returns integer language sql stable security definer set search_path = public as $$
  select case when s.value ? public.ks_kunci_toko(p_toko)
                   and coalesce(s.value ->> public.ks_kunci_toko(p_toko), '') <> ''
              then coalesce(nullif(regexp_replace(s.value ->> public.ks_kunci_toko(p_toko), '[^0-9.]', '', 'g'), '')::numeric, 0)::int
              else coalesce(nullif(regexp_replace(coalesce(s.value ->> '__default', ''), '[^0-9.]', '', 'g'), '')::numeric, 0)::int end
    from (select coalesce((select value from public.store_settings where key = 'shipping_fees'), '{}'::jsonb) as value) s
$$;

-- Tambahan ongkir per km dari toko ke titik pembeli (0 bila titik tidak lengkap)
create or replace function public.ks_ongkir_jarak(p_toko text, p_note text)
returns integer language plpgsql stable security definer set search_path = public as $$
declare sf jsonb; m text[]; bl float8; bg float8; tl float8; tg float8; km float8; gratis numeric; perkm numeric;
begin
  m := regexp_match(coalesce(p_note, ''), '__KS_MAP__(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)__END__');
  if m is null then return 0; end if;
  bl := m[1]::float8; bg := m[2]::float8;
  if abs(bl) > 90 or abs(bg) > 180 or (bl = 0 and bg = 0) then return 0; end if;
  select (x->>'latitude')::float8, (x->>'longitude')::float8 into tl, tg
    from public.store_settings s,
         jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'penjual_members'
     and public.ks_kunci_toko(coalesce(nullif(x->>'toko', ''), x->>'usaha')) = public.ks_kunci_toko(p_toko)
     and coalesce(x->>'latitude', '') ~ '^-?\d+(\.\d+)?$' and coalesce(x->>'longitude', '') ~ '^-?\d+(\.\d+)?$'
     and not ((x->>'latitude')::float8 = 0 and (x->>'longitude')::float8 = 0)
   limit 1;
  if tl is null then return -1; end if;   -- -1 = toko belum punya titik lokasi
  sf := coalesce((select value from public.store_settings where key = 'shipping_fees'), '{}'::jsonb);
  gratis := case when coalesce(sf->>'__freeKm', '') = '' then 2 else greatest(0, coalesce(nullif(regexp_replace(sf->>'__freeKm', '[^0-9.]', '', 'g'), '')::numeric, 0)) end;
  perkm  := case when coalesce(sf->>'__perKm', '')  = '' then 2500 else greatest(0, coalesce(nullif(regexp_replace(sf->>'__perKm', '[^0-9.]', '', 'g'), '')::numeric, 0)) end;
  km := public.ks_km(tl, tg, bl, bg);
  return (greatest(0, ceil(km - gratis - 1e-9)) * perkm)::int;
end $$;


-- ---------- 2) Hitung ulang setiap pesanan baru (sebelum disimpan) ----------
-- (sengaja TANPA security definer: supaya bisa membedakan pembeli (anon) dari admin & fungsi server)
create or replace function public.ks_harga_pesanan()
returns trigger language plpgsql set search_path = public as $$
declare
  it jsonb; baru jsonb := '[]'::jsonb; p public.products%rowtype; q int; harga int; dasar int; sub bigint := 0;
  vnama text; v record; tnama text; tq int; tp record; tops jsonb; bagian text[]; potong text[]; x text; kunci text := null;
  ttl jsonb; lay text; ja jsonb; tu jsonb; km float8; tarif jsonb; faktor numeric; bulat numeric; ongkos numeric; jarak int;
begin
  -- admin, fungsi server (service_role) & SQL Editor tidak dihitung ulang
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if current_user = 'authenticated' and public.is_admin() then return new; end if;

  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then
    raise exception 'HARGA: Pesanan kosong.';
  end if;
  if jsonb_array_length(new.items) > 50 then raise exception 'HARGA: Terlalu banyak produk dalam satu nota.'; end if;

  -- ===== Ojek / kirim paket =====
  lay := new.items->0->>'layanan';
  if coalesce(lay, '') <> '' then
    if lay not in ('ojek', 'paket') or jsonb_array_length(new.items) <> 1 then raise exception 'HARGA: Layanan tidak dikenal.'; end if;
    ja := new.items->0->'jemput'; tu := new.items->0->'tujuan';
    if coalesce(ja->>'lat', '') !~ '^-?\d+(\.\d+)?$' or coalesce(ja->>'lng', '') !~ '^-?\d+(\.\d+)?$'
       or coalesce(tu->>'lat', '') !~ '^-?\d+(\.\d+)?$' or coalesce(tu->>'lng', '') !~ '^-?\d+(\.\d+)?$' then
      raise exception 'HARGA: Titik jemput / tujuan tidak valid.';
    end if;
    -- tarif bawaan sama dengan ojek.html, ditimpa pengaturan admin "transport_tariff"
    ttl := jsonb_build_object('faktor', 1.3, 'bulat', 500,
             'ojek',  jsonb_build_object('aktif', true, 'dasar', 5000, 'perKm', 2000, 'minimal', 5000, 'maxKm', 20),
             'paket', jsonb_build_object('aktif', true, 'dasar', 5000, 'perKm', 2500, 'minimal', 6000, 'maxKm', 20));
    tarif := coalesce((select value from public.store_settings where key = 'transport_tariff'), '{}'::jsonb);
    if jsonb_typeof(tarif) = 'object' then
      ttl := ttl || (tarif - 'ojek' - 'paket')
             || jsonb_build_object('ojek', (ttl->'ojek') || coalesce(case when jsonb_typeof(tarif->'ojek') = 'object' then tarif->'ojek' end, '{}'::jsonb),
                                   'paket', (ttl->'paket') || coalesce(case when jsonb_typeof(tarif->'paket') = 'object' then tarif->'paket' end, '{}'::jsonb));
    end if;
    tarif := ttl->lay;
    if (tarif->>'aktif') = 'false' then raise exception 'HARGA: Layanan % sedang tidak aktif.', lay; end if;
    faktor := coalesce(nullif(ttl->>'faktor', '')::numeric, 1); if faktor = 0 then faktor := 1; end if;
    bulat := greatest(1, coalesce(nullif(ttl->>'bulat', '')::numeric, 1));
    km := greatest(0.1, round((public.ks_km((ja->>'lat')::float8, (ja->>'lng')::float8, (tu->>'lat')::float8, (tu->>'lng')::float8) * faktor * 10)::numeric) / 10);
    if coalesce(nullif(tarif->>'maxKm', '')::numeric, 0) > 0 and km > (tarif->>'maxKm')::numeric then
      raise exception 'HARGA: Jarak terlalu jauh (maks % km).', tarif->>'maxKm';
    end if;
    ongkos := coalesce(nullif(tarif->>'dasar', '')::numeric, 0) + coalesce(nullif(tarif->>'perKm', '')::numeric, 0) * km;
    ongkos := ceil(greatest(coalesce(nullif(tarif->>'minimal', '')::numeric, 0), ongkos) / bulat) * bulat;
    new.items := jsonb_set(jsonb_set(jsonb_set(new.items, '{0,price}', to_jsonb(ongkos::int)), '{0,qty}', '1'::jsonb), '{0,km}', to_jsonb(km));
    new.subtotal := ongkos::int; new.shipping := 0; new.total := ongkos::int;
    return new;
  end if;

  -- ===== Belanja toko =====
  for it in select * from jsonb_array_elements(new.items) loop
    if coalesce(it->>'id', '') !~ '^\d+$' then raise exception 'HARGA: Produk tidak dikenal.'; end if;
    select * into p from public.products where id = (it->>'id')::bigint;
    if not found then raise exception 'HARGA: Produk sudah tidak ada. Muat ulang halaman.'; end if;
    if coalesce(p.status, '') <> 'Show' then raise exception 'HARGA: % sedang tidak tersedia.', p.name; end if;
    q := case when coalesce(it->>'qty', '') ~ '^\d{1,3}$' then (it->>'qty')::int else 0 end;
    if q < 1 or q > 99 then raise exception 'HARGA: Jumlah % tidak valid.', p.name; end if;

    -- toko: harus salah satu penjual produk ini, dan satu nota = satu toko
    if not public.ks_milik_toko(p.seller, it->>'seller') then
      raise exception 'HARGA: % tidak dijual oleh %.', p.name, coalesce(it->>'seller', '-');
    end if;
    if kunci is null then kunci := public.ks_kunci_toko(it->>'seller');
    elsif kunci <> public.ks_kunci_toko(it->>'seller') then raise exception 'HARGA: Satu nota hanya untuk satu toko.'; end if;

    -- pilihan varian & topping: dari "pilihan" (versi web baru), atau dibaca dari nama (versi lama)
    vnama := nullif(coalesce(it#>>'{pilihan,v}', it->>'varian'), '');
    tops := case when jsonb_typeof(it#>'{pilihan,t}') = 'array' then it#>'{pilihan,t}' else null end;
    if tops is null and exists (select 1 from public.ks_topping(p.toppings)) then
      x := coalesce(it->>'name', '');
      if left(x, length(p.name) + 2) <> p.name || ' (' or right(x, 1) <> ')' then
        raise exception 'HARGA: Pilihan topping % tidak terbaca. Muat ulang halaman lalu pesan lagi.', p.name;
      end if;
      bagian := string_to_array(substr(x, length(p.name) + 3, length(x) - length(p.name) - 3), ', ');
      tops := '[]'::jsonb;
      foreach x in array bagian loop
        if vnama is not null and x = vnama and tops = '[]'::jsonb then continue; end if;
        potong := regexp_match(x, '^(.*) x(\d+)$');
        if potong is not null and exists (select 1 from public.ks_topping(p.toppings) t where t.nama = potong[1]) then
          tops := tops || jsonb_build_array(jsonb_build_array(potong[1], potong[2]::int));
        else
          tops := tops || jsonb_build_array(jsonb_build_array(x, 1));
        end if;
      end loop;
    end if;

    -- harga dasar
    if exists (select 1 from public.ks_varian(p.variants)) then
      if vnama is null then raise exception 'HARGA: Pilih varian % dulu.', p.name; end if;
      select * into v from public.ks_varian(p.variants) vv where vv.nama = vnama limit 1;
      if not found then raise exception 'HARGA: Varian % (%) sudah tidak ada. Muat ulang halaman.', p.name, vnama; end if;
      if v.habis then raise exception 'HARGA: Varian % (%) sedang habis.', p.name, vnama; end if;
      dasar := v.harga;
    else
      vnama := null;
      dasar := case when coalesce(p.sale, 0) > 0 and (p.sale_until is null or p.sale_until > now()) then p.sale else coalesce(p.price, 0) end;
    end if;
    harga := dasar;

    -- topping (produk racik)
    if exists (select 1 from public.ks_topping(p.toppings)) then
      if tops is null or jsonb_array_length(tops) = 0 then raise exception 'HARGA: Pilih topping % dulu.', p.name; end if;
      bagian := array[]::text[];
      for tnama, tq in select e->>0, case when coalesce(e->>1, '') ~ '^\d{1,2}$' then (e->>1)::int else 0 end from jsonb_array_elements(tops) e loop
        if tq < 1 then raise exception 'HARGA: Jumlah topping % tidak valid.', tnama; end if;
        select * into tp from public.ks_topping(p.toppings) t where t.nama = tnama limit 1;
        if not found then raise exception 'HARGA: Topping % sudah tidak ada. Muat ulang halaman.', tnama; end if;
        if tp.habis then raise exception 'HARGA: Topping % sedang habis.', tnama; end if;
        harga := harga + tp.harga * tq;
        bagian := bagian || case when tq > 1 then tnama || ' x' || tq else tnama end;
      end loop;
      if coalesce(p.topping_limit, 0) > 0 and harga > p.topping_limit then
        raise exception 'HARGA: % melebihi batas % per porsi.', p.name, p.topping_limit;
      end if;
      if coalesce(p.min_order, 0) > 0 and harga < p.min_order then
        raise exception 'HARGA: % minimal order % per porsi.', p.name, p.min_order;
      end if;
      -- nama yang dilihat penjual & kurir = pilihan yang benar-benar dibayar
      it := it || jsonb_build_object('name', p.name || ' (' || array_to_string(array_remove(array[vnama], null) || bagian, ', ') || ')');
    elsif vnama is not null then
      it := it || jsonb_build_object('name', p.name || ' (' || vnama || ')');
    else
      it := it || jsonb_build_object('name', p.name);
    end if;

    it := it || jsonb_build_object('price', harga, 'sale', null, 'qty', q);
    baru := baru || jsonb_build_array(it);
    sub := sub + harga::bigint * q;
  end loop;

  new.items := baru;
  new.subtotal := sub;
  -- ongkir: ongkir pertama toko (+ tambahan jarak; untuk nota gabungan diatur setelah semua nota masuk)
  new.shipping := public.ks_ongkir_dasar(new.items->0->>'seller');
  if coalesce(new.grup, '') = '' then
    jarak := public.ks_ongkir_jarak(new.items->0->>'seller', new.note);
    new.shipping := new.shipping + greatest(jarak, 0);
  end if;
  new.total := new.subtotal + new.shipping;
  return new;
end $$;
revoke all on function public.ks_harga_pesanan() from public;

drop trigger if exists ks_harga_pesanan on public.orders;
create trigger ks_harga_pesanan before insert on public.orders
  for each row execute function public.ks_harga_pesanan();


-- ---------- 3) Nota gabungan (beberapa toko, 1 kurir): tambahan jarak masuk ke toko terakhir ----------
-- Toko terakhir = toko bertitik lokasi yang paling dekat dengan pembeli (sama seperti keranjang).
create or replace function public.ks_ongkir_grup_atur(p_grup text[])
returns void language plpgsql security definer set search_path = public as $$
declare g text; r record; akhir text; jarak int; best float8;
        bl float8; bg float8; m text[]; tl float8; tg float8; km float8;
begin
  foreach g in array coalesce(p_grup, array[]::text[]) loop
    akhir := null; best := null;
    select (regexp_match(o.note, '__KS_MAP__(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)__END__')) into m
      from public.orders o where o.grup = g order by o.id limit 1;
    if m is not null then
      bl := m[1]::float8; bg := m[2]::float8;
      for r in select o.order_code, o.items->0->>'seller' as toko from public.orders o where o.grup = g order by o.id loop
        tl := null;
        select (x->>'latitude')::float8, (x->>'longitude')::float8 into tl, tg
          from public.store_settings s,
               jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
         where s.key = 'penjual_members'
           and public.ks_kunci_toko(coalesce(nullif(x->>'toko', ''), x->>'usaha')) = public.ks_kunci_toko(r.toko)
           and coalesce(x->>'latitude', '') ~ '^-?\d+(\.\d+)?$' and coalesce(x->>'longitude', '') ~ '^-?\d+(\.\d+)?$'
           and not ((x->>'latitude')::float8 = 0 and (x->>'longitude')::float8 = 0)
         limit 1;
        if tl is null then continue; end if;
        km := public.ks_km(tl, tg, bl, bg);
        if best is null or km <= best then best := km; akhir := r.order_code; end if;
      end loop;
    end if;
    for r in select o.id, o.order_code, o.subtotal, o.shipping, o.items->0->>'seller' as toko, o.note from public.orders o where o.grup = g loop
      jarak := public.ks_ongkir_dasar(r.toko);
      if r.order_code = akhir then jarak := jarak + greatest(public.ks_ongkir_jarak(r.toko, r.note), 0); end if;
      if r.shipping is distinct from jarak then
        update public.orders set shipping = jarak, total = coalesce(subtotal, 0) + jarak where id = r.id;
      end if;
    end loop;
  end loop;
end $$;
revoke all on function public.ks_ongkir_grup_atur(text[]) from public;
grant execute on function public.ks_ongkir_grup_atur(text[]) to anon, authenticated;  -- hanya menghitung ulang ongkir yang benar

-- pembungkus (tanpa security definer): hanya untuk pesanan dari web, bukan admin / fungsi server
create or replace function public.ks_ongkir_grup()
returns trigger language plpgsql set search_path = public as $$
declare gs text[];
begin
  if current_user not in ('anon', 'authenticated') then return null; end if;
  if current_user = 'authenticated' and public.is_admin() then return null; end if;
  select array_agg(distinct b.grup) into gs from baru b
   where coalesce(b.grup, '') <> '' and coalesce(b.items->0->>'layanan', '') = '';
  if gs is not null then perform public.ks_ongkir_grup_atur(gs); end if;
  return null;
end $$;
revoke all on function public.ks_ongkir_grup() from public;

drop trigger if exists ks_ongkir_grup on public.orders;
create trigger ks_ongkir_grup after insert on public.orders
  referencing new table as baru
  for each statement execute function public.ks_ongkir_grup();
