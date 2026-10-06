-- =====================================================================
-- KALENSARI STORE • Keamanan ULASAN & LAPAK BARTER (tahap 5)
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-baca.sql & supabase-keamanan-produk.sql.
--
--  ULASAN
--   * Pembeli bisa mengirim ulasan lagi (sejak pesanan dikunci, pengecekan "pesanan selesai" gagal).
--   * Ulasan hanya bisa diubah / dihapus admin. Penjual membalas lewat fungsi aman (hanya ulasan tokonya).
--   * Nomor WA pembeli di ulasan tidak bisa dibaca publik lagi (admin tetap bisa).
--  LAPAK BARTER
--   * Pasang / ubah / hapus iklan dan komentar lewat fungsi aman: pemilik dicek dari sesi akun pembeli,
--     bukan dari HP. Orang lain tidak bisa mengubah / menghapus iklan atau komentar Anda.
--   * Admin tetap bisa menyembunyikan / menghapus iklan dan komentar.
--  LAIN-LAIN
--   * Fungsi internal (trigger, khusus admin) tidak bisa dipanggil langsung dari luar.
-- =====================================================================

-- ---------------------------------------------------------------
-- A) ULASAN
-- ---------------------------------------------------------------
create or replace function public.ks_pesanan_selesai(p_kode text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.orders where order_code = p_kode and status = 'selesai')
$$;
revoke all on function public.ks_pesanan_selesai(text) from public;
grant execute on function public.ks_pesanan_selesai(text) to anon, authenticated;

drop policy if exists "ulasan_tulis" on public.ulasan;
create policy "ulasan_tulis" on public.ulasan for insert to anon, authenticated with check (
  length(isi) <= 500 and length(coalesce(balasan, '')) = 0 and sembunyi = false
  and public.ks_pesanan_selesai(order_code)
);
drop policy if exists "ulasan_ubah"  on public.ulasan;
drop policy if exists "ulasan_hapus" on public.ulasan;
drop policy if exists "ulasan_admin_ubah"  on public.ulasan;
drop policy if exists "ulasan_admin_hapus" on public.ulasan;
create policy "ulasan_admin_ubah"  on public.ulasan for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ulasan_admin_hapus" on public.ulasan for delete to authenticated using (public.is_admin());

-- kolom wa (nomor pembeli) hanya untuk admin
revoke select, update, delete on public.ulasan from anon;
grant select (id, created_at, order_code, toko, toko_nama, bintang, isi, nama, balasan, balas_at, sembunyi) on public.ulasan to anon;
grant insert on public.ulasan to anon;
grant select, insert, update, delete on public.ulasan to authenticated;

-- penjual membalas ulasan tokonya sendiri
create or replace function public.ulasan_balas(p_sesi text, p_id bigint, p_balasan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text := public.ks_toko_sesi(p_sesi); u public.ulasan;
begin
  select * into u from public.ulasan where id = p_id for update;
  if not found then raise exception 'Ulasan tidak ditemukan'; end if;
  if toko is null or lower(btrim(u.toko)) is distinct from lower(btrim(toko)) then raise exception 'Ulasan ini bukan untuk toko Anda'; end if;
  update public.ulasan set balasan = nullif(left(btrim(coalesce(p_balasan, '')), 500), ''), balas_at = now() where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ulasan_balas(text, bigint, text) from public;
grant execute on function public.ulasan_balas(text, bigint, text) to anon, authenticated;

-- ---------------------------------------------------------------
-- B) LAPAK BARTER (tabel lapak_iklan & lapak_komentar)
-- ---------------------------------------------------------------
create or replace function public.ks_hp10(v text)
returns text language sql immutable set search_path = public as $$
  select right(regexp_replace(coalesce(v, ''), '\D', '', 'g'), 10)
$$;

