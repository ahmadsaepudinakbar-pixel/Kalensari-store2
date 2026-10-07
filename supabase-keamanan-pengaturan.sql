-- =====================================================================
-- Kalensari Store • Keamanan pengaturan (store_settings) – "daftar yang boleh"
-- Jalankan SETELAH semua SQL keamanan sebelumnya (Supabase > SQL Editor > Run).
-- Aman dijalankan berulang kali.
--
-- Sebelum: semua pengaturan BOLEH diubah dari web, kecuali yang didaftar dilarang.
-- Sesudah: semua pengaturan DIKUNCI (hanya admin & fungsi server), kecuali
--          daftar kecil yang memang perlu ditulis dari web (lihat ks_boleh_web).
--
-- Yang ikut terkunci, antara lain:
--   * cod_aturan    – batas COD & blokir pembeli COD
--   * setoran_qris  – catatan setoran QRIS toko/kurir
--   * tutup_toko    – tutup/buka toko; penjual kini lewat fungsi toko_atur
--   * seller_schedule – jadwal toko; penjual kini lewat fungsi toko_atur
--   * pengaturan baru apa pun yang dibuat nanti (otomatis terkunci)
--
-- Admin (masuk lewat Supabase Auth) tetap bisa mengubah semuanya.
-- Fungsi server (Edge Function service_role, fungsi security definer) tidak terpengaruh.
-- =====================================================================

-- 1) Daftar kunci yang masih boleh ditulis langsung dari web
--    (dijaga lagi oleh aturan/trigger lama: akun, anggota, catatan kurir, dll.)
create or replace function public.ks_boleh_web(k text)
returns boolean language sql immutable as $$
  select k ~ '^(pembeli|penjual|kurir|jasa)_(accounts|members)$'   -- daftar/ubah akun (dijaga trigger ks_jaga_akun & ks_jaga_anggota)
      or k ~ '^(pembeli|penjual|kurir|jasa)_push_'                  -- langganan notifikasi HP
      or k ~ '^foto_(kurir|toko|topping)_'                          -- foto profil kurir / toko / topping
      or k ~ '^stoklog_'                                            -- catatan potong stok penjual
      or k ~ '^laporan_'                                            -- laporan masalah pesanan dari pembeli
      or k = 'unggulan_toko'                                        -- produk unggulan toko
$$;

drop policy if exists "ks_daftar_boleh_ins" on public.store_settings;
create policy "ks_daftar_boleh_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (public.ks_boleh_web(key) or public.is_admin());

drop policy if exists "ks_daftar_boleh_upd" on public.store_settings;
create policy "ks_daftar_boleh_upd" on public.store_settings as restrictive for update to anon, authenticated
  using      (public.ks_boleh_web(key) or public.is_admin())
  with check (public.ks_boleh_web(key) or public.is_admin());

drop policy if exists "ks_daftar_boleh_del" on public.store_settings;
create policy "ks_daftar_boleh_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (public.ks_boleh_web(key) or public.is_admin());


