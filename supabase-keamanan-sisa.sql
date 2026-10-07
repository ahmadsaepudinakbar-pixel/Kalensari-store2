-- =====================================================================
-- Kalensari Store • Kunci 3 pengaturan terakhir yang masih terbuka
-- Jalankan SETELAH supabase-notif-aman.sql. Aman dijalankan berulang kali.
--
--   unggulan_toko   -> hanya penjual pemilik toko (fungsi toko_unggulan)
--   stoklog_<id>    -> hanya penjual pemilik catatan (fungsi stok_catat)
--   laporan_<kode>  -> hanya pemesan (nomor WA harus cocok) (fungsi lapor_pesanan)
-- Setelah ini, yang boleh ditulis langsung dari web hanya data akun & anggota
-- (yang sudah dijaga trigger ks_jaga_akun / ks_jaga_anggota).
-- =====================================================================

-- 1) Produk unggulan toko (maks 3, hanya produk milik toko sendiri)
create or replace function public.toko_unggulan(p_sesi text, p_ids jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_toko text := public.ks_toko_sesi(p_sesi); k text := lower(btrim(v_toko)); ids jsonb := '[]'::jsonb; x jsonb;
begin
  if p_ids is null or jsonb_typeof(p_ids) <> 'array' or jsonb_array_length(p_ids) > 3 then
    raise exception 'Maksimal 3 produk unggulan';
  end if;
  for x in select * from jsonb_array_elements(p_ids) loop
    if (x #>> '{}') !~ '^\d+$' then raise exception 'Produk tidak valid'; end if;
    if not exists (select 1 from public.products p where p.id = (x #>> '{}')::bigint and public.ks_milik_toko(p.seller, v_toko)) then
      raise exception 'Produk ini bukan milik toko Anda';
    end if;
    if not ids @> jsonb_build_array(x #>> '{}') then ids := ids || jsonb_build_array(x #>> '{}'); end if;
  end loop;
  if jsonb_array_length(ids) = 0 then
    update public.store_settings set value = value - k where key = 'unggulan_toko' and jsonb_typeof(value) = 'object';
  else
    insert into public.store_settings (key, value) values ('unggulan_toko', jsonb_build_object(k, ids))
    on conflict (key) do update
      set value = (case when jsonb_typeof(public.store_settings.value) = 'object' then public.store_settings.value else '{}'::jsonb end)
                  || excluded.value;
  end if;
  return jsonb_build_object('ok', true, 'ids', ids);
end $$;
revoke all on function public.toko_unggulan(text, jsonb) from public;
grant execute on function public.toko_unggulan(text, jsonb) to anon, authenticated;

-- 2) Catatan potong / kembali stok per pesanan (p = dipotong, k = dikembalikan)
create or replace function public.stok_catat(p_sesi text, p_kode text, p_f text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_toko text := public.ks_toko_sesi(p_sesi); v_wa text; v_id text; k text; log jsonb; e record; now_ms bigint;
begin
  if p_f not in ('p', 'k') then raise exception 'Jenis catatan tidak dikenal'; end if;
  if not exists (select 1 from public.orders o, jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) it
                  where o.order_code = p_kode and public.ks_milik_toko(it->>'seller', v_toko)) then
    raise exception 'Pesanan ini bukan untuk toko Anda';
  end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
  k := 'stoklog_' || v_id;
  now_ms := (extract(epoch from now()) * 1000)::bigint;
  select value into log from public.store_settings where key = k;
  if log is null or jsonb_typeof(log) <> 'object' then log := '{}'::jsonb; end if;
  -- buang catatan lebih dari 60 hari
  for e in select key, value from jsonb_each(log) loop
    if now_ms - coalesce(nullif(e.value->>'p', '')::numeric, 0) > 60::numeric * 86400000 then log := log - e.key; end if;
  end loop;
  log := log || jsonb_build_object(p_kode, coalesce(log->p_kode, '{}'::jsonb) || jsonb_build_object(p_f, now_ms));
  insert into public.store_settings (key, value) values (k, log)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.stok_catat(text, text, text) from public;
grant execute on function public.stok_catat(text, text, text) to anon, authenticated;

-- 3) Laporan "belum saya terima" dari pemesan
create or replace function public.lapor_pesanan(p_kode text, p_hp text, p_ket text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare hp text := regexp_replace(coalesce(p_hp, ''), '\D', '', 'g'); a jsonb; lama jsonb;
begin
  if length(hp) < 9 then raise exception 'Nomor WhatsApp pemesan tidak valid'; end if;
  if not exists (select 1 from public.orders o
                  where o.order_code = p_kode
                    and right(regexp_replace(coalesce(nullif(o.customer_phone_normalized, ''), o.customer_phone, ''), '\D', '', 'g'), 10) = right(hp, 10)) then
    raise exception 'Pesanan tidak ditemukan untuk nomor ini';
  end if;
  select value into lama from public.store_settings where key = 'laporan_' || p_kode;
  if lama is not null and now() - to_timestamp(coalesce(nullif(lama->>'t', '')::numeric, 0) / 1000) < interval '1 minute' then
    raise exception 'Laporan baru saja dikirim. Tunggu 1 menit.';
  end if;
  select value into a from public.store_settings where key = 'antar_' || p_kode;   -- data kurir diambil dari server, bukan dari HP
  insert into public.store_settings (key, value)
  values ('laporan_' || p_kode, jsonb_build_object(
            't', (extract(epoch from now()) * 1000)::bigint, 'hp', hp, 'ket', left(coalesce(p_ket, ''), 300),
            'kurir', case when a is null then null else jsonb_build_object('id', a->'id', 'nama', a->'nama', 'wa', a->'wa', 'cara', a->'cara') end,
            'beres', false))
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.lapor_pesanan(text, text, text) from public;
grant execute on function public.lapor_pesanan(text, text, text) to anon, authenticated;

-- 4) Daftar yang boleh ditulis langsung dari web: tinggal data akun & anggota
create or replace function public.ks_boleh_web(k text)
returns boolean language sql immutable as $$
  select k ~ '^(pembeli|penjual|kurir|jasa)_(accounts|members)$'
$$;
