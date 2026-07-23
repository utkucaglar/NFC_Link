-- ============================================
-- PRODUCT IMAGES TABLE
-- File: 27_product_images_table.sql
-- ============================================
-- Bu dosya ürün renk bazlı görselleri için tablo oluşturur
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  color TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, color)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_color ON product_images(color);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images(sort_order);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_images_updated_at
BEFORE UPDATE ON product_images
FOR EACH ROW
EXECUTE FUNCTION update_product_images_updated_at();

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Herkes görselleri okuyabilir
CREATE POLICY "Public can read product images"
ON product_images FOR SELECT
USING (true);

-- Sadece authenticated kullanıcılar ekleyebilir
CREATE POLICY "Authenticated users can insert product images"
ON product_images FOR INSERT
TO authenticated
WITH CHECK (true);

-- Sadece authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Authenticated users can update product images"
ON product_images FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Authenticated users can delete product images"
ON product_images FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Product images table created!';
  RAISE NOTICE '📸 Table: product_images';
  RAISE NOTICE '🎨 Columns: product_id, color, image_url, sort_order';
  RAISE NOTICE '🔐 RLS: Enabled';
END $$;
