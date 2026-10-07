-- =====================================================================
-- Kalensari Store • HAPUS AKUN SENDIRI (syarat Google Play)
-- Jalankan SETELAH semua SQL keamanan sebelumnya. Aman dijalankan berulang kali.
--
-- Pemilik akun (pembeli / penjual / kurir / penyedia jasa) bisa menghapus akunnya
-- sendiri dari dashboard. Syarat: sedang masuk (sesi sah) + memasukkan PIN lagi,
-- dan tidak ada pesanan yang masih berjalan.
--
-- Yang dihapus : data akun & PIN, data anggota (nama, alamat, titik lokasi, foto),
--                semua sesi masuk, langganan notifikasi, foto toko/kurir, catatan stok,
--                iklan & komentar Lapak Barter, kode OTP, saldo voucher pembeli.
--                Penjual: produknya disembunyikan & jadwal/ongkir/unggulan toko dihapus.
--                Nama di ulasan diganti "Warga".
-- Yang disimpan: nota pesanan, riwayat saldo & pencairan (catatan keuangan),
--                sesuai Kebijakan Privasi (privasi.html#hapus-akun).
-- =====================================================================

create or replace function public.hapus_akun_saya(p_sesi text, p_peran text, p_pin text, p_konfirmasi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_wa text; v_id text; salah text; m jsonb; v_toko text; k text; n int; hp text; kunci text;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak dikenal'; end if;
  if upper(btrim(coalesce(p_konfirmasi, ''))) <> 'HAPUS' then raise exception 'Ketik HAPUS untuk konfirmasi'; end if;

  -- 1) harus sedang masuk + PIN benar (salah PIN ikut dihitung, 5x dikunci 15 menit)
  v_wa := public.ks_sesi_wa(p_sesi, p_peran);
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  salah := public.ks_cek_pin(p_peran, v_wa, p_pin);
  if salah is not null then raise exception '%', salah; end if;

  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = p_peran || '_accounts';
  if coalesce(v_id, '') = '' then raise exception 'Akun tidak ditemukan'; end if;
  select x into m from public.store_settings s,
         jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = p_peran || '_members' and x->>'id' = v_id limit 1;
  hp := right(regexp_replace(v_wa, '\D', '', 'g'), 10);

  -- 2) tidak boleh ada pesanan yang masih berjalan (14 hari terakhir; pesanan lama yang macet tidak menghalangi)
  if p_peran = 'pembeli' then
    select count(*) into n from public.orders o
     where right(regexp_replace(coalesce(nullif(o.customer_phone_normalized, ''), o.customer_phone, ''), '\D', '', 'g'), 10) = hp
       and coalesce(o.status, 'menunggu') not in ('selesai', 'dibatalkan', 'gagal')
       and o.created_at > now() - interval '14 days';
  elsif p_peran = 'penjual' then
    v_toko := btrim(coalesce(nullif(btrim(m->>'toko'), ''), m->>'usaha', ''));
    select count(*) into n from public.orders o
     where coalesce(o.status, 'menunggu') not in ('selesai', 'dibatalkan', 'gagal')
       and o.created_at > now() - interval '14 days'
       and v_toko <> ''
       and exists (select 1 from jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) it
                    where public.ks_milik_toko(it->>'seller', v_toko));
  elsif p_peran = 'kurir' then
    select count(*) into n from public.orders o
     where o.kurir_id = v_id and coalesce(o.status, '') not in ('selesai', 'dibatalkan', 'gagal')
       and o.created_at > now() - interval '14 days';
  else
    n := 0;
  end if;
  if n > 0 then
    raise exception 'Masih ada % pesanan yang berjalan. Selesaikan atau batalkan dulu, lalu coba lagi.', n;
  end if;

  -- 3) hapus akun & anggota (trigger penjaga ikut menghapus PIN & sesi)
  update public.store_settings set value = value - v_wa
   where key = p_peran || '_accounts' and jsonb_typeof(value) = 'object';
  update public.store_settings
     set value = coalesce((select jsonb_agg(x) from jsonb_array_elements(value) x where x->>'id' is distinct from v_id), '[]'::jsonb)
   where key = p_peran || '_members' and jsonb_typeof(value) = 'array';
  delete from public.akun_pin  where peran = p_peran and wa = v_wa;
  delete from public.akun_sesi where peran = p_peran and wa = v_wa;

  -- 4) data lain milik akun ini
  delete from public.store_settings
   where key in (p_peran || '_push_' || v_id, 'foto_toko_' || v_id, 'foto_kurir_' || v_id, 'stoklog_' || v_id)
      or (p_peran = 'pembeli' and key = 'pembeli_push_' || v_wa);

  if p_peran = 'pembeli' then
    delete from public.pembeli_saldo where wa = v_wa;                               -- saldo voucher hangus
    if to_regclass('public.pembeli_otp') is not null then
      execute 'delete from public.pembeli_otp where wa = $1' using v_wa;
    end if;
  end if;

  -- Lapak Barter (iklan beserta komentarnya, dan komentar di iklan orang lain)
  if to_regclass('public.lapak_iklan') is not null then
    execute 'delete from public.lapak_komentar where right(regexp_replace(coalesce(wa, ''''), ''\D'', '''', ''g''), 10) = $1' using hp;
    execute 'delete from public.lapak_iklan    where right(regexp_replace(coalesce(wa, ''''), ''\D'', '''', ''g''), 10) = $1' using hp;
  end if;
  -- ulasan tetap ada untuk toko, tapi nama & nomor pembeli dihapus
  if p_peran = 'pembeli' and to_regclass('public.ulasan') is not null then
    execute 'update public.ulasan set nama = ''Warga'', wa = '''' where right(regexp_replace(coalesce(wa, ''''), ''\D'', '''', ''g''), 10) = $1' using hp;
  end if;

  -- Penjual: produk disembunyikan, nama toko dilepas dari produk bersama, pengaturan toko dihapus
  if p_peran = 'penjual' and coalesce(v_toko, '') <> '' then
    kunci := lower(btrim(v_toko));
    update public.products p
       set seller = t.sisa,
           status = case when t.sisa is null then 'Hidden' else p.status end   -- tidak ada toko lain -> disembunyikan
      from (select q.id, nullif(array_to_string(array(
                      select btrim(x) from unnest(string_to_array(coalesce(q.seller, ''), ',')) x
                       where public.ks_k(x) <> public.ks_k(v_toko) and btrim(x) <> ''), ', '), '') as sisa
              from public.products q where public.ks_milik_toko(q.seller, v_toko)) t
     where p.id = t.id;
    foreach k in array array['seller_schedule', 'tutup_toko', 'closed_sellers', 'shipping_fees', 'unggulan_toko'] loop
      update public.store_settings set value = value - kunci where key = k and jsonb_typeof(value) = 'object';
    end loop;
  end if;

  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.hapus_akun_saya(text, text, text, text) from public;
grant execute on function public.hapus_akun_saya(text, text, text, text) to anon, authenticated;
