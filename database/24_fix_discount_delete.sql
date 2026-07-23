-- ============================================
-- Fix Discount Delete Issue
-- File: 24_fix_discount_delete.sql
-- ============================================
-- Bu dosya indirim silme sorununu düzeltir
-- orders tablosundaki discount_id foreign key constraint'ini günceller
-- ============================================

-- Önce mevcut constraint'i kaldır (tüm olası isimleri kontrol et)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- orders tablosundaki discount_id ile ilgili tüm foreign key constraint'lerini bul ve kaldır
  FOR r IN 
    SELECT conname
    FROM pg_constraint
    WHERE contype = 'f'
    AND conrelid = 'orders'::regclass
    AND (
      conname LIKE '%discount%' 
      OR conname LIKE '%discount_id%'
    )
  LOOP
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT IF EXISTS %I', r.conname);
    RAISE NOTICE 'Dropped constraint: %', r.conname;
  END LOOP;
END $$;

-- Yeni constraint'i ON DELETE SET NULL ile oluştur
-- Bu sayede indirim silindiğinde siparişlerdeki discount_id NULL olur
-- ama discount_amount korunur (geçmiş kayıtlar için önemli)
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_discount_id_fkey;

ALTER TABLE orders 
  ADD CONSTRAINT orders_discount_id_fkey 
  FOREIGN KEY (discount_id) 
  REFERENCES discounts(id) 
  ON DELETE SET NULL;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Discount delete constraint fixed successfully!';
  RAISE NOTICE '📝 Admin users can now delete discounts even if they are used in orders';
  RAISE NOTICE '💡 Order discount_id will be set to NULL when discount is deleted';
END $$;
