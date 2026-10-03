-- =====================================================================
-- KALENSARI STORE - Potongan saldo kurir: NOMINAL atau PERSEN dari ongkir
-- Jalankan SEKALI di Supabase > SQL Editor (setelah supabase-saldo-kurir.sql).
-- Aman dijalankan ulang. Pilihan diatur di admin.html > Pengaturan > Saldo Kurir.
-- =====================================================================
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

-- Cek: harus menampilkan true
select exists (select 1 from pg_trigger where tgname = 'ks_potong_saldo') as potong_siap;
