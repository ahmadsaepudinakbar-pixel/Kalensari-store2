-- =====================================================================
-- KALENSARI STORE • KUIS PINTAR • KOMPETISI ADIL
-- Jalankan SETELAH supabase-kuis-pintar.sql dan supabase-kuis-periode.sql
-- (Supabase > SQL Editor > New query > Run). Aman diulang, tidak menghapus data.
--
-- E) URUTAN PILIHAN DIACAK PER PEMAIN
--    Isi pilihan A–D diacak berbeda untuk tiap pemain (tetap sama bila soal yang sama
--    dibuka ulang oleh pemain itu). Teman tidak bisa lagi saling memberi tahu
--    "jawabannya B". Kunci tetap hanya di server.
--
-- F) VERIFIKASI JUARA SEBELUM HADIAH CAIR
--    * Saat periode berakhir, juara 1–3 dihitung dan kupon diundi otomatis,
--      TETAPI hadiah belum cair dan pemenang belum diumumkan.
--    * Admin memeriksa tiap pemenang (ada tanda bahaya otomatis), lalu menekan
--      ✅ Setujui atau ⛔ Tolak (diskualifikasi + alasan).
--    * Pemenang yang ditolak diganti otomatis: juara naik dari peringkat berikutnya,
--      undian diundi ulang 1 kupon pengganti.
--    * "Terbitkan" (umumkan + voucher masuk saldo) hanya bisa bila semua pemenang
--      sudah disetujui.
-- =====================================================================

-- ---------- E) ACAK URUTAN PILIHAN ----------
-- Urutan tetap per (pemain, soal): huruf tampil ke-i = huruf asli ke-substr(urut, i, 1)
create or replace function public.kuis__urut(p_wa text, p_qid bigint)
returns text language sql immutable as $$
  select (array['ABCD','ABDC','ACBD','ACDB','ADBC','ADCB','BACD','BADC','BCAD','BCDA','BDAC','BDCA',
                'CABD','CADB','CBAD','CBDA','CDAB','CDBA','DABC','DACB','DBAC','DBCA','DCAB','DCBA'])
         [1 + (('x' || substr(md5(coalesce(p_wa, '') || ':kalensari:' || p_qid), 1, 7))::bit(28)::int % 24)]
$$;
revoke all on function public.kuis__urut(text, bigint) from public, anon, authenticated;

drop function if exists public.kuis__opsi(public.quiz_questions, text);
create or replace function public.kuis__opsi(p_a text, p_b text, p_c text, p_d text, p_huruf text)
returns text language sql immutable as $$
  select case p_huruf when 'A' then p_a when 'B' then p_b when 'C' then p_c else p_d end
$$;
revoke all on function public.kuis__opsi(text, text, text, text, text) from public, anon, authenticated;

create or replace function public.kuis_ambil(p_sesi text, p_jenjang text, p_kelas integer, p_mapel text, p_jumlah integer default 10)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; n integer := least(greatest(coalesce(p_jumlah, 10), 1), 20); hasil jsonb;
begin
  v_wa := public.kuis_sesi(p_sesi);
  if not (select aktif from public.quiz_aturan where id = 1) then raise exception 'Kuis sedang ditutup sementara.'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', q.id, 'soal', q.soal,
           'a', public.kuis__opsi(q.a, q.b, q.c, q.d, substr(u, 1, 1)), 'b', public.kuis__opsi(q.a, q.b, q.c, q.d, substr(u, 2, 1)),
           'c', public.kuis__opsi(q.a, q.b, q.c, q.d, substr(u, 3, 1)), 'd', public.kuis__opsi(q.a, q.b, q.c, q.d, substr(u, 4, 1)))), '[]'::jsonb) into hasil
    from (select q.*, public.kuis__urut(v_wa, q.id) u from public.quiz_questions q
           where q.aktif and q.jenjang = p_jenjang and q.kelas = p_kelas and q.mapel = p_mapel
             and not exists (select 1 from public.quiz_jawaban j where j.wa = v_wa and j.qid = q.id)
           order by random() limit n) q;
  return jsonb_build_object('ok', true, 'soal', hasil);
end $$;

