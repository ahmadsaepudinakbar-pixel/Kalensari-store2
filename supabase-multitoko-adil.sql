-- =====================================================================
-- MULTI TOKO ADIL (jalankan SEKALI di Supabase > SQL Editor, setelah supabase-keamanan-pesanan.sql
-- dan supabase-voucher-pembeli.sql)
--
-- Aturan:
--  * 1 checkout ke banyak toko = 1 nota per toko. Tiap nota berdiri sendiri.
--  * Toko yang sudah MENERIMA -> nota langsung diproses, tidak ikut batal bila toko lain batal / telat.
--  * Pembeli boleh membatalkan nota yang masih MENUNGGU toko, walau sudah dibayar QRIS.
--  * Nota yang batal (ditolak toko / telat 15 menit / dibatalkan pembeli) -> harga produk + ongkir nota itu
--    kembali sebagai SALDO VOUCHER (otomatis oleh trigger ks_voucher_batal di supabase-voucher-pembeli.sql).
--  * Batas 15 menit tetap ditangani cron 'ks-auto-tolak-pesanan' (supabase-qris-statis.sql / supabase-toko-tutup.sql).
-- =====================================================================

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
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = coalesce(nullif(left(d->>'alasan', 120), ''), case when p_aksi = 'tolak' then 'Ditolak toko' else 'Toko tidak menjawab' end)
         where id = o.id;
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
           or coalesce(o.paid_at, o.created_at) > sekarang - interval '15 minutes' then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = 'Toko tidak menjawab dalam 15 menit' where id = o.id;
        hasil := hasil || o.order_code; continue;
      end if;
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
        if st not in ('menunggu', 'baru') or coalesce(o.pay_status, '') = 'verifikasi' then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
               batal_alasan = 'Dibatalkan pembeli: ' || left(coalesce(d->>'alasan', '-'), 80),
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
