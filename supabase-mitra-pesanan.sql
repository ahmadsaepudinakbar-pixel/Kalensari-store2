-- KALENSARI STORE - PESANAN MASUK MITRA LUAR KOTA (jalankan SEKALI di Supabase > SQL Editor)
-- Syarat: supabase-mitra-luar-kota.sql sudah dijalankan. Hanya membaca pesanan; tidak mengubah data.
create or replace function public.mitra_pesanan(p_sesi text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi);
begin
  return coalesce((
    select jsonb_agg(z.r order by z.ord desc) from (
      select o.created_at ord, jsonb_build_object('kode', o.order_code, 'tgl', o.created_at, 'status', lower(coalesce(o.status, '')),
             'nama', o.customer_name, 'wa', o.customer_phone, 'alamat', o.address, 'catatan', o.note, 'bayar', o.payment,
             'ongkir', o.shipping, 'items', l.its) r
        from public.orders o
        cross join lateral (
          select jsonb_agg(jsonb_build_object('nama', coalesce(it->>'name', p.name),
                   'qty', case when it->>'qty' ~ '^[0-9]+$' then (it->>'qty')::int else 1 end,
                   'harga', case when it->>'price' ~ '^[0-9]+(\.[0-9]+)?$' then (it->>'price')::numeric else p.price end)) its
            from jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) it
            join public.products p on p.mitra_id = m.id and p.id = case when it->>'id' ~ '^[0-9]+$' then (it->>'id')::bigint end) l
       where l.its is not null
       order by o.created_at desc limit 50) z), '[]'::jsonb);
end $$;
revoke all on function public.mitra_pesanan(text) from public;
grant execute on function public.mitra_pesanan(text) to anon, authenticated;
select 'ok' as siap;
