-- =====================================================================
-- KALENSARI STORE • Saldo voucher belanja pembeli + Ajak Tetangga + Kompensasi toko tutup
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-toko-tutup.sql.
--
-- Prinsip keamanan:
--  * Saldo voucher hanya BERTAMBAH lewat database (refund nota batal, kompensasi, bonus ajak tetangga, admin).
--  * Saldo hanya bisa DIPAKAI lewat fungsi pakai_saldo (cek PIN pembeli), tidak bisa diubah langsung.
--  * Status bayar "lunas" hanya bisa diisi server pembayaran (Duitku) / admin / fungsi saldo, bukan dari halaman web.
--  * Status pesanan tidak bisa dimundurkan dari halaman web (mis. Selesai -> Diproses).
--  * Saldo voucher hanya untuk belanja di Kalensari Store, tidak bisa diisi ulang (top up).
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- 1) Kolom tambahan pesanan
alter table public.orders add column if not exists potong_saldo integer not null default 0;  -- bagian yang dibayar pakai saldo voucher
alter table public.orders add column if not exists refund       jsonb;
alter table public.orders add column if not exists batal_alasan text;
alter table public.orders add column if not exists paid_at      timestamptz;
alter table public.orders add column if not exists pay_status   text;

-- 2) Tabel saldo, riwayat, ajak tetangga
create table if not exists public.pembeli_saldo (
  wa         text primary key,                       -- nomor WA 62xxxx
  saldo      integer not null default 0 check (saldo >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.pembeli_mutasi (
  id          bigserial primary key,
  wa          text not null,
  jumlah      integer not null,                     -- + masuk, - dipakai
  jenis       text not null,                        -- refund | kompensasi | ajak | ajak_baru | pakai | koreksi
  ket         text,
  order_code  text,
  saldo_akhir integer,
  t           timestamptz not null default now()
);
create index if not exists pembeli_mutasi_wa_idx on public.pembeli_mutasi(wa, t desc);
create unique index if not exists pembeli_mutasi_unik on public.pembeli_mutasi(order_code, jenis)
  where order_code is not null and jenis in ('refund','kompensasi','ajak','ajak_baru','pakai');
create table if not exists public.pembeli_ajak (
  wa         text primary key,                      -- pembeli baru
  pengundang text not null,                         -- WA pengundang
  t          timestamptz not null default now(),
  status     text not null default 'menunggu',      -- menunggu | selesai | kedaluwarsa | batal
  order_code text,
  selesai_t  timestamptz,
  ket        text
);
create index if not exists pembeli_ajak_pengundang_idx on public.pembeli_ajak(pengundang, status);

alter table public.pembeli_saldo  enable row level security;
alter table public.pembeli_mutasi enable row level security;
alter table public.pembeli_ajak   enable row level security;
drop policy if exists "pembeli_saldo_baca"  on public.pembeli_saldo;
create policy "pembeli_saldo_baca"  on public.pembeli_saldo  for select to anon, authenticated using (true);
drop policy if exists "pembeli_mutasi_baca" on public.pembeli_mutasi;
create policy "pembeli_mutasi_baca" on public.pembeli_mutasi for select to anon, authenticated using (true);
drop policy if exists "pembeli_ajak_baca"   on public.pembeli_ajak;
create policy "pembeli_ajak_baca"   on public.pembeli_ajak   for select to anon, authenticated using (true);
grant select on public.pembeli_saldo, public.pembeli_mutasi, public.pembeli_ajak to anon, authenticated;
revoke insert, update, delete on public.pembeli_saldo, public.pembeli_mutasi, public.pembeli_ajak from anon, authenticated;

-- 3) Pengaturan (admin): store_settings "voucher_aturan"
create or replace function public.ks_voucher()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('aktif', true, 'kompensasi', 2000,
           'ajak', jsonb_build_object('aktif', true, 'pengundang', 5000, 'baru', 5000, 'min', 20000, 'maksBulan', 10, 'hari', 30))
         || coalesce((select value from public.store_settings where key = 'voucher_aturan'), '{}'::jsonb)
$$;

-- Kunci pengaturan yang hanya boleh diubah admin (tambahan, tanpa mengubah aturan lama)
drop policy if exists "ks_kunci_admin_ins" on public.store_settings;
create policy "ks_kunci_admin_ins" on public.store_settings as restrictive for insert to anon, authenticated
  with check (key not in ('voucher_aturan','aturan_toko_tutup','pelanggaran_toko','kontak_support') or public.is_admin());
drop policy if exists "ks_kunci_admin_upd" on public.store_settings;
create policy "ks_kunci_admin_upd" on public.store_settings as restrictive for update to anon, authenticated
  using      (key not in ('voucher_aturan','aturan_toko_tutup','pelanggaran_toko','kontak_support') or public.is_admin())
  with check (key not in ('voucher_aturan','aturan_toko_tutup','pelanggaran_toko','kontak_support') or public.is_admin());
drop policy if exists "ks_kunci_admin_del" on public.store_settings;
create policy "ks_kunci_admin_del" on public.store_settings as restrictive for delete to anon, authenticated
  using (key not in ('voucher_aturan','aturan_toko_tutup','pelanggaran_toko','kontak_support') or public.is_admin());

-- 4) Ubah saldo + catat riwayat (internal)
create or replace function public.ks_saldo_pembeli(p_wa text, p_jumlah integer, p_jenis text, p_ket text, p_order text)
returns integer language plpgsql security definer set search_path = public as $$
declare akhir integer;
begin
  if p_wa is null or p_wa = '' or p_jumlah = 0 then return null; end if;
  if p_jumlah < 0 then
    update public.pembeli_saldo set saldo = saldo + p_jumlah, updated_at = now() where wa = p_wa returning saldo into akhir;
    if akhir is null then raise exception 'Saldo voucher tidak cukup'; end if;
  else
    insert into public.pembeli_saldo (wa, saldo) values (p_wa, p_jumlah)
    on conflict (wa) do update set saldo = public.pembeli_saldo.saldo + p_jumlah, updated_at = now()
    returning saldo into akhir;
  end if;
  insert into public.pembeli_mutasi (wa, jumlah, jenis, ket, order_code, saldo_akhir)
  values (p_wa, p_jumlah, p_jenis, p_ket, p_order, akhir);
  return akhir;
