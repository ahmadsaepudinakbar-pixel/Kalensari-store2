-- =====================================================================
-- KALENSARI STORE • Keamanan tahap 3b: PERLINDUNGAN PESANAN & PENCAIRAN SALDO
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-keamanan-produk.sql (butuh ks_k, ks_milik_toko, ks_toko_sesi).
--
-- Sesudah ini:
--  * Pesanan TIDAK BISA diubah langsung dari halaman web. Hanya admin (login admin),
--    atau lewat fungsi server pesanan_aksi yang memeriksa sesi masuk:
--      - penjual : terima / tolak pesanan TOKONYA SENDIRI, catat uang COD diterima
--      - kurir   : ambil / lepas / kirim / selesai / gagal / batal toko tutup — hanya pesanan YANG DIA PEGANG
--      - pembeli : batalkan pesanan yang belum diterima toko & belum dibayar
--  * Membuat pesanan baru tetap bisa, tetapi kolom uang & status dijaga server.
--  * Daftar pencairan saldo toko (cair_toko) hanya bisa diajukan penjual pemilik toko
--    (lewat fungsi cair_ajukan) dan hanya admin yang bisa memprosesnya.
--  * Melihat pesanan belum diubah (tahap berikutnya).
-- =====================================================================

-- 0) Pastikan kolom yang dipakai ada (aman bila sudah ada)
alter table public.orders add column if not exists customer_phone_normalized text;
alter table public.orders add column if not exists pay_status   text;
alter table public.orders add column if not exists paid_at      timestamptz;
alter table public.orders add column if not exists potong_saldo integer not null default 0;
alter table public.orders add column if not exists refund       jsonb;
alter table public.orders add column if not exists uang_toko    jsonb default '{}'::jsonb;
alter table public.orders add column if not exists grup         text;
alter table public.orders add column if not exists updated_at   timestamptz;
alter table public.orders add column if not exists kurir_id     text;
alter table public.orders add column if not exists kurir_nama   text;
alter table public.orders add column if not exists kurir_wa     text;
alter table public.orders add column if not exists diambil_at   timestamptz;
alter table public.orders add column if not exists selesai_at   timestamptz;
alter table public.orders add column if not exists gagal_alasan text;
alter table public.orders add column if not exists gagal_at     timestamptz;
alter table public.orders add column if not exists batal_alasan text;
alter table public.orders add column if not exists batal_at     timestamptz;
alter table public.orders add column if not exists ongkir_tetap integer;

-- 1) UBAH & HAPUS pesanan langsung: hanya admin
alter table public.orders enable row level security;
do $$ declare p record; begin
  for p in select polname from pg_policy where polrelid = 'public.orders'::regclass and polcmd in ('w', 'd', '*') loop
    execute format('drop policy %I on public.orders', p.polname);
  end loop;
end $$;
create policy "orders_admin_update" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orders_admin_delete" on public.orders for delete to authenticated using (public.is_admin());
-- membuat & melihat pesanan tetap terbuka (pesanan dibuat dari toko tanpa login)
drop policy if exists "orders_public_insert" on public.orders;
create policy "orders_public_insert" on public.orders for insert to anon, authenticated with check (true);

-- 2) Penjaga pesanan BARU dari web: kolom uang / kurir / status tidak bisa dipalsukan
create or replace function public.ks_jaga_orders()
returns trigger language plpgsql as $$
declare r_old int; r_new int; transport boolean;
begin
  if current_user <> 'anon' then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.pay_status, '') not in ('', 'tunggu_wa') then new.pay_status := null; end if;
    new.paid_at := null; new.potong_saldo := 0; new.refund := null;
    new.kurir_id := null; new.kurir_nama := null; new.kurir_wa := null;
    new.diambil_at := null; new.selesai_at := null; new.gagal_at := null; new.gagal_alasan := null;
    new.batal_at := null; new.batal_alasan := null; new.ongkir_tetap := null; new.uang_toko := '{}'::jsonb;
    transport := jsonb_typeof(new.items) = 'array' and coalesce(new.items->0->>'layanan', '') <> '';
    if coalesce(new.status, 'menunggu') not in ('menunggu', 'baru') and not (transport and new.status = 'diproses') then
      new.status := 'menunggu';
    end if;
    return new;
  end if;
  -- (ubah langsung dari web sudah ditolak oleh RLS; bagian ini cadangan)
  new.pay_status := old.pay_status; new.paid_at := old.paid_at; new.potong_saldo := old.potong_saldo;
  if old.refund is not null and new.refund is distinct from old.refund then new.refund := old.refund; end if;
  if new.status is distinct from old.status then
    if coalesce(old.status, '') in ('selesai', 'dibatalkan', 'gagal') then new.status := old.status;
    else
      r_old := case coalesce(old.status, 'menunggu') when 'baru' then 0 when 'menunggu' then 0 when 'diproses' then 1 when 'dikirim' then 2 when 'selesai' then 3 end;
      r_new := case new.status when 'baru' then 0 when 'menunggu' then 0 when 'diproses' then 1 when 'dikirim' then 2 when 'selesai' then 3 end;
      if r_old is not null and r_new is not null and r_new < r_old then new.status := old.status; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists ks_jaga_orders on public.orders;
create trigger ks_jaga_orders before insert or update on public.orders
  for each row execute function public.ks_jaga_orders();

