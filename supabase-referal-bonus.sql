-- =====================================================================
-- KALENSARI STORE • Bonus referal toko (QR toko)
--   * Penjual : +Rp2.000 saldo penjualan untuk setiap pembeli BARU yang daftar lewat kode/QR tokonya
--   * Pembeli : tidak ada bonus tambahan; tetap hanya 1 voucher selamat datang (supabase-voucher-sambut.sql)
-- Jalankan SEKALI di Supabase > SQL Editor > Run. Aman dijalankan ulang.
-- Jalankan SETELAH: supabase-referal-toko.sql
-- Nilai bisa diubah admin tanpa edit kode:
--   insert into store_settings(key,value) values ('referal_toko_bonus','{"aktif":true,"penjual":2000}')
--   on conflict (key) do update set value = excluded.value;
-- =====================================================================

alter table public.toko_referal add column if not exists bonus_penjual integer not null default 0;

-- Hanya admin yang boleh mengubah aturan bonus
drop policy if exists "ks_kunci_referal_ins" on public.store_settings;
create policy "ks_kunci_referal_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key <> 'referal_toko_bonus' or public.is_admin());
drop policy if exists "ks_kunci_referal_upd" on public.store_settings;
create policy "ks_kunci_referal_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key <> 'referal_toko_bonus' or public.is_admin()) with check (key <> 'referal_toko_bonus' or public.is_admin());
drop policy if exists "ks_kunci_referal_del" on public.store_settings;
create policy "ks_kunci_referal_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key <> 'referal_toko_bonus' or public.is_admin());

create or replace function public.ks_referal_bonus()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('aktif', true, 'penjual', 2000)
         || coalesce((select value from public.store_settings where key = 'referal_toko_bonus'), '{}'::jsonb)
$$;
revoke all on function public.ks_referal_bonus() from public, anon, authenticated;

create or replace function public.catat_referal_toko(p_wa text, p_pin text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  kode text := regexp_replace(upper(coalesce(p_kode, '')), '[^A-Z0-9]', '', 'g');
  arr jsonb; acc jsonb; m jsonb; pid text; pwa text; nm text; kd text;
  b jsonb := public.ks_referal_bonus(); bj int := 0;
begin
  if not public.ks_pin_pembeli_ok(p_wa, p_pin) then raise exception 'PIN salah'; end if;
  if kode !~ '^[A-Z]{2}[0-9]{1,6}$' then
    return jsonb_build_object('ok', false, 'pesan', 'Kode toko tidak valid');
  end if;

  select value into arr from public.store_settings where key = 'penjual_members';
  if arr is null or jsonb_typeof(arr) <> 'array' then
    return jsonb_build_object('ok', false, 'pesan', 'Kode toko tidak ditemukan');
  end if;
  select x into m from jsonb_array_elements(arr) x
   where regexp_replace(upper(coalesce(x->>'kode', '')), '[^A-Z0-9]', '', 'g') = kode limit 1;
  if m is null then return jsonb_build_object('ok', false, 'pesan', 'Kode toko tidak ditemukan'); end if;

  pid := m->>'id'; kd := m->>'kode';
  nm := coalesce(nullif(m->>'toko', ''), nullif(m->>'usaha', ''), m->>'nama');

  select value into acc from public.store_settings where key = 'penjual_accounts';
  if acc is not null and jsonb_typeof(acc) = 'object' then
    select e.key into pwa from jsonb_each(acc) e where e.value->>'id' = pid limit 1;
  end if;
  if pwa is not null and pwa = p_wa then
    return jsonb_build_object('ok', false, 'pesan', 'Tidak bisa memakai kode toko sendiri');
  end if;

  if coalesce((b->>'aktif')::boolean, true) then
    bj := greatest(coalesce((b->>'penjual')::int, 2000), 0);
  end if;

  insert into public.toko_referal (kode_toko, penjual_id, nama_toko, wa_pembeli, bonus_penjual)
  values (kd, pid, nm, p_wa, bj) on conflict (wa_pembeli) do nothing;

  return jsonb_build_object('ok', true, 'toko', nm);
end $$;
grant execute on function public.catat_referal_toko(text, text, text) to anon, authenticated;

-- Total bonus referal satu toko (angka saja) -> ditambahkan ke Saldo Penjualan di aplikasi penjual
create or replace function public.bonus_referal_toko(p_kode text)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(bonus_penjual), 0)::int from public.toko_referal
   where regexp_replace(upper(kode_toko), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(coalesce(p_kode, '')), '[^A-Z0-9]', '', 'g')
$$;
grant execute on function public.bonus_referal_toko(text) to anon, authenticated;

-- Cek
select public.ks_referal_bonus() as aturan_bonus;
