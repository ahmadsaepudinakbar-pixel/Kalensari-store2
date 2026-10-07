-- =====================================================================
-- Kalensari Store • Simpan foto lewat server (foto toko, foto topping, foto kurir)
-- Jalankan SETELAH supabase-keamanan-pengaturan.sql. Aman dijalankan berulang kali.
--
-- Kunci "foto_..." di store_settings terkunci untuk web (hanya admin), jadi
-- penjual & kurir tidak bisa lagi mengganti foto. Fungsi foto_simpan membuka
-- jalur aman: hanya foto MILIK SENDIRI, dan isinya wajib gambar asli
-- (data:image/jpeg|png|webp;base64,...) supaya tidak bisa disusupi kode.
--
--   p_jenis 'toko'    p_peran 'penjual'  p_ref = (diabaikan)   p_value = {"foto":"data:image/...","toko":"..."}
--   p_jenis 'topping' p_peran 'penjual'  p_ref = id produk     p_value = {"foto":{"Nama topping":"data:image/..."}}
--   p_jenis 'kurir'   p_peran 'kurir'    p_ref = (diabaikan)   p_value = {"foto":"data:image/...","nama":"..."}
-- =====================================================================

create or replace function public.ks_foto_sah(v text)
returns boolean language sql immutable as $$
  select v is not null and length(v) <= 700000
     and v ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$'
$$;

create or replace function public.foto_simpan(p_sesi text, p_peran text, p_jenis text, p_ref text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; v_toko text; k text; val jsonb; e record; n int := 0;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then raise exception 'Data foto tidak valid'; end if;

  if p_jenis = 'toko' and p_peran = 'penjual' then
    v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
    if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
    select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
    if coalesce(v_id, '') = '' then raise exception 'Akun penjual tidak ditemukan'; end if;
    if not public.ks_foto_sah(p_value->>'foto') then raise exception 'Foto harus berupa gambar (JPG/PNG/WEBP)'; end if;
    k := 'foto_toko_' || v_id;
    val := jsonb_build_object('foto', p_value->>'foto', 't', (extract(epoch from now()) * 1000)::bigint,
                              'toko', left(coalesce(p_value->>'toko', ''), 80));

  elsif p_jenis = 'topping' and p_peran = 'penjual' then
    v_toko := public.ks_toko_sesi(p_sesi);   -- error "Sesi berakhir" bila sesi tidak sah
    if coalesce(p_ref, '') !~ '^\d+$' then raise exception 'Produk tidak valid'; end if;
    if not exists (select 1 from public.products p where p.id = p_ref::bigint and public.ks_milik_toko(p.seller, v_toko)) then
      raise exception 'Produk ini bukan milik toko Anda';
    end if;
    if jsonb_typeof(coalesce(p_value->'foto', '{}')) <> 'object' then raise exception 'Data foto topping tidak valid'; end if;
    for e in select key, value from jsonb_each(coalesce(p_value->'foto', '{}')) loop
      n := n + 1;
      if n > 60 or length(e.key) > 80 or jsonb_typeof(e.value) <> 'string' or not public.ks_foto_sah(e.value #>> '{}') then
        raise exception 'Foto topping "%" tidak valid', left(e.key, 40);
      end if;
    end loop;
    k := 'foto_topping_' || p_ref;
    val := jsonb_build_object('foto', coalesce(p_value->'foto', '{}'), 't', (extract(epoch from now()) * 1000)::bigint);

  elsif p_jenis = 'kurir' and p_peran = 'kurir' then
    v_wa := public.ks_sesi_wa(p_sesi, 'kurir');
    if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
    select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'kurir_accounts';
    if coalesce(v_id, '') = '' then raise exception 'Akun kurir tidak ditemukan'; end if;
    if not public.ks_foto_sah(p_value->>'foto') then raise exception 'Foto harus berupa gambar (JPG/PNG/WEBP)'; end if;
    k := 'foto_kurir_' || v_id;
    val := jsonb_build_object('foto', p_value->>'foto', 'nama', left(coalesce(p_value->>'nama', ''), 80),
                              't', (extract(epoch from now()) * 1000)::bigint);
  else
    raise exception 'Jenis foto tidak dikenal';
  end if;

  insert into public.store_settings (key, value) values (k, val)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true, 'key', k);
end $$;
revoke all on function public.foto_simpan(text, text, text, text, jsonb) from public;
grant execute on function public.foto_simpan(text, text, text, text, jsonb) to anon, authenticated;

-- Foto tidak lagi ditulis langsung dari web: keluarkan dari daftar yang boleh.
create or replace function public.ks_boleh_web(k text)
returns boolean language sql immutable as $$
  select k ~ '^(pembeli|penjual|kurir|jasa)_(accounts|members)$'
      or k ~ '^(pembeli|penjual|kurir|jasa)_push_'
      or k ~ '^stoklog_'
      or k ~ '^laporan_'
      or k = 'unggulan_toko'
$$;
