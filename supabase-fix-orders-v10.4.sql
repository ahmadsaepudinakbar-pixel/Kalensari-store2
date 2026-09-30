-- KALENSARI STORE V10.4 - FIX PESANAN ONLINE
-- Jalankan SEKALI di Supabase > SQL Editor.

-- Pastikan kolom penting tersedia.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_code text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'menunggu',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Pastikan order_code unik jika diisi.
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_code_idx
  ON public.orders(order_code)
  WHERE order_code IS NOT NULL;

-- Pastikan website boleh membuat pesanan baru.
DROP POLICY IF EXISTS "orders_public_insert" ON public.orders;
CREATE POLICY "orders_public_insert"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Pastikan website pelanggan/admin boleh membaca pesanan.
DROP POLICY IF EXISTS "orders_public_read" ON public.orders;
DROP POLICY IF EXISTS "orders_public_select" ON public.orders;
CREATE POLICY "orders_public_read"
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

-- Pastikan admin bisa mengubah status pesanan.
DROP POLICY IF EXISTS "orders_public_update" ON public.orders;
CREATE POLICY "orders_public_update"
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Index agar pencarian pesanan berdasarkan nomor WhatsApp cepat.
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx
  ON public.orders(customer_phone);

CREATE INDEX IF NOT EXISTS orders_created_at_idx
  ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS orders_status_idx
  ON public.orders(status);

-- Pesanan lama yang memakai "baru" tetap dianggap Menunggu.
UPDATE public.orders
SET status='menunggu'
WHERE status IS NULL OR lower(status)='baru';
