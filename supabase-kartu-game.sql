-- =====================================================================
-- KALENSARI GAME • KARTU HERO & SKIN (scan QR untuk membuka hero / skin)
-- Jalankan di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
-- Butuh fungsi yang sudah ada: ks_sesi_wa (akun pembeli) dan is_admin.
--
-- Aturan:
--   • 1 kode kartu hanya bisa diklaim 1 akun pembeli (selamanya).
--   • Kode acak 6 karakter (tanpa huruf/angka yang mirip: 0 O 1 I L).
--   • Salah kode maks 10x per jam per akun (mencegah tebak-tebakan kode).
--   • Tabel tidak bisa dibaca/diubah langsung dari web; semua lewat fungsi.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- 1) TABEL ----------
create table if not exists public.game_kartu (
  kode          text primary key,                 -- contoh: KLS-KUN-7F3K9Q
  jenis         text not null check (jenis in ('hero', 'skin')),
  item          text not null,                    -- hero: 'kuntilanak' · skin: 'kuntilanak:merah'
  kelas         text not null default 'biasa' check (kelas in ('biasa', 'langka', 'legenda')),
  batch         text not null default '',         -- nama kelompok cetak, mis. "Kunti Okt 2026"
  aktif         boolean not null default true,
  pemilik_wa    text,
  diklaim       timestamptz,
  dibuat        timestamptz not null default now()
);
create index if not exists game_kartu_pemilik on public.game_kartu (pemilik_wa) where pemilik_wa is not null;
create index if not exists game_kartu_batch on public.game_kartu (batch);

create table if not exists public.game_kartu_gagal (
  wa    text not null,
  waktu timestamptz not null default now()
);
create index if not exists game_kartu_gagal_wa on public.game_kartu_gagal (wa, waktu);

alter table public.game_kartu enable row level security;
alter table public.game_kartu_gagal enable row level security;
revoke all on public.game_kartu, public.game_kartu_gagal from anon, authenticated;

