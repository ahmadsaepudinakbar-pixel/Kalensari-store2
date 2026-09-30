-- KALENSARI STORE v10.5
-- Sinkronisasi Pesanan Saya HP <-> komputer berdasarkan nomor WhatsApp.
-- Jalankan SEKALI di Supabase > SQL Editor.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_phone_normalized text;

-- Normalisasi pesanan lama: 08xxxxxxxxxx -> 628xxxxxxxxxx.
UPDATE public.orders
SET customer_phone_normalized = CASE
  WHEN regexp_replace(COALESCE(customer_phone,''), '[^0-9]', '', 'g') LIKE '0%'
    THEN '62' || substring(regexp_replace(COALESCE(customer_phone,''), '[^0-9]', '', 'g') FROM 2)
  ELSE regexp_replace(COALESCE(customer_phone,''), '[^0-9]', '', 'g')
END
WHERE customer_phone_normalized IS NULL OR customer_phone_normalized = '';

CREATE INDEX IF NOT EXISTS orders_customer_phone_normalized_idx
ON public.orders (customer_phone_normalized);

-- Website perlu membaca pesanan customer dan memperbarui status dari admin.
DROP POLICY IF EXISTS orders_public_select ON public.orders;
CREATE POLICY orders_public_select
  ON public.orders FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS orders_public_update ON public.orders;
CREATE POLICY orders_public_update
  ON public.orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.orders TO anon, authenticated;
