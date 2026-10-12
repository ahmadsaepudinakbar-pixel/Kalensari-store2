-- =====================================================================
-- KALENSARI STORE • KUIS PINTAR
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run.
-- Aman diulang (tidak menghapus data).
-- Butuh fungsi yang sudah ada: ks_wa, ks_sesi_wa, is_admin, ks_saldo_pembeli.
--
-- Aturan:
--  * Pemain = akun pembeli Kalensari Store (masuk dengan No. WhatsApp + PIN).
--  * Tiap soal hanya bisa dijawab SEKALI per pemain (benar/salah). Kunci jawaban
--    tidak pernah dikirim ke HP sebelum soal dijawab.
--  * Jawaban benar = poin (default +10). Poin bisa ditukar kupon undian bulan berjalan.
--  * Juara 1-3 tiap bulan = jumlah JAWABAN BENAR UNIK terbanyak bulan itu.
--  * Admin menetapkan juara, mengundi kupon, lalu menerbitkan pemenang
--    (tampil sebagai popup di toko) dan hadiah masuk saldo voucher belanja.
-- =====================================================================

-- ---------- 1) TABEL ----------
create table if not exists public.quiz_questions (
  id          bigserial primary key,
  jenjang     text not null check (jenjang in ('SD', 'SMP', 'SMA')),
  kelas       smallint not null check (kelas between 1 and 12),
  mapel       text not null,
  soal        text not null,
  a           text not null,
  b           text not null,
  c           text not null,
  d           text not null,
  kunci       char(1) not null check (kunci in ('A', 'B', 'C', 'D')),
  pembahasan  text,
  aktif       boolean not null default true,
  hash        text generated always as (md5(lower(btrim(soal)) || '|' || lower(btrim(a)) || '|' || lower(btrim(b)) || '|' || lower(btrim(c)) || '|' || lower(btrim(d)))) stored,
  created_at  timestamptz not null default now()
);
create unique index if not exists quiz_questions_hash_uq on public.quiz_questions(hash);
create index if not exists quiz_questions_pilih_idx on public.quiz_questions(jenjang, kelas, mapel) where aktif;

create table if not exists public.quiz_akun (
  wa          text primary key,
  nama        text,
  poin        integer not null default 0 check (poin >= 0),   -- poin yang belum ditukar
  poin_total  integer not null default 0,                      -- semua poin yang pernah didapat
  updated_at  timestamptz not null default now()
);

create table if not exists public.quiz_jawaban (
  wa       text not null,
  qid      bigint not null references public.quiz_questions(id) on delete cascade,
  pilihan  char(1) not null,
  benar    boolean not null,
  bulan    text not null,                      -- YYYY-MM (WIB)
  hari     date not null,                      -- tanggal WIB (batas harian)
  t        timestamptz not null default now(),
  primary key (wa, qid)
);
create index if not exists quiz_jawaban_bulan_idx on public.quiz_jawaban(bulan, wa) where benar;
create index if not exists quiz_jawaban_hari_idx  on public.quiz_jawaban(wa, hari);

create table if not exists public.quiz_kupon (
  id     bigserial primary key,
  nomor  text not null unique,
  wa     text not null,
  bulan  text not null,
  t      timestamptz not null default now()
);
create index if not exists quiz_kupon_bulan_idx on public.quiz_kupon(bulan, wa);

create table if not exists public.quiz_pemenang (
  id           bigserial primary key,
  bulan        text not null,
  jenis        text not null check (jenis in ('juara', 'undian')),
  peringkat    integer not null,
  wa           text not null,
  nama         text,
  jumlah_benar integer,
  nomor_kupon  text,
  hadiah       integer not null default 0,
  terbit       boolean not null default false,
  terbit_at    timestamptz,
  voucher_ok   boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (bulan, jenis, peringkat)
);

