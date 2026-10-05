-- =====================================================================
-- KALENSARI STORE • Keamanan akun tahap 1
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Jalankan SETELAH supabase-voucher-pembeli.sql dan supabase-otp-pembeli.sql.
--
-- Isi:
--  * Sandi PIN (hash) semua akun (pembeli, penjual, kurir, jasa) dipindah ke tabel tertutup "akun_pin".
--    Data akun di store_settings tetap ada (id akun), tetapi TANPA PIN, jadi tidak bisa ditebak dari web.
--  * Masuk & ganti PIN diperiksa di server. Salah 5x = akun dikunci 15 menit.
--  * Tidak ada yang bisa menimpa PIN / ID akun orang lain atau menghapus akun dari halaman web.
--    Pendaftaran baru tetap jalan seperti biasa. Admin tetap bisa reset PIN & hapus akun.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- 1) Tabel PIN tertutup (tanpa policy = tidak bisa dibaca/diubah dari web)
create table if not exists public.akun_pin (
  peran        text not null,              -- pembeli | penjual | kurir | jasa
  wa           text not null,
  h            text not null,
  gagal        integer not null default 0,
  kunci_sampai timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (peran, wa)
);
alter table public.akun_pin enable row level security;
revoke all on public.akun_pin from anon, authenticated;

create or replace function public.ks_peran_akun(k text)
returns text language sql immutable as $$
  select case k when 'pembeli_accounts' then 'pembeli' when 'penjual_accounts' then 'penjual'
                when 'kurir_accounts' then 'kurir' when 'jasa_accounts' then 'jasa' end
$$;

-- Hanya boleh dipanggil dari dalam trigger penjaga akun (bukan langsung dari web)
create or replace function public.ks_akun_pin_set(p_peran text, p_wa text, p_h text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() < 1 then raise exception 'Tidak diizinkan'; end if;
  insert into public.akun_pin (peran, wa, h) values (p_peran, p_wa, p_h)
  on conflict (peran, wa) do update set h = excluded.h, gagal = 0, kunci_sampai = null, updated_at = now();
end $$;
revoke all on function public.ks_akun_pin_set(text, text, text) from public;
grant execute on function public.ks_akun_pin_set(text, text, text) to anon, authenticated;

create or replace function public.ks_akun_pin_hapus(p_peran text, p_wa text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() < 1 then raise exception 'Tidak diizinkan'; end if;
  delete from public.akun_pin where peran = p_peran and wa = p_wa;
end $$;
revoke all on function public.ks_akun_pin_hapus(text, text) from public;
grant execute on function public.ks_akun_pin_hapus(text, text) to anon, authenticated;

-- 2) Penjaga data akun di store_settings
--    - PIN ("h") selalu dipindah ke akun_pin, tidak pernah tersimpan di data publik
--    - Pengunjung web hanya boleh MENAMBAH akun baru; tidak bisa mengubah PIN/ID atau menghapus akun orang lain
--    - Admin & fungsi server boleh semuanya
create or replace function public.ks_jaga_akun()
returns trigger language plpgsql set search_path = public as $$
declare v_peran text := public.ks_peran_akun(NEW.key); v_lama jsonb; v_baru jsonb := '{}'::jsonb;
        v_kuasa boolean; k text; v jsonb;
begin
  if v_peran is null then return NEW; end if;
  v_kuasa := current_user not in ('anon', 'authenticated') or coalesce(public.is_admin(), false);
  if TG_OP = 'UPDATE' then v_lama := OLD.value;
  elsif exists (select 1 from public.store_settings s where s.key = NEW.key) then
    return NEW;  -- baris sudah ada: upsert diteruskan ke pemeriksaan UPDATE di bawah (on conflict do update)
  end if;
  if v_lama is null or jsonb_typeof(v_lama) <> 'object' then v_lama := '{}'::jsonb; end if;
  if NEW.value is null or jsonb_typeof(NEW.value) <> 'object' then
    if v_kuasa then NEW.value := '{}'::jsonb; else raise exception 'Data akun tidak valid'; end if;
  end if;
  for k, v in select * from jsonb_each(NEW.value) loop
    if jsonb_typeof(v) <> 'object' then continue; end if;
    if v_kuasa or not (v_lama ? k) then
      if coalesce(v->>'h', '') <> '' then perform public.ks_akun_pin_set(v_peran, k, v->>'h'); end if;
      v_baru := v_baru || jsonb_build_object(k, v - 'h');
    else
      v_baru := v_baru || jsonb_build_object(k, (v - 'h' - 'id') || jsonb_build_object('id', v_lama->k->'id'));
    end if;
  end loop;
  for k, v in select * from jsonb_each(v_lama) loop
    if not (v_baru ? k) then
      if v_kuasa then perform public.ks_akun_pin_hapus(v_peran, k);
      else v_baru := v_baru || jsonb_build_object(k, v - 'h'); end if;
    end if;
  end loop;
  NEW.value := v_baru;
  return NEW;
end $$;
drop trigger if exists ks_jaga_akun on public.store_settings;
create trigger ks_jaga_akun before insert or update on public.store_settings
  for each row execute function public.ks_jaga_akun();

-- 3) Pindahkan PIN yang sudah ada ke tabel tertutup (sekali jalan; aman diulang)
update public.store_settings set value = value
 where key in ('pembeli_accounts', 'penjual_accounts', 'kurir_accounts', 'jasa_accounts');

