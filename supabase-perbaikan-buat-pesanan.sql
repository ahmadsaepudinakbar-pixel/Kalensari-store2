-- =====================================================================
-- KALENSARI STORE • PERBAIKAN: pesanan gagal masuk database
-- Error: new row violates row-level security policy for table "orders"
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- =====================================================================

-- Pembeli boleh menerima kembali HANYA baris pesanan yang baru saja ia buat (dalam permintaan yang sama).
-- Supabase meminta balikan baris saat INSERT; tanpa ini muncul error
-- "new row violates row-level security policy for table orders". Pesanan orang lain tetap tidak bisa dibaca.
create or replace function public.ks_tandai_baru()
returns trigger language plpgsql as $$
begin
  perform set_config('ks.pesanan_baru', coalesce(current_setting('ks.pesanan_baru', true), '') || '|' || new.id || '|', true);
  return new;
end $$;
drop trigger if exists ks_tandai_baru on public.orders;
create trigger ks_tandai_baru before insert on public.orders
  for each row execute function public.ks_tandai_baru();
drop policy if exists "orders_baru_kembali" on public.orders;
create policy "orders_baru_kembali" on public.orders for select to anon, authenticated
  using (coalesce(current_setting('request.method', true), 'POST') = 'POST'
         and strpos(coalesce(current_setting('ks.pesanan_baru', true), ''), '|' || id || '|') > 0);

-- Cek: harus muncul orders_admin_select dan orders_baru_kembali
select polname from pg_policy where polrelid = 'public.orders'::regclass and polcmd = 'r' order by 1;
