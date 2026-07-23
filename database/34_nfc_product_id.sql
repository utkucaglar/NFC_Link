-- ============================================
-- NFC'lere product_id sütunu ekleme
-- Abonelik yenileme sayfasında doğru fiyatlandırma için gerekli
-- ============================================

-- 1. product_id sütununu ekle
ALTER TABLE nfcs ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;

-- 2. product_id için index oluştur (performans için)
CREATE INDEX IF NOT EXISTS idx_nfcs_product_id ON nfcs(product_id);

-- 3. Mevcut NFC'leri türlerine göre ürünlerle eşleştir (opsiyonel güncelleme)
-- Not: Bu sadece mevcut eşleşmeyen NFC'ler için çalışır
-- business-card türündeki NFC'ler
UPDATE nfcs 
SET product_id = (
  SELECT p.id FROM products p 
  WHERE p.nfc_type = 'business-card' 
  AND p.is_active = true 
  LIMIT 1
)
WHERE type = 'business-card' AND product_id IS NULL;

-- pet-id türündeki NFC'ler
UPDATE nfcs 
SET product_id = (
  SELECT p.id FROM products p 
  WHERE p.nfc_type = 'pet-id' 
  AND p.is_active = true 
  LIMIT 1
)
WHERE type = 'pet-id' AND product_id IS NULL;

-- redirect türündeki NFC'ler
UPDATE nfcs 
SET product_id = (
  SELECT p.id FROM products p 
  WHERE p.nfc_type = 'redirect' 
  AND p.is_active = true 
  LIMIT 1
)
WHERE type = 'redirect' AND product_id IS NULL;

-- ============================================
-- GRANT'lar (RLS politikaları için)
-- ============================================
-- product_id zaten public.nfcs tablosunda olduğu için 
-- mevcut RLS politikaları otomatik olarak bu sütunu da kapsayacaktır
