-- =====================================================================
-- KALENSARI STORE - Kategori jasa, penyedia jasa, tarif ojek/kirim paket
--                   & tempat patokan peta hanya bisa diubah admin
-- Jalankan SETELAH supabase-admin-auth.sql. Aman dijalankan ulang.
-- Pendaftaran penyedia jasa (jasa_members / jasa_accounts) tetap terbuka.
-- =====================================================================
create or replace function public.is_admin_setting_key(k text)
returns boolean
language sql
immutable
as $$
  select k in ('categories','removed_categories','shipping_fees',
               'whatsapp_number','closed_sellers','seller_schedule',
               'admin_pin_hash','jasa_categories','jasa_providers',
               'transport_tariff','transport_places');
$$;

-- Cek: harus menampilkan true, true, true, true, false
select public.is_admin_setting_key('jasa_categories') as kategori_jasa,
       public.is_admin_setting_key('jasa_providers')  as penyedia_admin,
       public.is_admin_setting_key('transport_tariff') as tarif_ojek,
       public.is_admin_setting_key('transport_places') as tempat_patokan,
       public.is_admin_setting_key('jasa_members')    as pendaftaran_jasa;