-- 4) Cek PIN + kunci 15 menit setelah salah 5x (internal). Hasil: null = benar, teks = pesan salah
create or replace function public.ks_cek_pin(p_peran text, p_wa text, p_pin text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text := public.ks_wa(p_wa); r public.akun_pin%rowtype; v_ada boolean;
begin
  select coalesce((select s.value ? v_wa from public.store_settings s where s.key = p_peran || '_accounts'), false) into v_ada;
  select * into r from public.akun_pin where peran = p_peran and wa = v_wa for update;
  if not found or not v_ada then return 'Nomor atau PIN salah'; end if;
  if r.kunci_sampai > now() then
    return 'Akun dikunci sementara karena PIN salah 5 kali. Coba lagi ' || greatest(1, ceil(extract(epoch from r.kunci_sampai - now()) / 60))::int || ' menit lagi.';
  end if;
  if r.h = encode(extensions.digest('kalensari-' || p_peran || ':' || v_wa || ':' || coalesce(p_pin, ''), 'sha256'), 'hex') then
    if r.gagal > 0 or r.kunci_sampai is not null then
      update public.akun_pin set gagal = 0, kunci_sampai = null where peran = p_peran and wa = v_wa;
    end if;
    return null;
  end if;
  if r.gagal + 1 >= 5 then
    update public.akun_pin set gagal = 0, kunci_sampai = now() + interval '15 minutes' where peran = p_peran and wa = v_wa;
    return 'PIN salah 5 kali. Akun dikunci 15 menit.';
  end if;
  update public.akun_pin set gagal = gagal + 1 where peran = p_peran and wa = v_wa;
  return 'Nomor atau PIN salah (sisa ' || (4 - r.gagal) || ' kali sebelum dikunci)';
end $$;
revoke all on function public.ks_cek_pin(text, text, text) from public, anon, authenticated;

-- 5) MASUK akun (semua peran). Hasil: {ok:true, id, tmp} atau {ok:false, pesan, kunci}
create or replace function public.masuk_akun(p_peran text, p_wa text, p_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text := public.ks_wa(p_wa); v_salah text; a jsonb;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  v_salah := public.ks_cek_pin(p_peran, v_wa, p_pin);
  if v_salah is not null then
    return jsonb_build_object('ok', false, 'pesan', v_salah, 'kunci', v_salah like 'Akun dikunci%' or v_salah like 'PIN salah 5 kali%');
  end if;
  select s.value->v_wa into a from public.store_settings s where s.key = p_peran || '_accounts';
  return jsonb_build_object('ok', true, 'id', a->>'id', 'tmp', coalesce((a->>'tmp')::boolean, false));
end $$;
revoke all on function public.masuk_akun(text, text, text) from public;
grant execute on function public.masuk_akun(text, text, text) to anon, authenticated;

-- 6) GANTI PIN (semua peran): cek PIN lama di server
create or replace function public.ganti_pin_akun(p_peran text, p_wa text, p_pin_lama text, p_pin_baru text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare v_wa text := public.ks_wa(p_wa); v_salah text;
begin
  if p_peran not in ('pembeli', 'penjual', 'kurir', 'jasa') then raise exception 'Peran tidak valid'; end if;
  if coalesce(p_pin_baru, '') !~ '^\d{4,8}$' then raise exception 'PIN baru harus 4–8 angka'; end if;
  v_salah := public.ks_cek_pin(p_peran, v_wa, p_pin_lama);
  if v_salah is not null then
    return jsonb_build_object('ok', false, 'pesan', replace(v_salah, 'Nomor atau PIN salah', 'PIN lama salah'));
  end if;
  update public.akun_pin set h = encode(extensions.digest('kalensari-' || p_peran || ':' || v_wa || ':' || p_pin_baru, 'sha256'), 'hex'),
         gagal = 0, kunci_sampai = null, updated_at = now()
   where peran = p_peran and wa = v_wa;
  update public.store_settings set value = jsonb_set(value, array[v_wa], (value->v_wa) - 'tmp')
   where key = p_peran || '_accounts' and value->v_wa ? 'tmp';
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.ganti_pin_akun(text, text, text, text) from public;
grant execute on function public.ganti_pin_akun(text, text, text, text) to anon, authenticated;

-- 7) Fungsi pembeli lama disesuaikan
drop function if exists public.ganti_pin_pembeli(text, text, text);
create or replace function public.ganti_pin_pembeli(p_wa text, p_pin_lama text, p_pin_baru text)
returns jsonb language sql security definer set search_path = public as $$
  select public.ganti_pin_akun('pembeli', p_wa, p_pin_lama, p_pin_baru)
