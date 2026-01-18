-- ============================================
-- Fix Orders RLS Policies
-- File: 12_fix_orders_rls.sql
-- ============================================

-- is_admin fonksiyonu
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FOREIGN KEY (Opsiyonel - hata verirse atlayın)
-- ============================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_profiles_fkey;

DO $$ 
BEGIN
  ALTER TABLE orders 
  ADD CONSTRAINT orders_user_profiles_fkey 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Foreign key eklenemedi (mevcut veriler uyumsuz olabilir)';
END $$;

-- ============================================
-- ORDERS RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Users and admins can view orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users and admins can update orders" ON orders;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and admins can view orders"
  ON orders FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- ============================================
-- ORDER_ITEMS RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
DROP POLICY IF EXISTS "Users and admins can view order items" ON order_items;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users and admins can view order items"
  ON order_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ============================================
-- USER_PROFILES RLS
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON user_profiles;

CREATE POLICY "Users and admins can view profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR is_admin());

-- ============================================
DO $$ BEGIN RAISE NOTICE '✅ RLS Policies updated!'; END $$;
