-- Ürün bazlı indirim sistemi
-- Her ürün için ayrı indirim ayarlanabilir

-- Ürünlere indirim alanları ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_discounted BOOLEAN DEFAULT false;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP WITH TIME ZONE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP WITH TIME ZONE;

-- İndirim kontrolü için fonksiyon (tarih aralığına göre aktifliği kontrol eder)
CREATE OR REPLACE FUNCTION is_product_discount_active(
  p_is_discounted BOOLEAN,
  p_discount_percentage DECIMAL,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
BEGIN
  -- İndirim kapalıysa false
  IF NOT COALESCE(p_is_discounted, false) THEN
    RETURN false;
  END IF;
  
  -- İndirim yüzdesi 0 veya negatifse false
  IF COALESCE(p_discount_percentage, 0) <= 0 THEN
    RETURN false;
  END IF;
  
  -- Başlangıç tarihi varsa ve henüz gelmemişse false
  IF p_start_date IS NOT NULL AND NOW() < p_start_date THEN
    RETURN false;
  END IF;
  
  -- Bitiş tarihi varsa ve geçmişse false
  IF p_end_date IS NOT NULL AND NOW() > p_end_date THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- İndirimli fiyatı hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_discounted_price(
  p_price DECIMAL,
  p_discount_percentage DECIMAL,
  p_is_discounted BOOLEAN,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL AS $$
BEGIN
  -- İndirim aktif değilse normal fiyatı döndür
  IF NOT is_product_discount_active(p_is_discounted, p_discount_percentage, p_start_date, p_end_date) THEN
    RETURN p_price;
  END IF;
  
  -- İndirimli fiyatı hesapla ve döndür
  RETURN ROUND(p_price * (1 - COALESCE(p_discount_percentage, 0) / 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Yorum: Bu sistem ile:
-- 1. Her ürün için ayrı indirim yüzdesi ayarlanabilir
-- 2. İndirim başlangıç ve bitiş tarihi belirlenebilir
-- 3. İndirim aktif/pasif yapılabilir
-- 4. Frontend'de orijinal fiyat üzeri çizili + indirimli fiyat gösterilir
-- 5. Kupon kodu sisteminden bağımsız çalışır
