-- =====================================================================
-- KALENSARI STORE • KABAR DESA: penulis tambahan + masa tayang bawaan
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-tahap2a.sql & supabase-otp-pembeli.sql (sudah terpasang).
--
--  store_settings "kabar_penulis" : [{wa, nama, ket}]  daftar akun pembeli yang boleh menulis kabar
--                                    (perangkat desa, RT, dll.). RAHASIA: hanya admin yang bisa baca/ubah.
--  store_settings "kabar_aturan"  : {hari: 7}  masa tayang bawaan kabar (hari). Diatur admin.
--  store_settings "kabar_desa"    : daftar kabar (tetap seperti sebelumnya, hanya admin & fungsi server
--                                    yang bisa menulis).
--
--  Fungsi untuk penulis (dipakai dashboard pembeli lewat harian.js):
--    kabar_saya(p_sesi)                        -> {penulis, hari, kabar:[kabar milik penulis]}
--    kabar_tulis(p_sesi, p_kabar, p_foto)      -> terbitkan / ubah kabar milik sendiri
--    kabar_hapus(p_sesi, p_id)                 -> hapus kabar milik sendiri
-- =====================================================================

-- 1) "kabar_penulis" berisi nomor WA -> tertutup untuk web (admin & fungsi server tetap bisa)
drop policy if exists "ks_rahasia_kabar_sel" on public.store_settings;
create policy "ks_rahasia_kabar_sel" on public.store_settings as restrictive for select to anon, authenticated
  using (key <> 'kabar_penulis' or public.is_admin());
drop policy if exists "ks_rahasia_kabar_ins" on public.store_settings;
create policy "ks_rahasia_kabar_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key <> 'kabar_penulis' or public.is_admin());
drop policy if exists "ks_rahasia_kabar_upd" on public.store_settings;
create policy "ks_rahasia_kabar_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key <> 'kabar_penulis' or public.is_admin()) with check (key <> 'kabar_penulis' or public.is_admin());
drop policy if exists "ks_rahasia_kabar_del" on public.store_settings;
create policy "ks_rahasia_kabar_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key <> 'kabar_penulis' or public.is_admin());

-- 2) Pembantu
create or replace function public.ks_kabar_hari()
returns integer language sql stable security definer set search_path = public as $$
  select greatest(1, least(90, coalesce(nullif(regexp_replace(coalesce(
    (select value->>'hari' from public.store_settings where key = 'kabar_aturan'), ''), '\D', '', 'g'), '')::int, 7)))
$$;
revoke all on function public.ks_kabar_hari() from public;
grant execute on function public.ks_kabar_hari() to anon, authenticated;

