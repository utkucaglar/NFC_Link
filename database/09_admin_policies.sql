-- ============================================
-- NFCLink Admin RLS Policies
-- File: 09_admin_policies.sql
-- ============================================
-- Bu dosya admin kullanıcıları için RLS politikalarını ayarlar
-- ÖNEMLİ: 08_admin_discounts.sql'i çalıştırdıktan SONRA çalıştırın
-- ============================================

-- ============================================
-- HELPER FUNCTION: Check if user is admin
-- ============================================
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
-- 1. USER PROFILES - Admin Policies
-- ============================================
-- Adminler tüm profilleri görebilir
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- Adminler tüm profilleri güncelleyebilir (rol değişikliği için)
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- ============================================
-- 2. PRODUCTS - Admin Policies
-- ============================================
-- Adminler tüm ürünleri görebilir (aktif olmayan dahil)
DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

-- Adminler ürün ekleyebilir
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Adminler ürün güncelleyebilir
DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Adminler ürün silebilir
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 3. ORDERS - Admin Policies
-- ============================================
-- Adminler tüm siparişleri görebilir
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- Adminler tüm siparişleri güncelleyebilir
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- ============================================
-- 4. ORDER ITEMS - Admin Policies
-- ============================================
-- Adminler tüm sipariş kalemlerini görebilir
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );

-- Adminler sipariş kalemlerini güncelleyebilir (kişiselleştirme notları için)
DROP POLICY IF EXISTS "Admins can update order items" ON order_items;
CREATE POLICY "Admins can update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- 5. DISCOUNTS - Policies
-- ============================================
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

-- Herkes aktif indirimleri görebilir (kod doğrulama için)
CREATE POLICY "Anyone can view active discounts"
  ON discounts FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Adminler tüm indirimleri görebilir
CREATE POLICY "Admins can view all discounts"
  ON discounts FOR SELECT
  TO authenticated
  USING (is_admin());

-- Adminler indirim ekleyebilir
CREATE POLICY "Admins can insert discounts"
  ON discounts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Adminler indirimleri güncelleyebilir
CREATE POLICY "Admins can update discounts"
  ON discounts FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Adminler indirimleri silebilir
CREATE POLICY "Admins can delete discounts"
  ON discounts FOR DELETE
  TO authenticated
  USING (is_admin());

-- ============================================
-- 6. DISCOUNT USAGES - Policies
-- ============================================
ALTER TABLE discount_usages ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi kullanımlarını görebilir
CREATE POLICY "Users can view own discount usages"
  ON discount_usages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Kullanım kaydı oluşturma (sipariş sırasında)
CREATE POLICY "Users can create discount usages"
  ON discount_usages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. ADMIN LOGS - Policies
-- ============================================
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Sadece adminler logları görebilir
CREATE POLICY "Admins can view admin logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (is_admin());

-- Adminler log ekleyebilir
CREATE POLICY "Admins can insert admin logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- ============================================
-- 8. NFCS - Admin Policies
-- ============================================
-- Adminler tüm NFC'leri görebilir
DROP POLICY IF EXISTS "Admins can view all nfcs" ON nfcs;
CREATE POLICY "Admins can view all nfcs"
  ON nfcs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR is_active = true OR is_admin());

-- ============================================
-- ADMIN HELPER FUNCTIONS
-- ============================================

-- Sipariş durumunu güncelle ve log tut
CREATE OR REPLACE FUNCTION admin_update_order_status(
  p_order_id UUID,
  p_new_status TEXT,
  p_tracking_number TEXT DEFAULT NULL,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_old_order RECORD;
  v_result JSONB;
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Eski sipariş bilgisini al
  SELECT * INTO v_old_order FROM orders WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Siparişi güncelle
  UPDATE orders SET
    status = p_new_status,
    tracking_number = COALESCE(p_tracking_number, tracking_number),
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    updated_at = NOW()
  WHERE id = p_order_id;

  -- Log kaydı oluştur
  INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    auth.uid(),
    'update_order_status',
    'order',
    p_order_id::TEXT,
    jsonb_build_object('status', v_old_order.status, 'tracking_number', v_old_order.tracking_number),
    jsonb_build_object('status', p_new_status, 'tracking_number', p_tracking_number)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Order updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sipariş kalemi kişiselleştirmesini onayla
CREATE OR REPLACE FUNCTION admin_confirm_customization(
  p_order_item_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  -- Admin kontrolü
  IF NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE order_items SET
    customization_confirmed = true,
    confirmed_by = auth.uid(),
    confirmed_at = NOW(),
    admin_notes = COALESCE(p_admin_notes, admin_notes)
  WHERE id = p_order_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order item not found');
  END IF;

  -- Log kaydı
  INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_data)
  VALUES (
    auth.uid(),
    'confirm_customization',
    'order_item',
    p_order_item_id::TEXT,
    jsonb_build_object('admin_notes', p_admin_notes)
  );

  RETURN jsonb_build_object('success', true, 'message', 'Customization confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İndirim kodu doğrula
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_user_id UUID,
  p_order_total DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_discount RECORD;
  v_user_usage_count INTEGER;
  v_discount_amount DECIMAL;
BEGIN
  -- İndirim kodunu bul
  SELECT * INTO v_discount 
  FROM discounts 
  WHERE code = UPPER(p_code) 
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Geçersiz veya süresi dolmuş indirim kodu');
  END IF;

  -- Toplam kullanım kontrolü
  IF v_discount.usage_limit IS NOT NULL AND v_discount.usage_count >= v_discount.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'İndirim kodu kullanım limitine ulaştı');
  END IF;

  -- Kullanıcı başına kullanım kontrolü
  SELECT COUNT(*) INTO v_user_usage_count
  FROM discount_usages
  WHERE discount_id = v_discount.id AND user_id = p_user_id;

  IF v_user_usage_count >= v_discount.per_user_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Bu indirim kodunu zaten kullandınız');
  END IF;

  -- Minimum sipariş tutarı kontrolü
  IF p_order_total < v_discount.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'error', format('Minimum sipariş tutarı: ₺%s', v_discount.min_order_amount)
    );
  END IF;

  -- İndirim tutarını hesapla
  IF v_discount.discount_type = 'percentage' THEN
    v_discount_amount := p_order_total * (v_discount.discount_value / 100);
    IF v_discount.max_discount_amount IS NOT NULL AND v_discount_amount > v_discount.max_discount_amount THEN
      v_discount_amount := v_discount.max_discount_amount;
    END IF;
  ELSE
    v_discount_amount := v_discount.discount_value;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'discount_id', v_discount.id,
    'discount_type', v_discount.discount_type,
    'discount_value', v_discount.discount_value,
    'discount_amount', v_discount_amount,
    'description', v_discount.description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Admin RLS Policies created successfully!';
  RAISE NOTICE '🔒 Admin functions are now available';
  RAISE NOTICE '📝 Admin users can now manage orders, products, and discounts';
END $$;
