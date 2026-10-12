-- =====================================================================
-- Kalensari Store • NIK kurir (wajib, hanya admin yang bisa membaca)
-- Jalankan SETELAH supabase-keamanan-pengaturan.sql dan supabase-foto-aman.sql.
-- Supabase > SQL Editor > New query > Run. Aman dijalankan berulang kali.
--
-- NIK disimpan di store_settings, kunci "kurir_nik" = {"<id kurir>": {"nik":"16 angka","t":ms}}.
--   * TIDAK bisa dibaca dari web (pembeli, penjual, kurir lain): hanya admin yang login.
--   * TIDAK bisa ditulis langsung dari web: kurir mengisi lewat fungsi kurir_nik_simpan (pakai sesi login kurir).
--   * Sekali tersimpan, kurir tidak bisa mengubahnya sendiri (admin bisa mereset di menu kurir).
--   * Satu NIK hanya boleh dipakai satu akun kurir.
-- Foto profil kurir memakai fungsi foto_simpan yang sudah ada (supabase-foto-aman.sql).
--
-- Untuk membatalkan: drop function public.kurir_nik_simpan(text, text);
--                    drop function public.kurir_nik_saya(text);
--                    delete from public.store_settings where key = 'kurir_nik';   -- menghapus semua NIK
-- =====================================================================

-- 1) Kunci "kurir_nik" tertutup untuk web (admin & fungsi server tetap bisa)
drop policy if exists "ks_rahasia_nik_sel" on public.store_settings;
create policy "ks_rahasia_nik_sel" on public.store_settings as restrictive for select to anon, authenticated
  using (key <> 'kurir_nik' or public.is_admin());
drop policy if exists "ks_rahasia_nik_ins" on public.store_settings;
create policy "ks_rahasia_nik_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key <> 'kurir_nik' or public.is_admin());
drop policy if exists "ks_rahasia_nik_upd" on public.store_settings;
create policy "ks_rahasia_nik_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key <> 'kurir_nik' or public.is_admin()) with check (key <> 'kurir_nik' or public.is_admin());
drop policy if exists "ks_rahasia_nik_del" on public.store_settings;
create policy "ks_rahasia_nik_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key <> 'kurir_nik' or public.is_admin());

-- 2) Kurir menyimpan NIK sendiri
create or replace function public.kurir_nik_simpan(p_sesi text, p_nik text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_wa text; v_id text; nik text := regexp_replace(coalesce(p_nik, ''), '\D', '', 'g');
  ada jsonb; e record; ts bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'kurir');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'kurir_accounts';
  if coalesce(v_id, '') = '' then raise exception 'Akun kurir tidak ditemukan'; end if;

  -- bentuk NIK: 16 angka, kode provinsi 11-92, tanggal lahir (perempuan +40) & bulan masuk akal, bukan angka kembar
  if nik !~ '^\d{16}$' then raise exception 'NIK harus 16 angka'; end if;
  if nik ~ '^(\d)\1{15}$' or substr(nik, 1, 2)::int not between 11 and 92
     or substr(nik, 9, 2)::int not between 1 and 12
     or not (substr(nik, 7, 2)::int between 1 and 31 or substr(nik, 7, 2)::int between 41 and 71) then
    raise exception 'NIK tidak valid. Periksa kembali sesuai KTP';
  end if;

  insert into public.store_settings (key, value) values ('kurir_nik', '{}'::jsonb) on conflict (key) do nothing;
  select value into ada from public.store_settings where key = 'kurir_nik' for update;
  if jsonb_typeof(ada) <> 'object' then ada := '{}'::jsonb; end if;

  for e in select key as k, value as v from jsonb_each(ada) loop
    if e.k <> v_id and e.v->>'nik' = nik then
      raise exception 'NIK ini sudah terdaftar pada akun kurir lain. Hubungi admin bila ini kesalahan';
    end if;
  end loop;
  if ada ? v_id and coalesce(ada->v_id->>'nik', '') <> '' and ada->v_id->>'nik' <> nik then
    raise exception 'NIK sudah tersimpan dan tidak bisa diubah sendiri. Hubungi admin';
  end if;

  ada := ada || jsonb_build_object(v_id, jsonb_build_object('nik', nik, 't', ts));
  update public.store_settings set value = ada where key = 'kurir_nik';

  -- tandai di data kurir (dibaca aplikasi kurir untuk membuka tombol "siap antar")
  update public.store_settings
     set value = (select coalesce(jsonb_agg(case when jsonb_typeof(x) = 'object' and x->>'id' = v_id
                                                 then x || '{"nikOk":true}'::jsonb else x end), '[]'::jsonb)
                    from jsonb_array_elements(value) x)
   where key = 'kurir_members' and jsonb_typeof(value) = 'array';

  return jsonb_build_object('ok', true, 'nik_samar', repeat('*', 12) || right(nik, 4));
end $$;
revoke all on function public.kurir_nik_simpan(text, text) from public;
grant execute on function public.kurir_nik_simpan(text, text) to anon, authenticated;

-- 3) Kurir mengecek apakah NIK-nya sudah ada (hanya 4 angka terakhir yang dikembalikan)
create or replace function public.kurir_nik_saya(p_sesi text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v_wa text; v_id text; nik text;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'kurir');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'kurir_accounts';
  select s.value->v_id->>'nik' into nik from public.store_settings s where s.key = 'kurir_nik' and jsonb_typeof(s.value) = 'object';
  return jsonb_build_object('ok', true, 'ada', coalesce(nik, '') <> '',
                            'nik_samar', case when coalesce(nik, '') = '' then null else repeat('*', 12) || right(nik, 4) end);
end $$;
revoke all on function public.kurir_nik_saya(text) from public;
grant execute on function public.kurir_nik_saya(text) to anon, authenticated;

-- Cek: keduanya harus true
select exists (select 1 from pg_proc where proname = 'kurir_nik_simpan') as fungsi_simpan_ada,
       exists (select 1 from pg_proc where proname = 'kurir_nik_saya')   as fungsi_cek_ada;
