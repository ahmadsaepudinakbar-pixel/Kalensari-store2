-- =====================================================================
-- KALENSARI • Toko tutup saat kurir datang + refund pembeli
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- Aman dijalankan ulang (tidak menghapus data).
-- =====================================================================

-- 1. Kolom pembatalan & refund di tabel orders
alter table public.orders add column if not exists batal_alasan text;
alter table public.orders add column if not exists batal_at     timestamptz;
alter table public.orders add column if not exists refund       jsonb;     -- {jumlah, barang, ongkir, ongkir_kurir, kurir, status, t, selesai_t, ket}
alter table public.orders add column if not exists ongkir_tetap integer;   -- ongkir jarak yang tetap dibayar walau nota batal
alter table public.orders add column if not exists paid_at      timestamptz;
alter table public.orders add column if not exists pay_status   text;
alter table public.orders add column if not exists grup         text;

-- 2. Perbaikan pembatalan otomatis 15 menit (menggantikan job lama 'ks-auto-tolak-pesanan'):
--    - QRIS: 15 menit dihitung sejak DIBAYAR (paid_at), bukan sejak pesanan dibuat
--    - COD pertama yang menunggu konfirmasi WA admin (pay_status = 'tunggu_wa') TIDAK dibatalkan
--    - alasan pembatalan dicatat
--    Bagian ini butuh ekstensi pg_cron. Jika belum aktif, bagian ini dilewati (kolom di atas tetap dibuat).
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
       and coalesce(pay_status, '') <> 'tunggu_wa'
       and coalesce(paid_at, created_at) < now() - interval '15 minutes'
       and created_at > now() - interval '2 days';
    $job$
  );
exception when others then
  raise notice 'pg_cron belum aktif, pembatalan otomatis server dilewati: %', sqlerrm;
end
$outer$;

-- Untuk mematikan pembatalan otomatis server: select cron.unschedule('ks-auto-tolak-pesanan');
