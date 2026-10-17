-- KALENSARI STORE - MITRA LUAR KOTA (jalankan SEKALI di Supabase > SQL Editor)
-- Akun mitra TERPISAH dari akun penjual. Tabel tertutup (tanpa akses langsung dari web); semua lewat fungsi di bawah.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.mitra_luar_kota (
  id bigint generated always as identity primary key,
  wa text not null unique, pin_hash text not null,
  nama text not null, toko text not null, kota text not null, provinsi text, jenis text, izin text not null, alamat text, alamat_toko text, ongkir_desa integer,
  status text not null default 'menunggu' check (status in ('menunggu','aktif','ditolak','nonaktif')),
  gagal int not null default 0, kunci_sampai timestamptz, dibuat timestamptz not null default now());
create unique index if not exists mitra_toko_uniq on public.mitra_luar_kota (lower(btrim(toko)));
create table if not exists public.mitra_sesi (
  token text primary key, mitra_id bigint not null references public.mitra_luar_kota(id) on delete cascade,
  exp timestamptz not null default now() + interval '30 days');
alter table public.mitra_luar_kota add column if not exists alamat_toko text;
alter table public.mitra_luar_kota add column if not exists ongkir_desa integer;
alter table public.mitra_luar_kota enable row level security;
alter table public.mitra_sesi enable row level security;
revoke all on public.mitra_luar_kota, public.mitra_sesi from anon, authenticated;

alter table public.products add column if not exists luar_kota  boolean default false;
alter table public.products add column if not exists berat_gram integer;
alter table public.products add column if not exists asal_kota  text;
alter table public.products add column if not exists izin_edar  text;
alter table public.products add column if not exists mitra_id   bigint;

create or replace function public.mitra_wa(t text) returns text language sql immutable as $$
  select case when d like '0%' then '62' || substr(d, 2) when d like '8%' then '62' || d else d end
    from (select regexp_replace(coalesce(t, ''), '\D', '', 'g') d) x $$;

create or replace function public.mitra_data(m public.mitra_luar_kota) returns jsonb language sql immutable as $$
  select jsonb_build_object('id', m.id, 'wa', m.wa, 'nama', m.nama, 'toko', m.toko, 'kota', m.kota, 'provinsi', m.provinsi,
                            'jenis', m.jenis, 'izin', m.izin, 'alamat', m.alamat, 'alamat_toko', m.alamat_toko, 'ongkir_desa', m.ongkir_desa, 'status', m.status) $$;

create or replace function public.mitra_sesi_row(p_sesi text) returns public.mitra_luar_kota
language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota;
begin
  select k.* into m from public.mitra_luar_kota k join public.mitra_sesi s on s.mitra_id = k.id where s.token = p_sesi and s.exp > now();
  if m.id is null then raise exception 'Sesi berakhir. Silakan masuk lagi.'; end if;
  return m;
end $$;
revoke all on function public.mitra_sesi_row(text) from public, anon, authenticated;

