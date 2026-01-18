-- ============================================
-- NFCLink Functions & Triggers
-- File: 03_functions.sql
-- ============================================

-- ============================================
-- 1. UPDATED_AT FONKSİYONU
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger'ları
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_nfcs_updated_at ON nfcs;
CREATE TRIGGER update_nfcs_updated_at
  BEFORE UPDATE ON nfcs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. SİPARİŞ NUMARASI OLUŞTURMA
-- ============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_number ON orders;
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- ============================================
-- 3. KULLANICI PROFİLİ OLUŞTURMA (SIGNUP)
-- ============================================
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- first_name: metadata'dan al
  v_first_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    ''
  );
  
  -- last_name: metadata'dan al
  v_last_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
    ''
  );
  
  -- full_name: first + last veya metadata'dan
  v_full_name := COALESCE(
    NULLIF(TRIM(CONCAT(v_first_name, ' ', v_last_name)), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    ''
  );
  
  INSERT INTO public.user_profiles (id, email, first_name, last_name, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_full_name,
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), user_profiles.first_name),
    last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), user_profiles.last_name),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), user_profiles.full_name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı oluştur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_handle_new_user ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================
-- 4. NFC TARAMA SAYACI
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

DROP TRIGGER IF EXISTS increment_scan_count ON nfc_scans;
CREATE TRIGGER increment_scan_count
  AFTER INSERT ON nfc_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_nfc_scan_count();

-- ============================================
-- 5. NFC KEY OLUŞTURMA
-- ============================================
CREATE OR REPLACE FUNCTION generate_nfc_key(nfc_type TEXT)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  random_part TEXT;
BEGIN
  prefix := CASE nfc_type
    WHEN 'business-card' THEN 'biz'
    WHEN 'pet-id' THEN 'pet'
    WHEN 'redirect' THEN 'red'
    ELSE 'nfc'
  END;
  
  random_part := LOWER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
  
  RETURN prefix || '-' || random_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SONUÇ
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Functions & Triggers created!';
  RAISE NOTICE '📝 Next: Run 04_seed_data.sql';
END $$;
