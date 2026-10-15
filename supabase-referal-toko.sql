-- KALENSARI STORE: referal toko (QR toko). Jalankan sekali di Supabase > SQL Editor.
-- Mencatat pembeli baru mendaftar lewat QR / kode toko siapa. Hanya pencatatan (belum ada hadiah).

create table if not exists public.toko_referal (
  id          bigserial primary key,
  kode_toko   text not null,            -- mis. PJ-0012
  penjual_id  text,
  nama_toko   text,
  wa_pembeli  text not null unique,     -- satu pembeli hanya tercatat sekali
  dibuat      timestamptz not null default now()
);
create index if not exists toko_referal_kode_idx on public.toko_referal (kode_toko);
alter table public.toko_referal enable row level security;
revoke all on table public.toko_referal from anon, authenticated;   -- hanya lewat fungsi di bawah / SQL Editor

-- Dipanggil aplikasi setelah akun pembeli berhasil dibuat (PIN diperiksa seperti pakai_kode_ajak)
create or replace function public.catat_referal_toko(p_wa text, p_pin text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  kode text := regexp_replace(upper(coalesce(p_kode, '')), '[^A-Z0-9]', '', 'g');
  arr jsonb; acc jsonb; m jsonb; pid text; pwa text; nm text; kd text;
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

  insert into public.toko_referal (kode_toko, penjual_id, nama_toko, wa_pembeli)
  values (kd, pid, nm, p_wa) on conflict (wa_pembeli) do nothing;
  return jsonb_build_object('ok', true, 'toko', nm);
end $$;
grant execute on function public.catat_referal_toko(text, text, text) to anon, authenticated;

-- Jumlah pembeli yang mendaftar lewat satu kode toko (angka saja, untuk ditampilkan di aplikasi penjual)
create or replace function public.jumlah_referal_toko(p_kode text)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from public.toko_referal
   where regexp_replace(upper(kode_toko), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(coalesce(p_kode, '')), '[^A-Z0-9]', '', 'g')
$$;
grant execute on function public.jumlah_referal_toko(text) to anon, authenticated;

-- Untuk admin (lihat di SQL Editor): rekap per toko
-- select kode_toko, nama_toko, count(*) as pembeli_baru from public.toko_referal group by 1, 2 order by 3 desc;