create table if not exists public.quiz_aturan (
  id                    integer primary key default 1 check (id = 1),
  aktif                 boolean not null default true,
  poin_benar            integer not null default 10  check (poin_benar between 1 and 1000),
  poin_per_kupon        integer not null default 100 check (poin_per_kupon between 1 and 100000),
  maks_soal_harian      integer not null default 100 check (maks_soal_harian between 1 and 5000),
  hadiah_juara          integer[] not null default array[50000, 30000, 20000],
  hadiah_undian         integer not null default 50000,
  jumlah_pemenang_undian integer not null default 5 check (jumlah_pemenang_undian between 0 and 100),
  catatan               text default 'Gratis, tanpa biaya apa pun. Hadiah berupa saldo voucher belanja Kalensari Store.',
  updated_at            timestamptz not null default now()
);
insert into public.quiz_aturan (id) values (1) on conflict (id) do nothing;

-- ---------- 2) KEAMANAN (RLS) ----------
alter table public.quiz_questions enable row level security;
alter table public.quiz_akun      enable row level security;
alter table public.quiz_jawaban   enable row level security;
alter table public.quiz_kupon     enable row level security;
alter table public.quiz_pemenang  enable row level security;
alter table public.quiz_aturan    enable row level security;

-- Web umum (anon) TIDAK bisa membaca tabel langsung (kunci jawaban & nomor WA aman).
-- Semua akses umum lewat fungsi di bawah. Admin (login Supabase + tabel admins) boleh semuanya.
do $$
declare t text;
begin
  foreach t in array array['quiz_questions','quiz_akun','quiz_jawaban','quiz_kupon','quiz_pemenang','quiz_aturan'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_admin', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;
grant usage, select on sequence public.quiz_questions_id_seq to authenticated;

-- ---------- 3) FUNGSI BANTU ----------
create or replace function public.kuis_bulan(t timestamptz default now())
returns text language sql stable as $$ select to_char(t at time zone 'Asia/Jakarta', 'YYYY-MM') $$;

-- nama pembeli dari data akun warga
create or replace function public.kuis_nama(p_wa text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(nullif(trim(x->>'nama'), ''), 'Pelajar')
    from public.store_settings a, public.store_settings m,
         jsonb_array_elements(case when jsonb_typeof(m.value) = 'array' then m.value else '[]'::jsonb end) x
   where a.key = 'pembeli_accounts' and m.key = 'pembeli_members' and x->>'id' = a.value->p_wa->>'id'
   limit 1
$$;
revoke all on function public.kuis_nama(text) from public, anon, authenticated;

-- nama disamarkan untuk tampilan umum: "Asep Saepudin" -> "Asep S."
create or replace function public.kuis_samar(p_nama text)
returns text language sql immutable as $$
  select case when p_nama is null or btrim(p_nama) = '' then 'Pelajar'
              when position(' ' in btrim(p_nama)) = 0 then btrim(p_nama)
              else split_part(btrim(p_nama), ' ', 1) || ' ' || upper(left(split_part(btrim(p_nama), ' ', 2), 1)) || '.' end
$$;

-- nomor WA disamarkan: 6283872851727 -> 0838****727
create or replace function public.kuis_samar_wa(p_wa text)
returns text language sql immutable as $$
  select case when length(coalesce(p_wa, '')) < 8 then '****'
              else '0' || substr(p_wa, 3, 3) || '****' || right(p_wa, 3) end
$$;

create or replace function public.kuis_sesi(p_sesi text)
returns text language plpgsql security definer set search_path = public as $$
declare v_wa text;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then raise exception 'SESI: Silakan masuk akun pembeli dulu.'; end if;
  insert into public.quiz_akun (wa, nama) values (v_wa, public.kuis_nama(v_wa))
  on conflict (wa) do update set nama = coalesce(public.kuis_nama(v_wa), public.quiz_akun.nama);
  return v_wa;
end $$;
revoke all on function public.kuis_sesi(text) from public, anon, authenticated;

-- peringkat bulan: jawaban benar unik terbanyak; seri -> yang lebih dulu mencapainya
create or replace function public.kuis_ranking(p_bulan text)
returns table (peringkat bigint, wa text, nama text, jumlah_benar bigint)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by count(*) desc, max(j.t) asc), j.wa, coalesce(k.nama, 'Pelajar'), count(*)
    from public.quiz_jawaban j left join public.quiz_akun k on k.wa = j.wa
   where j.bulan = p_bulan and j.benar
   group by j.wa, k.nama
   order by 1
