-- =================================================
-- Products tablosuna nfc_type sütunu ekleme
-- =================================================

-- nfc_type sütununu products tablosuna ekle (yoksa)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'nfc_type'
    ) THEN
        ALTER TABLE products ADD COLUMN nfc_type TEXT CHECK (nfc_type IN ('business-card', 'pet-id', 'redirect'));
        
        RAISE NOTICE 'nfc_type sütunu eklendi';
    ELSE
        RAISE NOTICE 'nfc_type sütunu zaten mevcut';
    END IF;
END $$;

-- Mevcut ürünlerin nfc_type değerlerini kategoriye göre ayarla
-- (Sadece nfc_type NULL olanlar için)
UPDATE products 
SET nfc_type = 'business-card'
WHERE nfc_type IS NULL 
  AND (LOWER(category) LIKE '%profesyonel%' OR LOWER(category) LIKE '%premium%');

UPDATE products 
SET nfc_type = 'pet-id'
WHERE nfc_type IS NULL 
  AND (LOWER(category) LIKE '%evcil%' OR LOWER(category) LIKE '%pet%');

UPDATE products 
SET nfc_type = 'redirect'
WHERE nfc_type IS NULL 
  AND (LOWER(category) LIKE '%spor%' OR LOWER(category) LIKE '%etkinlik%');

-- Sonuçları kontrol et
SELECT id, name, category, nfc_type FROM products ORDER BY id;