end $$;
revoke all on function public.ks_saldo_pembeli(text, integer, text, text, text) from public, anon, authenticated;

-- Cek PIN pembeli (sama dengan cara akun-pembeli.html menyimpan PIN)
create or replace function public.ks_pin_pembeli_ok(p_wa text, p_pin text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select coalesce((select value->p_wa->>'h' from public.store_settings where key = 'pembeli_accounts')
                  = encode(extensions.digest('kalensari-pembeli:' || p_wa || ':' || coalesce(p_pin, ''), 'sha256'), 'hex'), false)
$$;
revoke all on function public.ks_pin_pembeli_ok(text, text) from public, anon, authenticated;

-- 5) PEMBELI: pakai saldo voucher untuk pesanan yang baru dibuat (QRIS / bayar penuh dengan saldo)
create or replace function public.pakai_saldo(p_wa text, p_pin text, p_codes text[], p_jumlah integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare punya integer; jml_total integer := 0; sisa integer; ambil integer; o record; akhir integer; n integer;
begin
  if not public.ks_pin_pembeli_ok(p_wa, p_pin) then raise exception 'PIN salah'; end if;
  if p_jumlah is null or p_jumlah <= 0 then raise exception 'Jumlah tidak valid'; end if;
  select saldo into punya from public.pembeli_saldo where wa = p_wa for update;
  if coalesce(punya, 0) < p_jumlah then raise exception 'Saldo voucher tidak cukup'; end if;
  select count(*), coalesce(sum(total), 0) into n, jml_total from public.orders
   where order_code = any(p_codes) and customer_phone_normalized = p_wa
     and coalesce(status, 'menunggu') in ('menunggu', 'baru') and coalesce(pay_status, '') not in ('lunas', 'tunggu_wa')
     and coalesce(potong_saldo, 0) = 0 and (payment ilike 'qris%' or payment ilike 'saldo%');
  if n = 0 or n <> coalesce(array_length(p_codes, 1), 0) then raise exception 'Pesanan tidak bisa dibayar dengan saldo'; end if;
  if p_jumlah > jml_total then raise exception 'Saldo yang dipakai melebihi total'; end if;
  if jml_total - p_jumlah between 1 and 999 then raise exception 'Sisa bayar QRIS minimal Rp1.000'; end if;
  sisa := p_jumlah;
  for o in select id, order_code, total from public.orders where order_code = any(p_codes) order by order_code for update loop
    exit when sisa <= 0;
    ambil := least(sisa, coalesce(o.total, 0));
    if ambil > 0 then
      update public.orders set total = total - ambil, potong_saldo = ambil, updated_at = now() where id = o.id;
      akhir := public.ks_saldo_pembeli(p_wa, -ambil, 'pakai', 'Belanja ' || o.order_code, o.order_code);
      sisa := sisa - ambil;
    end if;
  end loop;
  if p_jumlah = jml_total then
    update public.orders set pay_status = 'lunas', paid_at = now(), payment = 'Saldo voucher', updated_at = now()
     where order_code = any(p_codes);
  end if;
  return jsonb_build_object('saldo', coalesce(akhir, punya - p_jumlah), 'sisa', jml_total - p_jumlah);
end $$;
revoke all on function public.pakai_saldo(text, text, text[], integer) from public;
grant execute on function public.pakai_saldo(text, text, text[], integer) to anon, authenticated;

-- 6) PEMBELI: masukkan kode ajak tetangga (ID akun PB-xxxx atau nomor WA teman)
create or replace function public.pakai_kode_ajak(p_wa text, p_pin text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb := public.ks_voucher(); kode text := upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'));
        mid text; v_peng text; nama text; acc jsonb;
begin
  if not public.ks_pin_pembeli_ok(p_wa, p_pin) then raise exception 'PIN salah'; end if;
  if coalesce((v->'ajak'->>'aktif')::boolean, true) is not true then raise exception 'Program ajak tetangga sedang tidak aktif'; end if;
  select value into acc from public.store_settings where key = 'pembeli_accounts';
  if kode ~ '^PB-?[0-9]+$' then
    kode := 'PB-' || lpad(regexp_replace(kode, '\D', '', 'g')::int::text, 4, '0');
    select x->>'id', x->>'nama' into mid, nama from public.store_settings s, jsonb_array_elements(s.value) x
     where s.key = 'pembeli_members' and jsonb_typeof(s.value) = 'array' and upper(x->>'kode') = kode limit 1;
    select k into v_peng from jsonb_each(acc) e(k, val) where val->>'id' = mid limit 1;
  else
    v_peng := regexp_replace(regexp_replace(kode, '\D', '', 'g'), '^0', '62');
    select x->>'nama' into nama from public.store_settings s, jsonb_array_elements(s.value) x
     where s.key = 'pembeli_members' and jsonb_typeof(s.value) = 'array' and x->>'id' = acc->v_peng->>'id' limit 1;
  end if;
  if v_peng is null or v_peng = '' or not coalesce(acc ? v_peng, false) then raise exception 'Kode tidak ditemukan'; end if;
  if v_peng = p_wa then raise exception 'Tidak bisa memakai kode sendiri'; end if;
  if exists (select 1 from public.pembeli_ajak where wa = p_wa) then raise exception 'Anda sudah pernah memakai kode ajak'; end if;
  if exists (select 1 from public.pembeli_ajak where pembeli_ajak.wa = v_peng and pembeli_ajak.pengundang = p_wa) then raise exception 'Kode ini tidak bisa dipakai'; end if;
  if exists (select 1 from public.orders where customer_phone_normalized = p_wa and status = 'selesai') then
    raise exception 'Kode ajak hanya untuk pembeli yang belum pernah belanja';
  end if;
  insert into public.pembeli_ajak (wa, pengundang) values (p_wa, v_peng);
  return jsonb_build_object('nama', coalesce(nama, 'teman Anda'), 'bonus', (v->'ajak'->>'baru')::int, 'min', (v->'ajak'->>'min')::int);
end $$;
revoke all on function public.pakai_kode_ajak(text, text, text) from public;
grant execute on function public.pakai_kode_ajak(text, text, text) to anon, authenticated;

-- 7) ADMIN: tambah / kurangi saldo voucher pembeli
create or replace function public.koreksi_saldo_pembeli(p_wa text, p_jumlah integer, p_ket text)
returns integer language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_jumlah = 0 then raise exception 'Jumlah tidak boleh 0'; end if;
  return public.ks_saldo_pembeli(regexp_replace(regexp_replace(p_wa, '\D', '', 'g'), '^0', '62'), p_jumlah, 'koreksi', coalesce(nullif(p_ket, ''), 'Koreksi admin'), null);
