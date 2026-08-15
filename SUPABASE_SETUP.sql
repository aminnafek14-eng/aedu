-- ══════════════════════════════════════════
--  AEdu — Supabase Database Setup
--  Jalankan ini dalam Supabase SQL Editor
-- ══════════════════════════════════════════

-- 1. STUDENTS (murid)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL UNIQUE,        -- sentiasa uppercase
  parent_phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. FOLDERS
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  img_url TEXT,
  emoji TEXT DEFAULT '📁',
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LINKS
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  img_url TEXT,
  emoji TEXT DEFAULT '🔗',
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. BANNERS (galeri bergerak)
CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT '',
  img_url TEXT,
  link_url TEXT,
  active BOOLEAN DEFAULT true,
  order_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners  ENABLE ROW LEVEL SECURITY;

-- Public read for folders, links, banners (pelajar boleh baca)
CREATE POLICY "public_read_folders"  ON folders  FOR SELECT USING (true);
CREATE POLICY "public_read_links"    ON links     FOR SELECT USING (true);
CREATE POLICY "public_read_banners"  ON banners   FOR SELECT USING (true);

-- Public insert/read for students (signup & login check)
CREATE POLICY "public_read_students"   ON students FOR SELECT USING (true);
CREATE POLICY "public_insert_students" ON students FOR INSERT WITH CHECK (true);

-- All write operations (admin uses anon key — simpan admin pw di client sahaja)
CREATE POLICY "public_write_folders"  ON folders  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_write_links"    ON links     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_write_banners"  ON banners   FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════
--  STORAGE BUCKET untuk gambar
-- ══════════════════════════════════════════
-- Pergi ke Storage > New bucket
-- Nama: images
-- Public: YES (toggle on)
-- Kemudian tambah policy:
-- Bucket: images | Operation: SELECT, INSERT, UPDATE, DELETE | Role: anon | Allow

-- ══════════════════════════════════════════
--  DATA CONTOH (pilihan)
-- ══════════════════════════════════════════
INSERT INTO folders (name, emoji, order_num) VALUES
  ('Tahun 1', '1️⃣', 0),
  ('Tahun 2', '2️⃣', 1),
  ('Tahun 3', '3️⃣', 2);
