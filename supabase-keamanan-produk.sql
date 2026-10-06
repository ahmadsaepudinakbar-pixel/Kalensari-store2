-- =====================================================================
-- KALENSARI STORE • Keamanan tahap 3a: PERLINDUNGAN PRODUK
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-akun.sql dan supabase-keamanan-tahap2a.sql
-- (butuh fungsi ks_sesi_wa, akun_sesi, is_admin).
--
-- Sesudah ini:
--  * Semua orang tetap bisa MELIHAT produk.
--  * Menambah / mengubah / menghapus produk langsung ke tabel HANYA admin (login admin).
--  * Penjual mengubah produk lewat fungsi server yang memeriksa sesi masuk:
--    hanya produk milik tokonya sendiri.
--  * Nama toko tidak bisa disamakan dengan toko penjual lain (mencegah "mengambil alih" toko).
-- =====================================================================

-- 1) Kunci tabel produk: baca untuk semua, tulis hanya admin
alter table public.products enable row level security;
drop policy if exists "products_public_insert" on public.products;
drop policy if exists "products_public_write"  on public.products;
drop policy if exists "products_public_update" on public.products;
drop policy if exists "products_public_delete" on public.products;
drop policy if exists "products_public_read"   on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (true);
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products for delete to authenticated using (public.is_admin());

