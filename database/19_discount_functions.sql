-- =================================================
-- Esdodesign Discount Functions
-- =================================================

-- Mevcut fonksiyonları temizle
DROP FUNCTION IF EXISTS increment_discount_usage(UUID);
DROP FUNCTION IF EXISTS validate_discount_code(TEXT, UUID, DECIMAL);
DROP FUNCTION IF EXISTS validate_discount_code(TEXT, UUID, NUMERIC);

-- İndirim kullanım sayısını artır
CREATE OR REPLACE FUNCTION increment_discount_usage(discount_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE discounts
  SET usage_count = COALESCE(usage_count, 0) + 1,
      updated_at = NOW()
  WHERE id = discount_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- İndirim kodunu doğrula (opsiyonel - frontend'de de yapılıyor)
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code TEXT,
  p_user_id UUID,
  p_order_total DECIMAL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  discount_id UUID,
  discount_type TEXT,
  discount_value DECIMAL,
  calculated_discount DECIMAL,
  error_message TEXT
) AS $$
DECLARE
  v_discount RECORD;
  v_user_usage_count INTEGER;
  v_calculated_discount DECIMAL;
BEGIN
  -- İndirim kodunu bul
  SELECT * INTO v_discount
  FROM discounts d
  WHERE UPPER(d.code) = UPPER(p_code)
    AND d.is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Geçersiz indirim kodu'::TEXT;
    RETURN;
  END IF;
  
  -- Tarih kontrolü
  IF v_discount.starts_at IS NOT NULL AND v_discount.starts_at > NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Bu indirim kodu henüz aktif değil'::TEXT;
    RETURN;
  END IF;
  
  IF v_discount.expires_at IS NOT NULL AND v_discount.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Bu indirim kodunun süresi dolmuş'::TEXT;
    RETURN;
  END IF;
  
  -- Kullanım limiti kontrolü
  IF v_discount.usage_limit IS NOT NULL AND v_discount.usage_count >= v_discount.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Bu indirim kodu kullanım limitine ulaşmış'::TEXT;
    RETURN;
  END IF;
  
  -- Minimum tutar kontrolü
  IF v_discount.min_order_amount IS NOT NULL AND p_order_total < v_discount.min_order_amount THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 
      ('Minimum sipariş tutarı: ₺' || v_discount.min_order_amount)::TEXT;
    RETURN;
  END IF;
  
  -- Kullanıcı başına kullanım kontrolü
  IF p_user_id IS NOT NULL AND v_discount.per_user_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM discount_usages
    WHERE discount_usages.discount_id = v_discount.id
      AND user_id = p_user_id;
    
    IF v_user_usage_count >= v_discount.per_user_limit THEN
      RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::DECIMAL, NULL::DECIMAL, 'Bu indirim kodunu daha önce kullandınız'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- İndirim miktarını hesapla
  IF v_discount.discount_type = 'percentage' THEN
    v_calculated_discount := (p_order_total * v_discount.discount_value) / 100;
    IF v_discount.max_discount_amount IS NOT NULL AND v_calculated_discount > v_discount.max_discount_amount THEN
      v_calculated_discount := v_discount.max_discount_amount;
    END IF;
  ELSE
    v_calculated_discount := v_discount.discount_value;
  END IF;
  
  -- İndirim tutarı sipariş tutarını geçemez
  IF v_calculated_discount > p_order_total THEN
    v_calculated_discount := p_order_total;
  END IF;
  
  RETURN QUERY SELECT 
    true,
    v_discount.id,
    v_discount.discount_type,
    v_discount.discount_value,
    v_calculated_discount,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Discount functions oluşturuldu!';
  RAISE NOTICE '';
END $$;
