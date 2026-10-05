-- =====================================================================
-- KALENSARI • Kolom pembayaran QRIS Duitku di tabel orders
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
-- Aman dijalankan ulang (tidak menghapus data).
-- =====================================================================
alter table public.orders add column if not exists grup         text;
alter table public.orders add column if not exists pay_status   text;        -- menunggu / lunas / gagal / tunggu_wa (COD)
alter table public.orders add column if not exists pay_order_id text;        -- merchantOrderId yang dikirim ke Duitku
alter table public.orders add column if not exists pay_ref      text;        -- reference dari Duitku
alter table public.orders add column if not exists pay_qr       text;        -- isi QRIS (qrString)
alter table public.orders add column if not exists pay_url      text;        -- halaman bayar Duitku (cadangan)
alter table public.orders add column if not exists pay_expire   timestamptz;
alter table public.orders add column if not exists paid_at      timestamptz;
alter table public.orders add column if not exists updated_at   timestamptz;

create index if not exists orders_grup_idx         on public.orders(grup);
create index if not exists orders_pay_order_id_idx on public.orders(pay_order_id);
