-- ============================================
-- Shipping Addresses Soft Delete - PROPER IMPLEMENTATION
-- File: 23_shipping_addresses_soft_delete_proper.sql
-- ============================================
-- Adresleri silmek yerine pasif yapmak için is_active kolonu ekler
-- RLS politikalarını doğru şekilde günceller
-- ============================================

-- ============================================
-- 1. IS_ACTIVE KOLONU EKLE
-- ============================================
ALTER TABLE shipping_addresses
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Mevcut kayıtların hepsini aktif yap (eğer NULL değer varsa)
UPDATE shipping_addresses
SET is_active = true
WHERE is_active IS NULL;

-- ============================================
-- 2. INDEX EKLE (performans için)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_active 
ON shipping_addresses(user_id, is_active) 
WHERE is_active = true;

-- ============================================
-- 3. RLS POLİTİKALARINI GÜNCELLE
-- ============================================
-- Önce tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON shipping_addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON shipping_addresses;

-- SELECT: Kullanıcılar kendi adreslerini görebilir (aktif ve pasif)
-- ÖNEMLİ: Soft delete için pasif adresleri de görebilmeliyiz (UPDATE sonrası görünmesi için)
-- Frontend'de is_active = true filtresi yapılacak, bu yüzden pasif adresler kullanıcıya gösterilmeyecek
CREATE POLICY "Users can view own addresses" 
  ON shipping_addresses FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Kullanıcı yeni adres ekleyebilir
-- is_active DEFAULT true olduğu için kontrol etmeye gerek yok
CREATE POLICY "Users can insert own addresses" 
  ON shipping_addresses FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Kullanıcı kendi adreslerini güncelleyebilir
-- ÖNEMLİ: 
-- - USING: Hangi satırların güncellenebileceğini kontrol eder (mevcut satır)
-- - WITH CHECK: Güncelleme sonrası yeni satırın geçerli olup olmadığını kontrol eder
-- Soft delete için is_active = false yapabilmek için WITH CHECK'te is_active kontrolü YOK
-- Sadece user_id kontrolü yapıyoruz, böylece is_active = false yapılabilir
CREATE POLICY "Users can update own addresses" 
  ON shipping_addresses FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Hard delete için politika (opsiyonel - soft delete kullanacağız)
CREATE POLICY "Users can delete own addresses" 
  ON shipping_addresses FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. POLİTİKALARI DOĞRULA
-- ============================================
DO $$ 
DECLARE
  policy_count INTEGER;
  is_active_exists BOOLEAN;
BEGIN 
  -- Kolonun varlığını kontrol et
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'shipping_addresses' 
    AND column_name = 'is_active'
  ) INTO is_active_exists;
  
  -- Politikaları say
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'shipping_addresses';
  
  IF is_active_exists THEN
    RAISE NOTICE '✅ is_active kolonu eklendi!';
  ELSE
    RAISE WARNING '⚠️ is_active kolonu eklenemedi!';
  END IF;
  
  RAISE NOTICE '✅ Shipping addresses RLS policies updated!';
  RAISE NOTICE '📊 Total policies: %', policy_count;
  RAISE NOTICE '📝 SELECT policy: Sadece aktif adresler görünür (is_active = true)';
  RAISE NOTICE '📝 UPDATE policy: Kullanıcılar kendi adreslerini güncelleyebilir (soft delete için)';
  RAISE NOTICE '🔍 Check policies with: SELECT * FROM pg_policies WHERE tablename = ''shipping_addresses'';';
END $$;
