-- =====================================================================
-- KALENSARI STORE • NOTIF WHATSAPP KE PENJUAL + TERIMA OTOMATIS 10 MENIT
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman diulang.
-- Jalankan SETELAH supabase-praorder.sql (file ini menggantikan job 'ks-auto-tolak-pesanan').
--
-- Aturan:
--  1) Begitu pesanan SAMPAI ke toko, penjual dapat pesan WhatsApp (lewat Fonnte):
--       * COD  : saat pesanan dibuat (COD pertama: setelah admin konfirmasi)
--       * QRIS : setelah LUNAS (penjual tidak dapat notif sebelum dibayar)
--     Tiap nota hanya dikirimi 1x (orders.wa_penjual_at).
--  2) Penjual tidak menanggapi 10 menit -> pesanan OTOMATIS DITERIMA (status Diproses,
--     orders.auto_terima_at diisi) lalu langsung ditawarkan ke kurir seperti biasa.
--     Bila toko ternyata tutup, kurir tetap bisa memakai tombol "Toko tutup" seperti biasa.
--  3) Tetap seperti dulu:
--       * PRAORDER : tidak diterima otomatis; toko punya 12 jam, lewat itu batal.
--       * QRIS yang BELUM dibayar : batal setelah 15 menit.
--       * COD menunggu konfirmasi WA admin / QRIS menunggu verifikasi : tidak disentuh.
--
-- SETELAH MENJALANKAN, isi token Fonnte (sama dengan yang dipakai OTP) — jalankan sekali:
--   insert into ks_privat.rahasia (key, value) values ('fonnte_token', 'TOKEN_FONNTE_ANDA')
--   on conflict (key) do update set value = excluded.value;
-- Tanpa token: pesanan tetap diterima otomatis, hanya WA yang tidak terkirim.
-- =====================================================================

create extension if not exists pg_net;

alter table public.orders add column if not exists wa_penjual_at  timestamptz;  -- kapan WA ke penjual dikirim
alter table public.orders add column if not exists auto_terima_at timestamptz;  -- kapan diterima otomatis oleh sistem

