-- =====================================================================
-- KALENSARI STORE • KUIS PINTAR • PERIODE
-- Jalankan SETELAH supabase-kuis-pintar.sql (Supabase > SQL Editor > New query > Run).
-- Aman diulang (tidak menghapus data).
--
-- Mengganti hitungan "per bulan kalender" menjadi "per periode" yang diatur admin:
--  * Periode = nama + waktu mulai + waktu selesai (WIB). Periode tidak boleh bertabrakan.
--  * Juara 1-3 = jawaban benar terbanyak yang dijawab SELAMA periode berjalan.
--  * Tukar poin -> kupon hanya saat ada periode berjalan; kupon milik periode itu.
--  * Di luar periode (jeda) pelajar tetap bisa latihan & dapat poin, tetapi
--    jawaban tidak dihitung untuk peringkat dan tukar kupon ditutup.
--  * Periode "otomatis": begitu waktu selesai lewat, juara ditetapkan, kupon diundi,
--    pemenang diumumkan, dan voucher langsung masuk saldo pemenang.
--    Periode tidak otomatis: admin menekan tombolnya sendiri setelah periode selesai.
--  * Pertama kali dijalankan: dibuat "Periode 1" dari awal kuis s.d. 27 Des 2026 20.00 WIB.
-- =====================================================================

-- ---------- 0) VERSI PERIODE LAMA (kolom "kode", "tutup") -> simpan sebagai cadangan ----------
-- Tabel lama TIDAK dihapus: diganti nama menjadi quiz_periode_lama, isinya dipindah di langkah 2.
do $$
begin
  if to_regclass('public.quiz_periode') is not null
     and not exists (select 1 from information_schema.columns
                      where table_schema = 'public' and table_name = 'quiz_periode' and column_name = 'id') then
    if to_regclass('public.quiz_periode_lama') is not null then
      raise exception 'Tabel quiz_periode_lama sudah ada. Ganti nama atau hapus tabel itu dulu, lalu jalankan ulang.';
    end if;
    alter table public.quiz_periode rename to quiz_periode_lama;
  end if;
end $$;

-- Buang SEMUA versi fungsi kuis yang akan dibuat ulang di bawah (termasuk versi lama
-- berbasis bulan/kode periode), supaya tidak ada fungsi ganda yang membingungkan web.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as sig
             from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.prokind = 'f'
              and p.proname in ('kuis_bulan', 'kuis_periode_nama', 'kuis_tutup_otomatis', 'kuis_ranking', 'kuis_info', 'kuis_tukar',
                                'kuis_pemenang_terbit', 'kuis_periode_json', 'kuis_proses_otomatis', 'kuis_proses_otomatis_aman',
                                'kuis__juara', 'kuis__undi', 'kuis__terbit', 'kuis__cek_admin_periode',
                                'kuis_admin_ringkas', 'kuis_admin_juara', 'kuis_admin_undi', 'kuis_admin_terbit', 'kuis_admin_sembunyi',
                                'kuis_admin_periode_simpan', 'kuis_admin_periode_hapus')
  loop
    execute 'drop function ' || f.sig;
  end loop;
end $$;

-- bulan kalender WIB (kolom "bulan" kini hanya catatan; hitungan lomba memakai periode)
create function public.kuis_bulan(t timestamptz default now())
returns text language sql stable as $$ select to_char(t at time zone 'Asia/Jakarta', 'YYYY-MM') $$;

-- ---------- 1) TABEL ----------
create table if not exists public.quiz_periode (
  id           serial primary key,
  nama         text not null,
  mulai        timestamptz not null,
  selesai      timestamptz not null,
  otomatis     boolean not null default true,      -- hitung & cairkan hadiah otomatis saat selesai
  diproses_at  timestamptz,                         -- kapan pemenang periode ini selesai diproses
  created_at   timestamptz not null default now(),
  check (selesai > mulai)
);

