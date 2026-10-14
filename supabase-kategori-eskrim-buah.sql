-- =====================================================================
-- KALENSARI STORE: Es Krim & Buah-buahan ikut "ditanggung kurir" bila gagal antar
-- Jalankan SETELAH supabase-gagal-antar-aman.sql (Supabase > SQL Editor > Run).
-- Aman dijalankan berulang kali.
-- =====================================================================

-- 1) Penyamaan nama kategori: huruf kecil, tanpa spasi/tanda baca, plus sinonim.
--    "Es Krim" = "es cream" = "Ice Cream" = "EsKrim";  "Buah" = "Buah-buahan" = "buah buahan"
create or replace function public.ks_kat_norm(t text)
returns text language sql immutable as $$
  select case k
           when 'escream' then 'eskrim' when 'escrim' then 'eskrim' when 'icecream' then 'eskrim'
           when 'buah' then 'buahbuahan'
           else k end
    from (select regexp_replace(lower(coalesce(t, '')), '[^a-z0-9]', '', 'g') k) z
$$;

-- 2) Daftar kategori yang ditanggung kurir (dari admin 'gagal_aturan'; bawaan 4 kategori)
create or replace function public.ks_tanggung_kurir()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(
    (select array_agg(public.ks_kat_norm(x)) from public.store_settings s, jsonb_array_elements_text(s.value->'tanggung_kurir') x
      where s.key = 'gagal_aturan' and jsonb_typeof(s.value->'tanggung_kurir') = 'array' and btrim(x) <> ''),
    array['makanan', 'minuman', 'eskrim', 'buahbuahan'])
$$;

-- 3) Pemisahan barang gagal antar memakai nama kategori yang sudah disamakan
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

-- 4) Simpan aturan admin: tambahkan Es Krim & Buah-buahan ke daftar yang sudah ada
--    (isian admin yang lain tetap; tidak dobel bila sudah ada dengan ejaan lain, mis. "Es Cream")
do $$
declare
  v jsonb; daftar jsonb; k text;
begin
  select value into v from public.store_settings where key = 'gagal_aturan';
  v := case when jsonb_typeof(v) = 'object' then v else '{}'::jsonb end;
  daftar := case when jsonb_typeof(v->'tanggung_kurir') = 'array' then v->'tanggung_kurir' else '["Makanan","Minuman"]'::jsonb end;
  foreach k in array array['Es Krim', 'Buah-buahan'] loop
    if not exists (select 1 from jsonb_array_elements_text(daftar) x where public.ks_kat_norm(x) = public.ks_kat_norm(k)) then
      daftar := daftar || to_jsonb(k);
    end if;
  end loop;
  insert into public.store_settings (key, value) values ('gagal_aturan', v || jsonb_build_object('tanggung_kurir', daftar))
  on conflict (key) do update set value = excluded.value;
end $$;

-- Cek: harus tampil {makanan,minuman,eskrim,buahbuahan} (ditambah kategori lain yang admin isi)
select public.ks_tanggung_kurir();
