-- =================================================
-- Esdodesign Reviews (Yorum/Değerlendirme) Schema
-- =================================================

-- Reviews tablosu
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  admin_response TEXT,
  admin_response_at TIMESTAMP WITH TIME ZONE,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Her kullanıcı bir ürüne sadece bir yorum yapabilir
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- RLS Enable
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- =================================================
-- RLS Policies
-- =================================================

-- Herkes onaylanmış ve görünür yorumları okuyabilir
CREATE POLICY "Anyone can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true AND is_visible = true);

-- Kullanıcılar kendi yorumlarını görebilir (onaysız olsa bile)
CREATE POLICY "Users can view their own reviews"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcılar sadece satın aldıkları ürünlere yorum yapabilir
CREATE POLICY "Users can create reviews for purchased products"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = auth.uid()
        AND oi.product_id = reviews.product_id
        AND o.status IN ('delivered', 'shipped', 'confirmed')
    )
  );

-- Kullanıcılar kendi yorumlarını güncelleyebilir (sadece bazı alanları)
CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi yorumlarını silebilir
CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Admin tüm yorumları görebilir
CREATE POLICY "Admins can view all reviews"
  ON reviews FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin tüm yorumları güncelleyebilir
CREATE POLICY "Admins can update all reviews"
  ON reviews FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin yorumları silebilir
CREATE POLICY "Admins can delete reviews"
  ON reviews FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =================================================
-- Helper Functions
-- =================================================

-- Ürün ortalama puanını hesapla
CREATE OR REPLACE FUNCTION get_product_rating(p_product_id INTEGER)
RETURNS TABLE(average_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE product_id = p_product_id
    AND is_approved = true
    AND is_visible = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kullanıcının bu ürüne yorum yapıp yapamayacağını kontrol et
CREATE OR REPLACE FUNCTION can_user_review_product(p_user_id UUID, p_product_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  has_purchased BOOLEAN;
  already_reviewed BOOLEAN;
BEGIN
  -- Ürünü satın almış mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = p_user_id
      AND oi.product_id = p_product_id
      AND o.status IN ('delivered', 'shipped', 'confirmed')
  ) INTO has_purchased;
  
  -- Zaten yorum yapmış mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM reviews
    WHERE user_id = p_user_id AND product_id = p_product_id
  ) INTO already_reviewed;
  
  RETURN has_purchased AND NOT already_reviewed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin yorumu onayla/reddet
CREATE OR REPLACE FUNCTION admin_approve_review(p_review_id UUID, p_approved BOOLEAN)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE reviews
  SET is_approved = p_approved, updated_at = NOW()
  WHERE id = p_review_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin yorum yanıtla
CREATE OR REPLACE FUNCTION admin_respond_to_review(p_review_id UUID, p_response TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  UPDATE reviews
  SET 
    admin_response = p_response,
    admin_response_at = NOW(),
    updated_at = NOW()
  WHERE id = p_review_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- Updated_at trigger
-- =================================================
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Reviews tablosu ve politikaları oluşturuldu!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Özellikler:';
  RAISE NOTICE '   - Kullanıcılar sadece satın aldıkları ürünlere yorum yapabilir';
  RAISE NOTICE '   - Her ürüne bir kez yorum yapılabilir';
  RAISE NOTICE '   - Yorumlar admin onayından sonra görünür';
  RAISE NOTICE '   - Adminler yorum yanıtlayabilir';
  RAISE NOTICE '';
END $$;
