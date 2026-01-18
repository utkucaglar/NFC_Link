-- ============================================
-- NFCLink Mock Data
-- File: 07_mock_data.sql
-- ============================================
-- Bu dosya test için örnek veriler ekler
-- ÖNEMLİ: Gerçek user_id değerlerini kullanın veya
-- önce bir kullanıcı oluşturup onun ID'sini kullanın
-- ============================================

-- ÖRNEK KULLANIM:
-- 1. Bir kullanıcı oluşturun ve giriş yapın
-- 2. auth.users tablosundan user ID'nizi alın
-- 3. Aşağıdaki UUID'leri gerçek user_id ile değiştirin
-- 4. SQL'i çalıştırın

-- ============================================
-- ÖRNEK USER_ID (GERÇEK ID İLE DEĞİŞTİRİN!)
-- ============================================
-- Örnek: SELECT id FROM auth.users LIMIT 1;
-- Sonra aşağıdaki '00000000-0000-0000-0000-000000000000' değerini değiştirin

-- ============================================
-- 1. SHIPPING ADDRESSES MOCK DATA
-- ============================================
-- INSERT INTO shipping_addresses (
--   user_id,
--   title,
--   first_name,
--   last_name,
--   phone,
--   address_line1,
--   address_line2,
--   city,
--   district,
--   postal_code,
--   country,
--   is_default
-- ) VALUES
-- (
--   '00000000-0000-0000-0000-000000000000', -- USER_ID BURAYA
--   'Ev',
--   'Ahmet',
--   'Yılmaz',
--   '05551234567',
--   'Test Mahallesi, Örnek Sokak, No: 123',
--   'Daire 4, Kat 3',
--   'İstanbul',
--   'Kadıköy',
--   '34000',
--   'Türkiye',
--   true
-- ),
-- (
--   '00000000-0000-0000-0000-000000000000', -- USER_ID BURAYA
--   'İş',
--   'Ahmet',
--   'Yılmaz',
--   '02121234567',
--   'İş Merkezi, Şirket Sokak, No: 45',
--   'A Blok, Kat 10, Ofis 101',
--   'İstanbul',
--   'Şişli',
--   '34394',
--   'Türkiye',
--   false
-- );

-- ============================================
-- 2. SUBSCRIPTIONS MOCK DATA
-- ============================================
-- INSERT INTO subscriptions (
--   user_id,
--   plan_type,
--   status,
--   amount,
--   start_date,
--   end_date,
--   next_billing_date,
--   auto_renew
-- ) VALUES
-- (
--   '00000000-0000-0000-0000-000000000000', -- USER_ID BURAYA
--   'monthly',
--   'active',
--   87.00,
--   NOW() - INTERVAL '1 month',
--   NOW() + INTERVAL '1 month',
--   NOW() + INTERVAL '15 days',
--   true
-- );

-- ============================================
-- 3. PAYMENTS MOCK DATA
-- ============================================
-- INSERT INTO payments (
--   user_id,
--   subscription_id,
--   amount,
--   status,
--   payment_method,
--   paid_at
-- ) VALUES
-- (
--   '00000000-0000-0000-0000-000000000000', -- USER_ID BURAYA
--   (SELECT id FROM subscriptions WHERE user_id = '00000000-0000-0000-0000-000000000000' LIMIT 1),
--   87.00,
--   'succeeded',
--   'card',
--   NOW() - INTERVAL '1 month'
-- );

-- ============================================
-- 4. INVOICES MOCK DATA
-- ============================================
-- INSERT INTO invoices (
--   user_id,
--   subscription_id,
--   payment_id,
--   invoice_number,
--   amount,
--   tax_amount,
--   total_amount,
--   status,
--   invoice_date,
--   paid_date,
--   items
-- ) VALUES
-- (
--   '00000000-0000-0000-0000-000000000000', -- USER_ID BURAYA
--   (SELECT id FROM subscriptions WHERE user_id = '00000000-0000-0000-0000-000000000000' LIMIT 1),
--   (SELECT id FROM payments WHERE user_id = '00000000-0000-0000-0000-000000000000' LIMIT 1),
--   'INV-' || nextval('invoice_number_seq')::text,
--   87.00,
--   0.00,
--   87.00,
--   'paid',
--   NOW() - INTERVAL '1 month',
--   NOW() - INTERVAL '1 month',
--   '[{"name": "NFC Premium Plan", "quantity": 1, "price": 87.00}]'::jsonb
-- );

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Verileri kontrol etmek için:
-- SELECT * FROM shipping_addresses WHERE user_id = 'YOUR_USER_ID';
-- SELECT * FROM subscriptions WHERE user_id = 'YOUR_USER_ID';
-- SELECT * FROM payments WHERE user_id = 'YOUR_USER_ID';
-- SELECT * FROM invoices WHERE user_id = 'YOUR_USER_ID';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '📝 Mock data SQL hazır!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ ÖNEMLİ:';
  RAISE NOTICE '  1. Gerçek user_id değerlerinizi kullanın';
  RAISE NOTICE '  2. USER_ID bölümlerini gerçek değerlerle değiştirin';
  RAISE NOTICE '  3. Gerekli satırların başındaki "--" işaretlerini kaldırın';
  RAISE NOTICE '  4. SQL komutlarını tek tek çalıştırın';
END $$;
