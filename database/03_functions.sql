-- ============================================
-- NFCLink Functions & Triggers
-- File: 03_functions.sql
-- ============================================
-- Bu dosya otomatik işlemler için fonksiyonlar oluşturur
-- ÖNEMLİ: 02_policies.sql'i çalıştırdıktan SONRA çalıştırın
-- ============================================

-- ============================================
-- 1. AUTO UPDATE TIMESTAMP FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfcs_updated_at
  BEFORE UPDATE ON nfcs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. AUTO GENERATE ORDER NUMBER
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 3. AUTO CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 4. UPDATE NFC SCAN COUNT
-- ============================================
CREATE OR REPLACE FUNCTION update_nfc_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nfcs
  SET 
    scan_count = scan_count + 1,
    last_scanned_at = NEW.scanned_at,
    updated_at = NOW()
  WHERE id = NEW.nfc_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_scan_count
  AFTER INSERT ON nfc_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_nfc_scan_count();

-- ============================================
-- 5. VALIDATE ORDER TOTAL (Optional)
-- ============================================
CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  calculated_total DECIMAL(10, 2);
BEGIN
  -- Calculate total from order items
  SELECT COALESCE(SUM(price * quantity), 0)
  INTO calculated_total
  FROM order_items
  WHERE order_id = NEW.id;
  
  -- If totals don't match, log a warning (but don't block)
  IF calculated_total != NEW.total THEN
    RAISE WARNING 'Order % total mismatch: expected %, got %', 
      NEW.order_number, calculated_total, NEW.total;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_order_total
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_total();

-- ============================================
-- UTILITY FUNCTIONS
-- ============================================

-- Function to generate unique NFC key
CREATE OR REPLACE FUNCTION generate_nfc_key(nfc_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_part TEXT;
BEGIN
  -- Set prefix based on type
  prefix := CASE nfc_type
    WHEN 'business-card' THEN 'biz'
    WHEN 'pet-id' THEN 'pet'
    WHEN 'redirect' THEN 'red'
    ELSE 'nfc'
  END;
  
  -- Generate random part (8 characters)
  random_part := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  
  RETURN prefix || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Functions & Triggers created successfully!';
  RAISE NOTICE '⚡ Automatic operations are now enabled:';
  RAISE NOTICE '  - Auto order numbers';
  RAISE NOTICE '  - Auto user profile creation';
  RAISE NOTICE '  - Auto updated_at timestamps';
  RAISE NOTICE '  - Auto NFC scan counting';
  RAISE NOTICE '📝 Next: Run 04_seed_data.sql';
END $$;