-- penulis yang sedang masuk: {wa, nama, ket} atau null
create or replace function public.ks_kabar_penulis(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_sesi_wa(p_sesi, 'pembeli');
begin
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  return (select x from public.store_settings s, jsonb_array_elements(
            case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
           where s.key = 'kabar_penulis' and public.ks_wa(x->>'wa') = v_wa limit 1);
end $$;
revoke all on function public.ks_kabar_penulis(text) from public, anon, authenticated;

-- penanda pemilik kabar (tidak membuka nomor WA ke publik)
create or replace function public.ks_kabar_pemilik(p_wa text)
returns text language sql immutable set search_path = public, extensions as $$
  select 'p' || left(encode(extensions.digest('kabar:' || p_wa, 'sha256'), 'hex'), 16)
$$;
revoke all on function public.ks_kabar_pemilik(text) from public, anon, authenticated;

-- 3) Untuk dashboard pembeli: apakah saya penulis? + kabar milik saya
create or replace function public.kabar_saya(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p jsonb := public.ks_kabar_penulis(p_sesi); v_pid text;
begin
  if p is null then return jsonb_build_object('penulis', false); end if;
  v_pid := public.ks_kabar_pemilik(public.ks_wa(p->>'wa'));
  return jsonb_build_object('penulis', true, 'nama', p->>'nama', 'ket', p->>'ket', 'hari', public.ks_kabar_hari(),
    'kabar', coalesce((select jsonb_agg(x order by (x->>'t')::bigint desc) from public.store_settings s,
                         jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
                        where s.key = 'kabar_desa' and x->>'pid' = v_pid), '[]'::jsonb));
end $$;
revoke all on function public.kabar_saya(text) from public;
grant execute on function public.kabar_saya(text) to anon, authenticated;

-- 4) Terbitkan / ubah kabar milik sendiri
--    p_kabar = {id?, ikon, judul, isi, link, tombol, sampai?}   p_foto = data:image... | 'hapus' | null (tidak berubah)
create or replace function public.kabar_tulis(p_sesi text, p_kabar jsonb, p_foto text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p jsonb := public.ks_kabar_penulis(p_sesi);
  v_wa text; v_pid text; v_id text; lama jsonb; rec jsonb; daftar jsonb; n_hari int;
  v_judul text; v_isi text; v_link text; v_sampai text; v_maks text; v_foto boolean; v_now bigint;
begin
  if p is null then raise exception 'Akun Anda belum diberi izin menulis Kabar Desa. Hubungi admin.'; end if;
  v_wa  := public.ks_wa(p->>'wa');
  v_pid := public.ks_kabar_pemilik(v_wa);
  perform pg_advisory_xact_lock(hashtext('ks_kabar_desa'));

  v_judul := left(btrim(coalesce(p_kabar->>'judul', '')), 80);
  v_isi   := left(btrim(coalesce(p_kabar->>'isi', '')), 1500);
  v_link  := left(btrim(coalesce(p_kabar->>'link', '')), 300);
  if v_judul = '' then raise exception 'Judul kabar wajib diisi.'; end if;
  if v_link ~* '^\s*javascript:' then v_link := ''; end if;

  select case when jsonb_typeof(value) = 'array' then value else '[]'::jsonb end into daftar
    from public.store_settings where key = 'kabar_desa';
  daftar := coalesce(daftar, '[]'::jsonb);
  v_now := (extract(epoch from now()) * 1000)::bigint;

  v_id := nullif(regexp_replace(coalesce(p_kabar->>'id', ''), '[^A-Za-z0-9_-]', '', 'g'), '');
  if v_id is not null then
    select x into lama from jsonb_array_elements(daftar) x where x->>'id' = v_id limit 1;
    if lama is null or coalesce(lama->>'pid', '') <> v_pid then raise exception 'Kabar ini bukan milik Anda.'; end if;
  else
    -- batas: 5 kabar baru per penulis per hari
    if (select count(*) from jsonb_array_elements(daftar) x
         where x->>'pid' = v_pid and (x->>'t')::bigint > v_now - 86400000) >= 5 then
      raise exception 'Batas 5 kabar per hari sudah tercapai. Coba lagi besok.';
    end if;
    v_id := 'k' || to_hex(v_now) || substr(md5(random()::text), 1, 4);
  end if;

  -- masa tayang: bawaan N hari (diatur admin); penulis boleh memilih lebih singkat, tidak lebih lama
  n_hari := public.ks_kabar_hari();
  v_maks := to_char(public.ks_hari_ini() + n_hari, 'YYYY-MM-DD');
  v_sampai := coalesce(nullif(p_kabar->>'sampai', ''), lama->>'sampai', v_maks);
  if v_sampai !~ '^\d{4}-\d{2}-\d{2}$' or v_sampai > v_maks then v_sampai := v_maks; end if;
  if v_sampai < to_char(public.ks_hari_ini(), 'YYYY-MM-DD') then v_sampai := to_char(public.ks_hari_ini(), 'YYYY-MM-DD'); end if;

  -- foto (disimpan terpisah seperti kabar dari admin)
  v_foto := coalesce((lama->>'foto')::boolean, false);
  if p_foto = 'hapus' then
    delete from public.store_settings where key = 'foto_kabar_' || v_id; v_foto := false;
  elsif p_foto is not null and p_foto ~ '^data:image/(jpeg|png|webp);base64,' then
    if length(p_foto) > 700000 then raise exception 'Foto terlalu besar.'; end if;
    insert into public.store_settings (key, value) values ('foto_kabar_' || v_id, jsonb_build_object('foto', p_foto, 't', v_now))
    on conflict (key) do update set value = excluded.value;
    v_foto := true;
  end if;

  rec := coalesce(lama, '{}'::jsonb) || jsonb_build_object(
    'id', v_id, 'ikon', left(coalesce(nullif(p_kabar->>'ikon', ''), '📢'), 8), 'judul', v_judul, 'isi', v_isi,
    'link', v_link, 'tombol', left(btrim(coalesce(p_kabar->>'tombol', '')), 30), 'sampai', v_sampai,
    'foto', v_foto, 'pid', v_pid, 'oleh', btrim(coalesce(p->>'nama', '') || case when coalesce(p->>'ket', '') <> '' then ' · ' || (p->>'ket') else '' end),
    't', coalesce((lama->>'t')::bigint, v_now), 'ubah', v_now);

  daftar := jsonb_build_array(rec) || coalesce((select jsonb_agg(x) from jsonb_array_elements(daftar) x where x->>'id' <> v_id), '[]'::jsonb);
  -- simpan maks. 60 kabar terbaru
  daftar := coalesce((select jsonb_agg(x) from (select x from jsonb_array_elements(daftar) with ordinality a(x, i) order by i limit 60) z), '[]'::jsonb);
  insert into public.store_settings (key, value) values ('kabar_desa', daftar)
  on conflict (key) do update set value = excluded.value;
  return rec;
end $$;
revoke all on function public.kabar_tulis(text, jsonb, text) from public;
grant execute on function public.kabar_tulis(text, jsonb, text) to anon, authenticated;

-- 5) Hapus kabar milik sendiri
create or replace function public.kabar_hapus(p_sesi text, p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare p jsonb := public.ks_kabar_penulis(p_sesi); v_pid text; daftar jsonb;
begin
  if p is null then raise exception 'Akun Anda belum diberi izin menulis Kabar Desa.'; end if;
  v_pid := public.ks_kabar_pemilik(public.ks_wa(p->>'wa'));
  perform pg_advisory_xact_lock(hashtext('ks_kabar_desa'));
  select value into daftar from public.store_settings where key = 'kabar_desa';
  if not exists (select 1 from jsonb_array_elements(coalesce(daftar, '[]'::jsonb)) x where x->>'id' = p_id and x->>'pid' = v_pid) then
    raise exception 'Kabar ini bukan milik Anda.';
  end if;
  update public.store_settings set value = coalesce((select jsonb_agg(x) from jsonb_array_elements(daftar) x where x->>'id' <> p_id), '[]'::jsonb)
   where key = 'kabar_desa';
  delete from public.store_settings where key = 'foto_kabar_' || p_id;
  return true;
end $$;
revoke all on function public.kabar_hapus(text, text) from public;
grant execute on function public.kabar_hapus(text, text) to anon, authenticated;

-- 6) Masa tayang bawaan 7 hari (bila admin belum pernah mengatur)
insert into public.store_settings (key, value) values ('kabar_aturan', '{"hari": 7}'::jsonb)
on conflict (key) do nothing;

-- Cek: semua harus true
select exists (select 1 from pg_proc where proname = 'kabar_tulis')   as fungsi_tulis,
       exists (select 1 from pg_proc where proname = 'kabar_saya')    as fungsi_saya,
       exists (select 1 from pg_policy where polname = 'ks_rahasia_kabar_sel') as penulis_rahasia,
       public.ks_kabar_hari() between 1 and 90                         as masa_tayang;
