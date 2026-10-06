-- =====================================================================
-- KALENSARI STORE • Merapikan peringatan Security Advisor
-- Jalankan SEKALI di Supabase > SQL Editor > New query > Run. Aman dijalankan ulang.
--
-- 1) "Function Search Path Mutable": semua fungsi buatan sendiri di schema public
--    dikunci jalur pencariannya ke (public, extensions). Fungsi bawaan ekstensi tidak disentuh.
-- 2) Menampilkan daftar policy "selalu true" yang tersisa supaya bisa dicek satu per satu.
-- =====================================================================

do $$
declare f record; n int := 0;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.prokind in ('f', 'p')
       and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')   -- bukan milik ekstensi
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
  loop
    execute format('alter function %s set search_path = public, extensions', f.sig);
    n := n + 1;
  end loop;
  raise notice 'Fungsi yang dirapikan: %', n;
end $$;

-- Daftar policy yang masih "selalu true" untuk TULIS (tambah / ubah / hapus).
-- Kirim screenshot hasil ini ke Claude.
select c.relname as tabel,
       p.polname as policy,
       case p.polcmd when 'a' then 'tambah' when 'w' then 'ubah' when 'd' then 'hapus' when '*' then 'SEMUA' else p.polcmd::text end as aksi,
       coalesce(pg_get_expr(p.polqual, p.polrelid), '-')      as syarat_baris,
       coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '-') as syarat_isi
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace ns on ns.oid = c.relnamespace
 where ns.nspname = 'public'
   and p.polcmd in ('a', 'w', 'd', '*')
   and p.polpermissive
   and (coalesce(pg_get_expr(p.polqual, p.polrelid), 'true') = 'true'
        and coalesce(pg_get_expr(p.polwithcheck, p.polrelid), 'true') = 'true')
 order by 1, 3;
