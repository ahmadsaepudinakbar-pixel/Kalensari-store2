-- =====================================================================
-- KALENSARI STORE • PESANAN PRAORDER
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman diulang.
-- Jalankan SETELAH supabase-multitoko-adil.sql, supabase-keamanan-baca.sql dan supabase-qris-statis.sql
-- (file ini memperbarui fungsi pesanan_aksi, pesanan_kurir dan job 'ks-auto-tolak-pesanan').
--
-- Aturan:
--  * Penjual mencentang "Pesanan praorder" di form produk (kolom products.praorder).
--  * Nota yang berisi produk praorder ditandai orders.praorder = true (otomatis oleh database).
--  * Status Menunggu: toko punya waktu 12 jam (bukan 15 menit). Pembeli boleh membatalkan.
--  * Toko menerima -> status Diproses (orders.terima_at). Pembeli TIDAK bisa membatalkan selama 3 hari.
--    Uang tetap ditahan Kalensari Store (saldo toko baru masuk setelah pesanan selesai, seperti biasa).
--  * Toko menekan "Pesanan siap dikirim" (orders.siap_at) -> baru kurir ditawari, lalu berjalan seperti biasa.
--  * Lewat 3 hari dan belum "siap dikirim" -> pembeli boleh membatalkan; uang kembali sebagai saldo voucher.
-- =====================================================================

alter table public.products add column if not exists praorder  boolean not null default false;
alter table public.orders   add column if not exists praorder  boolean not null default false;
alter table public.orders   add column if not exists terima_at timestamptz;   -- kapan toko menerima pesanan
alter table public.orders   add column if not exists siap_at   timestamptz;   -- praorder: kapan toko menekan "Pesanan siap dikirim"

-- 1) Tandai nota praorder saat dibuat + jaga kolomnya dari ubahan langsung halaman web
-- (sengaja TANPA security definer: current_user harus peran pemanggil, seperti ks_jaga_orders)
create or replace function public.ks_praorder_tandai()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.terima_at := null; new.siap_at := null;
    new.praorder := case when jsonb_typeof(new.items) = 'array' then exists (
        select 1 from jsonb_array_elements(new.items) it
          join public.products p on p.id = case when coalesce(it->>'id', '') ~ '^\d{1,18}$' then (it->>'id')::bigint end
         where coalesce(p.praorder, false)) else false end;
    return new;
  end if;
  if current_user in ('anon', 'authenticated') and not coalesce(public.is_admin(), false) then
    new.praorder := old.praorder; new.siap_at := old.siap_at; new.terima_at := old.terima_at;
  end if;
  if new.status = 'diproses' and coalesce(old.status, 'menunggu') in ('menunggu', 'baru') and new.terima_at is null then
    new.terima_at := now();
  end if;
  return new;
end $$;
revoke all on function public.ks_praorder_tandai() from public;
drop trigger if exists ks_praorder_tandai on public.orders;
create trigger ks_praorder_tandai before insert or update on public.orders
  for each row execute function public.ks_praorder_tandai();

-- 2) Bantuan
-- batas 12 jam berlaku untuk praorder yang sudah sampai ke toko (QRIS: sudah lunas). QRIS belum dibayar tetap 15 menit.
create or replace function public.ks_praorder_berlaku(o public.orders)
returns boolean language sql immutable as $$
  select coalesce(o.praorder, false) and (coalesce(o.payment, '') !~* '^qris' or coalesce(o.pay_status, '') = 'lunas')
$$;
-- praorder diterima toko, lewat 3 hari, belum ditandai siap -> pembeli boleh membatalkan
create or replace function public.ks_praorder_telat(o public.orders)
returns boolean language sql stable as $$
  select coalesce(o.praorder, false) and coalesce(o.status, '') = 'diproses' and o.siap_at is null
         and coalesce(o.terima_at, o.updated_at, o.created_at) < now() - interval '3 days'
$$;

