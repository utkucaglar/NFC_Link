-- ============================================
-- PRODUCT IMAGES - MULTIPLE IMAGES PER COLOR
-- File: 28_product_images_multiple.sql
-- ============================================
-- Bu dosya her renk için birden fazla görsel eklenebilmesi için
-- UNIQUE constraint'ini kaldırır
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- Önce mevcut UNIQUE constraint'ini kaldır
ALTER TABLE product_images DROP CONSTRAINT IF EXISTS product_images_product_id_color_key;

-- Artık her renk için birden fazla görsel eklenebilir
-- sort_order ile sıralama yapılabilir

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Product images UNIQUE constraint removed!';
  RAISE NOTICE '📸 Artık her renk için birden fazla görsel eklenebilir';
  RAISE NOTICE '🎨 sort_order ile görseller sıralanabilir';
END $$;