-- ---------- 2) FUNGSI BANTU ----------
-- nama pembeli dari data akun warga
create or replace function public.game_nama(p_wa text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce((
    select nullif(trim(x->>'nama'), '')
      from public.store_settings a, public.store_settings m,
           jsonb_array_elements(case when jsonb_typeof(m.value) = 'array' then m.value else '[]'::jsonb end) x
     where a.key = 'pembeli_accounts' and m.key = 'pembeli_members' and x->>'id' = a.value->p_wa->>'id'
     limit 1), 'Pemain')
$$;
revoke all on function public.game_nama(text) from public, anon, authenticated;

-- rapikan kode yang diketik/discan: huruf besar, buang spasi, ambil dari link ?kartu=
create or replace function public.game_rapikan_kode(p text)
returns text language sql immutable as $$
  select upper(regexp_replace(
           coalesce(substring(coalesce(p, '') from '[?&]kartu=([A-Za-z0-9-]+)'), coalesce(p, '')),
           '[^A-Za-z0-9-]', '', 'g'))
$$;

create or replace function public.game_koleksi_isi(p_wa text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'hero', coalesce((select jsonb_agg(distinct item) from public.game_kartu where pemilik_wa = p_wa and jenis = 'hero' and aktif), '[]'::jsonb),
    'skin', coalesce((select jsonb_agg(distinct item) from public.game_kartu where pemilik_wa = p_wa and jenis = 'skin' and aktif), '[]'::jsonb),
    'kartu', coalesce((select jsonb_agg(jsonb_build_object('kode', kode, 'jenis', jenis, 'item', item, 'kelas', kelas, 'diklaim', diklaim) order by diklaim desc)
                         from public.game_kartu where pemilik_wa = p_wa and aktif), '[]'::jsonb))
$$;
revoke all on function public.game_koleksi_isi(text) from public, anon, authenticated;

-- ---------- 3) UNTUK PEMAIN (dipanggil dari game.html) ----------
-- koleksi kartu pemain. p_sesi kosong = belum masuk.
create or replace function public.game_koleksi(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text;
begin
  if coalesce(p_sesi, '') = '' then return jsonb_build_object('login', false); end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then return jsonb_build_object('login', false, 'sesi_habis', true); end if;
  return jsonb_build_object('login', true, 'nama', public.game_nama(v_wa)) || public.game_koleksi_isi(v_wa);
end $$;
grant execute on function public.game_koleksi(text) to anon, authenticated;

-- klaim kartu dengan kode / isi QR
create or replace function public.game_klaim(p_sesi text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_kode text; k public.game_kartu; n int;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then raise exception 'SESI: Silakan masuk akun pembeli dulu.'; end if;
  v_kode := public.game_rapikan_kode(p_kode);
  if length(v_kode) < 6 then raise exception 'Kode kartu tidak lengkap.'; end if;

  select count(*) into n from public.game_kartu_gagal where wa = v_wa and waktu > now() - interval '1 hour';
  if n >= 10 then raise exception 'Terlalu banyak kode salah. Coba lagi 1 jam lagi.'; end if;

  select * into k from public.game_kartu where kode = v_kode for update;
  if not found then
    insert into public.game_kartu_gagal (wa) values (v_wa);
    delete from public.game_kartu_gagal where waktu < now() - interval '1 day';
    -- sengaja tidak memakai raise supaya catatan salah-kode tetap tersimpan
    return jsonb_build_object('ok', false, 'pesan', 'Kode kartu tidak dikenal. Periksa lagi kodenya. (sisa percobaan: ' || greatest(0, 9 - n) || ')');
  end if;
  if not k.aktif then raise exception 'Kartu ini sudah dinonaktifkan admin.'; end if;
  if k.pemilik_wa = v_wa then
    return jsonb_build_object('ok', true, 'sudah', true, 'jenis', k.jenis, 'item', k.item, 'kelas', k.kelas, 'kode', k.kode) || public.game_koleksi_isi(v_wa);
  end if;
  if k.pemilik_wa is not null then raise exception 'Kartu sudah dimiliki pemain lain.'; end if;

  update public.game_kartu set pemilik_wa = v_wa, diklaim = now() where kode = v_kode;
  return jsonb_build_object('ok', true, 'sudah', false, 'jenis', k.jenis, 'item', k.item, 'kelas', k.kelas, 'kode', k.kode) || public.game_koleksi_isi(v_wa);
end $$;
grant execute on function public.game_klaim(text, text) to anon, authenticated;

-- ---------- 4) UNTUK ADMIN (admin-kartu.html) ----------
-- buat banyak kode sekaligus
create or replace function public.game_admin_buat(p_jenis text, p_item text, p_kelas text, p_jumlah int, p_batch text, p_awalan text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare abjad constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; aw text; kd text; acak bytea; i int; j int; dibuat int := 0; coba int := 0; hasil text[] := '{}';
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  if p_jenis not in ('hero', 'skin') then raise exception 'Jenis harus hero atau skin.'; end if;
  if coalesce(trim(p_item), '') = '' then raise exception 'Pilih hero / skin.'; end if;
  if coalesce(p_kelas, '') not in ('biasa', 'langka', 'legenda') then raise exception 'Kelas tidak dikenal.'; end if;
  if p_jumlah is null or p_jumlah < 1 or p_jumlah > 2000 then raise exception 'Jumlah 1–2000 kartu per sekali buat.'; end if;
  aw := upper(regexp_replace(coalesce(nullif(trim(p_awalan), ''), left(split_part(p_item, ':', 1), 3)), '[^A-Za-z0-9]', '', 'g'));
  aw := left(rpad(aw, 3, 'X'), 4);
  while dibuat < p_jumlah loop
    coba := coba + 1; if coba > p_jumlah * 5 + 50 then raise exception 'Gagal membuat kode unik, coba lagi.'; end if;
    acak := gen_random_bytes(6); kd := '';
    for j in 0..5 loop kd := kd || substr(abjad, (get_byte(acak, j) % length(abjad)) + 1, 1); end loop;
    kd := 'KLS-' || aw || '-' || kd;
    insert into public.game_kartu (kode, jenis, item, kelas, batch) values (kd, p_jenis, trim(p_item), p_kelas, coalesce(trim(p_batch), ''))
    on conflict (kode) do nothing;
    if found then dibuat := dibuat + 1; hasil := hasil || kd; end if;
  end loop;
  return jsonb_build_object('jumlah', dibuat, 'batch', coalesce(trim(p_batch), ''), 'kode', to_jsonb(hasil));
end $$;
grant execute on function public.game_admin_buat(text, text, text, int, text, text) to authenticated;

-- daftar kartu (filter: batch, status semua/diklaim/belum/nonaktif, cari kode / no WA)
create or replace function public.game_admin_daftar(p_batch text default null, p_status text default 'semua', p_cari text default null, p_batas int default 500, p_lewati int default 0)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb; tot int; c text := upper(regexp_replace(coalesce(p_cari, ''), '\s', '', 'g'));
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  with f as (
    select * from public.game_kartu k
     where (coalesce(p_batch, '') = '' or k.batch = p_batch)
       and (coalesce(p_status, 'semua') = 'semua'
            or (p_status = 'diklaim' and k.pemilik_wa is not null)
            or (p_status = 'belum' and k.pemilik_wa is null and k.aktif)
            or (p_status = 'nonaktif' and not k.aktif))
       and (c = '' or k.kode like '%' || c || '%' or k.pemilik_wa like '%' || regexp_replace(c, '^0', '62') || '%')
  )
  select (select count(*) from f),
         coalesce((select jsonb_agg(jsonb_build_object('kode', kode, 'jenis', jenis, 'item', item, 'kelas', kelas, 'batch', batch, 'aktif', aktif,
                    'pemilik_wa', pemilik_wa, 'pemilik_nama', case when pemilik_wa is null then null else public.game_nama(pemilik_wa) end,
                    'diklaim', diklaim, 'dibuat', dibuat))
                   from (select * from f order by dibuat desc, kode limit greatest(1, least(coalesce(p_batas, 500), 5000)) offset greatest(0, coalesce(p_lewati, 0))) x), '[]'::jsonb)
    into tot, r;
  return jsonb_build_object('total', tot, 'data', r);
end $$;
grant execute on function public.game_admin_daftar(text, text, text, int, int) to authenticated;

-- ringkasan per batch & per item
create or replace function public.game_admin_ringkas()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  return jsonb_build_object(
    'total', (select count(*) from public.game_kartu),
    'diklaim', (select count(*) from public.game_kartu where pemilik_wa is not null),
    'pemain', (select count(distinct pemilik_wa) from public.game_kartu where pemilik_wa is not null),
    'batch', coalesce((select jsonb_agg(x order by x->>'dibuat' desc) from (
        select jsonb_build_object('batch', batch, 'jenis', min(jenis), 'item', min(item), 'kelas', min(kelas), 'jumlah', count(*),
               'diklaim', count(pemilik_wa), 'nonaktif', count(*) filter (where not aktif), 'dibuat', min(dibuat)) x
          from public.game_kartu group by batch) b), '[]'::jsonb));
end $$;
grant execute on function public.game_admin_ringkas() to authenticated;

-- aktif / nonaktifkan kode (kartu hilang, salah cetak, dll.)
create or replace function public.game_admin_aktif(p_kode text[], p_aktif boolean)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  update public.game_kartu set aktif = p_aktif where kode = any(p_kode);
  get diagnostics n = row_count; return n;
end $$;
grant execute on function public.game_admin_aktif(text[], boolean) to authenticated;

-- lepas pemilik (bila klaim keliru) – kartu bisa diklaim lagi
create or replace function public.game_admin_lepas(p_kode text)
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  update public.game_kartu set pemilik_wa = null, diklaim = null where kode = upper(trim(p_kode));
  get diagnostics n = row_count; return n;
end $$;
grant execute on function public.game_admin_lepas(text) to authenticated;

-- hapus kode yang BELUM diklaim (mis. salah buat)
create or replace function public.game_admin_hapus(p_kode text[])
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'Khusus admin.'; end if;
  delete from public.game_kartu where kode = any(p_kode) and pemilik_wa is null;
  get diagnostics n = row_count; return n;
end $$;
grant execute on function public.game_admin_hapus(text[]) to authenticated;

notify pgrst, 'reload schema';
