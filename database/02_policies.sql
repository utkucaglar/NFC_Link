-- ============================================
-- NFCLink RLS Policies
-- File: 02_policies.sql
-- ============================================
-- Bu dosya Row Level Security politikalarını ayarlar
-- ÖNEMLİ: 01_schema.sql'i çalıştırdıktan SONRA çalıştırın
-- ============================================

-- ============================================
-- 1. USER PROFILES POLICIES
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Kullanıcılar kendi profillerini güncelleyebilir
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Kullanıcılar kendi profillerini oluşturabilir (signup için)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. PRODUCTS POLICIES
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes aktif ürünleri görebilir (giriş yapmadan bile)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- ============================================
-- 3. ORDERS POLICIES
-- ============================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi siparişlerini görebilir
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi siparişlerini oluşturabilir
CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi siparişlerini güncelleyebilir (iptal için)
CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. ORDER ITEMS POLICIES
-- ============================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi sipariş kalemlerini görebilir
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Kullanıcılar sipariş kalemleri oluşturabilir
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- 5. NFCS POLICIES
-- ============================================
ALTER TABLE nfcs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi NFC'lerini görebilir
CREATE POLICY "Users can view own nfcs"
  ON nfcs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi NFC'lerini oluşturabilir
CREATE POLICY "Users can create own nfcs"
  ON nfcs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi NFC'lerini güncelleyebilir
CREATE POLICY "Users can update own nfcs"
  ON nfcs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Kullanıcılar kendi NFC'lerini silebilir
CREATE POLICY "Users can delete own nfcs"
  ON nfcs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Herkes aktif NFC'leri unique_key ile görebilir (public pages için)
CREATE POLICY "Anyone can view active nfcs by key"
  ON nfcs FOR SELECT
  USING (is_active = true);

-- ============================================
-- 6. NFC SCANS POLICIES
-- ============================================
ALTER TABLE nfc_scans ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi NFC'lerinin taramalarını görebilir
CREATE POLICY "Users can view own nfc scans"
  ON nfc_scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nfcs
      WHERE nfcs.id = nfc_scans.nfc_id
      AND nfcs.user_id = auth.uid()
    )
  );

-- Herkes tarama kaydı oluşturabilir (NFC tarandığında)
CREATE POLICY "Anyone can create scan records"
  ON nfc_scans FOR INSERT
  WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ RLS Policies created successfully!';
  RAISE NOTICE '🔒 All tables are now secured';
  RAISE NOTICE '📝 Next: Run 03_functions.sql';
END $$;
