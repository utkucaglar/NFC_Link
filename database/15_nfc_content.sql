-- ============================================
-- NFCLink - NFC Content Tables
-- File: 15_nfc_content.sql
-- ============================================
-- Bu dosya NFC sayfaları için galeri, anılar ve manifest tablolarını oluşturur
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. NFC GALLERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nfc_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfc_id UUID REFERENCES nfcs(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  date DATE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. NFC MEMORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nfc_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfc_id UUID REFERENCES nfcs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  icon TEXT DEFAULT '💕',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. NFC MANIFEST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS nfc_manifest (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfc_id UUID REFERENCES nfcs(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  icon TEXT DEFAULT '📜',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_nfc_gallery_nfc_id ON nfc_gallery(nfc_id);
CREATE INDEX IF NOT EXISTS idx_nfc_gallery_sort ON nfc_gallery(nfc_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_nfc_memories_nfc_id ON nfc_memories(nfc_id);
CREATE INDEX IF NOT EXISTS idx_nfc_memories_date ON nfc_memories(nfc_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_nfc_manifest_nfc_id ON nfc_manifest(nfc_id);
CREATE INDEX IF NOT EXISTS idx_nfc_manifest_date ON nfc_manifest(nfc_id, date DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE nfc_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfc_manifest ENABLE ROW LEVEL SECURITY;

-- ============================================
-- GALLERY POLICIES
-- ============================================
-- Herkes görebilir
CREATE POLICY "nfc_gallery_select" ON nfc_gallery
  FOR SELECT USING (true);

-- Giriş yapmış kullanıcılar kendi NFC'lerine ekleyebilir
CREATE POLICY "nfc_gallery_insert" ON nfc_gallery
  FOR INSERT TO authenticated
  WITH CHECK (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

-- Giriş yapmış kullanıcılar kendi NFC'lerini güncelleyebilir
CREATE POLICY "nfc_gallery_update" ON nfc_gallery
  FOR UPDATE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

-- Giriş yapmış kullanıcılar kendi NFC'lerinden silebilir
CREATE POLICY "nfc_gallery_delete" ON nfc_gallery
  FOR DELETE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

-- ============================================
-- MEMORIES POLICIES
-- ============================================
CREATE POLICY "nfc_memories_select" ON nfc_memories
  FOR SELECT USING (true);

CREATE POLICY "nfc_memories_insert" ON nfc_memories
  FOR INSERT TO authenticated
  WITH CHECK (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

CREATE POLICY "nfc_memories_update" ON nfc_memories
  FOR UPDATE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

CREATE POLICY "nfc_memories_delete" ON nfc_memories
  FOR DELETE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

-- ============================================
-- MANIFEST POLICIES
-- ============================================
CREATE POLICY "nfc_manifest_select" ON nfc_manifest
  FOR SELECT USING (true);

CREATE POLICY "nfc_manifest_insert" ON nfc_manifest
  FOR INSERT TO authenticated
  WITH CHECK (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

CREATE POLICY "nfc_manifest_update" ON nfc_manifest
  FOR UPDATE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

CREATE POLICY "nfc_manifest_delete" ON nfc_manifest
  FOR DELETE TO authenticated
  USING (
    nfc_id IN (SELECT id FROM nfcs WHERE user_id = auth.uid())
  );

-- ============================================
-- STORAGE BUCKET FOR NFC GALLERY
-- ============================================
-- Supabase Dashboard > Storage > New Bucket
-- Bucket name: nfc-gallery
-- Public: true

-- Storage policies (run in SQL Editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('nfc-gallery', 'nfc-gallery', true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ NFC content tables created!';
  RAISE NOTICE '📝 Tables: nfc_gallery, nfc_memories, nfc_manifest';
  RAISE NOTICE '🔐 RLS policies applied';
  RAISE NOTICE '📸 Remember to create "nfc-gallery" storage bucket in Supabase Dashboard';
END $$;
