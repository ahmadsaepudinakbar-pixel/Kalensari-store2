-- =====================================================================
-- KALENSARI STORE • QRIS: lunas otomatis bila admin belum menanggapi
-- Jalankan SEKALI di Supabase > SQL Editor > Run, SETELAH supabase-qris-statis.sql.
-- Aman diulang.
--
-- Aturan: pesanan QRIS yang pembelinya sudah menekan "Saya sudah bayar"
-- (pay_status = 'verifikasi') dan belum ditanggapi admin selama N menit
-- otomatis ditandai LUNAS dan diteruskan ke penjual.
--  * Pesanan QRIS yang BELUM diklaim bayar tidak tersentuh (tetap batal 15 menit).
--  * COD tidak tersentuh.
--  * N diatur admin di Admin > Pengaturan > QRIS Pembayaran Pesanan
--    (store_settings "qris_auto" = {"aktif":true,"menit":2}). Dicek tiap menit,
--    jadi jeda sebenarnya N sampai N+1 menit.
--  * Pesanan yang dilunaskan otomatis diberi tanda pay_auto = true agar admin
--    bisa memeriksa mutasi belakangan.
-- =====================================================================
alter table public.orders add column if not exists pay_auto boolean;

insert into public.store_settings (key, value)
values ('qris_auto', '{"aktif":true,"menit":2}')
on conflict (key) do nothing;

do $outer$
begin
  create extension if not exists pg_cron;
  begin perform cron.unschedule('ks-qris-auto-lunas'); exception when others then null; end;
  perform cron.schedule(
    'ks-qris-auto-lunas',
    '* * * * *',
    $job$
    update public.orders o
       set pay_status = 'lunas', paid_at = now(), pay_auto = true, updated_at = now()
      from (select greatest(1, coalesce((value->>'menit')::int, 2)) as m
              from public.store_settings
             where key = 'qris_auto'
               and coalesce((value->>'aktif')::boolean, false)) c
     where o.pay_status = 'verifikasi'
       and o.payment ilike 'qris%'
       and coalesce(o.status, 'menunggu') in ('baru', 'menunggu')
       and coalesce(o.pay_klaim_at, o.created_at) < now() - make_interval(mins => c.m);
    $job$
  );
exception when others then
  raise notice 'pg_cron belum aktif, lunas otomatis dilewati: %', sqlerrm;
end
$outer$;

-- Mematikan: ubah "aktif" jadi mati di Admin, atau: select cron.unschedule('ks-qris-auto-lunas');
