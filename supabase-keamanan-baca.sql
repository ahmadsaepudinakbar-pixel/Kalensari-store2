-- =====================================================================
-- KALENSARI STORE • Keamanan tahap 3c: DATA PRIBADI TIDAK BISA DIINTIP
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-pesanan.sql & supabase-upah-kurir-qris.sql.
-- PENTING: upload dulu file aplikasi versi v52 ke GitHub, BARU jalankan SQL ini.
--
--  1. PESANAN (nama, WA, alamat) tidak bisa dibaca bebas. Dibaca lewat fungsi server:
--       pembeli  -> pesanannya sendiri (sesi masuk)
--       penjual  -> pesanan tokonya
--       kurir    -> pesanan aktif (nomor WA pembeli hanya untuk kurir yang memegang) + riwayatnya
--       tanpa akun -> cek status pakai kode pesanan (tanpa nama/WA/alamat)
--       admin    -> semua (login admin)
--  2. Catatan kurir (kurir_ord_*, antar_*, foto_*, lacak_*) hanya bisa ditulis kurir yang
--     memegang pesanan (lewat fungsi kurir_simpan), atau admin.
--  3. Riwayat saldo pembeli & kurir, isi saldo, pencairan (berisi WA & rekening) hanya bisa
--     dibaca pemiliknya (fungsi saldo_saya) atau admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A. PESANAN
-- ---------------------------------------------------------------------
do $$ declare p record; begin
  for p in select polname from pg_policy where polrelid = 'public.orders'::regclass and polcmd in ('r', '*') loop
    execute format('drop policy %I on public.orders', p.polname);
  end loop;
end $$;
create policy "orders_admin_select" on public.orders for select to authenticated using (public.is_admin());

-- kolom yang disembunyikan untuk pencarian tanpa akun
create or replace function public.ks_pesanan_umum(o public.orders)
returns jsonb language sql immutable as $$
  select to_jsonb(o) - array['customer_name','customer_phone','customer_phone_normalized','address','note','kurir_wa','refund','uang_toko']
$$;

-- 1) Pembeli: pesanannya sendiri
create or replace function public.pesanan_saya(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli');
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  return coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc) from (
    select * from public.orders
     where customer_phone_normalized = v_wa or customer_phone in (v_wa, '0' || substr(v_wa, 3), '+' || v_wa)
     order by created_at desc limit 200) o), '[]'::jsonb);
end $$;
revoke all on function public.pesanan_saya(text) from public;
grant execute on function public.pesanan_saya(text) to anon, authenticated;

-- 2) Tanpa akun: cek pesanan dengan kode (tanpa data pribadi)
create or replace function public.pesanan_kode(p_kode text[])
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(public.ks_pesanan_umum(o)), '[]'::jsonb)
    from public.orders o where o.order_code = any(p_kode[1:30])
$$;
revoke all on function public.pesanan_kode(text[]) from public;
grant execute on function public.pesanan_kode(text[]) to anon, authenticated;

-- riwayat COD (dipakai aturan COD saat checkout): hanya status, tanpa data pribadi
create or replace function public.cod_riwayat(p_wa text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('status', status, 'payment', payment, 'gagal_at', gagal_at, 'updated_at', updated_at)), '[]'::jsonb)
    from public.orders where customer_phone_normalized = public.ks_wa(p_wa) and status in ('selesai', 'gagal')
$$;
revoke all on function public.cod_riwayat(text) from public;
grant execute on function public.cod_riwayat(text) to anon, authenticated;

-- daftar kode pesanan yang sedang aktif (untuk menghitung kurir yang sedang sibuk)
create or replace function public.pesanan_aktif_kode()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(order_code), '[]'::jsonb) from (select order_code from public.orders where status in ('diproses', 'dikirim') order by created_at desc limit 300) x
$$;
revoke all on function public.pesanan_aktif_kode() from public;
grant execute on function public.pesanan_aktif_kode() to anon, authenticated;

-- 3) Penjual: pesanan tokonya
create or replace function public.pesanan_toko(p_sesi text, p_status text[] default null, p_limit integer default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text := public.ks_toko_sesi(p_sesi);
begin
  return coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc) from (
    select * from public.orders
     where public.ks_pesanan_toko(items, toko)
       and (p_status is null or coalesce(status, 'menunggu') = any(p_status))
     order by created_at desc limit least(greatest(coalesce(p_limit, 200), 1), 5000)) o), '[]'::jsonb);
end $$;
revoke all on function public.pesanan_toko(text, text[], integer) from public;
grant execute on function public.pesanan_toko(text, text[], integer) to anon, authenticated;

