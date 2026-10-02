-- Batas waktu penjual menanggapi pesanan: 15 menit
-- Jalankan sekali di Supabase > SQL Editor.
-- Jika error "extension pg_cron", aktifkan dulu di Database > Extensions > pg_cron.
create extension if not exists pg_cron;

select cron.schedule(
  'ks-auto-tolak-pesanan',
  '* * * * *',
  $$
  update public.orders
     set status = 'dibatalkan', updated_at = now()
   where status in ('baru','menunggu')
     and created_at < now() - interval '15 minutes'
     and created_at > now() - interval '1 day';
  $$
);

-- Untuk mematikan: select cron.unschedule('ks-auto-tolak-pesanan');
