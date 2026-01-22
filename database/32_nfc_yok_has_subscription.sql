-- ============================================
-- NFC Yok & Abonelik Seçeneği
-- File: 32_nfc_yok_has_subscription.sql
-- ============================================
-- 1. products.has_subscription (abonelik var/yok)
-- 2. nfc_type'a 'nfc-yok' ekle (NFC olmayan ürünler)
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- 1. has_subscription sütununu ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS has_subscription BOOLEAN DEFAULT true;

-- Mevcut ürünler için varsayılan: abonelik var
UPDATE products SET has_subscription = true WHERE has_subscription IS NULL;

-- 2. nfc_type CHECK kısıtlamasını güncelle (nfc-yok ekle)
DO $$
DECLARE
  rec record;
BEGIN
  -- nfc_type kullanan CHECK constraint'leri bul ve kaldır
  FOR rec IN 
    SELECT ccu.constraint_name
    FROM information_schema.constraint_column_usage ccu
    WHERE ccu.table_name = 'products' AND ccu.column_name = 'nfc_type'
  LOOP
    EXECUTE format('ALTER TABLE products DROP CONSTRAINT IF EXISTS %I', rec.constraint_name);
    RAISE NOTICE 'Constraint kaldırıldı: %', rec.constraint_name;
  END LOOP;
  
  -- Yeni constraint: nfc-yok dahil
  ALTER TABLE products 
  ADD CONSTRAINT products_nfc_type_check 
  CHECK (nfc_type IS NULL OR nfc_type IN ('business-card', 'pet-id', 'redirect', 'nfc-yok'));
  RAISE NOTICE 'nfc_type constraint güncellendi (nfc-yok eklendi)';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'products_nfc_type_check zaten var, atlanıyor';
END $$;

-- 3. nfc-yok ürünlerde abonelik olmamalı
UPDATE products 
SET has_subscription = false 
WHERE nfc_type = 'nfc-yok';

-- ============================================
-- Kullanım:
-- - nfc_type = 'nfc-yok' → NFC olmayan ürün, abonelik yok
-- - has_subscription = false → Abonelik yok (NFC'li ürünlerde de seçilebilir)
-- - has_subscription = true → Aylık abonelik ücreti uygulanır
-- ============================================