end $$;
revoke all on function public.koreksi_saldo_pembeli(text, integer, text) from public;
grant execute on function public.koreksi_saldo_pembeli(text, integer, text) to authenticated;

-- 8) PENJAGA tabel orders untuk akses dari halaman web (peran anon)
create or replace function public.ks_jaga_orders()
returns trigger language plpgsql as $$
declare r_old int; r_new int;
begin
  if current_user <> 'anon' then return new; end if;
  if tg_op = 'INSERT' then
    if coalesce(new.pay_status, '') not in ('', 'tunggu_wa') then new.pay_status := null; end if;
    new.paid_at := null; new.potong_saldo := 0; new.refund := null;
    return new;
  end if;
  new.pay_status := old.pay_status; new.paid_at := old.paid_at; new.potong_saldo := old.potong_saldo;
  if old.refund is not null and new.refund is distinct from old.refund then new.refund := old.refund; end if;
  if new.refund is not null and coalesce(new.refund->>'status', 'menunggu') <> 'menunggu' then new.refund := old.refund; end if;
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

-- 9) Nota DIBATALKAN -> uang kembali sebagai saldo voucher (+ kompensasi & pelanggaran bila toko tutup)
create or replace function public.ks_voucher_batal()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb := public.ks_voucher(); v_wa text := nullif(new.customer_phone_normalized, '');
        bayar int; jml int := 0; komp int := 0; alasan text := coalesce(new.batal_alasan, 'pesanan dibatalkan');
        a jsonb; toko text; k text; potong int := 0; n int; sejak timestamptz; daftar jsonb;
