-- KALENSARI STORE - PEMBELI MELIHAT TAHAP & RESI DARI MITRA LUAR KOTA (jalankan SEKALI di Supabase > SQL Editor)
-- Syarat: supabase-mitra-resi.sql sudah dijalankan. Pembeli hanya bisa melihat resi dari pesanannya sendiri.
create or replace function public.pesanan_resi(p_sesi text) returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli');
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('kode', o.order_code, 'toko', m.toko, 'tahap', k.tahap, 'kurir', k.kurir, 'resi', k.resi, 't', k.dikirim_t) order by k.dikirim_t desc)
      from public.orders o
      join public.mitra_kirim k on k.order_code = o.order_code
      join public.mitra_luar_kota m on m.id = k.mitra_id
     where o.created_at > now() - interval '120 days'
       and (o.customer_phone_normalized = v_wa or o.customer_phone in (v_wa, '0' || substr(v_wa, 3), '+' || v_wa))), '[]'::jsonb);
end $$;
revoke all on function public.pesanan_resi(text) from public;
grant execute on function public.pesanan_resi(text) to anon, authenticated;
select 'ok' as siap;
