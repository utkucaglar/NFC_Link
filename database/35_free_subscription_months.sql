-- Ürünlerde bedava abonelik ay sayısı alanı
-- Bu alan ürün satın alındığında kaç ay bedava abonelik verileceğini belirler

-- free_subscription_months alanını ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS free_subscription_months INTEGER DEFAULT 1;

-- Mevcut ürünlere varsayılan değer ata (1 ay bedava)
UPDATE products 
SET free_subscription_months = 1 
WHERE free_subscription_months IS NULL;

-- Not null constraint ekle
ALTER TABLE products 
ALTER COLUMN free_subscription_months SET NOT NULL;

-- Yorum: Bu alan sayesinde:
-- 1. Admin panelinde ürün başına bedava abonelik süresi ayarlanabilir
-- 2. Müşteriye ürün fiyatı = sadece ürün fiyatı (abonelik dahil değil)
-- 3. Belirtilen ay sayısı kadar abonelik bedava verilir
-- 4. Süre bitince aylık abonelik ücreti başlar