-- 4) Kurir
--    mode 'aktif'   : pesanan diproses/dikirim (WA pembeli hanya untuk pesanan yang dia pegang)
--    mode 'tunggu'  : nota gabungan yang masih menunggu toko (tanpa data pribadi)
--    mode 'riwayat' : pesanan yang pernah dia antar sejak p_sejak
create or replace function public.pesanan_kurir(p_sesi text, p_mode text, p_sejak timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare kr jsonb := public.ks_kurir_sesi(p_sesi); kid text := kr->>'id';
begin
  if p_mode = 'aktif' then
    return coalesce((select jsonb_agg(case when o.kurir_id = kid or public.ks_kurir_pegang(o.order_code) = kid
                                           then to_jsonb(o) else to_jsonb(o) - array['customer_phone','customer_phone_normalized'] end
                                      order by o.created_at desc)
                       from (select * from public.orders where status in ('diproses', 'dikirim') order by created_at desc limit 100) o), '[]'::jsonb);
  elsif p_mode = 'tunggu' then
    return coalesce((select jsonb_agg(public.ks_pesanan_umum(o)) from (
      select * from public.orders where status in ('menunggu', 'baru') and grup is not null order by created_at desc limit 100) o), '[]'::jsonb);
  elsif p_mode = 'riwayat' then
    return coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc) from (
      select * from public.orders where kurir_id = kid and created_at >= coalesce(p_sejak, now() - interval '45 days')
       order by created_at desc limit 500) o), '[]'::jsonb);
  end if;
  raise exception 'Mode tidak dikenal';
