-- =====================================================================
-- Kalensari Store • AKUN PEDAGANG PASAR MALAM JUM'AT
--   * Akun pedagang Pasar Malam mendapat ID sendiri: PM0001, PM0002, ...
--     (akun penjual biasa tetap PJ0001, ...)
--   * Masuk bisa memakai nomor WhatsApp atau ID PMxxxx.
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-id-tanpa-strip.sql.
-- =====================================================================

-- 1) ID akun baru: PM untuk pedagang Pasar Malam (tanda "pasarMalam": true di penjual_members)
create or replace function public.ks_isi_id_akun()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare awal text := public.ks_awalan_id(new.key); aw text; hasil jsonb := '[]'::jsonb; el jsonb; lama text; n integer;
begin
  if awal is null or jsonb_typeof(new.value) <> 'array' then return new; end if;
  for el in
    select e from jsonb_array_elements(new.value) with ordinality as x(e, i)
    order by i
  loop
    if jsonb_typeof(el) = 'object' and coalesce(el->>'kode', '') = '' and coalesce(el->>'id', '') <> '' then
      lama := null;
      if tg_op = 'UPDATE' and jsonb_typeof(old.value) = 'array' then   -- pertahankan ID yang sudah ada
        select o->>'kode' into lama from jsonb_array_elements(old.value) o
         where o->>'id' = el->>'id' and coalesce(o->>'kode', '') <> '' limit 1;
      end if;
      if lama is null then
        aw := case when new.key = 'penjual_members' and coalesce(el->>'pasarMalam', '') = 'true' then 'PM' else awal end;
        insert into public.akun_nomor (peran, terakhir) values (aw, 1)
        on conflict (peran) do update set terakhir = public.akun_nomor.terakhir + 1
        returning terakhir into n;
        lama := aw || lpad(n::text, 4, '0');
      end if;
      el := el || jsonb_build_object('kode', replace(lama, '-', ''));
    end if;
    hasil := hasil || jsonb_build_array(el);
  end loop;
  new.value := hasil;
  return new;
end;
$$;

-- 2) Masuk dengan ID: penjual menerima PJxxxx dan PMxxxx
create or replace function public.ks_id_ke_wa(p_peran text, p_kode text)
returns text language plpgsql stable security definer set search_path = public as $$
declare m text := upper(regexp_replace(coalesce(p_kode, ''), '[\s-]', '', 'g')); awal text; mid text; v_wa text;
begin
  awal := case p_peran when 'pembeli' then 'PB' when 'penjual' then 'PJ' when 'kurir' then 'KR' when 'jasa' then 'JS' end;
  if p_peran = 'penjual' and m ~ '^PM[0-9]{1,6}$' then awal := 'PM'; end if;
  if m !~ ('^' || awal || '[0-9]{1,6}$') then return null; end if;
  m := awal || lpad(regexp_replace(m, '\D', '', 'g')::int::text, 4, '0');
  select x->>'id' into mid from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = p_peran || '_members' and replace(upper(x->>'kode'), '-', '') = m limit 1;
  if mid is null then return ''; end if;
  select e.key into v_wa from public.store_settings s, jsonb_each(case when jsonb_typeof(s.value) = 'object' then s.value else '{}'::jsonb end) e
   where s.key = p_peran || '_accounts' and e.value->>'id' = mid limit 1;
  return coalesce(v_wa, '');
end $$;
revoke all on function public.ks_id_ke_wa(text, text) from public, anon, authenticated;

-- 3) Pedagang Pasar Malam yang sudah terlanjur mendapat ID PJ (daftar sebelum SQL ini) dipindah ke PM
do $$
declare arr jsonb; hasil jsonb := '[]'::jsonb; el jsonb; n integer;
begin
  select value into arr from public.store_settings where key = 'penjual_members' for update;
  if arr is null or jsonb_typeof(arr) <> 'array' then return; end if;
  for el in select e from jsonb_array_elements(arr) with ordinality as x(e, i) order by i loop
    if jsonb_typeof(el) = 'object' and coalesce(el->>'pasarMalam', '') = 'true' and coalesce(el->>'kode', '') !~ '^PM' then
      insert into public.akun_nomor (peran, terakhir) values ('PM', 1)
      on conflict (peran) do update set terakhir = public.akun_nomor.terakhir + 1
      returning terakhir into n;
      el := el || jsonb_build_object('kode', 'PM' || lpad(n::text, 4, '0'));
    end if;
    hasil := hasil || jsonb_build_array(el);
  end loop;
  update public.store_settings set value = hasil where key = 'penjual_members' and value is distinct from hasil;
end $$;

-- Cek: daftar pedagang Pasar Malam beserta ID-nya
select x->>'kode' as id_akun, x->>'toko' as lapak, x->>'nama' as pemilik, coalesce((x->>'pending')::boolean, false) as menunggu
  from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
 where s.key = 'penjual_members' and coalesce(x->>'pasarMalam', '') = 'true';