drop function if exists public.mitra_daftar(text,text,text,text,text,text,text,text,text);
create or replace function public.mitra_daftar(p_wa text, p_pin text, p_nama text, p_toko text, p_kota text, p_provinsi text, p_jenis text, p_izin text, p_alamat_toko text, p_ongkir text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare w text := public.mitra_wa(p_wa); t text := btrim(coalesce(p_toko, ''));
begin
  if length(w) < 10 or length(w) > 15 then return jsonb_build_object('ok', false, 'pesan', 'Nomor WhatsApp tidak valid'); end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then return jsonb_build_object('ok', false, 'pesan', 'PIN harus 4-8 angka'); end if;
  if btrim(coalesce(p_nama, '')) = '' or t = '' or btrim(coalesce(p_kota, '')) = '' or btrim(coalesce(p_izin, '')) = '' then
    return jsonb_build_object('ok', false, 'pesan', 'Nama, nama toko, kota, dan nomor izin edar wajib diisi'); end if;
  if btrim(coalesce(p_alamat_toko, '')) = '' then return jsonb_build_object('ok', false, 'pesan', 'Alamat toko wajib diisi'); end if;
  if regexp_replace(coalesce(p_ongkir, ''), '\D', '', 'g') = '' or length(regexp_replace(p_ongkir, '\D', '', 'g')) > 9 then
    return jsonb_build_object('ok', false, 'pesan', 'Ongkos kirim ke desa Kalensari wajib diisi (angka)'); end if;
  if length(t) > 60 or position(',' in t) > 0 then return jsonb_build_object('ok', false, 'pesan', 'Nama toko maksimal 60 huruf dan tanpa koma'); end if;
  if exists (select 1 from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
              where s.key = 'penjual_members' and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = public.ks_k(t))
     or exists (select 1 from public.products p where public.ks_milik_toko(p.seller, t)) then
    return jsonb_build_object('ok', false, 'pesan', 'Nama toko sudah dipakai, pilih nama lain'); end if;
  insert into public.mitra_luar_kota (wa, pin_hash, nama, toko, kota, provinsi, jenis, izin, alamat_toko, ongkir_desa)
  values (w, extensions.crypt(p_pin, extensions.gen_salt('bf')), left(btrim(p_nama), 60), t, left(btrim(p_kota), 60), left(btrim(coalesce(p_provinsi, '')), 40),
          left(btrim(coalesce(p_jenis, '')), 40), left(btrim(p_izin), 80), left(btrim(p_alamat_toko), 200), regexp_replace(p_ongkir, '\D', '', 'g')::integer);
  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'pesan', 'Nomor WhatsApp atau nama toko sudah terdaftar');
end $$;

create or replace function public.mitra_masuk(p_wa text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare m public.mitra_luar_kota; tk text;
begin
  select * into m from public.mitra_luar_kota where wa = public.mitra_wa(p_wa);
  if m.id is null then return jsonb_build_object('ok', false, 'pesan', 'Nomor atau PIN salah'); end if;
  if m.kunci_sampai is not null and m.kunci_sampai > now() then return jsonb_build_object('ok', false, 'pesan', 'Terlalu banyak salah PIN. Coba lagi 15 menit lagi.'); end if;
  if m.pin_hash <> extensions.crypt(coalesce(p_pin, ''), m.pin_hash) then
    update public.mitra_luar_kota set gagal = case when gagal + 1 >= 5 then 0 else gagal + 1 end,
           kunci_sampai = case when gagal + 1 >= 5 then now() + interval '15 minutes' else kunci_sampai end where id = m.id;
    return jsonb_build_object('ok', false, 'pesan', 'Nomor atau PIN salah');
  end if;
  update public.mitra_luar_kota set gagal = 0, kunci_sampai = null where id = m.id;
  delete from public.mitra_sesi where exp < now();
  tk := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  insert into public.mitra_sesi (token, mitra_id) values (tk, m.id);
  return jsonb_build_object('ok', true, 'sesi', tk, 'data', public.mitra_data(m));
end $$;

create or replace function public.mitra_saya(p_sesi text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi);
begin return jsonb_build_object('ok', true, 'data', public.mitra_data(m)); end $$;

create or replace function public.mitra_produk_list(p_sesi text) returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi);
begin return coalesce((select jsonb_agg(to_jsonb(p) order by p.id desc) from public.products p where p.mitra_id = m.id), '[]'::jsonb); end $$;

create or replace function public.mitra_produk_simpan(p_sesi text, p_id bigint, p_data jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi); d jsonb := coalesce(p_data, '{}'::jsonb);
  v_name text := btrim(coalesce(d->>'name', '')); v_price int := nullif(d->>'price', '')::int; v_berat int := nullif(d->>'berat_gram', '')::int;
  v_stok int := nullif(d->>'stock', '')::int; v_st text := coalesce(nullif(d->>'status', ''), 'Show'); v_id bigint;