end $$;
revoke all on function public.pesanan_kurir(text, text, timestamptz) from public;
grant execute on function public.pesanan_kurir(text, text, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------
-- B. CATATAN KURIR di store_settings: hanya lewat fungsi server / admin
-- ---------------------------------------------------------------------
create or replace function public.ks_kunci_kurir(k text)
returns boolean language sql immutable as $$ select k ~ '^(kurir_ord|antar|foto|lacak)_' $$;

drop policy if exists "ks_kunci_kurir_ins" on public.store_settings;
create policy "ks_kunci_kurir_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (not public.ks_kunci_kurir(key) or public.is_admin());
drop policy if exists "ks_kunci_kurir_upd" on public.store_settings;
create policy "ks_kunci_kurir_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (not public.ks_kunci_kurir(key) or public.is_admin()) with check (not public.ks_kunci_kurir(key) or public.is_admin());
drop policy if exists "ks_kunci_kurir_del" on public.store_settings;
create policy "ks_kunci_kurir_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (not public.ks_kunci_kurir(key) or public.is_admin());

-- kurir menulis / menghapus catatan pesanan (p_value null = hapus)
create or replace function public.kurir_simpan(p_sesi text, p_key text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare kr jsonb := public.ks_kurir_sesi(p_sesi); kid text := kr->>'id'; m text[]; jenis text; kode text;
        o public.orders; lama jsonb; acc_lama text; acc_baru text;
begin
  m := regexp_match(coalesce(p_key, ''), '^(kurir_ord|antar|foto|lacak)_(.+)$');
  if m is null then raise exception 'Kunci tidak diizinkan'; end if;
  jenis := m[1]; kode := m[2];
  if p_value is not null and length(p_value::text) > 1500000 then raise exception 'Data terlalu besar'; end if;
  select * into o from public.orders where order_code = kode;
  if not found then raise exception 'Pesanan tidak ditemukan'; end if;
  select value into lama from public.store_settings where key = p_key for update;
  if jenis = 'kurir_ord' then
    acc_lama := case when jsonb_typeof(lama->'acc') = 'object' then lama->'acc'->>'id' end;
    acc_baru := case when jsonb_typeof(p_value->'acc') = 'object' then p_value->'acc'->>'id' end;
    if acc_lama is not null and acc_lama <> kid then raise exception 'Pesanan sudah diambil kurir lain'; end if;
    if acc_baru is not null and acc_baru <> kid then raise exception 'Tidak diizinkan'; end if;
    if p_value is not null and coalesce(o.status, 'menunggu') not in ('menunggu', 'baru', 'diproses', 'dikirim') then
      raise exception 'Pesanan sudah tidak aktif';
    end if;
  else
    if coalesce(public.ks_kurir_pegang(kode), '') <> kid and coalesce(o.kurir_id, '') <> kid then
      raise exception 'Pesanan % bukan milik Anda', kode;
    end if;
  end if;
  if p_value is null then
    delete from public.store_settings where key = p_key;
  else
    insert into public.store_settings (key, value) values (p_key, p_value)
    on conflict (key) do update set value = excluded.value;
  end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.kurir_simpan(text, text, jsonb) from public;
grant execute on function public.kurir_simpan(text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- C. SALDO & RIWAYAT UANG: hanya pemilik (fungsi saldo_saya) & admin
--    (kurir_saldo tetap bisa dibaca: hanya ID kurir + angka saldo, dipakai pembagian pesanan)
-- ---------------------------------------------------------------------
do $$ declare t text; p record; begin
  foreach t in array array['pembeli_saldo', 'pembeli_mutasi', 'pembeli_ajak', 'kurir_mutasi', 'kurir_topup', 'kurir_cair'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    for p in select polname from pg_policy where polrelid = ('public.' || t)::regclass and polcmd in ('r', '*') loop
      execute format('drop policy %I on public.%I', p.polname, t);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin())', t || '_admin_baca', t);
  end loop;
end $$;

create or replace function public.saldo_saya(p_sesi text, p_peran text, p_sejak timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; kr jsonb; kid text; sejak timestamptz := coalesce(p_sejak, now() - interval '60 days');
begin
  if p_peran = 'pembeli' then
    v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
    if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
    return jsonb_build_object(
      'saldo', coalesce((select saldo from public.pembeli_saldo where wa = v_wa), 0),
      'mutasi', coalesce((select jsonb_agg(x order by x.id desc) from (select id, jumlah, jenis, ket, order_code, saldo_akhir, t from public.pembeli_mutasi where wa = v_wa order by id desc limit 100) x), '[]'::jsonb),
      'diajak', coalesce((select jsonb_agg(jsonb_build_object('status', status, 't', t)) from public.pembeli_ajak where pengundang = v_wa), '[]'::jsonb),
      'saya', coalesce((select jsonb_agg(jsonb_build_object('status', status)) from public.pembeli_ajak where wa = v_wa), '[]'::jsonb));
  elsif p_peran = 'kurir' then
    kr := public.ks_kurir_sesi(p_sesi); kid := kr->>'id';
    return jsonb_build_object(
      'saldo', coalesce((select saldo from public.kurir_saldo where kurir_id = kid), 0),
      'mutasi', coalesce((select jsonb_agg(x order by x.id desc) from (select id, jumlah, jenis, ket, order_code, saldo_akhir, t from public.kurir_mutasi where kurir_id = kid and t >= sejak order by id desc limit 2000) x), '[]'::jsonb),
      'topup', coalesce((select jsonb_agg(x order by x.t desc) from (select id, jumlah, status, t, catatan, diproses_t from public.kurir_topup where kurir_id = kid order by t desc limit 5) x), '[]'::jsonb),
      'cair', case when to_regclass('public.kurir_cair') is null then null else
              coalesce((select jsonb_agg(x order by x.t desc) from (select id, jumlah, diterima, status, t, catatan, diproses_t from public.kurir_cair where kurir_id = kid order by t desc limit 5) x), '[]'::jsonb) end);
  end if;
  raise exception 'Peran tidak valid';
end $$;
revoke all on function public.saldo_saya(text, text, timestamptz) from public;
grant execute on function public.saldo_saya(text, text, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------
-- D. PENCAIRAN TOKO (berisi nomor rekening): daftar hanya bisa dibaca admin,
--    penjual melihat miliknya lewat cair_saya. Nomor rekening tidak disimpan di data akun.
-- ---------------------------------------------------------------------
drop policy if exists "ks_rahasia_cair_sel" on public.store_settings;
create policy "ks_rahasia_cair_sel" on public.store_settings as restrictive for select to anon, authenticated
  using (key <> 'cair_toko' or public.is_admin());

create or replace function public.cair_saya(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text := public.ks_toko_sesi(p_sesi); kunci text := lower(btrim(toko));
begin
  return coalesce((select jsonb_agg(x) from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
                    where s.key = 'cair_toko' and x->>'toko' = kunci), '[]'::jsonb);
end $$;
revoke all on function public.cair_saya(text) from public;
grant execute on function public.cair_saya(text) to anon, authenticated;

-- hapus nomor rekening yang dulu sempat tersimpan di data akun penjual / kurir (data akun ini terbaca publik)
update public.store_settings s
   set value = (select jsonb_agg(case when jsonb_typeof(e) = 'object' then e - array['rek','rekB','rekN','rekA'] else e end order by i)
                  from jsonb_array_elements(s.value) with ordinality as t(e, i))
 where s.key in ('penjual_members', 'kurir_members') and jsonb_typeof(s.value) = 'array'
   and exists (select 1 from jsonb_array_elements(s.value) e where jsonb_typeof(e) = 'object' and (e ? 'rek' or e ? 'rekN'));

-- Cek: pesanan hanya bisa dibaca admin; saldo hanya admin
select 'orders' as tabel, polname, case polcmd when 'r' then 'baca' when 'a' then 'buat' when 'w' then 'ubah' when 'd' then 'hapus' else polcmd::text end as aksi
  from pg_policy where polrelid = 'public.orders'::regclass
union all
select c.relname, p.polname, 'baca' from pg_policy p join pg_class c on c.oid = p.polrelid
 where c.relname in ('pembeli_saldo','pembeli_mutasi','pembeli_ajak','kurir_mutasi','kurir_topup','kurir_cair') and p.polcmd in ('r','*')
order by 1, 2;