alter table public.quiz_kupon    add column if not exists periode_id integer references public.quiz_periode(id);
alter table public.quiz_pemenang add column if not exists periode_id integer references public.quiz_periode(id) on delete cascade;
alter table public.quiz_pemenang alter column bulan drop not null;
alter table public.quiz_pemenang drop constraint if exists quiz_pemenang_bulan_jenis_peringkat_key;
create unique index if not exists quiz_pemenang_periode_uq on public.quiz_pemenang(periode_id, jenis, peringkat);
create index if not exists quiz_kupon_periode_idx on public.quiz_kupon(periode_id, wa);
create index if not exists quiz_jawaban_t_benar_idx on public.quiz_jawaban(t) where benar;

-- periode tidak boleh bertabrakan
create or replace function public.kuis_periode_cek()
returns trigger language plpgsql set search_path = public as $$
begin
  new.nama := btrim(coalesce(new.nama, ''));
  if new.nama = '' then raise exception 'Nama periode wajib diisi'; end if;
  if exists (select 1 from public.quiz_periode p
              where p.id <> new.id and tstzrange(p.mulai, p.selesai) && tstzrange(new.mulai, new.selesai)) then
    raise exception 'Waktu periode bertabrakan dengan periode lain';
  end if;
  return new;
end $$;
drop trigger if exists quiz_periode_cek on public.quiz_periode;
create trigger quiz_periode_cek before insert or update of nama, mulai, selesai on public.quiz_periode
for each row execute function public.kuis_periode_cek();

-- keamanan: sama dengan tabel kuis lain (hanya admin, anon tidak bisa baca langsung)
alter table public.quiz_periode enable row level security;
drop policy if exists quiz_periode_admin on public.quiz_periode;
create policy quiz_periode_admin on public.quiz_periode for all to authenticated using (public.is_admin()) with check (public.is_admin());
revoke all on public.quiz_periode from anon;
grant select, insert, update, delete on public.quiz_periode to authenticated;
grant usage, select on sequence public.quiz_periode_id_seq to authenticated;

-- ---------- 2) PINDAHKAN DATA LAMA (hanya sekali, saat tabel periode masih kosong) ----------
do $$
declare r record; pid integer; awal timestamptz;
begin
  if exists (select 1 from public.quiz_periode) then return; end if;

  -- a) dari tabel periode versi lama (kode/nama/mulai/selesai/tutup)
  if to_regclass('public.quiz_periode_lama') is not null then
    for r in execute 'select kode, nama, mulai, selesai, tutup, tutup_at, created_at from public.quiz_periode_lama order by mulai nulls last, created_at' loop
      insert into public.quiz_periode (nama, mulai, selesai, otomatis, diproses_at)
      values (coalesce(nullif(btrim(r.nama), ''), r.kode, 'Periode'),
              coalesce(r.mulai, r.created_at, now()),
              greatest(coalesce(r.selesai, timestamptz '2026-12-27 20:00:00+07'), coalesce(r.mulai, r.created_at, now()) + interval '1 hour'),
              true,
              -- dianggap sudah diproses hanya bila versi lama menutupnya DAN pemenangnya sudah terbit
              case when coalesce(r.tutup, false) and exists (select 1 from public.quiz_pemenang w where w.bulan = r.kode and w.terbit)
                   then coalesce(r.tutup_at, now()) end)
      returning id into pid;
      update public.quiz_kupon    set periode_id = pid where periode_id is null and bulan = r.kode;
      update public.quiz_pemenang set periode_id = pid where periode_id is null and bulan = r.kode;
    end loop;
    -- kupon yang belum terhubung: ikut periode tempat kupon itu ditukar
    update public.quiz_kupon k set periode_id = p.id
      from public.quiz_periode p
     where k.periode_id is null and k.t >= p.mulai and k.t < p.selesai;
    if exists (select 1 from public.quiz_periode) then return; end if;
  end if;

  -- b) pemenang bulanan lama (jika pernah ada) -> periode bulanan yang sudah selesai
  for r in select distinct bulan from public.quiz_pemenang where periode_id is null and bulan is not null order by 1 loop
    insert into public.quiz_periode (nama, mulai, selesai, otomatis, diproses_at)
    values ('Bulan ' || r.bulan,
            ((r.bulan || '-01')::date)::timestamp at time zone 'Asia/Jakarta',
            ((r.bulan || '-01')::date + interval '1 month')::timestamp at time zone 'Asia/Jakarta',
            false, now())
    returning id into pid;
    update public.quiz_pemenang set periode_id = pid where bulan = r.bulan and periode_id is null;
    update public.quiz_kupon    set periode_id = pid where bulan = r.bulan and periode_id is null;
  end loop;
  -- Periode 1: sejak kuis pertama dipakai (awal hari WIB) s.d. 27 Desember 2026 pukul 20.00 WIB
  awal := least(now(), coalesce((select min(t) from public.quiz_jawaban), now()), coalesce((select min(t) from public.quiz_kupon where periode_id is null), now()));
  awal := (date_trunc('day', awal at time zone 'Asia/Jakarta')) at time zone 'Asia/Jakarta';
  awal := greatest(awal, coalesce((select max(selesai) from public.quiz_periode), awal));
  if awal < timestamptz '2026-12-27 20:00:00+07' then
    insert into public.quiz_periode (nama, mulai, selesai, otomatis)
    values ('Periode 1', awal, timestamptz '2026-12-27 20:00:00+07', true)
    returning id into pid;
    update public.quiz_kupon set periode_id = pid where periode_id is null;
  end if;