-- 3) Bantuan: kurir yang sedang masuk
create or replace function public.ks_kurir_sesi(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_id text; m jsonb;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'kurir');
  if v_wa is null then raise exception 'SESI: Sesi berakhir. Silakan masuk lagi.'; end if;
  select s.value->v_wa->>'id' into v_id from public.store_settings s where s.key = 'kurir_accounts';
  select x into m from public.store_settings s, jsonb_array_elements(case when jsonb_typeof(s.value) = 'array' then s.value else '[]'::jsonb end) x
   where s.key = 'kurir_members' and x->>'id' = v_id limit 1;
  if m is null then raise exception 'Akun kurir tidak ditemukan'; end if;
  if coalesce((m->>'pending')::boolean, false) then raise exception 'Akun kurir belum disetujui admin'; end if;
  return jsonb_build_object('id', v_id, 'wa', v_wa, 'nama', coalesce(m->>'nama', ''));
end $$;
revoke all on function public.ks_kurir_sesi(text) from public, anon, authenticated;

-- pesanan berisi barang dari toko ini?
create or replace function public.ks_pesanan_toko(p_items jsonb, p_toko text)
returns boolean language sql immutable as $$
  select exists (select 1 from jsonb_array_elements(case when jsonb_typeof(p_items) = 'array' then p_items else '[]'::jsonb end) it
                  where public.ks_milik_toko(it->>'seller', p_toko))
$$;

-- kurir pemegang pesanan (catatan pembagian kurir_ord_<kode>)
create or replace function public.ks_kurir_pegang(p_kode text)
returns text language sql stable security definer set search_path = public as $$
  select s.value->'acc'->>'id' from public.store_settings s where s.key = 'kurir_ord_' || p_kode and jsonb_typeof(s.value->'acc') = 'object'
$$;
revoke all on function public.ks_kurir_pegang(text) from public, anon, authenticated;

-- 4) SATU PINTU untuk mengubah pesanan dari aplikasi
--    p_peran: penjual | kurir | tamu   (tamu = pembeli / pemesan ojek, tanpa sesi)
--    Hasil: {ok:true, jumlah:<pesanan yang berubah>, kode:[...]}
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
        if st not in ('menunggu', 'baru') or coalesce(o.pay_status, '') = 'lunas' then continue; end if;
        update public.orders set status = 'dibatalkan', updated_at = sekarang, batal_at = sekarang,
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

-- 5) PENCAIRAN SALDO TOKO: daftar cair_toko & biaya_cair hanya bisa diubah admin
drop policy if exists "ks_kunci_cair_ins" on public.store_settings;
create policy "ks_kunci_cair_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key not in ('cair_toko', 'biaya_cair') or public.is_admin());
drop policy if exists "ks_kunci_cair_upd" on public.store_settings;
create policy "ks_kunci_cair_upd" on public.store_settings as restrictive for update to anon, authenticated
  using (key not in ('cair_toko', 'biaya_cair') or public.is_admin()) with check (key not in ('cair_toko', 'biaya_cair') or public.is_admin());
drop policy if exists "ks_kunci_cair_del" on public.store_settings;
create policy "ks_kunci_cair_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key not in ('cair_toko', 'biaya_cair') or public.is_admin());

-- penjual mengajukan pencairan (toko diambil dari sesi, tidak bisa dipalsukan)
create or replace function public.cair_ajukan(p_sesi text, p_jumlah integer, p_rek text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare toko text; kunci text; l jsonb; biaya int; v_wa text; nama text; hari text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD'); bc jsonb;
begin
  toko := public.ks_toko_sesi(p_sesi);
  kunci := lower(btrim(toko));
  if coalesce(p_jumlah, 0) < 20000 then raise exception 'Minimal pencairan Rp20.000'; end if;
  if length(btrim(coalesce(p_rek, ''))) < 8 then raise exception 'Isi tujuan transfer lengkap'; end if;
  select value into bc from public.store_settings where key = 'biaya_cair';
  biaya := coalesce(case when jsonb_typeof(bc) = 'object' then (bc->>'admin')::int when jsonb_typeof(bc) = 'number' then bc::text::int end, 2500);
  if p_jumlah <= biaya then raise exception 'Jumlah harus lebih besar dari biaya admin bank'; end if;
  insert into public.store_settings (key, value) values ('cair_toko', '[]'::jsonb) on conflict (key) do nothing;
  select value into l from public.store_settings where key = 'cair_toko' for update;
  if jsonb_typeof(l) <> 'array' then l := '[]'::jsonb; end if;
  if exists (select 1 from jsonb_array_elements(l) x where x->>'toko' = kunci and x->>'status' = 'menunggu') then
    raise exception 'Masih ada pencairan yang menunggu diproses admin';
  end if;
  if exists (select 1 from jsonb_array_elements(l) x where x->>'toko' = kunci and coalesce(x->>'status', '') <> 'ditolak'
              and to_char((x->>'t')::timestamptz at time zone 'Asia/Jakarta', 'YYYY-MM-DD') = hari) then
    raise exception 'Pencairan hanya bisa 1x sehari. Coba lagi besok.';
  end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'penjual');
  l := l || jsonb_build_array(jsonb_build_object('id', to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint) || substr(md5(random()::text), 1, 4),
          'toko', kunci, 'nama', toko, 'wa', v_wa, 'jumlah', p_jumlah, 'biaya', biaya, 'diterima', p_jumlah - biaya,
          'rek', left(btrim(p_rek), 100), 't', to_jsonb(now()), 'status', 'menunggu'));
  update public.store_settings set value = l where key = 'cair_toko';
  return jsonb_build_object('ok', true, 'biaya', biaya, 'diterima', p_jumlah - biaya);
end $$;
revoke all on function public.cair_ajukan(text, integer, text) from public;
grant execute on function public.cair_ajukan(text, integer, text) to anon, authenticated;

-- Cek
select polname as policy_pesanan, case polcmd when 'r' then 'baca' when 'a' then 'buat' when 'w' then 'ubah' when 'd' then 'hapus' else polcmd::text end as aksi
  from pg_policy where polrelid = 'public.orders'::regclass order by polname;