$$;
revoke all on function public.kuis_ranking(text) from public, anon, authenticated;

-- ---------- 4) FUNGSI UNTUK PELAJAR (web) ----------

-- Daftar mapel + jumlah soal aktif untuk jenjang/kelas (tanpa login)
create or replace function public.kuis_mapel(p_jenjang text, p_kelas integer)
returns table (mapel text, jumlah bigint)
language sql stable security definer set search_path = public as $$
  select q.mapel, count(*) from public.quiz_questions q
   where q.aktif and q.jenjang = p_jenjang and q.kelas = p_kelas
   group by q.mapel order by q.mapel
$$;

-- Ringkasan untuk halaman kuis. p_sesi boleh kosong (belum masuk).
create or replace function public.kuis_info(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; ak public.quiz_akun%rowtype; a public.quiz_aturan%rowtype; b text := public.kuis_bulan();
        r jsonb := '{}'::jsonb; rk record; top jsonb;
begin
  select * into a from public.quiz_aturan where id = 1;
  select coalesce(jsonb_agg(jsonb_build_object('peringkat', x.peringkat, 'nama', public.kuis_samar(x.nama), 'benar', x.jumlah_benar) order by x.peringkat), '[]'::jsonb)
    into top from (select * from public.kuis_ranking(b) limit 10) x;
  r := jsonb_build_object('ok', true, 'bulan', b, 'aktif', a.aktif, 'top', top,
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
  select * into rk from public.kuis_ranking(b) x where x.wa = v_wa;
  return r || jsonb_build_object('login', true, 'nama', ak.nama, 'poin', ak.poin, 'poin_total', ak.poin_total,
    'benar_bulan', coalesce(rk.jumlah_benar, 0), 'peringkat', rk.peringkat,
    'dijawab_hari_ini', (select count(*) from public.quiz_jawaban where wa = v_wa and hari = (now() at time zone 'Asia/Jakarta')::date),
    'kupon', coalesce((select jsonb_agg(nomor order by id desc) from public.quiz_kupon where wa = v_wa and bulan = b), '[]'::jsonb));
end $$;

-- Ambil soal acak yang BELUM pernah dijawab pemain (tanpa kunci jawaban)
create or replace function public.kuis_ambil(p_sesi text, p_jenjang text, p_kelas integer, p_mapel text, p_jumlah integer default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; n integer := least(greatest(coalesce(p_jumlah, 10), 1), 20); hasil jsonb;
begin
  v_wa := public.kuis_sesi(p_sesi);
  if not (select aktif from public.quiz_aturan where id = 1) then raise exception 'Kuis sedang ditutup sementara.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'soal', q.soal, 'a', q.a, 'b', q.b, 'c', q.c, 'd', q.d)), '[]'::jsonb) into hasil
    from (select * from public.quiz_questions q
           where q.aktif and q.jenjang = p_jenjang and q.kelas = p_kelas and q.mapel = p_mapel
             and not exists (select 1 from public.quiz_jawaban j where j.wa = v_wa and j.qid = q.id)
           order by random() limit n) q;
  return jsonb_build_object('ok', true, 'soal', hasil);
end $$;

-- Jawab satu soal. Mengembalikan benar/salah, kunci, pembahasan, poin.
create or replace function public.kuis_jawab(p_sesi text, p_qid bigint, p_pilihan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; q public.quiz_questions%rowtype; a public.quiz_aturan%rowtype; v_pil char(1) := upper(left(coalesce(p_pilihan, ''), 1));
        v_benar boolean; v_hari date := (now() at time zone 'Asia/Jakarta')::date; v_n integer; v_poin integer := 0; ak public.quiz_akun%rowtype; ada public.quiz_jawaban%rowtype;
begin
  v_wa := public.kuis_sesi(p_sesi);
  select * into a from public.quiz_aturan where id = 1;
  if not a.aktif then raise exception 'Kuis sedang ditutup sementara.'; end if;
  if v_pil not in ('A', 'B', 'C', 'D') then raise exception 'Pilihan tidak valid'; end if;
  select * into q from public.quiz_questions where id = p_qid and aktif;
  if not found then raise exception 'Soal tidak ditemukan'; end if;

  perform 1 from public.quiz_akun where wa = v_wa for update;   -- antre per pemain (anti klik ganda)
  select * into ada from public.quiz_jawaban where wa = v_wa and qid = p_qid;
  if found then
    select * into ak from public.quiz_akun where wa = v_wa;
    return jsonb_build_object('ok', true, 'sudah', true, 'benar', ada.benar, 'kunci', q.kunci, 'pembahasan', q.pembahasan, 'poin_dapat', 0, 'poin', ak.poin);
  end if;
  select count(*) into v_n from public.quiz_jawaban where wa = v_wa and hari = v_hari;
  if v_n >= a.maks_soal_harian then
    raise exception 'Batas % soal per hari sudah tercapai. Lanjut besok ya!', a.maks_soal_harian;
  end if;

  v_benar := v_pil = q.kunci;
  insert into public.quiz_jawaban (wa, qid, pilihan, benar, bulan, hari) values (v_wa, p_qid, v_pil, v_benar, public.kuis_bulan(), v_hari);
  if v_benar then v_poin := a.poin_benar; end if;
  update public.quiz_akun set poin = poin + v_poin, poin_total = poin_total + v_poin, updated_at = now() where wa = v_wa returning * into ak;
  return jsonb_build_object('ok', true, 'benar', v_benar, 'kunci', q.kunci, 'pembahasan', q.pembahasan, 'poin_dapat', v_poin, 'poin', ak.poin);
end $$;

-- Tukar poin menjadi kupon undian bulan berjalan
create or replace function public.kuis_tukar(p_sesi text, p_jumlah integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; a public.quiz_aturan%rowtype; ak public.quiz_akun%rowtype; n integer := coalesce(p_jumlah, 0);
        b text := public.kuis_bulan(); nomor text; daftar text[] := '{}'; i integer;
        huruf constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  v_wa := public.kuis_sesi(p_sesi);
  select * into a from public.quiz_aturan where id = 1;
  if not a.aktif then raise exception 'Kuis sedang ditutup sementara.'; end if;
  if n < 1 or n > 100 then raise exception 'Jumlah kupon 1–100'; end if;
  select * into ak from public.quiz_akun where wa = v_wa for update;
  if ak.poin < n * a.poin_per_kupon then
    raise exception 'Poin belum cukup. Butuh % poin untuk % kupon.', n * a.poin_per_kupon, n;
  end if;
  update public.quiz_akun set poin = poin - n * a.poin_per_kupon, updated_at = now() where wa = v_wa returning * into ak;
  for i in 1..n loop
    loop
      nomor := 'KP' || replace(substr(b, 3), '-', '') || '-' ||
               (select string_agg(substr(huruf, 1 + floor(random() * length(huruf))::int, 1), '') from generate_series(1, 6));
      begin
        insert into public.quiz_kupon (nomor, wa, bulan) values (nomor, v_wa, b);
        exit;
      exception when unique_violation then null;
      end;
    end loop;
    daftar := daftar || nomor;
  end loop;
  return jsonb_build_object('ok', true, 'kupon', to_jsonb(daftar), 'poin', ak.poin);
end $$;

-- Pemenang yang sudah diterbitkan (untuk popup toko & halaman kuis). Tanpa login.
create or replace function public.kuis_pemenang_terbit()
returns jsonb language sql stable security definer set search_path = public as $$
  with b as (select max(bulan) bulan from public.quiz_pemenang where terbit)
  select jsonb_build_object('bulan', b.bulan,
    'id', (select max(id) from public.quiz_pemenang p where p.bulan = b.bulan and p.terbit),
    'juara', coalesce((select jsonb_agg(jsonb_build_object('peringkat', p.peringkat, 'nama', public.kuis_samar(p.nama), 'wa', public.kuis_samar_wa(p.wa), 'benar', p.jumlah_benar, 'hadiah', p.hadiah) order by p.peringkat)
                         from public.quiz_pemenang p where p.bulan = b.bulan and p.terbit and p.jenis = 'juara'), '[]'::jsonb),
    'undian', coalesce((select jsonb_agg(jsonb_build_object('peringkat', p.peringkat, 'nama', public.kuis_samar(p.nama), 'wa', public.kuis_samar_wa(p.wa), 'kupon', p.nomor_kupon, 'hadiah', p.hadiah) order by p.peringkat)
                         from public.quiz_pemenang p where p.bulan = b.bulan and p.terbit and p.jenis = 'undian'), '[]'::jsonb))
  from b where b.bulan is not null
$$;

revoke all on function public.kuis_mapel(text, integer), public.kuis_info(text), public.kuis_ambil(text, text, integer, text, integer),
                       public.kuis_jawab(text, bigint, text), public.kuis_tukar(text, integer), public.kuis_pemenang_terbit() from public;
grant execute on function public.kuis_mapel(text, integer), public.kuis_info(text), public.kuis_ambil(text, text, integer, text, integer),
                          public.kuis_jawab(text, bigint, text), public.kuis_tukar(text, integer), public.kuis_pemenang_terbit() to anon, authenticated;

-- ---------- 5) FUNGSI ADMIN ----------

create or replace function public.kuis_admin_ringkas(p_bulan text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare b text := coalesce(p_bulan, public.kuis_bulan());
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  return jsonb_build_object(
    'bulan', b,
    'soal_total', (select count(*) from public.quiz_questions),
    'soal_aktif', (select count(*) from public.quiz_questions where aktif),
    'per_jenjang', coalesce((select jsonb_object_agg(jenjang, n) from (select jenjang, count(*) n from public.quiz_questions where aktif group by jenjang) x), '{}'::jsonb),
    'per_mapel', coalesce((select jsonb_agg(jsonb_build_object('jenjang', jenjang, 'kelas', kelas, 'mapel', mapel, 'n', n) order by jenjang, kelas, mapel)
                           from (select jenjang, kelas, mapel, count(*) n from public.quiz_questions where aktif group by 1, 2, 3) x), '[]'::jsonb),
    'pemain_bulan', (select count(distinct wa) from public.quiz_jawaban where bulan = b),
    'jawaban_bulan', (select count(*) from public.quiz_jawaban where bulan = b),
    'kupon_bulan', (select count(*) from public.quiz_kupon where bulan = b),
    'ranking', coalesce((select jsonb_agg(jsonb_build_object('peringkat', x.peringkat, 'wa', x.wa, 'nama', x.nama, 'benar', x.jumlah_benar) order by x.peringkat)
                         from (select * from public.kuis_ranking(b) limit 20) x), '[]'::jsonb),
    'pemenang', coalesce((select jsonb_agg(to_jsonb(p) order by p.jenis, p.peringkat) from public.quiz_pemenang p where p.bulan = b), '[]'::jsonb));
end $$;

-- Tetapkan juara 1-3 bulan p_bulan (bisa diulang selama belum diterbitkan)
create or replace function public.kuis_admin_juara(p_bulan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; x record;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if exists (select 1 from public.quiz_pemenang where bulan = p_bulan and terbit) then raise exception 'Pemenang bulan ini sudah diterbitkan'; end if;
  select * into a from public.quiz_aturan where id = 1;
  delete from public.quiz_pemenang where bulan = p_bulan and jenis = 'juara';
  for x in select * from public.kuis_ranking(p_bulan) limit 3 loop
    insert into public.quiz_pemenang (bulan, jenis, peringkat, wa, nama, jumlah_benar, hadiah)
    values (p_bulan, 'juara', x.peringkat, x.wa, x.nama, x.jumlah_benar, coalesce(a.hadiah_juara[x.peringkat], 0));
  end loop;
  return public.kuis_admin_ringkas(p_bulan);
end $$;

-- Undi kupon bulan p_bulan: 1 orang maksimal 1 hadiah undian (peluang tetap sebanding jumlah kupon)
create or replace function public.kuis_admin_undi(p_bulan text, p_jumlah integer default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; n integer; k record; i integer := 0;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if exists (select 1 from public.quiz_pemenang where bulan = p_bulan and terbit) then raise exception 'Pemenang bulan ini sudah diterbitkan'; end if;
  select * into a from public.quiz_aturan where id = 1;
  n := coalesce(p_jumlah, a.jumlah_pemenang_undian);
  delete from public.quiz_pemenang where bulan = p_bulan and jenis = 'undian';
  -- tiap pemain diwakili 1 kupon acak miliknya; pemain diurutkan acak dengan bobot = jumlah kupon
  -- (Efraimidis-Spirakis: kunci -ln(U)/bobot, ambil yang terkecil)
  for k in
    select y.* from (select distinct on (z.wa) z.*, random() r from (select *, random() acak from public.quiz_kupon where bulan = p_bulan) z order by z.wa, z.acak) y
    order by -ln(y.r) / greatest((select count(*) from public.quiz_kupon c where c.bulan = p_bulan and c.wa = y.wa), 1)
    limit n
  loop
    i := i + 1;
    insert into public.quiz_pemenang (bulan, jenis, peringkat, wa, nama, nomor_kupon, hadiah)
    values (p_bulan, 'undian', i, k.wa, coalesce((select nama from public.quiz_akun where wa = k.wa), 'Pelajar'), k.nomor, a.hadiah_undian);
  end loop;
  return public.kuis_admin_ringkas(p_bulan);
end $$;

-- Terbitkan pemenang (muncul di popup toko). p_voucher = true -> hadiah masuk saldo voucher belanja.
create or replace function public.kuis_admin_terbit(p_bulan text, p_voucher boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p record;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if not exists (select 1 from public.quiz_pemenang where bulan = p_bulan) then raise exception 'Belum ada pemenang untuk bulan ini'; end if;
  for p in select * from public.quiz_pemenang where bulan = p_bulan and not voucher_ok and hadiah > 0 for update loop
    if p_voucher then
      perform public.ks_saldo_pembeli(p.wa, p.hadiah, 'kuis',
        'Hadiah Kuis Pintar ' || p_bulan || ' • ' || case when p.jenis = 'juara' then 'Juara ' || p.peringkat else 'Undian kupon ' || p.nomor_kupon end, null);
      update public.quiz_pemenang set voucher_ok = true where id = p.id;
    end if;
  end loop;
  update public.quiz_pemenang set terbit = true, terbit_at = coalesce(terbit_at, now()) where bulan = p_bulan;
  return public.kuis_admin_ringkas(p_bulan);
end $$;

-- Batalkan terbit (popup disembunyikan). Voucher yang sudah masuk TIDAK ditarik.
create or replace function public.kuis_admin_sembunyi(p_bulan text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  update public.quiz_pemenang set terbit = false where bulan = p_bulan;
  return public.kuis_admin_ringkas(p_bulan);
end $$;

revoke all on function public.kuis_admin_ringkas(text), public.kuis_admin_juara(text), public.kuis_admin_undi(text, integer),
                       public.kuis_admin_terbit(text, boolean), public.kuis_admin_sembunyi(text) from public, anon;
grant execute on function public.kuis_admin_ringkas(text), public.kuis_admin_juara(text), public.kuis_admin_undi(text, integer),
                          public.kuis_admin_terbit(text, boolean), public.kuis_admin_sembunyi(text) to authenticated;