create or replace function public.ks_pembeli_sesi(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli'); a jsonb; m jsonb;
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa into a from public.store_settings s where s.key = 'pembeli_accounts';
  select x into m from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'pembeli_members' and x->>'id' = a->>'id' limit 1;
  return jsonb_build_object('wa', v_wa, 'nama', coalesce(nullif(btrim(m->>'nama'), ''), 'Warga'),
                            'alamat', left(coalesce(nullif(btrim(m->>'dusun'), ''), btrim(m->>'alamat'), ''), 60));
end $$;
revoke all on function public.ks_pembeli_sesi(text) from public, anon, authenticated;

do $$
declare t text; p record;
begin
  foreach t in array array['lapak_iklan', 'lapak_komentar'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    -- semua policy tulis lama (insert / update / delete / all) dihapus; policy baca tetap
    for p in select polname from pg_policy where polrelid = ('public.' || t)::regclass and polcmd in ('a', 'w', 'd', '*') loop
      execute format('drop policy %I on public.%I', p.polname, t);
    end loop;
    -- bila ada policy "all" yang tadi terhapus, pastikan baca tetap terbuka
    if not exists (select 1 from pg_policy where polrelid = ('public.' || t)::regclass and polcmd = 'r') then
      execute format('create policy %I on public.%I for select to anon, authenticated using (true)', t || '_baca', t);
    end if;
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
    execute format('revoke insert, update, delete on public.%I from anon', t);
  end loop;
end $$;

-- pasang iklan baru / ubah iklan sendiri
create or replace function public.lapak_simpan(p_sesi text, p_id bigint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb := public.ks_pembeli_sesi(p_sesi); d jsonb := coalesce(p_data, '{}'::jsonb); r public.lapak_iklan; lama public.lapak_iklan; baru_id bigint;
begin
  if jsonb_typeof(d) <> 'object' then raise exception 'Data tidak valid'; end if;
  if length(d::text) > 3000000 then raise exception 'Foto terlalu besar'; end if;
  -- kolom yang boleh diisi pembeli
  d := (select coalesce(jsonb_object_agg(key, value), '{}'::jsonb) from jsonb_each(d)
         where key in ('judul', 'kondisi', 'harga', 'barter', 'foto', 'thumb', 'status'));
  if d ? 'status' and d->>'status' not in ('aktif', 'selesai') then d := d - 'status'; end if;
  d := d || jsonb_build_object('nama', me->>'nama', 'alamat', me->>'alamat', 'updated_at', now());
  if p_id is null then
    if coalesce(btrim(d->>'judul'), '') = '' then raise exception 'Isi nama produk'; end if;
    if (select count(*) from public.lapak_iklan where public.ks_hp10(wa) = public.ks_hp10(me->>'wa') and created_at > now() - interval '1 day') >= 10 then
      raise exception 'Maksimal 10 iklan baru per hari';
    end if;
    r := jsonb_populate_record(null::public.lapak_iklan, d || jsonb_build_object('wa', me->>'wa', 'status', coalesce(d->>'status', 'aktif')));
    insert into public.lapak_iklan (judul, kondisi, harga, barter, foto, thumb, nama, alamat, wa, status, updated_at)
    values (r.judul, r.kondisi, r.harga, r.barter, r.foto, r.thumb, r.nama, r.alamat, r.wa, r.status, r.updated_at)
    returning id into baru_id;
    return jsonb_build_object('ok', true, 'id', baru_id);
  end if;
  select * into lama from public.lapak_iklan where id = p_id for update;
  if not found then raise exception 'Iklan tidak ditemukan'; end if;
  if public.ks_hp10(lama.wa) <> public.ks_hp10(me->>'wa') then raise exception 'Ini bukan iklan Anda'; end if;
  r := jsonb_populate_record(lama, d);
  update public.lapak_iklan set judul = r.judul, kondisi = r.kondisi, harga = r.harga, barter = r.barter, foto = r.foto,
         thumb = r.thumb, nama = r.nama, alamat = r.alamat, status = r.status, updated_at = r.updated_at
   where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id);
end $$;
revoke all on function public.lapak_simpan(text, bigint, jsonb) from public;
grant execute on function public.lapak_simpan(text, bigint, jsonb) to anon, authenticated;

-- hapus iklan sendiri (beserta komentarnya)
create or replace function public.lapak_hapus(p_sesi text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb := public.ks_pembeli_sesi(p_sesi); w text;
begin
  select wa into w from public.lapak_iklan where id = p_id;
  if not found then return jsonb_build_object('ok', true); end if;
  if public.ks_hp10(w) <> public.ks_hp10(me->>'wa') then raise exception 'Ini bukan iklan Anda'; end if;
  delete from public.lapak_komentar where iklan_id = p_id;
  delete from public.lapak_iklan where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.lapak_hapus(text, bigint) from public;
grant execute on function public.lapak_hapus(text, bigint) to anon, authenticated;

-- kirim komentar (nama & nomor diambil dari akun, tidak bisa dipalsukan)
create or replace function public.lapak_komentar_kirim(p_sesi text, p_iklan bigint, p_isi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb := public.ks_pembeli_sesi(p_sesi); isi text := left(btrim(coalesce(p_isi, '')), 500);
begin
  if isi = '' then raise exception 'Tulis komentar dulu'; end if;
  if not exists (select 1 from public.lapak_iklan where id = p_iklan) then raise exception 'Iklan tidak ditemukan'; end if;
  if exists (select 1 from public.lapak_komentar where public.ks_hp10(wa) = public.ks_hp10(me->>'wa') and created_at > now() - interval '5 seconds') then
    raise exception 'Tunggu sebentar sebelum berkomentar lagi';
  end if;
  insert into public.lapak_komentar (iklan_id, wa, nama, isi) values (p_iklan, me->>'wa', me->>'nama', isi);
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.lapak_komentar_kirim(text, bigint, text) from public;
grant execute on function public.lapak_komentar_kirim(text, bigint, text) to anon, authenticated;

-- hapus komentar: penulis komentar atau pemilik iklan
create or replace function public.lapak_komentar_hapus(p_sesi text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb := public.ks_pembeli_sesi(p_sesi); k public.lapak_komentar; pemilik text;
begin
  select * into k from public.lapak_komentar where id = p_id;
  if not found then return jsonb_build_object('ok', true); end if;
  select wa into pemilik from public.lapak_iklan where id = k.iklan_id;
  if public.ks_hp10(k.wa) <> public.ks_hp10(me->>'wa') and public.ks_hp10(pemilik) <> public.ks_hp10(me->>'wa') then
    raise exception 'Tidak bisa menghapus komentar orang lain';
  end if;
  delete from public.lapak_komentar where id = p_id;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.lapak_komentar_hapus(text, bigint) from public;
grant execute on function public.lapak_komentar_hapus(text, bigint) to anon, authenticated;

-- ---------------------------------------------------------------
-- C) Fungsi internal: tidak bisa dipanggil langsung dari luar
--    (fungsi trigger tetap jalan otomatis; fungsi khusus admin tetap untuk akun admin)
-- ---------------------------------------------------------------
do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public' and p.prorettype = 'trigger'::regtype
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;
do $$
declare n text;
begin
  foreach n in array array['koreksi_saldo', 'koreksi_saldo_pembeli', 'beri_saldo_awal', 'proses_topup', 'kurir_cair_proses', 'admin_catat'] loop
    perform 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace where ns.nspname = 'public' and p.proname = n;
    if found then
      execute (select string_agg(format('revoke execute on function %s from public, anon', p.oid::regprocedure), '; ')
                 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace where ns.nspname = 'public' and p.proname = n);
    end if;
  end loop;
end $$;

-- Cek
select (select count(*) from pg_policy where polrelid = 'public.ulasan'::regclass and polname in ('ulasan_ubah', 'ulasan_hapus')) as ulasan_terbuka_harus_0,
       has_column_privilege('anon', 'public.ulasan', 'wa', 'select')           as anon_baca_wa_harus_false,
       exists (select 1 from pg_proc where proname = 'lapak_simpan')            as lapak_aman,
       has_table_privilege('anon', 'public.lapak_iklan', 'delete')             as anon_hapus_iklan_harus_false;