end $$;

-- ---------- 3) FUNGSI BANTU ----------
-- data periode untuk ditampilkan
create or replace function public.kuis_periode_json(p public.quiz_periode)
returns jsonb language sql stable as $$
  select case when p.id is null then null else jsonb_build_object(
    'id', p.id, 'nama', p.nama, 'mulai', p.mulai, 'selesai', p.selesai, 'otomatis', p.otomatis,
    'status', case when now() < p.mulai then 'akan' when now() < p.selesai then 'berjalan' else 'selesai' end) end
$$;

-- peringkat periode: jawaban benar unik terbanyak selama periode; seri -> yang lebih dulu mencapainya
create or replace function public.kuis_ranking(p_periode integer)
returns table (peringkat bigint, wa text, nama text, jumlah_benar bigint)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by count(*) desc, max(j.t) asc), j.wa, coalesce(k.nama, 'Pelajar'), count(*)
    from public.quiz_periode p
    join public.quiz_jawaban j on j.benar and j.t >= p.mulai and j.t < p.selesai
    left join public.quiz_akun k on k.wa = j.wa
   where p.id = p_periode
   group by j.wa, k.nama
   order by 1
$$;
revoke all on function public.kuis_ranking(integer) from public, anon, authenticated;

-- ---------- 4) PROSES PEMENANG (dipakai otomatis & oleh admin) ----------
create or replace function public.kuis__juara(p_periode integer)
returns void language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; pr public.quiz_periode%rowtype; x record;
begin
  select * into pr from public.quiz_periode where id = p_periode;
  select * into a from public.quiz_aturan where id = 1;
  delete from public.quiz_pemenang where periode_id = p_periode and jenis = 'juara';
  for x in select * from public.kuis_ranking(p_periode) limit 3 loop
    insert into public.quiz_pemenang (periode_id, bulan, jenis, peringkat, wa, nama, jumlah_benar, hadiah)
    values (p_periode, to_char(pr.selesai at time zone 'Asia/Jakarta', 'YYYY-MM'), 'juara', x.peringkat, x.wa, x.nama, x.jumlah_benar,
            coalesce(a.hadiah_juara[x.peringkat::int], 0));
  end loop;
end $$;

