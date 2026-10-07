-- =====================================================================
-- Kalensari Store • Tombol "Laporkan" di Lapak Barter (syarat Google Play
-- untuk aplikasi yang memuat konten buatan pengguna).
-- Jalankan SETELAH supabase-keamanan-ulasan-lapak.sql. Aman dijalankan berulang kali.
--
--   * Pembeli yang sudah masuk akun bisa melaporkan iklan atau komentar.
--   * Satu orang hanya bisa melapor satu kali per iklan / komentar.
--   * Iklan yang dilaporkan 3 orang berbeda otomatis disembunyikan
--     sampai diperiksa admin. Komentar yang dilaporkan 3 orang otomatis dihapus.
--   * Daftar laporan hanya bisa dilihat admin (menu Lapak Barter di app admin).
-- =====================================================================

create table if not exists public.lapak_laporan (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  iklan_id    bigint not null references public.lapak_iklan(id) on delete cascade,
  komentar_id bigint,            -- (tanpa relasi: laporan tetap tersimpan walau komentarnya sudah dihapus)
  alasan      text not null,
  ket         text,
  pelapor_wa  text not null,
  pelapor_nama text,
  isi         text,              -- salinan isi komentar / judul iklan saat dilaporkan
  beres       boolean not null default false
);
create unique index if not exists lapak_laporan_sekali
  on public.lapak_laporan (iklan_id, coalesce(komentar_id, 0), pelapor_wa);

alter table public.lapak_laporan enable row level security;
revoke all on public.lapak_laporan from anon;
grant select, update, delete on public.lapak_laporan to authenticated;
drop policy if exists "lapak_laporan_admin" on public.lapak_laporan;
create policy "lapak_laporan_admin" on public.lapak_laporan for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.lapak_lapor(p_sesi text, p_iklan bigint, p_komentar bigint, p_alasan text, p_ket text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare me jsonb := public.ks_pembeli_sesi(p_sesi); v_wa text := me->>'wa'; i record; k_wa text; k_isi text; n int; baru boolean;
begin
  if p_alasan not in ('Penipuan', 'Barang terlarang', 'Konten tidak pantas', 'Spam', 'Lainnya') then
    raise exception 'Pilih alasan laporan';
  end if;
  select id, wa, judul, status into i from public.lapak_iklan where id = p_iklan;
  if not found then raise exception 'Iklan tidak ditemukan'; end if;
  if p_komentar is not null then
    select wa, isi into k_wa, k_isi from public.lapak_komentar where id = p_komentar and iklan_id = p_iklan;
    if not found then raise exception 'Komentar tidak ditemukan'; end if;
    if public.ks_hp10(k_wa) = public.ks_hp10(v_wa) then raise exception 'Tidak bisa melaporkan komentar sendiri'; end if;
  elsif public.ks_hp10(i.wa) = public.ks_hp10(v_wa) then
    raise exception 'Tidak bisa melaporkan iklan sendiri';
  end if;

  insert into public.lapak_laporan (iklan_id, komentar_id, alasan, ket, pelapor_wa, pelapor_nama, isi)
  values (p_iklan, p_komentar, p_alasan, left(nullif(btrim(coalesce(p_ket, '')), ''), 300), v_wa, me->>'nama',
          left(case when p_komentar is null then i.judul else k_isi end, 300))
  on conflict do nothing;
  get diagnostics n = row_count; baru := n > 0;

  -- 3 pelapor berbeda -> sembunyikan iklan / hapus komentar sampai diperiksa admin
  select count(distinct pelapor_wa) into n from public.lapak_laporan
   where iklan_id = p_iklan and komentar_id is not distinct from p_komentar and not beres;
  if n >= 3 then
    if p_komentar is null then
      update public.lapak_iklan set status = 'disembunyikan' where id = p_iklan and status = 'aktif';
    else
      delete from public.lapak_komentar where id = p_komentar;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'baru', baru);
end $$;
revoke all on function public.lapak_lapor(text, bigint, bigint, text, text) from public;
grant execute on function public.lapak_lapor(text, bigint, bigint, text, text) to anon, authenticated;
