-- ============================================
-- NFCLink Database RESET
-- File: 00_reset.sql
-- ============================================
-- ⚠️ DİKKAT: Bu dosya TÜM VERİLERİ SİLER!
-- Sadece temiz başlamak istiyorsanız çalıştırın.
-- ============================================

-- ============================================
-- 1. TÜM TRIGGER'LARI SİL
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_nfcs_updated_at ON nfcs;
DROP TRIGGER IF EXISTS update_shipping_addresses_updated_at ON shipping_addresses;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
DROP TRIGGER IF EXISTS set_order_number ON orders;
DROP TRIGGER IF EXISTS increment_scan_count ON nfc_scans;
DROP TRIGGER IF EXISTS check_order_total ON orders;

-- ============================================
-- 2. TÜM FONKSİYONLARI SİL
-- ============================================
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_nfc_scan_count() CASCADE;
DROP FUNCTION IF EXISTS validate_order_total() CASCADE;
DROP FUNCTION IF EXISTS generate_nfc_key(TEXT) CASCADE;

-- ============================================
-- 3. TÜM TABLOLARI SİL (sıra önemli - foreign keys)
-- ============================================
DROP TABLE IF EXISTS nfc_scans CASCADE;
DROP TABLE IF EXISTS nfcs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shipping_addresses CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- 4. SEQUENCE'LERİ SİL
-- ============================================
DROP SEQUENCE IF EXISTS order_number_seq CASCADE;
DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;

-- ============================================
-- SONUÇ
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  ====== DATABASE RESET TAMAMLANDI ======';
  RAISE NOTICE '';
  RAISE NOTICE 'Tüm tablolar, fonksiyonlar ve trigger''lar silindi.';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Şimdi sırayla çalıştırın:';
  RAISE NOTICE '   1. 01_schema.sql';
  RAISE NOTICE '   2. 02_policies.sql';
  RAISE NOTICE '   3. 03_functions.sql';
  RAISE NOTICE '   4. 04_seed_data.sql';
  RAISE NOTICE '   5. 05_schema_update.sql';
  RAISE NOTICE '   6. 06_subscriptions_payments.sql (opsiyonel)';
  RAISE NOTICE '';
END $$;