-- 1 orang maksimal 1 hadiah undian; peluang sebanding jumlah kupon (Efraimidis-Spirakis)
create or replace function public.kuis__undi(p_periode integer, p_jumlah integer default null)
returns void language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; pr public.quiz_periode%rowtype; n integer; k record; i integer := 0;
begin
  select * into pr from public.quiz_periode where id = p_periode;
  select * into a from public.quiz_aturan where id = 1;
  n := greatest(coalesce(p_jumlah, a.jumlah_pemenang_undian), 0);
  delete from public.quiz_pemenang where periode_id = p_periode and jenis = 'undian';
  for k in
    select y.* from (select distinct on (z.wa) z.*, random() r
                       from (select *, random() acak from public.quiz_kupon where periode_id = p_periode) z
                      order by z.wa, z.acak) y
     order by -ln(greatest(y.r, 1e-12)) / greatest((select count(*) from public.quiz_kupon c where c.periode_id = p_periode and c.wa = y.wa), 1)
     limit n
  loop
    i := i + 1;
    insert into public.quiz_pemenang (periode_id, bulan, jenis, peringkat, wa, nama, nomor_kupon, hadiah)
    values (p_periode, to_char(pr.selesai at time zone 'Asia/Jakarta', 'YYYY-MM'), 'undian', i, k.wa,
            coalesce((select nama from public.quiz_akun where wa = k.wa), 'Pelajar'), k.nomor, a.hadiah_undian);
  end loop;
end $$;

-- terbitkan + kirim voucher (voucher tidak pernah terkirim dua kali)
create or replace function public.kuis__terbit(p_periode integer)
returns void language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; p record;
begin
  select * into pr from public.quiz_periode where id = p_periode;
  for p in select * from public.quiz_pemenang where periode_id = p_periode and not voucher_ok and hadiah > 0 for update loop
    perform public.ks_saldo_pembeli(p.wa, p.hadiah, 'kuis',
      'Hadiah Kuis Pintar ' || pr.nama || ' • ' || case when p.jenis = 'juara' then 'Juara ' || p.peringkat else 'Undian kupon ' || p.nomor_kupon end, null);
    update public.quiz_pemenang set voucher_ok = true where id = p.id;
  end loop;
  update public.quiz_pemenang set terbit = true, terbit_at = coalesce(terbit_at, now()) where periode_id = p_periode;
  update public.quiz_periode set diproses_at = coalesce(diproses_at, now()) where id = p_periode;
end $$;

-- Periode otomatis yang sudah selesai -> juara + undi + terbit. Dipanggil sendiri oleh
-- halaman toko/kuis/admin, jadi tidak perlu jadwal (cron). Aman dipanggil berkali-kali.
create or replace function public.kuis_proses_otomatis()
returns integer language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; n integer := 0;
begin
  for pr in select * from public.quiz_periode
             where otomatis and diproses_at is null and selesai <= now()
             order by selesai for update skip locked loop
    if not exists (select 1 from public.quiz_pemenang where periode_id = pr.id and terbit) then
      perform public.kuis__juara(pr.id);
      perform public.kuis__undi(pr.id, null);
    end if;
    perform public.kuis__terbit(pr.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- versi aman: kesalahan saat memproses tidak boleh membuat halaman gagal dimuat
create or replace function public.kuis_proses_otomatis_aman()
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.quiz_periode where otomatis and diproses_at is null and selesai <= now()) then
    begin
      perform public.kuis_proses_otomatis();
    exception when others then
      raise warning 'kuis_proses_otomatis gagal: %', sqlerrm;
    end;
  end if;
end $$;

-- nama lama tetap ada (bila pernah dijadwalkan, mis. lewat pg_cron), isinya memakai proses baru
create or replace function public.kuis_tutup_otomatis()
returns integer language sql security definer set search_path = public as $$ select public.kuis_proses_otomatis() $$;

