-- KALENSARI STORE v11.7: kolom varian produk
-- Jalankan sekali di Supabase > SQL Editor > New query > Run
alter table public.products add column if not exists product_group text;
alter table public.products add column if not exists variant text;

-- Gabungkan produk kembar yang sudah ada (boleh dihapus jika tidak perlu)
update public.products set product_group='Pecel Lele',  variant='Lauk saja' where id=17 and name='Pecel Lele';
update public.products set product_group='Pecel Lele',  variant='+ Nasi'    where id=18 and name='Pecel Lele + Nasi';
update public.products set product_group='Pecel Ayam', variant='Lauk saja' where id=19 and name='Pecel Ayam';
update public.products set product_group='Pecel Ayam', variant='+ Nasi'    where id=20 and name='Pecel Ayam + Nasi';