$$;
revoke all on function public.ganti_pin_pembeli(text, text, text) from public;
grant execute on function public.ganti_pin_pembeli(text, text, text) to anon, authenticated;

create or replace function public.ks_pin_pembeli_ok(p_wa text, p_pin text)
returns boolean language sql stable security definer set search_path = public, extensions as $$
  select coalesce((select h = encode(extensions.digest('kalensari-pembeli:' || p_wa || ':' || coalesce(p_pin, ''), 'sha256'), 'hex')
                     and coalesce(kunci_sampai, now() - interval '1 second') < now()
                     from public.akun_pin where peran = 'pembeli' and wa = p_wa), false)
$$;
revoke all on function public.ks_pin_pembeli_ok(text, text) from public, anon, authenticated;

-- Pakai saldo & kode ajak: PIN salah sekarang ikut dihitung (kunci 15 menit setelah 5x)
create or replace function public.pakai_saldo(p_wa text, p_pin text, p_codes text[], p_jumlah integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_salah text; punya integer; jml_total integer := 0; sisa integer; ambil integer; o record; akhir integer; n integer;
begin
  v_salah := public.ks_cek_pin('pembeli', p_wa, p_pin);
  if v_salah is not null then return jsonb_build_object('ok', false, 'pesan', replace(v_salah, 'Nomor atau PIN salah', 'PIN salah')); end if;
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

create or replace function public.pakai_kode_ajak(p_wa text, p_pin text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_salah text; v jsonb := public.ks_voucher(); kode text := upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'));
        mid text; v_peng text; nama text; acc jsonb;
begin
  v_salah := public.ks_cek_pin('pembeli', p_wa, p_pin);
  if v_salah is not null then return jsonb_build_object('ok', false, 'pesan', replace(v_salah, 'Nomor atau PIN salah', 'PIN salah')); end if;
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
-- Cek: kolom "pin_masih_terbuka" harus 0, yang lain true
select (select count(*) from public.store_settings s, jsonb_each(s.value) e
         where s.key in ('pembeli_accounts','penjual_accounts','kurir_accounts','jasa_accounts')
           and jsonb_typeof(s.value) = 'object' and e.value ? 'h') as pin_masih_terbuka,
       (select count(*) from public.akun_pin) as jumlah_pin_aman,
       exists (select 1 from pg_proc where proname = 'masuk_akun') as masuk_server,
       exists (select 1 from pg_trigger where tgname = 'ks_jaga_akun') as penjaga_akun;