-- 3) Pembatalan otomatis: 15 menit biasa, 12 jam untuk praorder (menggantikan job lama dengan nama yang sama)
do $outer$
begin
  create extension if not exists pg_cron;
  begin perform cron.unschedule('ks-auto-tolak-pesanan'); exception when others then null; end;
  perform cron.schedule(
    'ks-auto-tolak-pesanan',
    '* * * * *',
    $job$
    update public.orders o
       set status = 'dibatalkan',
           batal_alasan = case when public.ks_praorder_berlaku(o) then 'Toko tidak menjawab praorder dalam 12 jam' else 'Toko tidak menjawab dalam 15 menit' end,
           batal_at = now(),
           updated_at = now()
     where o.status in ('baru','menunggu')
       and coalesce(o.pay_status, '') not in ('tunggu_wa', 'verifikasi')
       and coalesce(o.paid_at, o.created_at) < now() - case when public.ks_praorder_berlaku(o) then interval '12 hours' else interval '15 minutes' end
       and o.created_at > now() - interval '3 days';
    $job$
  );
exception when others then
  raise notice 'pg_cron belum aktif, pembatalan otomatis server dilewati: %', sqlerrm;
end
$outer$;

-- 4) Aksi pesanan (versi multi toko adil + praorder: aksi penjual 'siap', batal pembeli setelah 3 hari)
create or replace function public.pesanan_aksi(p_sesi text, p_peran text, p_kode text[], p_aksi text, p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb := coalesce(p_data, '{}'::jsonb); toko text; kr jsonb; o public.orders; hasil text[] := '{}';
        sekarang timestamptz := now(); st text; kunci text; ref jsonb;
begin
  if p_kode is null or array_length(p_kode, 1) is null then raise exception 'Kode pesanan kosong'; end if;
  if array_length(p_kode, 1) > 20 then raise exception 'Terlalu banyak pesanan sekaligus'; end if;

  if p_peran = 'penjual' then
    toko := public.ks_toko_sesi(p_sesi);
    kunci := lower(btrim(toko));
    for o in select * from public.orders where order_code = any(p_kode) for update loop
      if not public.ks_pesanan_toko(o.items, toko) then raise exception 'Pesanan % bukan untuk toko Anda', o.order_code; end if;
      if p_aksi = 'terima' then
        if coalesce(o.status, 'menunggu') not in ('menunggu', 'baru') then continue; end if;
        update public.orders set status = 'diproses', updated_at = sekarang where id = o.id;
      elsif p_aksi in ('tolak', 'kedaluwarsa') then
        if coalesce(o.status, 'menunggu') not in ('menunggu', 'baru') then continue; end if;
        -- PRAORDER: toko punya waktu 12 jam (bukan 15 menit) untuk menjawab
        if p_aksi = 'kedaluwarsa' and public.ks_praorder_berlaku(o)
           and coalesce(o.paid_at, o.created_at) > sekarang - interval '12 hours' then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = coalesce(nullif(left(d->>'alasan', 120), ''), case when p_aksi = 'tolak' then 'Ditolak toko' else 'Toko tidak menjawab' end)
         where id = o.id;
      elsif p_aksi = 'siap' then
        -- PRAORDER: toko menandai "Pesanan siap dikirim" -> baru sekarang kurir ditawari
        if not coalesce(o.praorder, false) or coalesce(o.status, '') <> 'diproses' or o.siap_at is not null then continue; end if;
        update public.orders set siap_at = sekarang, updated_at = sekarang where id = o.id;
      elsif p_aksi = 'uang_toko' then
        update public.orders set uang_toko = coalesce(uang_toko, '{}'::jsonb) || jsonb_build_object(kunci, to_jsonb(sekarang)) where id = o.id;
      else raise exception 'Aksi penjual tidak dikenal: %', p_aksi;
      end if;
      hasil := hasil || o.order_code;
    end loop;

  elsif p_peran = 'kurir' then
    kr := public.ks_kurir_sesi(p_sesi);
    for o in select * from public.orders where order_code = any(p_kode) for update loop
      st := coalesce(o.status, 'menunggu');
      if p_aksi = 'batal_telat' then
        -- toko tidak menjawab 15 menit: boleh dibatalkan kurir mana pun
        if st not in ('menunggu', 'baru') or coalesce(o.pay_status, '') = 'tunggu_wa'
           or coalesce(o.paid_at, o.created_at) > sekarang - (case when public.ks_praorder_berlaku(o) then interval '12 hours' else interval '15 minutes' end) then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = case when public.ks_praorder_berlaku(o) then 'Toko tidak menjawab praorder dalam 12 jam' else 'Toko tidak menjawab dalam 15 menit' end where id = o.id;
        hasil := hasil || o.order_code; continue;
      end if;
      -- PRAORDER yang belum ditandai siap oleh toko: kurir belum boleh mengubahnya
      if coalesce(o.praorder, false) and o.siap_at is null and st = 'diproses' then continue; end if;
      -- aksi lain: hanya kurir yang memegang pesanan
      if coalesce(public.ks_kurir_pegang(o.order_code), '') <> kr->>'id' and coalesce(o.kurir_id, '') <> kr->>'id' then
        raise exception 'Pesanan % bukan milik Anda', o.order_code;
      end if;
      if p_aksi = 'catat' then
        if st not in ('diproses', 'dikirim', 'selesai') then continue; end if;
        update public.orders set kurir_id = kr->>'id', kurir_nama = kr->>'nama', kurir_wa = kr->>'wa',
               diambil_at = case when d ? 'diambil_at' then coalesce(diambil_at, sekarang) else diambil_at end,
               selesai_at = case when d ? 'selesai_at' and st = 'selesai' then coalesce(selesai_at, sekarang) else selesai_at end
         where id = o.id;
      elsif p_aksi = 'lepas' then
        if st <> 'diproses' or coalesce(o.kurir_id, kr->>'id') <> kr->>'id' then continue; end if;
        update public.orders set kurir_id = null, kurir_nama = null, kurir_wa = null, diambil_at = null where id = o.id;
      elsif p_aksi = 'status' then
        if d->>'status' = 'dikirim' and st = 'diproses' then
          update public.orders set status = 'dikirim', updated_at = sekarang where id = o.id;
        elsif d->>'status' = 'selesai' and st in ('diproses', 'dikirim') then
          update public.orders set status = 'selesai', updated_at = sekarang, selesai_at = coalesce(selesai_at, sekarang),
                 kurir_id = kr->>'id', kurir_nama = kr->>'nama', kurir_wa = kr->>'wa' where id = o.id;
        else continue;
        end if;
      elsif p_aksi = 'gagal' then
        if st not in ('diproses', 'dikirim') then continue; end if;
        update public.orders set status = 'gagal', updated_at = sekarang, gagal_at = sekarang,
               kurir_id = kr->>'id', kurir_nama = kr->>'nama', kurir_wa = kr->>'wa',
               gagal_alasan = left(coalesce(d->>'alasan', 'Gagal diantar'), 500) where id = o.id;
      elsif p_aksi = 'batal_toko' then
        if st <> 'diproses' then continue; end if;
        ref := case when jsonb_typeof(d->'refund') = 'object' then (d->'refund') || jsonb_build_object('status', 'menunggu') else null end;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = left(coalesce(d->>'alasan', 'Toko tutup'), 200),
               ongkir_tetap = greatest(0, least(coalesce((d->>'ongkir_tetap')::int, 0), coalesce(o.shipping, 0))),
               refund = case when o.pay_status = 'lunas' then ref else o.refund end
         where id = o.id;
      else raise exception 'Aksi kurir tidak dikenal: %', p_aksi;
      end if;
      hasil := hasil || o.order_code;
    end loop;

  elsif p_peran = 'tamu' then
    for o in select * from public.orders where order_code = any(p_kode) for update loop
      st := coalesce(o.status, 'menunggu');
      if p_aksi = 'batal_pembeli' then
        -- MULTI TOKO ADIL: pembeli boleh membatalkan nota yang MASIH MENUNGGU toko, termasuk yang sudah dibayar.
        -- Uang nota itu (produk + ongkir toko tsb) kembali otomatis sebagai saldo voucher (trigger ks_voucher_batal).
        -- Nota toko lain di checkout yang sama tidak ikut berubah.
        -- PRAORDER: setelah toko menerima, pembeli baru boleh membatalkan bila 3 hari lewat
        -- dan toko belum menekan "Pesanan siap dikirim". Uang kembali sebagai saldo voucher (trigger ks_voucher_batal).
        if not ((st in ('menunggu', 'baru') and coalesce(o.pay_status, '') <> 'verifikasi')
                or public.ks_praorder_telat(o)) then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = case when st = 'diproses' then 'Praorder tidak siap dalam 3 hari, dibatalkan pembeli: '
                                   else 'Dibatalkan pembeli: ' end || left(coalesce(d->>'alasan', '-'), 80),
               gagal_alasan = 'Dibatalkan pembeli: ' || left(coalesce(d->>'alasan', '-'), 80) where id = o.id;
      elsif p_aksi = 'batal_ojek' then
        if st <> 'diproses' or coalesce(o.items->0->>'layanan', '') = '' or o.kurir_id is not null
           or public.ks_kurir_pegang(o.order_code) is not null then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = 'Dibatalkan pemesan' where id = o.id;
      else raise exception 'Aksi tidak dikenal: %', p_aksi;
      end if;
      hasil := hasil || o.order_code;
    end loop;

  else raise exception 'Peran tidak valid';
  end if;
  return jsonb_build_object('ok', true, 'jumlah', coalesce(array_length(hasil, 1), 0), 'kode', to_jsonb(hasil));
end $$;
revoke all on function public.pesanan_aksi(text, text, text[], text, jsonb) from public;
grant execute on function public.pesanan_aksi(text, text, text[], text, jsonb) to anon, authenticated;

-- 5) Kurir: praorder yang belum "siap dikirim" belum ditawarkan / tidak terlihat
create or replace function public.pesanan_kurir(p_sesi text, p_mode text, p_sejak timestamptz default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare kr jsonb := public.ks_kurir_sesi(p_sesi); kid text := kr->>'id';
begin
  if p_mode = 'aktif' then
    return coalesce((select jsonb_agg(case when o.kurir_id = kid or public.ks_kurir_pegang(o.order_code) = kid
                                           then to_jsonb(o) else to_jsonb(o) - array['customer_phone','customer_phone_normalized'] end
                                      order by o.created_at desc)
                       from (select * from public.orders where status in ('diproses', 'dikirim')
                               and not (coalesce(praorder, false) and siap_at is null and status = 'diproses')   -- praorder belum siap: belum untuk kurir
                             order by created_at desc limit 100) o), '[]'::jsonb);
  elsif p_mode = 'tunggu' then
    return coalesce((select jsonb_agg(public.ks_pesanan_umum(o)) from (
      select * from public.orders where status in ('menunggu', 'baru') and grup is not null order by created_at desc limit 100) o), '[]'::jsonb);
  elsif p_mode = 'riwayat' then
    return coalesce((select jsonb_agg(to_jsonb(o) order by o.created_at desc) from (
      select * from public.orders where kurir_id = kid and created_at >= coalesce(p_sejak, now() - interval '45 days')
       order by created_at desc limit 500) o), '[]'::jsonb);
  end if;
  raise exception 'Mode tidak dikenal';
end $$;
revoke all on function public.pesanan_kurir(text, text, timestamptz) from public;
grant execute on function public.pesanan_kurir(text, text, timestamptz) to anon, authenticated;

-- Cek: harus menampilkan true, true, true
select exists (select 1 from information_schema.columns where table_name = 'products' and column_name = 'praorder') as kolom_produk,
       exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'siap_at') as kolom_pesanan,
       exists (select 1 from pg_trigger where tgname = 'ks_praorder_tandai') as trigger_praorder;
