-- =====================================================================
-- KALENSARI STORE • Keamanan tambahan (tahap 4)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-baca.sql.
--
--  1) BATAS PESANAN PALSU: satu nomor WA maksimal 5 kali pesan per jam dan 15 kali per hari,
--     dan seluruh toko maksimal 60 kali pesan per 10 menit (melawan serangan banjir pesanan).
--     Belanja dari beberapa toko sekaligus dihitung 1 kali. Angka bisa diubah admin.
--  2) CATATAN AKTIVITAS ADMIN: setiap perubahan oleh admin (produk, pesanan, pengaturan,
--     pencairan, saldo) tercatat otomatis: siapa, kapan, apa yang berubah. Tidak bisa diubah/dihapus
--     dari aplikasi. Disimpan 180 hari.
--  3) Admin bisa mengunduh BACKUP data (tombol di menu Keamanan & Backup).
-- =====================================================================

-- ---------------------------------------------------------------
-- 1) BATAS PESANAN
-- ---------------------------------------------------------------
create index if not exists orders_created_idx on public.orders (created_at desc);

create or replace function public.ks_batas_pesanan()
returns trigger language plpgsql security definer set search_path = public as $$
declare b jsonb; per_jam int; per_hari int; per10 int; hp text; n int; grup_ini text;
begin
  -- hanya pesanan dari aplikasi (anon / akun biasa); admin & SQL Editor bebas
  if coalesce(current_setting('role', true), '') not in ('anon', 'authenticated') then return new; end if;
  if coalesce(public.is_admin(), false) then return new; end if;

  select value into b from public.store_settings where key = 'batas_pesanan';
  if jsonb_typeof(b) <> 'object' then b := '{}'::jsonb; end if;
  if coalesce((b->>'aktif')::boolean, true) = false then return new; end if;
  per_jam  := greatest(coalesce((b->>'perJam')::int, 5), 1);
  per_hari := greatest(coalesce((b->>'perHari')::int, 15), 1);
  per10    := greatest(coalesce((b->>'per10Menit')::int, 60), 5);

  grup_ini := coalesce(nullif(new.grup, ''), new.order_code);
  -- nota lain dari belanja yang sama (beberapa toko sekaligus) tidak dihitung lagi
  if nullif(new.grup, '') is not null and exists (select 1 from public.orders where grup = new.grup) then return new; end if;

  hp := right(regexp_replace(coalesce(new.customer_phone, ''), '\D', '', 'g'), 10);
  if length(hp) >= 8 then
    select count(distinct coalesce(nullif(grup, ''), order_code)) into n from public.orders
     where created_at > now() - interval '1 hour'
       and right(regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g'), 10) = hp;
    if n >= per_jam then
      raise exception 'BATAS: Nomor ini sudah % kali memesan dalam 1 jam terakhir. Tunggu sebentar lalu coba lagi, atau hubungi admin lewat WhatsApp.', n
        using errcode = 'P0001';
    end if;
    select count(distinct coalesce(nullif(grup, ''), order_code)) into n from public.orders
     where created_at > now() - interval '24 hours'
       and right(regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g'), 10) = hp;
    if n >= per_hari then
      raise exception 'BATAS: Nomor ini sudah % kali memesan hari ini. Untuk pesanan tambahan, hubungi admin lewat WhatsApp.', n
        using errcode = 'P0001';
    end if;
  end if;

  select count(distinct coalesce(nullif(grup, ''), order_code)) into n from public.orders
   where created_at > now() - interval '10 minutes';
  if n >= per10 then
    raise exception 'BATAS: Toko sedang menerima terlalu banyak pesanan. Coba lagi beberapa menit lagi.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.ks_batas_pesanan() from public, anon, authenticated;

drop trigger if exists ks_batas_pesanan on public.orders;
create trigger ks_batas_pesanan before insert on public.orders
  for each row execute function public.ks_batas_pesanan();

-- angka batas hanya boleh diubah admin
drop policy if exists "ks_kunci_batas_ins" on public.store_settings;
create policy "ks_kunci_batas_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key <> 'batas_pesanan' or public.is_admin());
drop policy if exists "ks_kunci_batas_upd" on public.store_settings;
create policy "ks_kunci_batas_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key <> 'batas_pesanan' or public.is_admin()) with check (key <> 'batas_pesanan' or public.is_admin());
drop policy if exists "ks_kunci_batas_del" on public.store_settings;
create policy "ks_kunci_batas_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key <> 'batas_pesanan' or public.is_admin());

-- ---------------------------------------------------------------
-- 2) CATATAN AKTIVITAS ADMIN
-- ---------------------------------------------------------------
create table if not exists public.admin_log (
  id     bigserial primary key,
  t      timestamptz not null default now(),
  email  text,
  tabel  text not null,
  aksi   text not null,          -- tambah | ubah | hapus | masuk | backup | ...
  kunci  text,                   -- kode pesanan / id produk / kunci pengaturan
  isi    jsonb                   -- yang berubah: {kolom: [lama, baru]}
);
create index if not exists admin_log_t_idx on public.admin_log (t desc);
alter table public.admin_log enable row level security;
drop policy if exists "admin_log_baca" on public.admin_log;
create policy "admin_log_baca" on public.admin_log for select to authenticated using (public.is_admin());
revoke all on public.admin_log from anon, authenticated;
grant select on public.admin_log to authenticated;

-- potong nilai yang panjang supaya catatan tetap ringan
create or replace function public.ks_log_ringkas(v jsonb)
returns jsonb language sql immutable as $$
  select case when v is null then null
              when length(v::text) <= 240 then v
              else to_jsonb(left(v::text, 240) || '…') end
$$;

create or replace function public.ks_log_admin()
returns trigger language plpgsql security definer set search_path = public as $$
declare baris jsonb; lama jsonb; isi jsonb; kunci text; aksi text;
begin
  if not coalesce(public.is_admin(), false) then return null; end if;
  baris := to_jsonb(coalesce(new, old));
  kunci := coalesce(baris->>'order_code', baris->>'key', baris->>'kurir_id', baris->>'pembeli_id', baris->>'id');
  if tg_table_name = 'products' then kunci := coalesce(baris->>'id', '') || ' ' || coalesce(baris->>'name', ''); end if;
  if tg_table_name in ('kurir_cair', 'kurir_topup') then kunci := coalesce(baris->>'id', '') || ' ' || coalesce(baris->>'nama', ''); end if;

  if tg_op = 'UPDATE' then
    aksi := 'ubah';
    lama := to_jsonb(old);
    select jsonb_object_agg(n.key, jsonb_build_array(public.ks_log_ringkas(o.value), public.ks_log_ringkas(n.value)))
      into isi
      from jsonb_each(baris) n join jsonb_each(lama) o on o.key = n.key
     where n.value is distinct from o.value and n.key not in ('updated_at');
    if isi is null then return null; end if;          -- tidak ada yang benar-benar berubah
  elsif tg_op = 'INSERT' then
    aksi := 'tambah';
    select jsonb_object_agg(key, public.ks_log_ringkas(value)) into isi from jsonb_each(baris) where value <> 'null'::jsonb;
  else
    aksi := 'hapus';
    select jsonb_object_agg(key, public.ks_log_ringkas(value)) into isi from jsonb_each(baris) where value <> 'null'::jsonb;
  end if;

  insert into public.admin_log (email, tabel, aksi, kunci, isi)
  values (coalesce(auth.jwt()->>'email', ''), tg_table_name, aksi, left(kunci, 120), isi);

  if random() < 0.01 then delete from public.admin_log where t < now() - interval '180 days'; end if;
  return null;
end $$;
revoke all on function public.ks_log_admin() from public, anon, authenticated;

do $$
declare tb text;
begin
  foreach tb in array array['products', 'orders', 'store_settings', 'kurir_cair', 'kurir_topup', 'kurir_saldo', 'pembeli_saldo', 'ulasan'] loop
    if to_regclass('public.' || tb) is not null then
      execute format('drop trigger if exists ks_log_admin on public.%I', tb);
      execute format('create trigger ks_log_admin after insert or update or delete on public.%I for each row execute function public.ks_log_admin()', tb);
    end if;
  end loop;
end $$;

-- catatan manual dari halaman admin (masuk, unduh backup)
create or replace function public.admin_catat(p_aksi text, p_info text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_aksi not in ('masuk', 'backup') then raise exception 'Aksi tidak dikenal'; end if;
  insert into public.admin_log (email, tabel, aksi, kunci)
  values (coalesce(auth.jwt()->>'email', ''), 'admin', p_aksi, left(coalesce(p_info, ''), 120));
end $$;
revoke all on function public.admin_catat(text, text) from public, anon;
grant execute on function public.admin_catat(text, text) to authenticated;

-- Cek
select exists (select 1 from pg_trigger where tgname = 'ks_batas_pesanan') as batas_pesanan,
       (select count(*) from pg_trigger where tgname = 'ks_log_admin')     as tabel_dicatat,
       to_regclass('public.admin_log') is not null                         as catatan_admin;
