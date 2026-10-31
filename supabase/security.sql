-- ═══════════════════════════════════════════════════════════════
-- AEdu — KUNCI KESELAMATAN DATA
-- Jalankan dalam Supabase → SQL Editor SELEPAS kod baru di-deploy.
-- Selamat dijalankan semula.
--
-- Selepas ini, kunci awam (anon key) dalam browser TIDAK boleh:
--   • membaca kata laluan / telefon murid
--   • mengubah status premium
--   • membaca kod game (html_content) atau URL aktiviti
--   • membaca / mencipta permintaan bayaran secara terus
-- Semua operasi ini kini melalui API pelayan (service role).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. MURID, BAYARAN, PENGGUNAAN — tertutup sepenuhnya kepada browser ──
revoke all on public.students         from anon, authenticated;
revoke all on public.payment_requests from anon, authenticated;
revoke all on public.app_usage        from anon, authenticated;

-- ── 2. AKTIVITI (links) — browser hanya nampak maklumat kad (nama, gambar, tag) ──
-- Kolum url & html_content TIDAK diberi. Kod game hanya melalui /api/play.
revoke all on public.links from anon, authenticated;
do $$
declare cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
    from information_schema.columns
   where table_schema = 'public' and table_name = 'links'
     and column_name not in ('url', 'html_content');
  execute format('grant select (%s) on public.links to anon, authenticated', cols);
end $$;
-- NOTA: jika anda tambah kolum baru pada 'links' kelak, jalankan semula fail ini.

-- ── 3. KANDUNGAN AWAM — baca sahaja ──
do $$
declare t text;
begin
  foreach t in array array['banners', 'app_settings', 'folders'] loop
    if to_regclass('public.' || t) is not null then
      execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', t);
      execute format('grant select on public.%I to anon, authenticated', t);
    end if;
  end loop;
end $$;

-- ── 4. Pastikan service role (API pelayan) masih ada akses penuh ──
grant all on public.students, public.payment_requests, public.app_usage, public.links to service_role;

-- ── SEMAKAN (pilihan): jalankan dan pastikan kedua-duanya 'false' ──
-- select has_column_privilege('anon', 'public.links', 'html_content', 'select') as anon_boleh_baca_game,
--        has_table_privilege('anon', 'public.students', 'select')              as anon_boleh_baca_murid;