-- Pengaturan (bisa diubah tanpa menjalankan ulang file ini):
--   update store_settings set value = '{"aktif":true,"menit":10,"wa":true}' where key = 'auto_terima';
insert into public.store_settings (key, value)
values ('auto_terima', '{"aktif":true,"menit":10,"wa":true}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 0) Skema privat: TIDAK bisa dipanggil dari halaman web (bukan schema public)
-- ---------------------------------------------------------------------
create schema if not exists ks_privat;
revoke all on schema ks_privat from public;
grant usage on schema ks_privat to anon, authenticated, service_role;

create table if not exists ks_privat.rahasia (key text primary key, value text not null);
revoke all on ks_privat.rahasia from public, anon, authenticated;

-- nomor WA penjual dari nama toko
create or replace function ks_privat.wa_toko(p_toko text)
returns text language sql stable security definer set search_path = public as $$
  select public.ks_wa(coalesce(nullif(x->>'wa', ''),
           (select a.key from public.store_settings s2, jsonb_each(case when jsonb_typeof(s2.value) = 'object' then s2.value else '{}'::jsonb end) a
             where s2.key = 'penjual_accounts' and a.value->>'id' = x->>'id' limit 1)))
    from public.store_settings s,
         jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'penjual_members'
     and public.ks_k(coalesce(nullif(btrim(x->>'toko'), ''), x->>'usaha')) = public.ks_k(p_toko)
     and not coalesce((x->>'pending')::boolean, false)
   limit 1
$$;

-- kirim 1 pesan WA lewat Fonnte (antrean pg_net, terkirim setelah transaksi selesai)
create or replace function ks_privat.kirim_wa(p_wa text, p_pesan text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare tok text; w text := public.ks_wa(p_wa);
begin
  if length(coalesce(w, '')) < 10 then return false; end if;
  select value into tok from ks_privat.rahasia where key = 'fonnte_token';
  if coalesce(tok, '') = '' then return false; end if;
  perform net.http_post(
    url     := 'https://api.fonnte.com/send',
    body    := jsonb_build_object('target', w, 'message', p_pesan, 'countryCode', '62'),
    headers := jsonb_build_object('Authorization', tok, 'Content-Type', 'application/json'),
    timeout_milliseconds := 10000);
  return true;
exception when others then
  raise warning 'WA penjual gagal diantrekan: %', sqlerrm;   -- jangan sampai pesanan gagal gara-gara WA
  return false;
end $$;

grant execute on function ks_privat.wa_toko(text) to anon, authenticated, service_role;
grant execute on function ks_privat.kirim_wa(text, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 1) Pesanan sudah "sampai ke toko"? (sama dengan aturan aplikasi penjual)
-- ---------------------------------------------------------------------
create or replace function public.ks_sampai_toko(o public.orders)
returns boolean language sql immutable as $$
  select coalesce(o.status, 'menunggu') in ('menunggu', 'baru')
     and coalesce(o.pay_status, '') not in ('tunggu_wa', 'verifikasi', 'kedaluwarsa', 'gagal')
     and (coalesce(o.payment, '') !~* '^qris' or coalesce(o.pay_status, '') = 'lunas')
     and coalesce(o.items->0->>'layanan', '') = ''          -- bukan ojek / kirim paket
$$;

-- nota berisi produk mitra luar kota (dikirim J&T, bukan kurir desa)?
create or replace function public.ks_pesanan_luar_kota(p_items jsonb)
returns boolean language sql stable set search_path = public as $$
  select case when jsonb_typeof(p_items) = 'array' then exists (
      select 1 from jsonb_array_elements(p_items) it
        join public.products p on p.id = case when coalesce(it->>'id', '') ~ '^\d{1,18}$' then (it->>'id')::bigint end
       where coalesce(p.luar_kota, false)) else false end
$$;

-- ---------------------------------------------------------------------
-- 2) Isi pesan WA untuk satu toko
-- ---------------------------------------------------------------------
create or replace function ks_privat.pesan_wa(o public.orders, p_toko text)
returns text language plpgsql stable security definer set search_path = public as $$
declare baris text := ''; it jsonb; sub bigint := 0; h bigint; n int := 0; menit int;
begin
  select greatest(1, coalesce((value->>'menit')::int, 10)) into menit from public.store_settings where key = 'auto_terima';
  menit := coalesce(menit, 10);
  for it in select * from jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) loop
    if not public.ks_milik_toko(it->>'seller', p_toko) then continue; end if;
    h := coalesce(nullif(it->>'sale', '')::numeric, nullif(it->>'price', '')::numeric, 0)::bigint * greatest(1, coalesce(nullif(it->>'qty', '')::numeric, 1))::bigint;
    sub := sub + h; n := n + 1;
    if n <= 15 then
      baris := baris || E'\n• ' || left(coalesce(it->>'name', 'Produk'), 60)
               || coalesce(' (' || nullif(it->>'variant', '') || ')', '')
               || ' ×' || coalesce(it->>'qty', '1')
               || ' = Rp' || replace(to_char(h, 'FM999G999G999'), ',', '.');
    end if;
  end loop;
  if n > 15 then baris := baris || E'\n• … dan ' || (n - 15) || ' produk lain'; end if;
  return '🔔 *PESANAN BARU – Kalensari Store*' || E'\n\n'
      || 'Toko: *' || p_toko || '*' || E'\n'
      || 'Kode: *' || coalesce(o.order_code, '-') || '*' || E'\n'
      || 'Bayar: ' || case when coalesce(o.payment, '') ~* '^qris' then 'QRIS (sudah LUNAS)' else 'COD (bayar di tempat)' end
      || E'\n' || baris || E'\n\n'
      || 'Subtotal: *Rp' || replace(to_char(sub, 'FM999G999G999'), ',', '.') || '*'
      || case when coalesce(o.note, '') <> '' then E'\nCatatan: ' || left(o.note, 200) else '' end
      || E'\n\n' || case when coalesce(o.praorder, false)
            then '📅 Ini pesanan *PRAORDER*. Tanggapi dalam 12 jam.'
            else '⏱ Tanggapi dalam *' || menit || ' menit*. Jika tidak ditanggapi, pesanan *otomatis DITERIMA* dan kurir langsung menuju toko Anda. Mohon segera siapkan pesanannya.' end
      || E'\n\nBuka aplikasi Mitra Toko:\nhttps://kalensari.web.id/penjual-app.html';
end $$;
grant execute on function ks_privat.pesan_wa(public.orders, text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3) Trigger: kirim WA saat pesanan sampai ke toko (sekali per nota)
--    Sengaja TANPA security definer: current_user dipakai untuk menjaga kolom.
-- ---------------------------------------------------------------------
create or replace function public.ks_wa_penjual()
returns trigger language plpgsql set search_path = public as $$
declare cfg jsonb; toko text; w text; terkirim boolean := false;
begin
  -- jaga kolom dari ubahan langsung halaman web
  if tg_op = 'INSERT' then
    new.wa_penjual_at := null; new.auto_terima_at := null;
  elsif current_user in ('anon', 'authenticated') and not coalesce(public.is_admin(), false) then
    new.wa_penjual_at := old.wa_penjual_at; new.auto_terima_at := old.auto_terima_at;
  end if;

  if new.wa_penjual_at is not null or not public.ks_sampai_toko(new) then return new; end if;
  select value into cfg from public.store_settings where key = 'auto_terima';
  if not coalesce((cfg->>'wa')::boolean, true) then return new; end if;

  for toko in
    select distinct btrim(x) from jsonb_array_elements(case when jsonb_typeof(new.items) = 'array' then new.items else '[]'::jsonb end) it,
           unnest(string_to_array(coalesce(it->>'seller', ''), ',')) x
     where btrim(x) <> ''
  loop
    w := ks_privat.wa_toko(toko);
    if w is not null and ks_privat.kirim_wa(w, ks_privat.pesan_wa(new, toko)) then terkirim := true; end if;
  end loop;
  -- ditandai juga bila tidak ada nomor/token, supaya tidak dicoba berulang tiap ubahan
  new.wa_penjual_at := now();
  return new;
