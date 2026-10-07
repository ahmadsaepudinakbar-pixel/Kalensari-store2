-- =====================================================================
-- Kalensari Store • Langganan notifikasi HP lewat server
-- Jalankan SETELAH supabase-foto-aman.sql. Aman dijalankan berulang kali.
--
-- Sebelum: siapa pun bisa menimpa "pembeli_push_<WA>", "penjual_push_<id>",
--          "kurir_push_<id>", "jasa_push_<id>" -> notifikasi orang lain bisa
--          dimatikan atau dibelokkan.
-- Sesudah: hanya pemilik akun yang sedang masuk (sesi sah) yang bisa
--          menambah / menghapus HP-nya sendiri. Pembeli tamu (tanpa akun,
--          mis. pesan ojek) hanya bisa MENAMBAH HP bila nomornya punya
--          pesanan dalam 2 hari terakhir.
-- Admin (admin_push) tetap lewat login admin seperti biasa.
-- =====================================================================

create or replace function public.notif_langganan(
  p_sesi text, p_peran text, p_sub jsonb,
  p_extra jsonb default '{}'::jsonb, p_hapus boolean default false, p_wa text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; k text; lama jsonb; subs jsonb; ep text; w text;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak dikenal'; end if;

  -- langganan dari browser: {endpoint, keys:{p256dh, auth}}
  ep := p_sub->>'endpoint';
  if ep is null or ep !~ '^https://' or length(ep) > 1000 then raise exception 'Data notifikasi tidak valid'; end if;
  if not p_hapus and (length(coalesce(p_sub#>>'{keys,p256dh}', '')) not between 20 and 200
                      or length(coalesce(p_sub#>>'{keys,auth}', '')) not between 8 and 100) then
    raise exception 'Data notifikasi tidak valid';
  end if;

  v_wa := public.ks_sesi_wa(p_sesi, p_peran);
  if p_peran = 'pembeli' then
    if v_wa is null then
      -- pembeli tamu: hanya boleh menambah, nomor tanpa akun, dan ada pesanan baru-baru ini
      w := regexp_replace(coalesce(p_wa, ''), '\D', '', 'g');
      if w like '0%' then w := '62' || substr(w, 2); end if;
      if p_hapus or w !~ '^62\d{8,13}$'
         or coalesce((select s.value ? w from public.store_settings s where s.key = 'pembeli_accounts'), false)
         or not exists (select 1 from public.orders o
                         where o.created_at > now() - interval '2 days'
                           and right(regexp_replace(coalesce(o.customer_phone_normalized, o.customer_phone, ''), '\D', '', 'g'), 10) = right(w, 10)) then
        raise exception 'SESI: Masuk akun pembeli dulu untuk mengatur notifikasi.';
      end if;
      v_wa := w;
    end if;
    k := 'pembeli_push_' || v_wa;
  else
    if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
    select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = p_peran || '_accounts';
    if coalesce(v_id, '') = '' then raise exception 'Akun tidak ditemukan'; end if;
    k := p_peran || '_push_' || v_id;
  end if;

  select value into lama from public.store_settings where key = k;
  if lama is null or jsonb_typeof(lama) <> 'object' then lama := '{}'::jsonb; end if;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into subs
    from jsonb_array_elements(case when jsonb_typeof(lama->'subs') = 'array' then lama->'subs' else '[]'::jsonb end) x
   where x->>'endpoint' is distinct from ep;
  if not p_hapus then
    subs := subs || jsonb_build_array(jsonb_build_object('endpoint', ep,
              'keys', jsonb_build_object('p256dh', p_sub#>>'{keys,p256dh}', 'auth', p_sub#>>'{keys,auth}')));
    -- simpan maksimal 5 HP terakhir
    select coalesce(jsonb_agg(x order by i), '[]'::jsonb) into subs
      from jsonb_array_elements(subs) with ordinality t(x, i)
     where i > jsonb_array_length(subs) - 5;
  end if;

  lama := lama || jsonb_build_object('subs', subs, 't', (extract(epoch from now()) * 1000)::bigint);
  if coalesce(p_extra->>'nama', '') <> '' then lama := lama || jsonb_build_object('nama', left(p_extra->>'nama', 80)); end if;

  insert into public.store_settings (key, value) values (k, lama)
  on conflict (key) do update set value = excluded.value;
  return jsonb_build_object('ok', true, 'key', k, 'jumlah', jsonb_array_length(subs));
end $$;
revoke all on function public.notif_langganan(text, text, jsonb, jsonb, boolean, text) from public;
grant execute on function public.notif_langganan(text, text, jsonb, jsonb, boolean, text) to anon, authenticated;

-- Langganan notifikasi tidak lagi ditulis langsung dari web: keluarkan dari daftar yang boleh.
create or replace function public.ks_boleh_web(k text)
returns boolean language sql immutable as $$
  select k ~ '^(pembeli|penjual|kurir|jasa)_(accounts|members)$'
      or k ~ '^stoklog_'
      or k ~ '^laporan_'
      or k = 'unggulan_toko'
$$;
