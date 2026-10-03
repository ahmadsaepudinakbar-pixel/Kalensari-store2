-- =====================================================================
-- KALENSARI STORE - Saldo kurir (deposit) & potongan per pesanan
-- Jalankan SEKALI di Supabase > SQL Editor. Aman dijalankan ulang.
-- Saldo hanya bisa ditambah admin & dipotong otomatis oleh database.
-- Tidak berisi kode rahasia.
-- =====================================================================

-- 1) Tabel saldo, riwayat (mutasi) & permintaan isi saldo
create table if not exists public.kurir_saldo (
  kurir_id   text primary key,
  saldo      integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.kurir_mutasi (
  id         bigserial primary key,
  kurir_id   text not null,
  jumlah     integer not null,                 -- + isi saldo, - potongan
  jenis      text not null,                    -- topup | potong | koreksi
  ket        text,
  order_code text,
  saldo_akhir integer,
  t          timestamptz not null default now()
);
create unique index if not exists kurir_mutasi_potong_unik on public.kurir_mutasi(order_code) where jenis = 'potong';
create index if not exists kurir_mutasi_kurir_idx on public.kurir_mutasi(kurir_id, t desc);
create table if not exists public.kurir_topup (
  id         bigserial primary key,
  kurir_id   text not null,
  nama       text,
  wa         text,
  jumlah     integer not null,
  bukti      text,                             -- foto bukti (opsional)
  status     text not null default 'menunggu', -- menunggu | diterima | ditolak
  catatan    text,
  t          timestamptz not null default now(),
  diproses_t timestamptz
);
create index if not exists kurir_topup_kurir_idx on public.kurir_topup(kurir_id, t desc);

alter table public.kurir_saldo  enable row level security;
alter table public.kurir_mutasi enable row level security;
alter table public.kurir_topup  enable row level security;
-- Boleh DIBACA (kurir melihat saldonya, aplikasi memeriksa saldo); TIDAK boleh diubah langsung.
drop policy if exists "kurir_saldo_baca"  on public.kurir_saldo;
create policy "kurir_saldo_baca"  on public.kurir_saldo  for select to anon, authenticated using (true);
drop policy if exists "kurir_mutasi_baca" on public.kurir_mutasi;
create policy "kurir_mutasi_baca" on public.kurir_mutasi for select to anon, authenticated using (true);
drop policy if exists "kurir_topup_baca"  on public.kurir_topup;
create policy "kurir_topup_baca"  on public.kurir_topup  for select to anon, authenticated using (true);
grant select on public.kurir_saldo, public.kurir_mutasi, public.kurir_topup to anon, authenticated;

-- 2) Pengaturan biaya (diatur admin di admin.html > Pengaturan)
create or replace function public.ks_biaya()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select value from public.store_settings where key = 'kurir_biaya'), '{}'::jsonb)
$$;

