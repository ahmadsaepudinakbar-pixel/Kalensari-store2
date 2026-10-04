-- =====================================================================
-- KALENSARI • Pengaman COD & Gagal antar
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- =====================================================================

-- 1. Kolom alasan & waktu gagal antar
alter table public.orders add column if not exists gagal_alasan text;
alter table public.orders add column if not exists gagal_at timestamptz;

-- 2. Izinkan status baru "gagal".
--    Jika tabel orders punya aturan (CHECK) yang membatasi isi kolom status,
--    aturan itu dihapus supaya status "gagal" bisa disimpan.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.orders'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) ~* '\mstatus\M'
      and pg_get_constraintdef(oid) !~* 'pay_status'
  loop
    execute format('alter table public.orders drop constraint %I', c.conname);
  end loop;
end $$;

-- 3. Aturan awal COD (bisa diubah di admin > COD & Gagal antar)
insert into public.store_settings (key, value)
values ('cod_aturan', '{"maks":100000,"wa_baru":true,"maks_gagal":2,"buka":{}}')
on conflict (key) do nothing;
