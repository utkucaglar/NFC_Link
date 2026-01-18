-- ============================================
-- NFCLink Admin & Discounts Schema
-- File: 08_admin_discounts.sql
-- ============================================
-- Bu dosya admin işlemleri için gerekli tabloları oluşturur
-- İndirim kodları, admin logları vb.
-- ============================================

-- ============================================
-- 1. DISCOUNTS TABLE (İndirim Kodları)
-- ============================================
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_discount_amount DECIMAL(10, 2), -- Yüzdelik indirimlerde max limit
  usage_limit INTEGER, -- Toplam kullanım limiti (null = sınırsız)
  usage_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1, -- Kullanıcı başına kullanım limiti
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  applicable_categories TEXT[], -- Boş ise tüm kategorilere uygulanır
  applicable_products INTEGER[], -- Boş ise tüm ürünlere uygulanır
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. DISCOUNT USAGES TABLE (İndirim Kullanımları)
-- ============================================
CREATE TABLE IF NOT EXISTS discount_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  discount_id UUID REFERENCES discounts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. ADMIN ACTIVITY LOGS TABLE (Admin İşlem Logları)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'order', 'product', 'discount', 'user'
  entity_id TEXT,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. ORDER CUSTOMIZATION NOTES (Sipariş Kişiselleştirme Notları)
-- ============================================
-- Order items tablosuna admin_notes kolonu ekle
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS customization_confirmed BOOLEAN DEFAULT false;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS confirmed_by UUID REFERENCES auth.users(id);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 5. PRODUCTS TABLE UPDATES
-- ============================================
-- Ürünler tablosuna ek alanlar
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[]; -- Birden fazla resim
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB; -- Özellikler listesi
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE; -- Stok kodu
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================
-- 6. ORDERS TABLE UPDATES
-- ============================================
-- Siparişler tablosuna indirim alanları ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_id UUID REFERENCES discounts(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_expires ON discounts(expires_at);
CREATE INDEX IF NOT EXISTS idx_discount_usages_discount ON discount_usages(discount_id);
CREATE INDEX IF NOT EXISTS idx_discount_usages_user ON discount_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Admin & Discounts schema created successfully!';
  RAISE NOTICE '📝 Next: Run 09_admin_policies.sql';
END $$;