revoke all on function public.kuis__juara(integer), public.kuis__undi(integer, integer), public.kuis__terbit(integer),
                       public.kuis_proses_otomatis(), public.kuis_proses_otomatis_aman(), public.kuis_tutup_otomatis() from public, anon, authenticated;

-- ---------- 5) FUNGSI UNTUK PELAJAR (web) ----------

-- Ringkasan halaman kuis. p_sesi boleh kosong (belum masuk).
create or replace function public.kuis_info(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; ak public.quiz_akun%rowtype; a public.quiz_aturan%rowtype;
        pa public.quiz_periode%rowtype; pb public.quiz_periode%rowtype; pt public.quiz_periode%rowtype; rk_id integer;
        r jsonb; rk record; top jsonb;
begin
  perform public.kuis_proses_otomatis_aman();
  select * into a from public.quiz_aturan where id = 1;
  select * into pa from public.quiz_periode where now() >= mulai and now() < selesai order by mulai desc limit 1;   -- berjalan
  select * into pb from public.quiz_periode where mulai > now() order by mulai limit 1;                             -- berikutnya
  select * into pt from public.quiz_periode where selesai <= now() order by selesai desc limit 1;                   -- terakhir selesai
  rk_id := coalesce(pa.id, pt.id);
  select coalesce(jsonb_agg(jsonb_build_object('peringkat', x.peringkat, 'nama', public.kuis_samar(x.nama), 'benar', x.jumlah_benar) order by x.peringkat), '[]'::jsonb)
    into top from (select * from public.kuis_ranking(rk_id) limit 10) x;
  r := jsonb_build_object('ok', true, 'aktif', a.aktif, 'top', top,
        'periode', public.kuis_periode_json(pa), 'berikut', public.kuis_periode_json(pb),
        'periode_peringkat', public.kuis_periode_json(case when pa.id is not null then pa else pt end),
        'aturan', jsonb_build_object('poin_benar', a.poin_benar, 'poin_per_kupon', a.poin_per_kupon, 'maks_soal_harian', a.maks_soal_harian,
                                     'hadiah_juara', to_jsonb(a.hadiah_juara), 'hadiah_undian', a.hadiah_undian,
                                     'jumlah_pemenang_undian', a.jumlah_pemenang_undian, 'catatan', a.catatan),
        'total_soal', (select count(*) from public.quiz_questions where aktif));
  if coalesce(p_sesi, '') = '' then return r || jsonb_build_object('login', false); end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then return r || jsonb_build_object('login', false, 'sesi_habis', true); end if;
  insert into public.quiz_akun (wa, nama) values (v_wa, public.kuis_nama(v_wa))
  on conflict (wa) do update set nama = coalesce(public.kuis_nama(v_wa), public.quiz_akun.nama)
  returning * into ak;
  select * into rk from public.kuis_ranking(rk_id) x where x.wa = v_wa;
  return r || jsonb_build_object('login', true, 'nama', ak.nama, 'poin', ak.poin, 'poin_total', ak.poin_total,
    'benar_periode', coalesce(rk.jumlah_benar, 0), 'peringkat', rk.peringkat,
    'dijawab_hari_ini', (select count(*) from public.quiz_jawaban where wa = v_wa and hari = (now() at time zone 'Asia/Jakarta')::date),
    'kupon', case when pa.id is null then '[]'::jsonb
                  else coalesce((select jsonb_agg(nomor order by id desc) from public.quiz_kupon where wa = v_wa and periode_id = pa.id), '[]'::jsonb) end);
end $$;

-- Tukar poin menjadi kupon undian periode yang sedang berjalan
create or replace function public.kuis_tukar(p_sesi text, p_jumlah integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; a public.quiz_aturan%rowtype; ak public.quiz_akun%rowtype; pr public.quiz_periode%rowtype; n integer := coalesce(p_jumlah, 0);
        nomor text; daftar text[] := '{}'; i integer;
        huruf constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  v_wa := public.kuis_sesi(p_sesi);
  select * into a from public.quiz_aturan where id = 1;
  if not a.aktif then raise exception 'Kuis sedang ditutup sementara.'; end if;
  select * into pr from public.quiz_periode where now() >= mulai and now() < selesai order by mulai desc limit 1;
  if not found then raise exception 'Belum ada periode berjalan. Tukar kupon dibuka lagi saat periode berikutnya dimulai, poinmu tetap aman.'; end if;
  if n < 1 or n > 100 then raise exception 'Jumlah kupon 1–100'; end if;
  select * into ak from public.quiz_akun where wa = v_wa for update;
  if ak.poin < n * a.poin_per_kupon then
    raise exception 'Poin belum cukup. Butuh % poin untuk % kupon.', n * a.poin_per_kupon, n;
  end if;
  update public.quiz_akun set poin = poin - n * a.poin_per_kupon, updated_at = now() where wa = v_wa returning * into ak;
  for i in 1..n loop
    loop
      nomor := 'KP' || pr.id || '-' ||
               (select string_agg(substr(huruf, 1 + floor(random() * length(huruf))::int, 1), '') from generate_series(1, 6));
      begin
        insert into public.quiz_kupon (nomor, wa, bulan, periode_id) values (nomor, v_wa, public.kuis_bulan(), pr.id);
        exit;
      exception when unique_violation then null;
      end;
    end loop;
    daftar := daftar || nomor;
  end loop;
  return jsonb_build_object('ok', true, 'kupon', to_jsonb(daftar), 'poin', ak.poin);
end $$;

-- Pemenang terakhir yang sudah diterbitkan (untuk popup toko & halaman kuis). Tanpa login.
create or replace function public.kuis_pemenang_terbit()
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype;
begin
  perform public.kuis_proses_otomatis_aman();
  select p.* into pr from public.quiz_periode p
   where exists (select 1 from public.quiz_pemenang w where w.periode_id = p.id and w.terbit)
   order by p.selesai desc limit 1;
  if not found then return null; end if;
  return jsonb_build_object('periode_id', pr.id, 'nama', pr.nama, 'mulai', pr.mulai, 'selesai', pr.selesai,
    'bulan', to_char(pr.selesai at time zone 'Asia/Jakarta', 'YYYY-MM'),
    'id', (select max(id) from public.quiz_pemenang w where w.periode_id = pr.id and w.terbit),
    'juara', coalesce((select jsonb_agg(jsonb_build_object('peringkat', w.peringkat, 'nama', public.kuis_samar(w.nama), 'wa', public.kuis_samar_wa(w.wa), 'benar', w.jumlah_benar, 'hadiah', w.hadiah) order by w.peringkat)
                         from public.quiz_pemenang w where w.periode_id = pr.id and w.terbit and w.jenis = 'juara'), '[]'::jsonb),
    'undian', coalesce((select jsonb_agg(jsonb_build_object('peringkat', w.peringkat, 'nama', public.kuis_samar(w.nama), 'wa', public.kuis_samar_wa(w.wa), 'kupon', w.nomor_kupon, 'hadiah', w.hadiah) order by w.peringkat)
                         from public.quiz_pemenang w where w.periode_id = pr.id and w.terbit and w.jenis = 'undian'), '[]'::jsonb));
end $$;

revoke all on function public.kuis_info(text), public.kuis_tukar(text, integer), public.kuis_pemenang_terbit() from public;
grant execute on function public.kuis_info(text), public.kuis_tukar(text, integer), public.kuis_pemenang_terbit() to anon, authenticated;

-- ---------- 6) FUNGSI ADMIN ----------

-- Ringkasan satu periode + daftar semua periode. p_periode kosong -> periode berjalan / terakhir.
create or replace function public.kuis_admin_ringkas(p_periode integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  perform public.kuis_proses_otomatis_aman();
  if p_periode is not null then select * into pr from public.quiz_periode where id = p_periode; end if;
  if pr.id is null then select * into pr from public.quiz_periode where now() >= mulai and now() < selesai order by mulai desc limit 1; end if;
  if pr.id is null then select * into pr from public.quiz_periode where selesai <= now() order by selesai desc limit 1; end if;
  if pr.id is null then select * into pr from public.quiz_periode order by mulai limit 1; end if;
  return jsonb_build_object(
    'periode', public.kuis_periode_json(pr) || coalesce(jsonb_build_object('diproses_at', pr.diproses_at), '{}'::jsonb),
    'daftar_periode', coalesce((select jsonb_agg(public.kuis_periode_json(p) || jsonb_build_object('diproses_at', p.diproses_at,
                         'terbit', exists (select 1 from public.quiz_pemenang w where w.periode_id = p.id and w.terbit),
                         'kupon', (select count(*) from public.quiz_kupon k where k.periode_id = p.id)) order by p.mulai desc)
                       from public.quiz_periode p), '[]'::jsonb),
    'soal_total', (select count(*) from public.quiz_questions),
    'soal_aktif', (select count(*) from public.quiz_questions where aktif),
    'per_jenjang', coalesce((select jsonb_object_agg(jenjang, n) from (select jenjang, count(*) n from public.quiz_questions where aktif group by jenjang) x), '{}'::jsonb),
    'per_mapel', coalesce((select jsonb_agg(jsonb_build_object('jenjang', jenjang, 'kelas', kelas, 'mapel', mapel, 'n', n) order by jenjang, kelas, mapel)
                           from (select jenjang, kelas, mapel, count(*) n from public.quiz_questions where aktif group by 1, 2, 3) x), '[]'::jsonb),
    'pemain', (select count(distinct wa) from public.quiz_jawaban where pr.id is not null and t >= pr.mulai and t < pr.selesai),
    'jawaban', (select count(*) from public.quiz_jawaban where pr.id is not null and t >= pr.mulai and t < pr.selesai),
    'kupon', (select count(*) from public.quiz_kupon where periode_id = pr.id),
    'ranking', coalesce((select jsonb_agg(jsonb_build_object('peringkat', x.peringkat, 'wa', x.wa, 'nama', x.nama, 'benar', x.jumlah_benar) order by x.peringkat)
                         from (select * from public.kuis_ranking(pr.id) limit 20) x), '[]'::jsonb),
    'pemenang', coalesce((select jsonb_agg(to_jsonb(w) order by w.jenis, w.peringkat) from public.quiz_pemenang w where w.periode_id = pr.id), '[]'::jsonb));
end $$;

-- Tambah (p_id kosong) atau ubah periode
create or replace function public.kuis_admin_periode_simpan(p_id integer, p_nama text, p_mulai timestamptz, p_selesai timestamptz, p_otomatis boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; v_id integer;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if p_mulai is null or p_selesai is null then raise exception 'Waktu mulai dan selesai wajib diisi'; end if;
  if p_selesai <= p_mulai then raise exception 'Waktu selesai harus setelah waktu mulai'; end if;
  if p_id is null then
    if p_selesai <= now() then raise exception 'Waktu selesai sudah lewat. Pilih waktu yang akan datang.'; end if;
    insert into public.quiz_periode (nama, mulai, selesai, otomatis) values (p_nama, p_mulai, p_selesai, coalesce(p_otomatis, true))
    returning id into v_id;
  else
    select * into pr from public.quiz_periode where id = p_id for update;
    if not found then raise exception 'Periode tidak ditemukan'; end if;
    if pr.diproses_at is not null or exists (select 1 from public.quiz_pemenang where periode_id = p_id and terbit) then
      raise exception 'Pemenang periode ini sudah diumumkan, periode tidak bisa diubah lagi.';
    end if;
    if pr.otomatis and coalesce(p_otomatis, true) and p_selesai <= now() then
      raise exception 'Waktu selesai sudah lewat: hadiah akan langsung dihitung & dicairkan. Pilih waktu yang akan datang, atau matikan "otomatis".';
    end if;
    update public.quiz_periode set nama = p_nama, mulai = p_mulai, selesai = p_selesai, otomatis = coalesce(p_otomatis, true) where id = p_id;
    v_id := p_id;
  end if;
  return public.kuis_admin_ringkas(v_id);
end $$;

create or replace function public.kuis_admin_periode_hapus(p_id integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if exists (select 1 from public.quiz_kupon where periode_id = p_id) then raise exception 'Periode ini sudah punya kupon peserta, tidak bisa dihapus. Ubah tanggalnya saja.'; end if;
  if exists (select 1 from public.quiz_pemenang where periode_id = p_id) then raise exception 'Periode ini sudah punya pemenang, tidak bisa dihapus.'; end if;
  delete from public.quiz_periode where id = p_id;
  return public.kuis_admin_ringkas(null);
end $$;

-- cek: hanya untuk periode yang sudah selesai & belum diterbitkan
create or replace function public.kuis__cek_admin_periode(p_periode integer, p_boleh_terbit boolean default false)
returns void language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select * into pr from public.quiz_periode where id = p_periode;
  if not found then raise exception 'Periode tidak ditemukan'; end if;
  if now() < pr.selesai then
    raise exception 'Periode "%" belum selesai (berakhir %). Pemenang baru bisa ditetapkan setelah periode berakhir.',
      pr.nama, to_char(pr.selesai at time zone 'Asia/Jakarta', 'DD-MM-YYYY HH24:MI') || ' WIB';
  end if;
  if not p_boleh_terbit and exists (select 1 from public.quiz_pemenang where periode_id = p_periode and terbit) then
    raise exception 'Pemenang periode ini sudah diterbitkan';
  end if;
end $$;
revoke all on function public.kuis__cek_admin_periode(integer, boolean) from public, anon, authenticated;

create or replace function public.kuis_admin_juara(p_periode integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.kuis__cek_admin_periode(p_periode);
  perform public.kuis__juara(p_periode);
  return public.kuis_admin_ringkas(p_periode);
end $$;

create or replace function public.kuis_admin_undi(p_periode integer, p_jumlah integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.kuis__cek_admin_periode(p_periode);
  perform public.kuis__undi(p_periode, p_jumlah);
  return public.kuis_admin_ringkas(p_periode);
end $$;

create or replace function public.kuis_admin_terbit(p_periode integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform public.kuis__cek_admin_periode(p_periode, true);
  if not exists (select 1 from public.quiz_pemenang where periode_id = p_periode) then raise exception 'Belum ada pemenang untuk periode ini'; end if;
  perform public.kuis__terbit(p_periode);
  return public.kuis_admin_ringkas(p_periode);
end $$;

-- Sembunyikan dari popup. Voucher yang sudah masuk TIDAK ditarik.
create or replace function public.kuis_admin_sembunyi(p_periode integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  update public.quiz_pemenang set terbit = false where periode_id = p_periode;
  return public.kuis_admin_ringkas(p_periode);
end $$;

revoke all on function public.kuis_admin_ringkas(integer), public.kuis_admin_periode_simpan(integer, text, timestamptz, timestamptz, boolean),
                       public.kuis_admin_periode_hapus(integer), public.kuis_admin_juara(integer), public.kuis_admin_undi(integer, integer),
                       public.kuis_admin_terbit(integer), public.kuis_admin_sembunyi(integer) from public, anon;
grant execute on function public.kuis_admin_ringkas(integer), public.kuis_admin_periode_simpan(integer, text, timestamptz, timestamptz, boolean),
                          public.kuis_admin_periode_hapus(integer), public.kuis_admin_juara(integer), public.kuis_admin_undi(integer, integer),
                          public.kuis_admin_terbit(integer), public.kuis_admin_sembunyi(integer) to authenticated;

notify pgrst, 'reload schema';
