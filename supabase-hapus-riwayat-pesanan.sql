-- =====================================================================
-- KALENSARI STORE • Izinkan ADMIN menghapus riwayat pesanan
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Policy hapus khusus admin sudah ada (supabase-keamanan-pesanan.sql),
-- tetapi hak DELETE pada tabel belum diberikan, jadi tombol hapus ditolak.
-- Pembeli/kurir/penjual (anon) tetap TIDAK bisa menghapus pesanan.
-- =====================================================================
grant delete on public.orders to authenticated;

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

-- Cek: harus ada baris 'orders_admin_delete' dan privilege DELETE = true
select polname from pg_policy where polrelid = 'public.orders'::regclass and polcmd = 'd';
select has_table_privilege('authenticated', 'public.orders', 'DELETE') as authenticated_boleh_delete,
       has_table_privilege('anon', 'public.orders', 'DELETE')          as anon_boleh_delete;
