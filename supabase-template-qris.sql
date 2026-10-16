-- =====================================================================
-- Kalensari Store • Template QRIS toko tersimpan di AKUN penjual
-- Jalankan di Supabase > SQL Editor > Run. Aman dijalankan berulang kali.
-- Jalankan SETELAH supabase-foto-aman.sql / supabase-keamanan-pengaturan.sql.
--
-- Menyimpan nama toko di poster + gambar QRIS ke store_settings
-- dengan kunci 'qris_tpl_<ID penjual>'. Penulisan hanya lewat fungsi ini
-- (dijaga sesi login penjual), jadi tidak ada penjual yang bisa mengubah
-- template milik toko lain. Pembacaan memakai kebijakan baca yang sama
-- dengan foto toko.
--   p_value = {"nama":"Warung Siti","qris":"data:image/png;base64,..." atau ""}
-- =====================================================================
create or replace function public.template_qris_simpan(p_sesi text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; q text; val jsonb;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then raise exception 'Data template tidak valid'; end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'penjual_accounts';
  if coalesce(v_id, '') = '' then raise exception 'Akun penjual tidak ditemukan'; end if;
  q := coalesce(p_value->>'qris', '');
  if q <> '' and not public.ks_foto_sah(q) then raise exception 'Gambar QRIS harus JPG/PNG/WEBP dan tidak terlalu besar'; end if;
  val := jsonb_build_object('nama', left(coalesce(p_value->>'nama', ''), 40), 'qris', q,
                            't', (extract(epoch from now()) * 1000)::bigint);
  insert into public.store_settings (key, value) values ('qris_tpl_' || v_id, val)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.template_qris_simpan(text, jsonb) from public;
grant execute on function public.template_qris_simpan(text, jsonb) to anon, authenticated;
