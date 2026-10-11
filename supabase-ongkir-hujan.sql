-- =====================================================================
-- KALENSARI • Tambahan ongkir saat cuaca hujan
-- Admin menyalakan "Mode hujan" di Admin > Ongkir (disimpan di store_settings
-- 'shipping_fees' sebagai __hujan = true dan __hujanRp = nominal).
-- Aturan: tambahan dikenakan SEKALI per pengiriman (1 kurir):
--   * pesanan 1 toko        -> masuk ke ongkir pesanan itu
--   * nota gabungan banyak toko -> masuk ke nota toko terakhir (sama seperti tambahan jarak)
--   * ojek / kirim paket tidak terpengaruh
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- (Jalankan SETELAH supabase-harga-server.sql)
-- =====================================================================

-- 1) Nominal tambahan hujan saat ini (0 bila mode hujan mati)
create or replace function public.ks_ongkir_hujan()
returns integer language sql stable security definer set search_path = public as $$
  select case
           when coalesce(s.value->>'__hujan', '') in ('true', '1')
           then greatest(0, coalesce(nullif(regexp_replace(coalesce(s.value->>'__hujanRp', ''), '[^0-9.]', '', 'g'), '')::numeric, 2000))::int
           else 0
         end
    from (select coalesce((select value from public.store_settings where key = 'shipping_fees'), '{}'::jsonb) as value) s
$$;
revoke all on function public.ks_ongkir_hujan() from public;
grant execute on function public.ks_ongkir_hujan() to anon, authenticated;

-- 2) Pesanan satu toko (tanpa grup): tambahkan setelah harga dihitung server
--    (nama trigger diurutkan SETELAH ks_harga_pesanan, jadi berjalan sesudahnya)
create or replace function public.ks_hujan_pesanan()
returns trigger language plpgsql set search_path = public as $$
declare h int;
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if current_user = 'authenticated' and public.is_admin() then return new; end if;
  if coalesce(new.grup, '') <> '' then return new; end if;                       -- nota gabungan: diatur ks_ongkir_grup_atur
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 then return new; end if;
  if coalesce(new.items->0->>'layanan', '') <> '' then return new; end if;         -- ojek / paket tidak kena
  h := public.ks_ongkir_hujan();
  if h > 0 then
    new.shipping := coalesce(new.shipping, 0) + h;
    new.total := coalesce(new.subtotal, 0) + new.shipping;
  end if;
  return new;
end $$;
revoke all on function public.ks_hujan_pesanan() from public;

drop trigger if exists ks_hujan_pesanan on public.orders;
create trigger ks_hujan_pesanan before insert on public.orders
  for each row execute function public.ks_hujan_pesanan();

-- 3) Nota gabungan: hitung ulang ongkir (sama dengan supabase-harga-server.sql + tambahan hujan)
create or replace function public.ks_ongkir_grup_atur(p_grup text[])
returns void language plpgsql security definer set search_path = public as $$
declare g text; r record; akhir text; pertama text; jarak int; best float8;
        bl float8; bg float8; m text[]; tl float8; tg float8; km float8; hujan int := public.ks_ongkir_hujan();
begin
  foreach g in array coalesce(p_grup, array[]::text[]) loop
    akhir := null; best := null;
    select o.order_code into pertama from public.orders o where o.grup = g order by o.id limit 1;
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
      -- tambahan hujan sekali per pengiriman: nota toko terakhir (atau nota pertama bila titik toko belum ada)
      if r.order_code = coalesce(akhir, pertama) then jarak := jarak + hujan; end if;
      if r.shipping is distinct from jarak then
        update public.orders set shipping = jarak, total = coalesce(subtotal, 0) + jarak where id = r.id;
      end if;
    end loop;
  end loop;
end $$;
revoke all on function public.ks_ongkir_grup_atur(text[]) from public;
grant execute on function public.ks_ongkir_grup_atur(text[]) to anon, authenticated;