-- Jawab: p_pilihan = huruf yang TAMPIL di HP pemain. Disimpan sebagai huruf asli.
create or replace function public.kuis_jawab(p_sesi text, p_qid bigint, p_pilihan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; q public.quiz_questions%rowtype; a public.quiz_aturan%rowtype; v_tampil char(1) := upper(left(coalesce(p_pilihan, ''), 1));
        v_pil char(1); v_u text; v_kunci_tampil char(1);
        v_benar boolean; v_hari date := (now() at time zone 'Asia/Jakarta')::date; v_n integer; v_poin integer := 0; ak public.quiz_akun%rowtype; ada public.quiz_jawaban%rowtype;
begin
  v_wa := public.kuis_sesi(p_sesi);
  select * into a from public.quiz_aturan where id = 1;
  if not a.aktif then raise exception 'Kuis sedang ditutup sementara.'; end if;
  if v_tampil not in ('A', 'B', 'C', 'D') then raise exception 'Pilihan tidak valid'; end if;
  select * into q from public.quiz_questions where id = p_qid and aktif;
  if not found then raise exception 'Soal tidak ditemukan'; end if;
  v_u := public.kuis__urut(v_wa, p_qid);
  v_pil := substr(v_u, strpos('ABCD', v_tampil), 1);                 -- huruf tampil -> huruf asli
  v_kunci_tampil := substr('ABCD', strpos(v_u, q.kunci), 1);         -- kunci asli -> huruf tampil

  perform 1 from public.quiz_akun where wa = v_wa for update;   -- antre per pemain (anti klik ganda)
  select * into ada from public.quiz_jawaban where wa = v_wa and qid = p_qid;
  if found then
    select * into ak from public.quiz_akun where wa = v_wa;
    return jsonb_build_object('ok', true, 'sudah', true, 'benar', ada.benar, 'kunci', v_kunci_tampil, 'pembahasan', q.pembahasan, 'poin_dapat', 0, 'poin', ak.poin);
  end if;
  select count(*) into v_n from public.quiz_jawaban where wa = v_wa and hari = v_hari;
  if v_n >= a.maks_soal_harian then
    raise exception 'Batas % soal per hari sudah tercapai. Lanjut besok ya!', a.maks_soal_harian;
  end if;

  v_benar := v_pil = q.kunci;
  insert into public.quiz_jawaban (wa, qid, pilihan, benar, bulan, hari) values (v_wa, p_qid, v_pil, v_benar, public.kuis_bulan(), v_hari);
  if v_benar then v_poin := a.poin_benar; end if;
  update public.quiz_akun set poin = poin + v_poin, poin_total = poin_total + v_poin, updated_at = now() where wa = v_wa returning * into ak;
  return jsonb_build_object('ok', true, 'benar', v_benar, 'kunci', v_kunci_tampil, 'pembahasan', q.pembahasan, 'poin_dapat', v_poin, 'poin', ak.poin);
end $$;
revoke all on function public.kuis_ambil(text, text, integer, text, integer), public.kuis_jawab(text, bigint, text) from public;
grant execute on function public.kuis_ambil(text, text, integer, text, integer), public.kuis_jawab(text, bigint, text) to anon, authenticated;


-- ---------- F) VERIFIKASI JUARA ----------
alter table public.quiz_pemenang add column if not exists status_cek text not null default 'ok';   -- pemenang lama dianggap sudah sah
alter table public.quiz_pemenang alter column status_cek set default 'menunggu';
alter table public.quiz_pemenang add column if not exists cek_at timestamptz;
alter table public.quiz_pemenang add column if not exists cek_oleh text;
alter table public.quiz_pemenang drop constraint if exists quiz_pemenang_status_cek_cek;
alter table public.quiz_pemenang add constraint quiz_pemenang_status_cek_cek check (status_cek in ('menunggu', 'ok'));

create table if not exists public.quiz_diskualifikasi (
  periode_id integer not null,
  wa         text not null,
  alasan     text,
  oleh       text,
  t          timestamptz not null default now(),
  primary key (periode_id, wa)
);
alter table public.quiz_diskualifikasi enable row level security;
drop policy if exists quiz_dq_admin on public.quiz_diskualifikasi;
create policy quiz_dq_admin on public.quiz_diskualifikasi for select to authenticated using (public.is_admin());

