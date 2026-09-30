-- KALENSARI STORE - sinkron status pesanan HP <-> komputer
-- Jalankan sekali di Supabase > SQL Editor.

-- Pastikan tabel orders boleh dibaca oleh website.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='orders_public_select'
  ) THEN
    CREATE POLICY orders_public_select
      ON public.orders FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;

-- IZINKAN website memperbarui status pesanan.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='orders' AND policyname='orders_public_update'
  ) THEN
    CREATE POLICY orders_public_update
      ON public.orders FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Pastikan kolom status tersedia.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'menunggu';

-- Pesanan lama yang masih memakai status "baru" dianggap Menunggu.
UPDATE public.orders
SET status='menunggu'
WHERE status IS NULL OR lower(status)='baru';
