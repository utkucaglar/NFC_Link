-- =================================================
-- Fix Reviews RLS Policy for Insert
-- =================================================

-- Mevcut INSERT politikasını kaldır
DROP POLICY IF EXISTS "Users can create reviews for purchased products" ON reviews;

-- Daha basit INSERT politikası
CREATE POLICY "Users can create reviews for purchased products"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
  );

-- Alternatif: RPC fonksiyonu ile yorum ekleme (RLS bypass)
CREATE OR REPLACE FUNCTION create_review(
  p_product_id INTEGER,
  p_rating INTEGER,
  p_title TEXT,
  p_comment TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_review_id UUID;
  v_has_purchased BOOLEAN;
  v_has_review BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Giriş yapmanız gerekiyor';
  END IF;
  
  -- Satın alma kontrolü
  SELECT EXISTS (
    SELECT 1 FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = v_user_id
      AND oi.product_id = p_product_id
      AND o.status IN ('delivered', 'shipped', 'confirmed', 'pending')
  ) INTO v_has_purchased;
  
  IF NOT v_has_purchased THEN
    RAISE EXCEPTION 'Bu ürünü satın almadınız';
  END IF;
  
  -- Mevcut yorum kontrolü
  SELECT EXISTS (
    SELECT 1 FROM reviews
    WHERE user_id = v_user_id AND product_id = p_product_id
  ) INTO v_has_review;
  
  IF v_has_review THEN
    RAISE EXCEPTION 'Bu ürüne zaten yorum yapmışsınız';
  END IF;
  
  -- Yorumu ekle
  INSERT INTO reviews (user_id, product_id, rating, title, comment)
  VALUES (v_user_id, p_product_id, p_rating, p_title, p_comment)
  RETURNING id INTO v_review_id;
  
  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Reviews RLS politikası düzeltildi!';
  RAISE NOTICE '';
END $$;