-- Peringkat: pemain yang didiskualifikasi pada periode itu tidak dihitung
create or replace function public.kuis_ranking(p_periode integer)
returns table (peringkat bigint, wa text, nama text, jumlah_benar bigint)
language sql stable security definer set search_path = public as $$
  select row_number() over (order by count(*) desc, max(j.t) asc), j.wa, coalesce(k.nama, 'Pelajar'), count(*)
    from public.quiz_periode p
    join public.quiz_jawaban j on j.benar and j.t >= p.mulai and j.t < p.selesai
    left join public.quiz_akun k on k.wa = j.wa
   where p.id = p_periode
     and not exists (select 1 from public.quiz_diskualifikasi d where d.periode_id = p.id and d.wa = j.wa)
   group by j.wa, k.nama
   order by 1
$$;
revoke all on function public.kuis_ranking(integer) from public, anon, authenticated;

-- Juara 1–3 dihitung ulang; status "disetujui" pemain yang tetap juara dipertahankan
create or replace function public.kuis__juara(p_periode integer)
returns void language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; pr public.quiz_periode%rowtype; x record; ok_wa text[];
begin
  select * into pr from public.quiz_periode where id = p_periode;
  select * into a from public.quiz_aturan where id = 1;
  select coalesce(array_agg(wa), '{}') into ok_wa from public.quiz_pemenang where periode_id = p_periode and jenis = 'juara' and status_cek = 'ok';
  delete from public.quiz_pemenang where periode_id = p_periode and jenis = 'juara';
  for x in select * from public.kuis_ranking(p_periode) limit 3 loop
    insert into public.quiz_pemenang (periode_id, bulan, jenis, peringkat, wa, nama, jumlah_benar, hadiah, status_cek)
    values (p_periode, to_char(pr.selesai at time zone 'Asia/Jakarta', 'YYYY-MM'), 'juara', x.peringkat, x.wa, x.nama, x.jumlah_benar,
            coalesce(a.hadiah_juara[x.peringkat::int], 0), case when x.wa = any(ok_wa) then 'ok' else 'menunggu' end);
  end loop;
end $$;

-- Undian: pemain yang didiskualifikasi tidak ikut
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
                       from (select *, random() acak from public.quiz_kupon c where c.periode_id = p_periode
                               and not exists (select 1 from public.quiz_diskualifikasi d where d.periode_id = p_periode and d.wa = c.wa)) z
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

-- 1 pemenang undian pengganti (bukan pemenang lain, bukan yang didiskualifikasi)
create or replace function public.kuis__undi_ganti(p_periode integer, p_peringkat integer)
returns void language plpgsql security definer set search_path = public as $$
declare a public.quiz_aturan%rowtype; pr public.quiz_periode%rowtype; k record;
begin
  select * into pr from public.quiz_periode where id = p_periode;
  select * into a from public.quiz_aturan where id = 1;
  select y.* into k from (select distinct on (z.wa) z.*, random() r
                            from (select *, random() acak from public.quiz_kupon c where c.periode_id = p_periode
                                    and not exists (select 1 from public.quiz_diskualifikasi d where d.periode_id = p_periode and d.wa = c.wa)
                                    and not exists (select 1 from public.quiz_pemenang w where w.periode_id = p_periode and w.jenis = 'undian' and w.wa = c.wa)) z
                           order by z.wa, z.acak) y
   order by -ln(greatest(y.r, 1e-12)) / greatest((select count(*) from public.quiz_kupon c where c.periode_id = p_periode and c.wa = y.wa), 1)
   limit 1;
  if k.wa is null then return; end if;     -- tidak ada kupon lain
  insert into public.quiz_pemenang (periode_id, bulan, jenis, peringkat, wa, nama, nomor_kupon, hadiah)
  values (p_periode, to_char(pr.selesai at time zone 'Asia/Jakarta', 'YYYY-MM'), 'undian', p_peringkat, k.wa,
          coalesce((select nama from public.quiz_akun where wa = k.wa), 'Pelajar'), k.nomor, a.hadiah_undian);
end $$;

-- Terbitkan + kirim voucher: hanya pemenang yang sudah disetujui
create or replace function public.kuis__terbit(p_periode integer)
returns void language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; p record;
begin
  select * into pr from public.quiz_periode where id = p_periode;
  if exists (select 1 from public.quiz_pemenang where periode_id = p_periode and status_cek <> 'ok') then
    raise exception 'Masih ada pemenang yang belum diverifikasi. Setujui atau tolak semua pemenang dulu.';
  end if;
  for p in select * from public.quiz_pemenang where periode_id = p_periode and not voucher_ok and hadiah > 0 for update loop
    perform public.ks_saldo_pembeli(p.wa, p.hadiah, 'kuis',
      'Hadiah Kuis Pintar ' || pr.nama || ' • ' || case when p.jenis = 'juara' then 'Juara ' || p.peringkat else 'Undian kupon ' || p.nomor_kupon end, null);
    update public.quiz_pemenang set voucher_ok = true where id = p.id;
  end loop;
  update public.quiz_pemenang set terbit = true, terbit_at = coalesce(terbit_at, now()) where periode_id = p_periode;
  update public.quiz_periode set diproses_at = coalesce(diproses_at, now()) where id = p_periode;