exception when others then
  raise warning 'ks_wa_penjual: %', sqlerrm;
  return new;
end $$;
revoke all on function public.ks_wa_penjual() from public;
drop trigger if exists ks_wa_penjual on public.orders;
-- nama diawali "ks_w" supaya berjalan SETELAH ks_jaga_orders & ks_praorder_tandai (urut abjad)
create trigger ks_wa_penjual before insert or update on public.orders
  for each row execute function public.ks_wa_penjual();

-- ---------------------------------------------------------------------
-- 4) Terima otomatis. Dipanggil cron tiap menit, dan oleh aplikasi saat hitung mundur habis
--    (p_kode = daftar kode; null = semua). Hanya mengubah pesanan yang memang sudah lewat batas.
-- ---------------------------------------------------------------------
create or replace function public.pesanan_auto_terima(p_kode text[] default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare cfg jsonb; menit int; hasil text[];
begin
  if p_kode is not null and array_length(p_kode, 1) > 20 then raise exception 'Terlalu banyak pesanan sekaligus'; end if;
  select value into cfg from public.store_settings where key = 'auto_terima';
  if not coalesce((cfg->>'aktif')::boolean, true) then return jsonb_build_object('ok', true, 'jumlah', 0, 'kode', '[]'::jsonb); end if;
  menit := greatest(1, coalesce((cfg->>'menit')::int, 10));
  with u as (
    update public.orders o
       set status = 'diproses', auto_terima_at = now(), updated_at = now()
     where (p_kode is null or o.order_code = any(p_kode))
       and public.ks_sampai_toko(o)
       and not public.ks_praorder_berlaku(o)
       and not coalesce(o.praorder, false)
       and not public.ks_pesanan_luar_kota(o.items)          -- paket luar kota (J&T) tidak diterima otomatis
       and coalesce(o.paid_at, o.created_at) < now() - make_interval(mins => menit)
       and o.created_at > now() - interval '3 days'
    returning o.order_code)
  select array_agg(order_code) into hasil from u;
  return jsonb_build_object('ok', true, 'jumlah', coalesce(array_length(hasil, 1), 0), 'kode', to_jsonb(coalesce(hasil, '{}')));
end $$;
revoke all on function public.pesanan_auto_terima(text[]) from public;
grant execute on function public.pesanan_auto_terima(text[]) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5) Job tiap menit (menggantikan 'ks-auto-tolak-pesanan' lama)
-- ---------------------------------------------------------------------
do $outer$
begin
  create extension if not exists pg_cron;
  begin perform cron.unschedule('ks-auto-tolak-pesanan'); exception when others then null; end;
  perform cron.schedule(
    'ks-auto-tolak-pesanan',
    '* * * * *',
    $job$
    -- a) toko tidak menanggapi 10 menit -> diterima otomatis, kurir dipanggil
    select public.pesanan_auto_terima(null);
    -- b) praorder tidak dijawab 12 jam -> batal; QRIS belum dibayar 15 menit -> batal
    update public.orders o
       set status = 'dibatalkan',
           batal_alasan = case when public.ks_praorder_berlaku(o) then 'Toko tidak menjawab praorder dalam 12 jam'
                               else 'Pembayaran QRIS tidak selesai dalam 15 menit' end,
           batal_at = now(),
           updated_at = now()
     where o.status in ('baru','menunggu')
       and coalesce(o.pay_status, '') not in ('tunggu_wa', 'verifikasi')
       and o.created_at > now() - interval '3 days'
       and ( (public.ks_praorder_berlaku(o) and coalesce(o.paid_at, o.created_at) < now() - interval '12 hours')
          or (coalesce(o.payment, '') ~* '^qris' and coalesce(o.pay_status, '') <> 'lunas'
              and o.created_at < now() - interval '15 minutes') );
    $job$
  );
exception when others then
  raise notice 'pg_cron belum aktif, terima otomatis server dilewati: %', sqlerrm;
end
$outer$;

-- Cek: harus menampilkan true semua
select exists (select 1 from pg_trigger where tgname = 'ks_wa_penjual')                    as trigger_wa,
       exists (select 1 from pg_proc where proname = 'pesanan_auto_terima')                as fungsi_auto_terima,
       exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'auto_terima_at') as kolom_auto,
       exists (select 1 from ks_privat.rahasia where key = 'fonnte_token')                 as token_fonnte_sudah_diisi;