begin
  if new.status is distinct from 'dibatalkan' or coalesce(old.status, 'menunggu') not in ('menunggu', 'baru', 'diproses') then return null; end if;
  if v_wa is null then v_wa := regexp_replace(regexp_replace(coalesce(new.customer_phone, ''), '\D', '', 'g'), '^0', '62'); end if;
  -- a) uang yang sudah dibayar (QRIS / saldo) kembali sebagai saldo voucher
  if new.pay_status = 'lunas' then
    bayar := coalesce(old.total, 0) + coalesce(old.potong_saldo, 0);
    jml := least(bayar, coalesce((new.refund->>'jumlah')::int, bayar));
  else
    jml := coalesce(old.potong_saldo, 0);                  -- QRIS belum dibayar: saldo yang sempat dipakai kembali
  end if;
  if jml > 0 and v_wa <> '' and not exists (select 1 from public.pembeli_mutasi where order_code = new.order_code and jenis = 'refund') then
    perform public.ks_saldo_pembeli(v_wa, jml, 'refund', 'Pengembalian ' || new.order_code || ' (' || regexp_replace(alasan, '\s*\(dilaporkan kurir.*\)$', '') || ')', new.order_code);
    update public.orders set refund = coalesce(refund, '{}'::jsonb) || jsonb_build_object('jumlah', jml, 'status', 'saldo', 'saldo_t', now()) where id = new.id;
  end if;
  -- b) toko tutup saat kurir datang: kompensasi pembeli + catatan pelanggaran toko
  if old.status = 'diproses' and alasan ilike '%dilaporkan kurir%' then
    if coalesce((v->>'aktif')::boolean, true) then komp := greatest(coalesce((v->>'kompensasi')::int, 0), 0); end if;
    if komp > 0 and v_wa <> '' and not exists (select 1 from public.pembeli_mutasi where order_code = new.order_code and jenis = 'kompensasi') then
      perform public.ks_saldo_pembeli(v_wa, komp, 'kompensasi', 'Kompensasi toko tutup (' || new.order_code || ')', new.order_code);
    end if;
    a := jsonb_build_object('maks', 3, 'potong', true, 'reset', '{}'::jsonb) || coalesce((select value from public.store_settings where key = 'aturan_toko_tutup'), '{}'::jsonb);
    toko := split_part(coalesce(new.items->0->>'seller', 'Toko'), ',', 1); k := lower(trim(toko));
    if coalesce((a->>'potong')::boolean, true) then
      potong := (case when new.pay_status = 'lunas' then coalesce((new.refund->>'ongkir')::int, 0) else 0 end) + komp;
    end if;
    insert into public.store_settings (key, value) values ('pelanggaran_toko', '{}'::jsonb) on conflict (key) do nothing;
    update public.store_settings
       set value = jsonb_set(case when jsonb_typeof(value) = 'object' then value else '{}'::jsonb end, array[k],
                   coalesce(case when jsonb_typeof(value->k) = 'array' then value->k end, '[]'::jsonb)
                   || jsonb_build_array(jsonb_build_object('kode', new.order_code, 't', now(), 'ket', alasan, 'nama', trim(toko), 'potong', potong, 'kompensasi', komp)))
     where key = 'pelanggaran_toko'
     returning value->k into daftar;
    sejak := coalesce(nullif(a->'reset'->>k, '')::timestamptz, '-infinity');
    select count(*) into n from jsonb_array_elements(daftar) x where (x->>'t')::timestamptz > sejak;
    if coalesce((a->>'maks')::int, 0) > 0 and n >= (a->>'maks')::int then
      insert into public.store_settings (key, value) values ('closed_sellers', jsonb_build_object(k, true))
      on conflict (key) do update set value = case when jsonb_typeof(public.store_settings.value) = 'object' then public.store_settings.value else '{}'::jsonb end || jsonb_build_object(k, true);
    end if;
  end if;
  return null;