end $$;

-- Periode otomatis selesai -> juara + undian dihitung, LALU BERHENTI menunggu verifikasi admin.
create or replace function public.kuis_proses_otomatis()
returns integer language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; n integer := 0;
begin
  for pr in select * from public.quiz_periode
             where otomatis and diproses_at is null and selesai <= now()
             order by selesai for update skip locked loop
    if not exists (select 1 from public.quiz_pemenang where periode_id = pr.id) then
      perform public.kuis__juara(pr.id);
      perform public.kuis__undi(pr.id, null);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.kuis__juara(integer), public.kuis__undi(integer, integer), public.kuis__undi_ganti(integer, integer),
                       public.kuis__terbit(integer), public.kuis_proses_otomatis() from public, anon, authenticated;

-- ---------- tanda bahaya untuk admin ----------
-- per pemenang: jumlah dijawab & benar selama periode, ketepatan, jawaban sangat cepat (< 3 detik
-- dari jawaban sebelumnya), kelas soal terbanyak, akun lain dengan nama sama di 50 besar.
create or replace function public.kuis_admin_cek(p_periode integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pr public.quiz_periode%rowtype; hasil jsonb;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  select * into pr from public.quiz_periode where id = p_periode;
  if not found then raise exception 'Periode tidak ditemukan'; end if;
  with w as (select * from public.quiz_pemenang where periode_id = p_periode),
  j as (select jj.*, extract(epoch from jj.t - lag(jj.t) over (partition by jj.wa order by jj.t)) jeda
          from public.quiz_jawaban jj where jj.t >= pr.mulai and jj.t < pr.selesai and jj.wa in (select wa from w)),
  st as (select j.wa, count(*) total, count(*) filter (where j.benar) benar,
                count(*) filter (where j.jeda is not null and j.jeda < 3) cepat,
                percentile_cont(.5) within group (order by j.jeda) filter (where j.jeda is not null and j.jeda < 600) median_jeda,
                count(distinct j.hari) hari
           from j group by j.wa),
  kl as (select x.wa, jsonb_agg(jsonb_build_object('kelas', x.jenjang || ' ' || x.kelas, 'n', x.n) order by x.n desc) kelas
           from (select j.wa, q.jenjang, q.kelas, count(*) n, row_number() over (partition by j.wa order by count(*) desc) r
                   from j join public.quiz_questions q on q.id = j.qid group by j.wa, q.jenjang, q.kelas) x
          where x.r <= 3 group by x.wa),
  top as (select * from public.kuis_ranking(p_periode) limit 50),
  nm as (select w.wa, count(*) filter (where t.wa <> w.wa) sama from (select distinct wa, nama from w) w join top t on lower(btrim(t.nama)) = lower(btrim(coalesce(w.nama, ''))) group by w.wa)
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', w.id, 'jenis', w.jenis, 'peringkat', w.peringkat, 'wa', w.wa, 'nama', w.nama, 'hadiah', w.hadiah,
           'nomor_kupon', w.nomor_kupon, 'jumlah_benar', w.jumlah_benar, 'status_cek', w.status_cek, 'cek_oleh', w.cek_oleh, 'cek_at', w.cek_at,
           'terbit', w.terbit, 'voucher_ok', w.voucher_ok,
           'total', coalesce(st.total, 0), 'benar', coalesce(st.benar, 0), 'cepat', coalesce(st.cepat, 0),
           'median_jeda', round(coalesce(st.median_jeda, 0)::numeric, 1), 'hari', coalesce(st.hari, 0),
           'kelas', coalesce(kl.kelas, '[]'::jsonb), 'nama_sama', coalesce(nm.sama, 0)
         ) order by w.jenis, w.peringkat), '[]'::jsonb) into hasil
    from w left join st on st.wa = w.wa left join kl on kl.wa = w.wa left join nm on nm.wa = w.wa;
  return jsonb_build_object('ok', true, 'pemenang', hasil,
    'diskualifikasi', coalesce((select jsonb_agg(to_jsonb(d) order by d.t desc) from public.quiz_diskualifikasi d where d.periode_id = p_periode), '[]'::jsonb));