-- 2) Bantuan
create or replace function public.ks_k(t text)
returns text language sql immutable as $$ select lower(regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g')) $$;

-- produk milik toko? (kolom seller bisa berisi beberapa toko: "Toko A, Toko B")
create or replace function public.ks_milik_toko(p_seller text, p_toko text)
returns boolean language sql immutable as $$
  select public.ks_k(p_toko) <> '' and exists (
    select 1 from unnest(string_to_array(coalesce(p_seller, ''), ',')) x where public.ks_k(x) = public.ks_k(p_toko))
$$;

-- toko milik sesi penjual yang sedang masuk
create or replace function public.ks_toko_sesi(p_sesi text)
returns text language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; m jsonb; toko text; n int;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
  select x into m from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'penjual_members' and x->>'id' = v_id limit 1;
  if m is null then raise exception 'Akun penjual tidak ditemukan'; end if;
  if coalesce((m->>'pending')::boolean, false) then raise exception 'Akun penjual belum disetujui admin'; end if;
  toko := btrim(coalesce(nullif(btrim(m->>'toko'), ''), m->>'usaha', ''));
  if toko = '' then raise exception 'Isi nama toko dulu di Pengaturan Toko'; end if;
  select count(*) into n from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'penjual_members' and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = public.ks_k(toko);
  if n > 1 then raise exception 'Nama toko "%" dipakai lebih dari satu penjual. Hubungi admin.', toko; end if;
  return toko;
end $$;
revoke all on function public.ks_toko_sesi(text) from public, anon, authenticated;

-- 3) SIMPAN produk (baru / ubah sebagian kolom). Hasil: {ok, id}
create or replace function public.produk_simpan(p_sesi text, p_id bigint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text; lama public.products; d jsonb; cols text; vals text; v_id bigint;
begin
  toko := public.ks_toko_sesi(p_sesi);
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data produk tidak valid'; end if;
  if length(p_data::text) > 1500000 then raise exception 'Data terlalu besar (foto terlalu besar?)'; end if;
  d := p_data - 'id' - 'seller';
  if p_id is not null then
    select * into lama from public.products where id = p_id for update;
  end if;
  if lama.id is not null then
    if not public.ks_milik_toko(lama.seller, toko) then raise exception 'Produk ini bukan milik toko Anda'; end if;
    select string_agg(format('%I = n.%I', c.column_name, c.column_name), ', ') into cols
      from information_schema.columns c
     where c.table_schema = 'public' and c.table_name = 'products' and c.column_name not in ('id', 'seller') and d ? c.column_name;
    if cols is not null then
      execute format('update public.products p set %s from jsonb_populate_record(null::public.products, $1) n where p.id = $2', cols) using d, lama.id;
    end if;
    return jsonb_build_object('ok', true, 'id', lama.id);
  end if;
  -- produk baru: penjual selalu = toko sendiri
  v_id := coalesce(p_id, (extract(epoch from clock_timestamp()) * 1000)::bigint);
  d := d || jsonb_build_object('id', v_id, 'seller', toko);
  if coalesce(btrim(d->>'name'), '') = '' then raise exception 'Nama produk wajib diisi'; end if;
  select string_agg(format('%I', c.column_name), ', '), string_agg(format('n.%I', c.column_name), ', ') into cols, vals
    from information_schema.columns c
   where c.table_schema = 'public' and c.table_name = 'products' and d ? c.column_name;
  execute format('insert into public.products (%s) select %s from jsonb_populate_record(null::public.products, $1) n', cols, vals) using d;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.produk_simpan(text, bigint, jsonb) from public;
grant execute on function public.produk_simpan(text, bigint, jsonb) to anon, authenticated;

-- 4) HAPUS produk milik sendiri
create or replace function public.produk_hapus(p_sesi text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text; s text;
begin
  toko := public.ks_toko_sesi(p_sesi);
  select seller into s from public.products where id = p_id;
  if not found then return jsonb_build_object('ok', true); end if;
  if not public.ks_milik_toko(s, toko) then raise exception 'Produk ini bukan milik toko Anda'; end if;
  delete from public.products where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.produk_hapus(text, bigint) from public;
grant execute on function public.produk_hapus(text, bigint) to anon, authenticated;

-- 5) GANTI NAMA TOKO: pindahkan semua produk dari nama lama (toko saat ini) ke nama baru.
--    Dipanggil SEBELUM data toko disimpan, supaya kepemilikan nama lama masih bisa diperiksa.
create or replace function public.produk_ganti_toko(p_sesi text, p_baru text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text; baru text := btrim(regexp_replace(coalesce(p_baru, ''), '\s+', ' ', 'g')); v_wa text; v_id text; n int;
begin
  toko := public.ks_toko_sesi(p_sesi);
  if baru = '' then raise exception 'Nama toko baru wajib diisi'; end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
  if exists (select 1 from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
              where s.key = 'penjual_members' and x->>'id' <> v_id
                and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = public.ks_k(baru)) then
    raise exception 'Nama toko "%" sudah dipakai penjual lain', baru;
  end if;
  update public.products p
     set seller = (select string_agg(case when public.ks_k(x) = public.ks_k(toko) then baru else btrim(x) end, ', ')
                     from unnest(string_to_array(p.seller, ',')) x)
   where public.ks_milik_toko(p.seller, toko);
  get diagnostics n = row_count;
  -- nama toko di data akun ikut diganti (sekaligus, supaya tidak ada celah)
  update public.store_settings s
     set value = (select jsonb_agg(case when x->>'id' = v_id then x || jsonb_build_object('toko', baru, 'usaha', baru) else x end order by i)
                    from jsonb_array_elements(s.value) with ordinality as t(x, i))
   where s.key = 'penjual_members' and jsonb_typeof(s.value) = 'array';
  return jsonb_build_object('ok', true, 'jumlah', n);
end $$;
revoke all on function public.produk_ganti_toko(text, text) from public;
grant execute on function public.produk_ganti_toko(text, text) to anon, authenticated;

-- 6) Cegah nama toko kembar lewat simpan data akun penjual (isi sama dengan tahap 2a + pemeriksaan nama toko)
create or replace function public.simpan_anggota(p_sesi text, p_peran text, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; arr jsonb; hasil jsonb := '[]'::jsonb; el jsonb; baru jsonb; ketemu boolean := false;
        jaga text[] := array['id', 'kode', 'wa', 'pending', 'status', 'dibuatAdmin', 'joined_admin']; tk text; lama text;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'Data tidak valid'; end if;
  if length(p_data::text) > 900000 then raise exception 'Data terlalu besar (foto terlalu besar?)'; end if;
  v_wa := public.ks_sesi_wa(p_sesi, p_peran);
  if v_wa is null then return jsonb_build_object('ok', false, 'sesi_habis', true, 'pesan', 'Sesi berakhir. Silakan masuk lagi.'); end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = p_peran || '_accounts';
  if v_id is null then return jsonb_build_object('ok', false, 'pesan', 'Akun tidak ditemukan'); end if;
  insert into public.store_settings (key, value) values (p_peran || '_members', '[]'::jsonb) on conflict (key) do nothing;
  select value into arr from public.store_settings where key = p_peran || '_members' for update;
  if jsonb_typeof(arr) <> 'array' then arr := '[]'::jsonb; end if;
  if p_peran = 'penjual' then
    tk := public.ks_k(coalesce(nullif(btrim(p_data->>'toko'), ''), p_data->>'usaha'));
    if tk <> '' and exists (select 1 from jsonb_array_elements(arr) x where x->>'id' <> v_id
                              and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = tk) then
      return jsonb_build_object('ok', false, 'pesan', 'Nama toko sudah dipakai penjual lain. Pilih nama lain.');
    end if;
    -- ganti nama toko yang sudah punya produk harus lewat produk_ganti_toko (memindahkan produknya sekaligus);
    -- nama yang masih dipakai produk toko lain ditolak
    lama := (select public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) from jsonb_array_elements(arr) x where x->>'id' = v_id limit 1);
    if tk <> '' and tk is distinct from coalesce(lama, '') then
      if exists (select 1 from public.products p where public.ks_milik_toko(p.seller, tk)) then
        return jsonb_build_object('ok', false, 'pesan', 'Nama toko sudah dipakai produk toko lain. Pilih nama lain.');
      end if;
      if coalesce(lama, '') <> '' and exists (select 1 from public.products p where public.ks_milik_toko(p.seller, lama)) then
        return jsonb_build_object('ok', false, 'pesan', 'Ganti nama toko lewat menu Pengaturan Toko di aplikasi penjual terbaru.');
      end if;
    end if;
  end if;
  for el in select e from jsonb_array_elements(arr) e loop
    if not ketemu and jsonb_typeof(el) = 'object' and el->>'id' = v_id then
      baru := el || (p_data - jaga);
      ketemu := true;
      hasil := hasil || jsonb_build_array(baru);
    else
      hasil := hasil || jsonb_build_array(el);
    end if;
  end loop;
  if not ketemu then
    baru := (p_data - jaga) || jsonb_build_object('id', v_id, 'wa', v_wa, 'pending', p_peran <> 'pembeli');
    hasil := hasil || jsonb_build_array(baru);
  end if;
  update public.store_settings set value = hasil where key = p_peran || '_members';
  select x into baru from public.store_settings s, jsonb_array_elements(s.value) x
   where s.key = p_peran || '_members' and x->>'id' = v_id limit 1;
  return jsonb_build_object('ok', true, 'data', baru);
end $$;
revoke all on function public.simpan_anggota(text, text, jsonb) from public;
grant execute on function public.simpan_anggota(text, text, jsonb) to anon, authenticated;

-- Cek: harus muncul 4 baris policy (1 baca untuk semua, 3 tulis khusus admin)
select polname as policy_produk, case polcmd when 'r' then 'baca' when 'a' then 'tambah' when 'w' then 'ubah' when 'd' then 'hapus' end as aksi
  from pg_policy where polrelid = 'public.products'::regclass order by polname;