-- Tambah/kurangi saldo + catat mutasi (dipakai fungsi lain, tidak bisa dipanggil langsung)
create or replace function public.ks_ubah_saldo(p_kurir text, p_jumlah integer, p_jenis text, p_ket text, p_order text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare akhir integer;
begin
  insert into public.kurir_saldo (kurir_id, saldo) values (p_kurir, p_jumlah)
  on conflict (kurir_id) do update set saldo = public.kurir_saldo.saldo + p_jumlah, updated_at = now()
  returning saldo into akhir;
  insert into public.kurir_mutasi (kurir_id, jumlah, jenis, ket, order_code, saldo_akhir)
  values (p_kurir, p_jumlah, p_jenis, p_ket, p_order, akhir);
  return akhir;
end;
$$;
revoke all on function public.ks_ubah_saldo(text, integer, text, text, text) from public, anon, authenticated;

-- 3) Kurir mengajukan isi saldo (admin yang mengonfirmasi)
create or replace function public.ajukan_topup(p_kurir_id text, p_jumlah integer, p_bukti text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare b jsonb := public.ks_biaya(); minimal integer := coalesce((b->>'minTopup')::int, 20000);
        m jsonb; new_id bigint;
begin
  if p_jumlah is null or p_jumlah < minimal or p_jumlah > 5000000 then
    raise exception 'Isi saldo minimal Rp%', minimal;
  end if;
  select x into m from public.store_settings s, jsonb_array_elements(s.value) x
   where s.key = 'kurir_members' and jsonb_typeof(s.value) = 'array' and x->>'id' = p_kurir_id limit 1;
  if m is null then raise exception 'Kurir tidak ditemukan'; end if;
  if (select count(*) from public.kurir_topup where kurir_id = p_kurir_id and status = 'menunggu') >= 3 then
    raise exception 'Masih ada 3 permintaan menunggu konfirmasi admin';
  end if;
  if p_bukti is not null and (length(p_bukti) > 400000 or p_bukti !~ '^data:image/(jpeg|png|webp);base64,') then
    p_bukti := null;
  end if;
  insert into public.kurir_topup (kurir_id, nama, wa, jumlah, bukti)
  values (p_kurir_id, m->>'nama', m->>'wa', p_jumlah, p_bukti)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.ajukan_topup(text, integer, text) from public;
grant execute on function public.ajukan_topup(text, integer, text) to anon, authenticated;

-- 4) Admin menerima / menolak permintaan isi saldo
create or replace function public.proses_topup(p_id bigint, p_terima boolean, p_catatan text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare r public.kurir_topup%rowtype; akhir integer;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select * into r from public.kurir_topup where id = p_id for update;
  if not found then raise exception 'Permintaan tidak ditemukan'; end if;
  if r.status <> 'menunggu' then raise exception 'Permintaan sudah diproses'; end if;
  update public.kurir_topup set status = case when p_terima then 'diterima' else 'ditolak' end,
         catatan = p_catatan, diproses_t = now() where id = p_id;
  if p_terima then
    akhir := public.ks_ubah_saldo(r.kurir_id, r.jumlah, 'topup', coalesce(p_catatan, 'Isi saldo'), null);
  end if;
  return coalesce(akhir, (select saldo from public.kurir_saldo where kurir_id = r.kurir_id), 0);
end;
$$;
revoke all on function public.proses_topup(bigint, boolean, text) from public;
grant execute on function public.proses_topup(bigint, boolean, text) to authenticated;

-- 5) Admin menambah / mengurangi saldo langsung (mis. bayar tunai ke admin, bonus, koreksi)
create or replace function public.koreksi_saldo(p_kurir_id text, p_jumlah integer, p_ket text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_jumlah = 0 then raise exception 'Jumlah tidak boleh 0'; end if;
  return public.ks_ubah_saldo(p_kurir_id, p_jumlah, case when p_jumlah > 0 then 'topup' else 'koreksi' end, coalesce(nullif(p_ket, ''), 'Koreksi admin'), null);
end;
$$;
revoke all on function public.koreksi_saldo(text, integer, text) from public;
grant execute on function public.koreksi_saldo(text, integer, text) to authenticated;

-- 6) Potong otomatis saat pesanan menjadi "selesai" (sekali per pesanan)
create or replace function public.ks_potong_saldo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare b jsonb := public.ks_biaya(); kid text; potong integer; ongkir integer; persen numeric; ket text;
begin
  if coalesce((b->>'aktif')::boolean, false) is not true then return null; end if;
  select coalesce(
           (select value->>'id' from public.store_settings where key = 'antar_' || new.order_code),
           (select value->'acc'->>'id' from public.store_settings where key = 'kurir_ord_' || new.order_code))
    into kid;
  if kid is null or kid = '' then return null; end if;
  if exists (select 1 from public.kurir_mutasi where order_code = new.order_code and jenis = 'potong') then return null; end if;
  if coalesce(b->>'mode', 'nominal') = 'persen' then
    -- ongkir yang diterima kurir: ojek/kirim paket = total; belanja = ongkir pesanan
    ongkir := case when jsonb_typeof(new.items) = 'array' and (new.items->0) ? 'layanan'
                   then coalesce(new.total, 0) else coalesce(new.shipping, 0) end;
    persen := least(greatest(coalesce((b->>'persen')::numeric, 10), 0), 100);
    potong := (round(ongkir * persen / 100.0 / 100.0) * 100)::int;          -- dibulatkan ke Rp100 terdekat
    ket := 'Potongan ' || trim(to_char(persen, 'FM990.##')) || '% dari ongkir Rp' || ongkir || ' (' || new.order_code || ')';
  else
    potong := coalesce((b->>'potong')::int, 1000);
    ket := 'Potongan pesanan ' || new.order_code;
  end if;
  if potong is null or potong <= 0 then return null; end if;
  perform public.ks_ubah_saldo(kid, -potong, 'potong', ket, new.order_code);
  return null;
end;
$$;
drop trigger if exists ks_potong_saldo on public.orders;
create trigger ks_potong_saldo
  after update on public.orders
  for each row when (new.status = 'selesai' and old.status is distinct from new.status)
  execute function public.ks_potong_saldo();

-- 7) Notifikasi: permintaan isi saldo -> admin, hasil konfirmasi -> kurir
drop trigger if exists ks_notif_topup on public.kurir_topup;
create trigger ks_notif_topup
  after insert or update on public.kurir_topup
  for each row execute function public.notif_colek();

-- 8) Pengaturan biaya hanya bisa diubah admin
create or replace function public.is_admin_setting_key(k text)
returns boolean
language sql
immutable
as $$
  select k in ('categories','removed_categories','shipping_fees',
               'whatsapp_number','closed_sellers','seller_schedule',
               'admin_pin_hash','jasa_categories','jasa_providers',
               'transport_tariff','transport_places','google_maps',
               'admin_push','kurir_biaya');
$$;

-- 9) Saldo awal kurir baru (diberikan sekali saat admin menyetujui kurir)
create unique index if not exists kurir_mutasi_awal_unik on public.kurir_mutasi(kurir_id) where jenis = 'awal';
-- Admin memberi saldo awal (hanya SEKALI per kurir). Hasil: saldo akhir, atau null bila tidak diberikan.
create or replace function public.beri_saldo_awal(p_kurir_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare jml integer := coalesce((public.ks_biaya()->>'saldoAwal')::int, 10000);
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if jml <= 0 or p_kurir_id is null or p_kurir_id = '' then return null; end if;
  if exists (select 1 from public.kurir_mutasi where kurir_id = p_kurir_id and jenis = 'awal') then return null; end if;
  return public.ks_ubah_saldo(p_kurir_id, jml, 'awal', 'Saldo awal kurir baru', null);
end;
$$;
revoke all on function public.beri_saldo_awal(text) from public;
grant execute on function public.beri_saldo_awal(text) to authenticated;

-- Cek: harus menampilkan true, true, true
select exists (select 1 from pg_proc where proname = 'ajukan_topup')       as ajukan_topup,
       exists (select 1 from pg_trigger where tgname = 'ks_potong_saldo')  as potong_otomatis,
       public.is_admin_setting_key('kurir_biaya')                          as biaya_khusus_admin;
