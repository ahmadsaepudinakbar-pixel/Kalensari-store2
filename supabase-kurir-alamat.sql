-- =====================================================================
-- Kalensari Store • Alamat domisili kurir (rahasia, hanya admin yang bisa membaca)
-- Jalankan SETELAH supabase-kurir-nik.sql. Supabase > SQL Editor > New query > Run. Aman diulang.
--
-- Alamat disimpan di store_settings kunci "kurir_nik" (kunci yang sudah TERTUTUP untuk web,
-- lihat supabase-kurir-nik.sql) pada record kurir: {"<id kurir>": {"nik":"..","alamat":"..","t":ms}}.
-- Daftar kurir (kurir_members) terbaca publik, karena itu alamat TIDAK disimpan di sana.
--
-- Untuk membatalkan: drop function public.kurir_alamat_simpan(text, text);
-- =====================================================================
create or replace function public.kurir_alamat_simpan(p_sesi text, p_alamat text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; al text := left(btrim(coalesce(p_alamat, '')), 200); ada jsonb;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'kurir');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'kurir_accounts';
  if coalesce(v_id, '') = '' then raise exception 'Akun kurir tidak ditemukan'; end if;
  if length(al) < 10 then raise exception 'Alamat domisili terlalu pendek'; end if;

  insert into public.store_settings (key, value) values ('kurir_nik', '{}'::jsonb) on conflict (key) do nothing;
  select value into ada from public.store_settings where key = 'kurir_nik' for update;
  if jsonb_typeof(ada) <> 'object' then ada := '{}'::jsonb; end if;
  ada := jsonb_set(ada, array[v_id], coalesce(ada->v_id, '{}'::jsonb) || jsonb_build_object('alamat', al), true);
  update public.store_settings set value = ada where key = 'kurir_nik';
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.kurir_alamat_simpan(text, text) from public;
grant execute on function public.kurir_alamat_simpan(text, text) to anon, authenticated;

select exists (select 1 from pg_proc where proname = 'kurir_alamat_simpan') as fungsi_alamat_ada;
