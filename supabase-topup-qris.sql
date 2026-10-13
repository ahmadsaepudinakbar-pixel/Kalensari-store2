-- =====================================================================
-- Kalensari Store • ISI SALDO KURIR LEWAT QRIS OTOMATIS (iPaymu)
-- Alur: aplikasi kurir -> Edge Function "ipaymu-qris" (aksi topup_buat / topup_cek)
--       -> fungsi di bawah ini (hanya bisa dipanggil server / service_role).
-- Status baris kurir_topup:
--   qris        = QR sudah dibuat, menunggu kurir membayar (TIDAK muncul di antrean admin)
--   diterima    = sudah dibayar, saldo otomatis masuk
--   kedaluwarsa = QR lewat 15 menit tanpa pembayaran
--   menunggu    = nominal yang dibayar kurang -> jumlah diganti nominal yang dibayar, admin memeriksa seperti biasa
-- Cara lama (QRIS statis + unggah bukti + ACC admin) tetap berjalan.
-- Jalankan SETELAH supabase-saldo-kurir.sql & supabase-keamanan-pesanan.sql. Aman diulang.
-- =====================================================================

alter table public.kurir_topup add column if not exists pay_order_id text;
alter table public.kurir_topup add column if not exists pay_ref      text;
alter table public.kurir_topup add column if not exists pay_qr       text;
alter table public.kurir_topup add column if not exists pay_expire   timestamptz;
create unique index if not exists kurir_topup_pay_order on public.kurir_topup (pay_order_id) where pay_order_id is not null;

-- 1) Kurir memulai isi saldo QRIS (sesi kurir diperiksa di server)
create or replace function public.topup_qris_mulai(p_sesi text, p_jumlah integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k jsonb := public.ks_kurir_sesi(p_sesi); b jsonb := public.ks_biaya();
        minimal integer := coalesce((b->>'minTopup')::int, 20000); r public.kurir_topup%rowtype;
begin
  if p_jumlah is null or p_jumlah < minimal or p_jumlah > 5000000 then raise exception 'Isi saldo minimal Rp%', minimal; end if;
  perform pg_advisory_xact_lock(hashtext('ks_topup:' || (k->>'id')));
  -- QR yang masih berlaku untuk nominal yang sama dipakai lagi (kurir menutup lalu membuka lagi)
  select * into r from public.kurir_topup
   where kurir_id = k->>'id' and status = 'qris' and jumlah = p_jumlah and pay_qr is not null and pay_expire > now() + interval '1 minute'
   order by id desc limit 1;
  if found then
    return jsonb_build_object('id', r.id, 'pakai_lagi', true, 'qr', r.pay_qr, 'expire', r.pay_expire, 'jumlah', r.jumlah, 'nama', k->>'nama', 'wa', k->>'wa');
  end if;
  -- QR lama yang tidak dibayar ditutup
  update public.kurir_topup set status = 'kedaluwarsa', diproses_t = now()
   where kurir_id = k->>'id' and status = 'qris' and (pay_expire is null or pay_expire < now());
  if (select count(*) from public.kurir_topup where kurir_id = k->>'id' and status = 'qris') >= 3 then
    raise exception 'Masih ada 3 QR isi saldo yang belum dibayar. Bayar salah satunya atau tunggu 15 menit.';
  end if;
  insert into public.kurir_topup (kurir_id, nama, wa, jumlah, status, catatan)
  values (k->>'id', k->>'nama', k->>'wa', p_jumlah, 'qris', 'QRIS otomatis')
  returning * into r;
  return jsonb_build_object('id', r.id, 'pakai_lagi', false, 'jumlah', r.jumlah, 'nama', k->>'nama', 'wa', k->>'wa');
end $$;

-- 2) Simpan QR dari iPaymu
create or replace function public.topup_qris_simpan(p_id bigint, p_ref text, p_trx text, p_qr text, p_expire timestamptz)
returns void language sql security definer set search_path = public as $$
  update public.kurir_topup set pay_order_id = p_ref, pay_ref = p_trx, pay_qr = p_qr, pay_expire = p_expire
   where id = p_id and status = 'qris'
$$;

-- 3) Status isi saldo milik kurir yang sedang masuk
create or replace function public.topup_qris_status(p_sesi text, p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k jsonb := public.ks_kurir_sesi(p_sesi); r public.kurir_topup%rowtype;
begin
  select * into r from public.kurir_topup where id = p_id and kurir_id = k->>'id';
  if not found then raise exception 'Isi saldo tidak ditemukan'; end if;
  return jsonb_build_object('id', r.id, 'status', r.status, 'jumlah', r.jumlah, 'pay_ref', r.pay_ref,
    'pay_order_id', r.pay_order_id, 'pay_expire', r.pay_expire,
    'saldo', coalesce((select saldo from public.kurir_saldo where kurir_id = r.kurir_id), 0));
end $$;

-- 4) Pembayaran berhasil (dipanggil setelah status dicek ulang ke iPaymu). Aman dipanggil berkali-kali.
create or replace function public.topup_qris_lunas(p_ref text, p_trx text, p_dibayar integer)
returns text language plpgsql security definer set search_path = public as $$
declare r public.kurir_topup%rowtype;
begin
  select * into r from public.kurir_topup where pay_order_id = p_ref for update;
  if not found then return 'tidak_ada'; end if;
  if r.status = 'diterima' then return 'sudah'; end if;
  if r.status not in ('qris', 'kedaluwarsa') then return r.status; end if;   -- kedaluwarsa tapi uang masuk: tetap dikreditkan
  if coalesce(p_dibayar, 0) < r.jumlah then
    -- nominal diganti dengan yang benar-benar dibayar, supaya ACC admin tidak mengkreditkan jumlah penuh
    update public.kurir_topup set status = 'menunggu', pay_ref = p_trx, jumlah = greatest(coalesce(p_dibayar, 0), 0),
           catatan = 'QRIS: dibayar Rp' || coalesce(p_dibayar, 0) || ' dari Rp' || r.jumlah || ' (kurang). Mohon dicek mutasi.'
     where id = r.id;
    return 'kurang';
  end if;
  update public.kurir_topup set status = 'diterima', pay_ref = p_trx, diproses_t = now(), catatan = 'QRIS otomatis iPaymu'
   where id = r.id;
  perform public.ks_ubah_saldo(r.kurir_id, r.jumlah, 'topup', 'Isi saldo QRIS otomatis', null);
  return 'lunas';
end $$;

revoke all on function public.topup_qris_mulai(text, integer) from public, anon, authenticated;
revoke all on function public.topup_qris_simpan(bigint, text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.topup_qris_status(text, bigint) from public, anon, authenticated;
revoke all on function public.topup_qris_lunas(text, text, integer) from public, anon, authenticated;
grant execute on function public.topup_qris_mulai(text, integer) to service_role;
grant execute on function public.topup_qris_simpan(bigint, text, text, text, timestamptz) to service_role;
grant execute on function public.topup_qris_status(text, bigint) to service_role;
grant execute on function public.topup_qris_lunas(text, text, integer) to service_role;

-- Cek: harus true semua
select exists (select 1 from pg_proc where proname = 'topup_qris_mulai') as mulai,
       exists (select 1 from pg_proc where proname = 'topup_qris_lunas') as lunas,
       exists (select 1 from information_schema.columns where table_name = 'kurir_topup' and column_name = 'pay_qr') as kolom;
