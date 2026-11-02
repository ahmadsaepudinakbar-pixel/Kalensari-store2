-- =====================================================================
--  PROFIL GAME (Kalensari Game): nama & foto profil per akun warga desa
--  Jalankan sekali di Supabase → SQL Editor (setelah supabase-kartu-game.sql).
--  Foto disimpan sebagai gambar kecil (data URL ±160×160 px, maks ±60 KB).
-- =====================================================================
create table if not exists public.game_profil (
  wa     text primary key,
  nama   text,
  foto   text,
  diubah timestamptz not null default now()
);
alter table public.game_profil enable row level security;   -- tanpa policy: hanya bisa lewat fungsi di bawah
revoke all on table public.game_profil from anon, authenticated;

-- nama di game: pakai nama profil game kalau ada, kalau tidak nama akun warga desa
create or replace function public.game_nama(p_wa text)
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select nullif(trim(nama), '') from public.game_profil where wa = p_wa),
    (select nullif(trim(x->>'nama'), '')
       from public.store_settings a, public.store_settings m,
            jsonb_array_elements(case when jsonb_typeof(m.value) = 'array' then m.value else '[]'::jsonb end) x
      where a.key = 'pembeli_accounts' and m.key = 'pembeli_members' and x->>'id' = a.value->p_wa->>'id'
      limit 1),
    'Pemain')
$$;
revoke all on function public.game_nama(text) from public, anon, authenticated;

-- koleksi pemain + foto profil game
create or replace function public.game_koleksi(p_sesi text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text;
begin
  if coalesce(p_sesi, '') = '' then return jsonb_build_object('login', false); end if;
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then return jsonb_build_object('login', false, 'sesi_habis', true); end if;
  return jsonb_build_object('login', true, 'nama', public.game_nama(v_wa),
                            'foto', (select foto from public.game_profil where wa = v_wa)) || public.game_koleksi_isi(v_wa);
end $$;
grant execute on function public.game_koleksi(text) to anon, authenticated;

-- simpan nama & foto profil game. p_foto: null = foto tidak diubah, '' = hapus foto
create or replace function public.game_profil_simpan(p_sesi text, p_nama text, p_foto text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_wa text; v_nama text;
begin
  v_wa := public.ks_sesi_wa(p_sesi, 'pembeli');
  if v_wa is null then raise exception 'SESI: Silakan masuk akun warga desa dulu.'; end if;
  v_nama := left(regexp_replace(trim(coalesce(p_nama, '')), '[<>"\\]', '', 'g'), 16);
  if length(v_nama) < 2 then raise exception 'Nama minimal 2 huruf.'; end if;
  if p_foto is not null and p_foto <> '' then
    if p_foto !~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$' then raise exception 'Format foto tidak dikenali.'; end if;
    if length(p_foto) > 80000 then raise exception 'Foto terlalu besar.'; end if;
  end if;
  insert into public.game_profil (wa, nama, foto, diubah)
       values (v_wa, v_nama, nullif(p_foto, ''), now())
  on conflict (wa) do update set nama = excluded.nama,
       foto = case when p_foto is null then public.game_profil.foto else nullif(p_foto, '') end,
       diubah = now();
  return jsonb_build_object('ok', true, 'nama', v_nama, 'foto', (select foto from public.game_profil where wa = v_wa));
end $$;
grant execute on function public.game_profil_simpan(text, text, text) to anon, authenticated;
