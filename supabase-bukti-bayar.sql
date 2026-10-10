-- =====================================================================
-- BUKTI TRANSFER QRIS WAJIB (jalankan SEKALI di Supabase > SQL Editor, setelah supabase-qris-statis.sql)
--
--  * Pembeli yang bayar QRIS wajib mengunggah foto bukti transfer. Pesanan belum dianggap berhasil sebelum bukti terkirim
--    (tanpa bukti, pembatalan otomatis 15 menit tetap berlaku).
--  * Setelah bukti terkirim: pay_status = 'verifikasi' (menunggu verifikasi admin). Penjual & kurir belum melihatnya
--    sampai admin menekan "Tandai QRIS sudah dibayar".
--  * Foto disimpan di tabel tertutup bukti_bayar: hanya admin yang bisa membaca.
--  * qris_klaim (tombol "sudah bayar" lama) sekarang hanya berlaku bila bukti sudah ada.
--  * Aman dijalankan ulang.
-- =====================================================================

alter table public.orders add column if not exists pay_klaim_at timestamptz;

create table if not exists public.bukti_bayar (
  id          bigserial primary key,
  order_codes text[] not null,
  foto        text not null,
  nominal     integer,
  created_at  timestamptz not null default now()
);
create index if not exists bukti_bayar_codes_idx on public.bukti_bayar using gin (order_codes);
alter table public.bukti_bayar enable row level security;
revoke all on public.bukti_bayar from anon, authenticated;
revoke all on sequence public.bukti_bayar_id_seq from anon, authenticated;
grant select on public.bukti_bayar to authenticated;
drop policy if exists "bukti_bayar_admin_baca" on public.bukti_bayar;
create policy "bukti_bayar_admin_baca" on public.bukti_bayar for select to authenticated using (public.is_admin());

-- Pembeli (tanpa login) mengirim bukti untuk 1 atau beberapa nota (1 QR = beberapa toko)
create or replace function public.bukti_bayar_kirim(p_codes text[], p_foto text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare kode text[]; n integer; tot integer;
begin
  if p_codes is null or array_length(p_codes, 1) is null then raise exception 'Kode pesanan kosong'; end if;
  if p_foto is null or length(p_foto) > 900000 or p_foto !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$' then
    raise exception 'Bukti harus berupa foto (JPG/PNG/WEBP) dan tidak terlalu besar';
  end if;
  select array_agg(o.order_code), coalesce(sum(o.total), 0) into kode, tot
    from public.orders o
   where o.order_code = any(p_codes[1:30])
     and o.payment ilike 'qris%'
     and coalesce(o.pay_status, '') in ('', 'menunggu', 'verifikasi')
     and coalesce(o.status, 'menunggu') in ('menunggu', 'baru')
     and o.created_at > now() - interval '1 hour';
  if kode is null then raise exception 'Pesanan tidak ditemukan atau sudah tidak bisa dibayar. Buat pesanan baru bila waktunya habis.'; end if;
  if (select count(*) from public.bukti_bayar b where b.order_codes && kode) >= 5 then
    raise exception 'Bukti sudah terkirim beberapa kali. Hubungi admin bila ada kendala.';
  end if;
  insert into public.bukti_bayar (order_codes, foto, nominal) values (kode, p_foto, tot);
  update public.orders set pay_status = 'verifikasi', pay_klaim_at = now(), updated_at = now()
   where order_code = any(kode);
  get diagnostics n = row_count;
  return jsonb_build_object('ok', true, 'jumlah', n, 'kode', to_jsonb(kode));
end $$;
revoke all on function public.bukti_bayar_kirim(text[], text) from public;
grant execute on function public.bukti_bayar_kirim(text[], text) to anon, authenticated;

-- "Saya sudah bayar" lama: hanya sah bila bukti transfer sudah diunggah
create or replace function public.qris_klaim(p_codes text[])
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.orders o
     set pay_status = 'verifikasi', pay_klaim_at = now(), updated_at = now()
   where o.order_code = any(p_codes[1:30])
     and o.payment ilike 'qris%'
     and coalesce(o.pay_status, '') in ('', 'menunggu')
     and coalesce(o.status, 'menunggu') in ('menunggu', 'baru')
     and o.created_at > now() - interval '1 hour'
     and exists (select 1 from public.bukti_bayar b where o.order_code = any(b.order_codes));
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.qris_klaim(text[]) from public;
grant execute on function public.qris_klaim(text[]) to anon, authenticated;
