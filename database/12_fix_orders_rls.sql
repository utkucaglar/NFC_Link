-- ============================================
-- Fix Orders RLS Policies
-- File: 12_fix_orders_rls.sql
-- ============================================
-- Bu dosya sipariş tabloları için RLS politikalarını düzeltir
-- ============================================

-- is_admin fonksiyonunu kontrol et/oluştur
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FOREIGN KEY İLİŞKİLERİ DÜZELT
-- ============================================
-- orders.user_id -> user_profiles.id foreign key ekle
-- Önce mevcut foreign key varsa kaldır
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_profiles_fkey;

-- user_profiles tablosuna foreign key ekle
ALTER TABLE orders 
ADD CONSTRAINT orders_user_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- ============================================
-- ORDERS TABLOSU
-- ============================================
-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- RLS aktif olduğundan emin ol
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Tek bir SELECT politikası - hem user hem admin için
CREATE POLICY "Users and admins can view orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- INSERT politikası - kullanıcılar sipariş oluşturabilir
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE politikası - hem user hem admin
CREATE POLICY "Users and admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- ============================================
-- ORDER_ITEMS TABLOSU
-- ============================================
-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;

-- RLS aktif olduğundan emin ol
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- SELECT politikası
CREATE POLICY "Users and admins can view order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

-- INSERT politikası
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

-- UPDATE politikası (admin için)
CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- USER_PROFILES TABLOSU - Admin view düzeltmesi
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

CREATE POLICY "Users and admins can view profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Orders RLS Policies fixed!';
  RAISE NOTICE '🔒 Admin can now view all orders';
  RAISE NOTICE '📝 Users can create and view their own orders';
END $$;
