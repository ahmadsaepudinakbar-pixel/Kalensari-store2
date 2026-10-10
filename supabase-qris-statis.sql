-- =====================================================================
-- KALENSARI STORE • QRIS statis (nominal otomatis) – dukungan database
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman diulang.
-- Jalankan SETELAH supabase-toko-tutup.sql (pembatalan otomatis 15 menit).
--
-- Isi:
--  1) pay_status baru "verifikasi" = pembeli menekan "Saya sudah bayar".
--     Pesanan ini TIDAK ikut dibatalkan otomatis 15 menit, supaya admin sempat
--     mengecek mutasi. Penjual & kurir tetap tidak melihatnya sampai admin
--     menekan "Tandai QRIS sudah dibayar" (lunas).
--  2) Fungsi qris_klaim(kode[]) yang boleh dipanggil pembeli (tanpa login).
--     Hanya bisa mengubah pesanan QRIS yang belum dibayar & masih menunggu.
--  3) Pembatalan otomatis: pesanan "verifikasi" yang tidak dikonfirmasi admin
--     dalam 3 jam dibatalkan (mencegah pesanan menggantung).
-- =====================================================================

alter table public.orders add column if not exists pay_klaim_at timestamptz;

-- 1) Pembeli menandai "sudah bayar" (menunggu cek admin)
create or replace function public.qris_klaim(p_codes text[])
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.orders
     set pay_status = 'verifikasi', pay_klaim_at = now(), updated_at = now()
   where order_code = any(p_codes[1:30])
     and payment ilike 'qris%'
     and coalesce(pay_status, '') in ('', 'menunggu')
     and coalesce(status, 'menunggu') in ('menunggu', 'baru')
     and created_at > now() - interval '1 hour';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.qris_klaim(text[]) from public;
grant execute on function public.qris_klaim(text[]) to anon, authenticated;

-- 2) Pembatalan otomatis 15 menit: pesanan "verifikasi" dikecualikan
do $outer$
begin
  create extension if not exists pg_cron;

  begin perform cron.unschedule('ks-auto-tolak-pesanan'); exception when others then null; end;
  perform cron.schedule(
    'ks-auto-tolak-pesanan',
    '* * * * *',
    $job$
    update public.orders
       set status = 'dibatalkan',
           batal_alasan = 'Toko tidak menjawab dalam 15 menit',
           batal_at = now(),
           updated_at = now()
     where status in ('baru','menunggu')
       and coalesce(pay_status, '') not in ('tunggu_wa', 'verifikasi')
       and coalesce(paid_at, created_at) < now() - interval '15 minutes'
       and created_at > now() - interval '2 days';
    $job$
  );

  -- 3) "verifikasi" yang tidak dikonfirmasi admin dalam 3 jam -> batal
  begin perform cron.unschedule('ks-qris-verifikasi-habis'); exception when others then null; end;
  perform cron.schedule(
    'ks-qris-verifikasi-habis',
    '*/10 * * * *',
    $job$
    update public.orders
       set status = 'dibatalkan',
           pay_status = 'kedaluwarsa',
           batal_alasan = 'Pembayaran QRIS tidak terverifikasi admin dalam 3 jam',
           batal_at = now(),
           updated_at = now()
     where status in ('baru','menunggu')
       and pay_status = 'verifikasi'
       and coalesce(pay_klaim_at, created_at) < now() - interval '3 hours';
    $job$
  );
exception when others then
  raise notice 'pg_cron belum aktif, pembatalan otomatis server dilewati: %', sqlerrm;
end
$outer$;

-- Untuk mematikan batas 3 jam: select cron.unschedule('ks-qris-verifikasi-habis');
