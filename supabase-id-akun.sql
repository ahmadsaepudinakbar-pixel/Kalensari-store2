-- =====================================================================
-- KALENSARI STORE - ID akun otomatis (nomor urut per peran)
--   Pembeli PB-0001 • Penjual PJ-0001 • Kurir KR-0001 • Penyedia jasa JS-0001
-- Setiap akun baru otomatis mendapat ID; akun lama diberi ID sekarang
-- (urut dari yang paling lama terdaftar). ID tidak pernah berubah / dipakai ulang.
-- Jalankan SEKALI di Supabase > SQL Editor. Aman dijalankan ulang.
-- =====================================================================
create table if not exists public.akun_nomor (
  peran    text primary key,
  terakhir integer not null default 0
);
alter table public.akun_nomor enable row level security;   -- tertutup dari luar

create or replace function public.ks_awalan_id(p_key text)
returns text
language sql
immutable
as $$
  select case p_key when 'pembeli_members' then 'PB' when 'penjual_members' then 'PJ'
                    when 'kurir_members'   then 'KR' when 'jasa_members'    then 'JS' end
$$;

-- Memberi ID pada setiap anggota yang belum punya (dipanggil trigger di bawah)
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
        lama := awal || '-' || lpad(n::text, 4, '0');
      end if;
      el := el || jsonb_build_object('kode', lama);
    end if;
    hasil := hasil || jsonb_build_array(el);
  end loop;
  new.value := hasil;
  return new;
end;
$$;

drop trigger if exists ks_id_akun on public.store_settings;
create trigger ks_id_akun
  before insert or update on public.store_settings
  for each row when (new.key in ('pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members'))
  execute function public.ks_isi_id_akun();

-- Beri ID untuk akun yang SUDAH ada (urut dari yang paling lama terdaftar)
do $$
declare k text; arr jsonb; urut jsonb;
begin
  foreach k in array array['pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members'] loop
    select value into arr from public.store_settings where key = k;
    if arr is null or jsonb_typeof(arr) <> 'array' then continue; end if;
    -- urutkan sementara berdasarkan waktu daftar agar nomor kecil = anggota lama
    select coalesce(jsonb_agg(e order by coalesce((e->>'joined')::numeric, (e->>'t')::numeric, (e->>'updated')::numeric, 9e15), i), '[]'::jsonb)
      into urut from jsonb_array_elements(arr) with ordinality as x(e, i);
    update public.store_settings set value = urut where key = k;      -- trigger mengisi ID yang kosong
    -- kembalikan ke urutan semula (ID tetap)
    update public.store_settings s set value = (
      select coalesce(jsonb_agg(coalesce((select u from jsonb_array_elements(s.value) u where u->>'id' = e->>'id' limit 1), e) order by i), '[]'::jsonb)
        from jsonb_array_elements(arr) with ordinality as x(e, i))
     where key = k;
  end loop;
end $$;

-- Cek: daftar ID yang sudah dibuat per peran
select key as peran, count(*) filter (where e ? 'kode') as punya_id, count(*) as total
  from public.store_settings, jsonb_array_elements(value) e
 where key in ('pembeli_members', 'penjual_members', 'kurir_members', 'jasa_members')
 group by key order by key;