end $$;
drop trigger if exists ks_voucher_batal on public.orders;
create trigger ks_voucher_batal after update on public.orders
  for each row when (new.status = 'dibatalkan' and old.status is distinct from new.status)
  execute function public.ks_voucher_batal();

-- 10) Pesanan pertama teman SELESAI -> bonus ajak tetangga untuk keduanya
create or replace function public.ks_voucher_ajak()
returns trigger language plpgsql security definer set search_path = public as $$
declare v jsonb := public.ks_voucher(); aj jsonb := v->'ajak'; r public.pembeli_ajak%rowtype; v_wa text := nullif(new.customer_phone_normalized, '');
        bulan int;
begin
  if v_wa is null then return null; end if;
  select * into r from public.pembeli_ajak where pembeli_ajak.wa = v_wa and status = 'menunggu' for update;
  if not found then return null; end if;
  if r.t < now() - make_interval(days => coalesce((aj->>'hari')::int, 30)) then
    update public.pembeli_ajak set status = 'kedaluwarsa' where pembeli_ajak.wa = v_wa; return null;
  end if;
  if coalesce((aj->>'aktif')::boolean, true) is not true then return null; end if;
  if coalesce(new.subtotal, 0) < coalesce((aj->>'min')::int, 0) then return null; end if;   -- tunggu pesanan yang cukup besar
  select count(*) into bulan from public.pembeli_ajak where pengundang = r.pengundang and status = 'selesai'
     and selesai_t >= date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta';
  if coalesce((aj->>'baru')::int, 0) > 0 then
    perform public.ks_saldo_pembeli(v_wa, (aj->>'baru')::int, 'ajak_baru', 'Bonus pembeli baru (diajak tetangga)', new.order_code);
  end if;
  if coalesce((aj->>'pengundang')::int, 0) > 0 and bulan < coalesce((aj->>'maksBulan')::int, 10) then
    perform public.ks_saldo_pembeli(r.pengundang, (aj->>'pengundang')::int, 'ajak', 'Bonus ajak tetangga (' || left(v_wa, 4) || '****' || right(v_wa, 3) || ')', new.order_code);
    update public.pembeli_ajak set status = 'selesai', order_code = new.order_code, selesai_t = now() where pembeli_ajak.wa = v_wa;
  else
    update public.pembeli_ajak set status = 'selesai', order_code = new.order_code, selesai_t = now(), ket = 'Batas bonus pengundang bulan ini tercapai' where pembeli_ajak.wa = v_wa;
  end if;
  return null;
end $$;
drop trigger if exists ks_voucher_ajak on public.orders;
create trigger ks_voucher_ajak after update on public.orders
  for each row when (new.status = 'selesai' and old.status is distinct from new.status)
  execute function public.ks_voucher_ajak();

-- Cek: harus menampilkan true semua
select exists (select 1 from pg_proc where proname = 'pakai_saldo')          as pakai_saldo,
       exists (select 1 from pg_trigger where tgname = 'ks_jaga_orders')      as penjaga_orders,
       exists (select 1 from pg_trigger where tgname = 'ks_voucher_batal')    as refund_ke_saldo,
       exists (select 1 from pg_trigger where tgname = 'ks_voucher_ajak')     as bonus_ajak;
