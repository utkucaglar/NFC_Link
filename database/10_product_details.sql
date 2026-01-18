-- ============================================
-- NFCLink Product Details & Categories Schema
-- File: 10_product_details.sql
-- ============================================
-- Bu dosya ürün detayları ve kategoriler için gerekli tabloları oluşturur
-- ============================================

-- ============================================
-- 1. CATEGORIES TABLE (Kategoriler)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan kategorileri ekle
INSERT INTO categories (name, description, sort_order) VALUES
  ('Profesyonel', 'İş dünyası için NFC çözümleri', 1),
  ('Premium', 'Lüks ve özel tasarım ürünler', 2),
  ('Spor & Etkinlik', 'Spor ve etkinlikler için NFC ürünleri', 3),
  ('Evcil Hayvan', 'Evcil hayvanlar için NFC etiketleri', 4),
  ('Aksesuar', 'NFC aksesuarları', 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. PRODUCTS TABLE UPDATES
-- ============================================
-- Renkler için JSON array
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[];

-- Teknik özellikler için JSONB (key-value pairs)
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB;

-- Uzun açıklama
ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Kategori ID (foreign key olarak)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id);

-- Mevcut ürünlerin category alanını category_id'ye dönüştür
UPDATE products p
SET category_id = c.id
FROM categories c
WHERE p.category = c.name AND p.category_id IS NULL;

-- ============================================
-- 3. RLS POLICIES FOR CATEGORIES
-- ============================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Herkes aktif kategorileri görebilir
CREATE POLICY "Anyone can view active categories"
  ON categories FOR SELECT
  USING (is_active = true);

-- Adminler tüm kategorileri görebilir
CREATE POLICY "Admins can view all categories"
  ON categories FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Adminler kategori ekleyebilir
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Adminler kategorileri güncelleyebilir
CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Adminler kategorileri silebilir
CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Product Details & Categories schema created successfully!';
  RAISE NOTICE '📦 Categories table created with default categories';
  RAISE NOTICE '📝 Products table updated with colors, specs, long_description';
END $$;