begin
  if m.status <> 'aktif' then raise exception 'Akun mitra belum disetujui admin'; end if;
  if v_name = '' or length(v_name) > 80 then raise exception 'Nama produk wajib diisi (maks 80 huruf)'; end if;
  if v_price is null or v_price <= 0 then raise exception 'Harga wajib diisi'; end if;
  if v_berat is null or v_berat <= 0 then raise exception 'Berat (gram) wajib diisi'; end if;
  if v_st not in ('Show', 'Sold', 'Hide') then raise exception 'Status tidak valid'; end if;
  if length(coalesce(d->>'image', '')) > 1400000 then raise exception 'Foto terlalu besar'; end if;
  if p_id is not null then
    update public.products set name = v_name, price = v_price, category = left(coalesce(nullif(btrim(d->>'category'), ''), 'Kosmetik'), 40),
           description = left(coalesce(d->>'description', ''), 600), stock = v_stok, status = v_st, berat_gram = v_berat,
           image = case when d ? 'image' then d->>'image' else image end
     where id = p_id and mitra_id = m.id;
    if not found then raise exception 'Produk ini bukan milik Anda'; end if;
    return jsonb_build_object('ok', true, 'id', p_id);
  end if;
  v_id := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  insert into public.products (id, name, price, category, description, stock, status, image, seller, luar_kota, berat_gram, asal_kota, izin_edar, mitra_id)
  values (v_id, v_name, v_price, left(coalesce(nullif(btrim(d->>'category'), ''), 'Kosmetik'), 40), left(coalesce(d->>'description', ''), 600), v_stok, v_st,
          nullif(d->>'image', ''), m.toko || ' (Luar Kota)', true, v_berat, m.kota, m.izin, m.id);
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.mitra_produk_hapus(p_sesi text, p_id bigint) returns jsonb language plpgsql security definer set search_path = public as $$
declare m public.mitra_luar_kota := public.mitra_sesi_row(p_sesi);
begin delete from public.products where id = p_id and mitra_id = m.id; return jsonb_build_object('ok', true); end $$;

-- ADMIN (hanya admin yang sudah login lewat Supabase Auth)
create or replace function public.mitra_admin_daftar() returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Khusus admin'; end if;
  return coalesce((select jsonb_agg(public.mitra_data(k) || jsonb_build_object('dibuat', k.dibuat, 'produk', (select count(*) from public.products p where p.mitra_id = k.id)) order by k.id desc) from public.mitra_luar_kota k), '[]'::jsonb);
end $$;
create or replace function public.mitra_admin_atur(p_id bigint, p_status text) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Khusus admin'; end if;
  if p_status not in ('aktif', 'menunggu', 'ditolak', 'nonaktif') then raise exception 'Status tidak valid'; end if;
  update public.mitra_luar_kota set status = p_status where id = p_id;
  if p_status <> 'aktif' then update public.products set status = 'Hide' where mitra_id = p_id; end if;
  return jsonb_build_object('ok', true);
end $$;
create or replace function public.mitra_admin_pin(p_id bigint, p_pin text) returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if not coalesce(public.is_admin(), false) then raise exception 'Khusus admin'; end if;
  if coalesce(p_pin, '') !~ '^[0-9]{4,8}$' then raise exception 'PIN harus 4-8 angka'; end if;
  update public.mitra_luar_kota set pin_hash = extensions.crypt(p_pin, extensions.gen_salt('bf')), gagal = 0, kunci_sampai = null where id = p_id;
  delete from public.mitra_sesi where mitra_id = p_id;
  return jsonb_build_object('ok', true);
end $$;

do $$ declare f text; begin
  foreach f in array array['mitra_daftar(text,text,text,text,text,text,text,text,text,text)','mitra_masuk(text,text)','mitra_saya(text)','mitra_produk_list(text)',
    'mitra_produk_simpan(text,bigint,jsonb)','mitra_produk_hapus(text,bigint)','mitra_admin_daftar()','mitra_admin_atur(bigint,text)','mitra_admin_pin(bigint,text)'] loop
    execute 'revoke all on function public.' || f || ' from public';
    execute 'grant execute on function public.' || f || ' to anon, authenticated';
  end loop; end $$;
select to_regclass('public.mitra_luar_kota') is not null as tabel_siap;
