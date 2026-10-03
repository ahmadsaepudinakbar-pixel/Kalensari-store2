-- =====================================================================
-- KALENSARI STORE - Saldo awal otomatis untuk kurir baru
-- Jalankan SEKALI di Supabase > SQL Editor (setelah supabase-saldo-kurir.sql).
-- Aman dijalankan ulang. Tidak berisi kode rahasia.
-- Besarnya diatur di admin.html > Pengaturan > Saldo Kurir ("Saldo awal kurir baru").
-- =====================================================================
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

-- Cek: harus menampilkan true
select exists (select 1 from pg_proc where proname = 'beri_saldo_awal') as saldo_awal_siap;