-- 2) Fungsi untuk app penjual: tutup/buka toko, jadwal, pindah nama toko.
--    Hanya mengubah data TOKO MILIK SESI PENJUAL yang sedang masuk.
--    p_jenis = 'tutup'  p_value = {"tutup": true|false}
--    p_jenis = 'jadwal' p_value = {"o":"08:00","c":"17:00","off":[0,5],"h":["2026-10-17"]} atau null (hapus jadwal)
--    p_jenis = 'pindah' p_value = {"baru":"Nama Toko Baru"}  (dipanggil sebelum nama toko diganti)
create or replace function public.toko_atur(p_sesi text, p_jenis text, p_value jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_toko text := public.ks_toko_sesi(p_sesi);   -- error "Sesi berakhir" bila sesi tidak sah
  k  text := lower(btrim(v_toko));
  v_wa text; v_id text; kb text; n int; rec jsonb; o text; c text; key_ text;
begin
  if p_jenis = 'tutup' then
    if coalesce((p_value->>'tutup')::boolean, false) then
      v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
      select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
      insert into public.store_settings (key, value)
      values ('tutup_toko', jsonb_build_object(k, jsonb_build_object(
                't', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'id', v_id)))
      on conflict (key) do update
        set value = (case when jsonb_typeof(public.store_settings.value) = 'object' then public.store_settings.value else '{}'::jsonb end)
                    || excluded.value;
    else
      update public.store_settings set value = value - k
       where key = 'tutup_toko' and jsonb_typeof(value) = 'object';
    end if;
    return jsonb_build_object('ok', true);

  elsif p_jenis = 'jadwal' then
    if p_value is null or jsonb_typeof(p_value) = 'null' then
      update public.store_settings set value = value - k
       where key = 'seller_schedule' and jsonb_typeof(value) = 'object';
      return jsonb_build_object('ok', true);
    end if;
    if jsonb_typeof(p_value) <> 'object' then raise exception 'Jadwal tidak valid'; end if;
    o := p_value->>'o'; c := p_value->>'c';
    if (o is null) <> (c is null)
       or (o is not null and (o !~ '^\d{1,2}:\d{2}(:\d{2})?$' or c !~ '^\d{1,2}:\d{2}(:\d{2})?$')) then
      raise exception 'Jam buka / tutup tidak valid';
    end if;
    if jsonb_typeof(coalesce(p_value->'off', '[]')) <> 'array' or jsonb_array_length(coalesce(p_value->'off', '[]')) > 6
       or exists (select 1 from jsonb_array_elements(coalesce(p_value->'off', '[]')) x
                   where jsonb_typeof(x) <> 'number' or x::text !~ '^[0-6]$') then
      raise exception 'Hari libur tidak valid';
    end if;
    if jsonb_typeof(coalesce(p_value->'h', '[]')) <> 'array' or jsonb_array_length(coalesce(p_value->'h', '[]')) > 60
       or exists (select 1 from jsonb_array_elements(coalesce(p_value->'h', '[]')) x
                   where jsonb_typeof(x) <> 'string' or x #>> '{}' !~ '^\d{4}-\d{2}-\d{2}$') then
      raise exception 'Tanggal libur tidak valid';
    end if;
    rec := jsonb_build_object('off', coalesce(p_value->'off', '[]'), 'h', coalesce(p_value->'h', '[]'))
           || case when o is not null then jsonb_build_object('o', o, 'c', c) else '{}'::jsonb end;
    insert into public.store_settings (key, value) values ('seller_schedule', jsonb_build_object(k, rec))
    on conflict (key) do update
      set value = (case when jsonb_typeof(public.store_settings.value) = 'object' then public.store_settings.value else '{}'::jsonb end)
                  || excluded.value;
    return jsonb_build_object('ok', true);

  elsif p_jenis = 'pindah' then
    kb := lower(btrim(regexp_replace(coalesce(p_value->>'baru', ''), '\s+', ' ', 'g')));
    if kb = '' or length(kb) > 80 then raise exception 'Nama toko baru tidak valid'; end if;
    if kb = k then return jsonb_build_object('ok', true); end if;
    -- nama baru tidak boleh milik penjual lain
    select count(*) into n
      from public.store_settings s,
           jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
     where s.key = 'penjual_members'
       and lower(btrim(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha', ''))) = kb;
    if n > 0 then raise exception 'Nama toko "%" sudah dipakai penjual lain', p_value->>'baru'; end if;
    -- pindahkan jadwal, status tutup, tutup-admin & ongkir dari nama lama ke nama baru
    foreach key_ in array array['seller_schedule', 'tutup_toko', 'closed_sellers', 'shipping_fees'] loop
      update public.store_settings
         set value = (value - k) || jsonb_build_object(kb, value->k)
       where key = key_ and jsonb_typeof(value) = 'object' and value ? k;
    end loop;
    return jsonb_build_object('ok', true);
  end if;

  raise exception 'Jenis pengaturan tidak dikenal';
end $$;
revoke all on function public.toko_atur(text, text, jsonb) from public;
grant execute on function public.toko_atur(text, text, jsonb) to anon, authenticated;


-- 3) Cek hasil: daftar pengaturan yang sekarang TERKUNCI dari web (hanya admin).
--    Bila ada fitur web (bukan admin) yang ternyata perlu menulis salah satunya,
--    kabari supaya dibuatkan jalur aman lewat fungsi server.
select key as terkunci_hanya_admin
  from public.store_settings
 where not public.ks_boleh_web(key)
 order by key;
