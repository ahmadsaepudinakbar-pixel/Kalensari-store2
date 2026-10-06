-- =====================================================================
-- KALENSARI STORE • ID akun tanpa tanda strip
--   PB-0001 -> PB0001 • PJ-0001 -> PJ0001 • KR-0001 -> KR0001 • JS-0001 -> JS0001
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-id-akun.sql, supabase-keamanan-akun.sql, supabase-keamanan-tahap2a.sql
-- (dan supabase-ajak-cair-otp.sql bila dipakai).
--
--  * ID akun BARU dibuat tanpa strip.
--  * ID akun LAMA diubah tanpa strip (nomornya tetap sama).
--  * Masuk / kode ajak tetap menerima ketikan lama "PB-0001", "pb 1", dll.
-- =====================================================================

-- 1) ID baru tanpa strip (isi sama dengan supabase-id-akun.sql, hanya format ID yang berubah)
create or replace function public.ks_isi_id_akun()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare awal text := public.ks_awalan_id(new.key); hasil jsonb := '[]'::jsonb; el jsonb; lama text; n integer;
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
        insert into public.akun_nomor (peran, terakhir) values (awal, 1)
        on conflict (peran) do update set terakhir = public.akun_nomor.terakhir + 1
        returning terakhir into n;
        lama := awal || lpad(n::text, 4, '0');
      end if;
      el := el || jsonb_build_object('kode', replace(lama, '-', ''));
    end if;
    hasil := hasil || jsonb_build_array(el);
  end loop;
  new.value := hasil;
  return new;
end;
$$;

-- 2) Ubah ID lama: buang tanda strip
update public.store_settings s
   set value = (select coalesce(jsonb_agg(case when jsonb_typeof(e) = 'object' and e ? 'kode'
                                               then e || jsonb_build_object('kode', replace(e->>'kode', '-', ''))
                                               else e end order by i), '[]'::jsonb)
                  from jsonb_array_elements(s.value) with ordinality as x(e, i))
 where s.key in ('pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members')
   and jsonb_typeof(s.value) = 'array';

-- 3) Cari akun dari ID: terima PB0001 / PB-0001 / pb 1
create or replace function public.ks_id_ke_wa(p_peran text, p_kode text)
returns text language plpgsql stable security definer set search_path = public as $$
declare m text := upper(regexp_replace(coalesce(p_kode, ''), '[\s-]', '', 'g')); awal text; mid text; v_wa text;
begin
  awal := case p_peran when 'pembeli' then 'PB' when 'penjual' then 'PJ' when 'kurir' then 'KR' when 'jasa' then 'JS' end;
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

-- 4) Kode ajak dari dashboard (akun lama): pakai pencarian ID yang sama
create or replace function public.pakai_kode_ajak(p_wa text, p_pin text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_salah text; v jsonb := public.ks_voucher(); kode text := upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'));
        v_peng text; nama text; acc jsonb;
begin
  v_salah := public.ks_cek_pin('pembeli', p_wa, p_pin);
  if v_salah is not null then return jsonb_build_object('ok', false, 'pesan', replace(v_salah, 'Nomor atau PIN salah', 'PIN salah')); end if;
  if coalesce((v->'ajak'->>'aktif')::boolean, true) is not true then raise exception 'Program ajak tetangga sedang tidak aktif'; end if;
  select value into acc from public.store_settings where key = 'pembeli_accounts';
  v_peng := public.ks_id_ke_wa('pembeli', kode);
  if v_peng is null then v_peng := public.ks_wa(kode); end if;
  if v_peng is null or v_peng = '' or not coalesce(acc ? v_peng, false) then raise exception 'Kode tidak ditemukan'; end if;
  select x->>'nama' into nama from public.store_settings s, jsonb_array_elements(s.value) x
   where s.key = 'pembeli_members' and jsonb_typeof(s.value) = 'array' and x->>'id' = acc->v_peng->>'id' limit 1;
  if v_peng = p_wa then raise exception 'Tidak bisa memakai kode sendiri'; end if;
  if exists (select 1 from public.pembeli_ajak where wa = p_wa) then raise exception 'Anda sudah pernah memakai kode ajak'; end if;
  if exists (select 1 from public.pembeli_ajak where pembeli_ajak.wa = v_peng and pembeli_ajak.pengundang = p_wa) then raise exception 'Kode ini tidak bisa dipakai'; end if;
  if exists (select 1 from public.orders where customer_phone_normalized = p_wa and status = 'selesai') then
    raise exception 'Kode ajak hanya untuk pembeli yang belum pernah belanja';
  end if;
  insert into public.pembeli_ajak (wa, pengundang) values (p_wa, v_peng);
  return jsonb_build_object('nama', coalesce(nama, 'teman Anda'), 'bonus', (v->'ajak'->>'baru')::int, 'min', (v->'ajak'->>'min')::int);
end $$;
revoke all on function public.pakai_kode_ajak(text, text, text) from public;
grant execute on function public.pakai_kode_ajak(text, text, text) to anon, authenticated;

-- Cek: kolom "masih_pakai_strip" harus 0
select s.key as peran,
       count(*) filter (where e->>'kode' like '%-%') as masih_pakai_strip,
       min(e->>'kode') as contoh_id
  from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) e
 where s.key in ('pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members')
 group by s.key order by s.key;
