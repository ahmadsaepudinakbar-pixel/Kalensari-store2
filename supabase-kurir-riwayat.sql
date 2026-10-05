-- =====================================================================
-- KALENSARI • Riwayat antaran & penghasilan kurir
-- Menyimpan kurir pengantar di setiap pesanan, lalu mengisi data lama
-- dari catatan serah terima (store_settings "antar_<kode>").
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- =====================================================================

alter table public.orders add column if not exists kurir_id   text;
alter table public.orders add column if not exists kurir_nama text;
alter table public.orders add column if not exists kurir_wa   text;
alter table public.orders add column if not exists diambil_at timestamptz;  -- kurir menerima pesanan
alter table public.orders add column if not exists selesai_at timestamptz;  -- pesanan selesai diantar

create index if not exists orders_kurir_idx on public.orders (kurir_id, created_at desc);

-- Isi data lama: pesanan yang sudah selesai sebelum fitur ini ada
update public.orders o
set kurir_id   = s.value->>'id',
    kurir_nama = s.value->>'nama',
    kurir_wa   = s.value->>'wa',
    selesai_at = coalesce(o.selesai_at,
                 case when (s.value->>'t') ~ '^[0-9]+$' then to_timestamp((s.value->>'t')::bigint / 1000.0) else o.updated_at end)
from public.store_settings s
where s.key = 'antar_' || o.order_code
  and o.kurir_id is null
  and s.value ? 'id';
