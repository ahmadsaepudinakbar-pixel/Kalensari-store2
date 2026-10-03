-- =====================================================================
-- KALENSARI STORE - Kode serah terima pesanan & laporan "belum diterima"
-- Jalankan SEKALI di Supabase > SQL Editor (setelah supabase-notifikasi.sql).
-- Aman dijalankan ulang. Tidak berisi kode rahasia.
-- =====================================================================

-- 1) Kode serah terima disimpan dalam bentuk acak (hash), tidak bisa dibaca dari luar
create table if not exists public.order_kode (
  order_code text primary key,
  h          text not null,
  coba       integer not null default 0,
  t          timestamptz not null default now()
);
alter table public.order_kode enable row level security;   -- tanpa policy: tertutup

-- 2) Dipanggil HP pembeli tepat setelah memesan (hanya sekali, maks. 15 menit setelah pesanan dibuat)
create or replace function public.simpan_kode_pesanan(p_code text, p_kode text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kode !~ '^[0-9]{4}$' then return false; end if;
  if not exists (select 1 from public.orders
                  where order_code = p_code and created_at > now() - interval '15 minutes') then
    return false;
  end if;
  insert into public.order_kode (order_code, h)
  values (p_code, encode(sha256(convert_to(p_code || ':' || p_kode, 'UTF8')), 'hex'))
  on conflict (order_code) do nothing;
  return found;
end;
$$;
revoke all on function public.simpan_kode_pesanan(text, text) from public;
grant execute on function public.simpan_kode_pesanan(text, text) to anon, authenticated;

-- 3) Dipanggil HP kurir saat menyerahkan pesanan. Maks. 5x salah, lalu terkunci.
--    Hasil: 'ok' | 'salah:<sisa>' | 'terkunci' | 'tanpa-kode'
create or replace function public.cek_kode_pesanan(p_code text, p_kode text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare r public.order_kode%rowtype;
begin
  select * into r from public.order_kode where order_code = p_code for update;
  if not found then return 'tanpa-kode'; end if;
  if r.coba >= 5 then return 'terkunci'; end if;
  if r.h = encode(sha256(convert_to(p_code || ':' || coalesce(p_kode, ''), 'UTF8')), 'hex') then
    return 'ok';
  end if;
  update public.order_kode set coba = coba + 1 where order_code = p_code;
  if r.coba + 1 >= 5 then return 'terkunci'; end if;
  return 'salah:' || (5 - r.coba - 1);
end;
$$;
revoke all on function public.cek_kode_pesanan(text, text) from public;
grant execute on function public.cek_kode_pesanan(text, text) to anon, authenticated;

-- 4) Laporan "Belum saya terima" langsung memberi tahu admin
drop trigger if exists ks_notif_settings on public.store_settings;
create trigger ks_notif_settings
  after insert or update on public.store_settings
  for each row when (new.key like 'kurir\_ord\_%' or new.key like 'laporan\_%'
                     or new.key in ('kurir_members', 'penjual_members', 'jasa_members'))
  execute function public.notif_colek();

-- Cek: harus menampilkan true, true, true
select exists (select 1 from pg_proc where proname = 'simpan_kode_pesanan') as simpan_kode,
       exists (select 1 from pg_proc where proname = 'cek_kode_pesanan')    as cek_kode,
       exists (select 1 from pg_trigger where tgname = 'ks_notif_settings') as notif_laporan;