end $$;

create or replace function public.kuis_admin_setujui(p_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.quiz_pemenang%rowtype;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  update public.quiz_pemenang set status_cek = 'ok', cek_at = now(), cek_oleh = coalesce(auth.jwt()->>'email', 'admin')
   where id = p_id and not terbit returning * into w;
  if w.id is null then raise exception 'Pemenang tidak ditemukan atau sudah diterbitkan'; end if;
  return public.kuis_admin_cek(w.periode_id);
end $$;

create or replace function public.kuis_admin_setujui_semua(p_periode integer)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  update public.quiz_pemenang set status_cek = 'ok', cek_at = now(), cek_oleh = coalesce(auth.jwt()->>'email', 'admin')
   where periode_id = p_periode and status_cek <> 'ok' and not terbit;
  return public.kuis_admin_cek(p_periode);
end $$;

-- Tolak = diskualifikasi pemain untuk periode itu, lalu pemenangnya diganti otomatis
create or replace function public.kuis_admin_tolak(p_id bigint, p_alasan text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare w public.quiz_pemenang%rowtype; u record; ada_juara boolean;
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if coalesce(btrim(p_alasan), '') = '' then raise exception 'Isi alasan penolakan'; end if;
  select * into w from public.quiz_pemenang where id = p_id for update;
  if w.id is null then raise exception 'Pemenang tidak ditemukan'; end if;
  if w.terbit or w.voucher_ok then raise exception 'Pemenang ini sudah diterbitkan, tidak bisa ditolak lagi'; end if;
  insert into public.quiz_diskualifikasi (periode_id, wa, alasan, oleh)
  values (w.periode_id, w.wa, left(btrim(p_alasan), 300), coalesce(auth.jwt()->>'email', 'admin'))
  on conflict (periode_id, wa) do update set alasan = excluded.alasan, oleh = excluded.oleh, t = now();
  -- pemain ini keluar dari SEMUA hadiah periode itu (juara & undian)
  select exists (select 1 from public.quiz_pemenang where periode_id = w.periode_id and wa = w.wa and jenis = 'juara') into ada_juara;
  if ada_juara then perform public.kuis__juara(w.periode_id); end if;
  for u in select * from public.quiz_pemenang where periode_id = w.periode_id and wa = w.wa and jenis = 'undian' loop
    delete from public.quiz_pemenang where id = u.id;
    perform public.kuis__undi_ganti(w.periode_id, u.peringkat);
  end loop;
  return public.kuis_admin_cek(w.periode_id);
end $$;

-- Batalkan diskualifikasi (bila admin keliru). Juara dihitung ulang; undian tidak diubah.
create or replace function public.kuis_admin_batal_tolak(p_periode integer, p_wa text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Hanya admin'; end if;
  if exists (select 1 from public.quiz_pemenang where periode_id = p_periode and terbit) then raise exception 'Pemenang periode ini sudah diterbitkan'; end if;
  delete from public.quiz_diskualifikasi where periode_id = p_periode and wa = p_wa;
  perform public.kuis__juara(p_periode);
  return public.kuis_admin_cek(p_periode);
end $$;

revoke all on function public.kuis_admin_cek(integer), public.kuis_admin_setujui(bigint), public.kuis_admin_setujui_semua(integer),
                       public.kuis_admin_tolak(bigint, text), public.kuis_admin_batal_tolak(integer, text) from public, anon;
grant execute on function public.kuis_admin_cek(integer), public.kuis_admin_setujui(bigint), public.kuis_admin_setujui_semua(integer),
                          public.kuis_admin_tolak(bigint, text), public.kuis_admin_batal_tolak(integer, text) to authenticated;

notify pgrst, 'reload schema';

-- Cek: harus menampilkan true, true, true
select exists (select 1 from pg_proc where proname = 'kuis__urut') as acak_pilihan,
       exists (select 1 from information_schema.columns where table_name = 'quiz_pemenang' and column_name = 'status_cek') as verifikasi,
       to_regclass('public.quiz_diskualifikasi') is not null as diskualifikasi;
