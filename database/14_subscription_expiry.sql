-- ============================================
-- NFCLink Subscription Expiry Management
-- File: 14_subscription_expiry.sql
-- ============================================
-- Bu dosya abonelik süresi yönetimini ekler
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- Süresi dolmuş abonelikleri devre dışı bırakan fonksiyon
CREATE OR REPLACE FUNCTION deactivate_expired_subscriptions()
RETURNS INTEGER AS $$
DECLARE
  affected_count INTEGER;
BEGIN
  UPDATE nfcs
  SET 
    is_active = false,
    subscription_status = 'expired',
    updated_at = NOW()
  WHERE 
    subscription_end_date < NOW()
    AND is_active = true
    AND subscription_status != 'expired';
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- NFC görüntüleme öncesi abonelik kontrolü yapan fonksiyon
CREATE OR REPLACE FUNCTION check_nfc_subscription(nfc_unique_key TEXT)
RETURNS TABLE (
  id UUID,
  unique_key TEXT,
  name TEXT,
  type TEXT,
  is_active BOOLEAN,
  data JSONB,
  theme TEXT,
  is_subscription_valid BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.unique_key,
    n.name,
    n.type,
    n.is_active,
    n.data,
    n.theme,
    (n.subscription_end_date IS NULL OR n.subscription_end_date > NOW()) AS is_subscription_valid
  FROM nfcs n
  WHERE n.unique_key = nfc_unique_key;
END;
$$ LANGUAGE plpgsql;

-- Abonelik durumunu güncelleyen fonksiyon (admin tarafından kullanılır)
CREATE OR REPLACE FUNCTION extend_nfc_subscription(
  nfc_id_param UUID,
  days_to_add INTEGER
)
RETURNS VOID AS $$
DECLARE
  current_end TIMESTAMP WITH TIME ZONE;
  new_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Mevcut bitiş tarihini al
  SELECT subscription_end_date INTO current_end
  FROM nfcs
  WHERE id = nfc_id_param;
  
  -- Eğer süresi dolmuşsa şu andan itibaren uzat
  IF current_end IS NULL OR current_end < NOW() THEN
    new_end := NOW() + (days_to_add || ' days')::INTERVAL;
  ELSE
    new_end := current_end + (days_to_add || ' days')::INTERVAL;
  END IF;
  
  -- Güncelle
  UPDATE nfcs
  SET 
    subscription_end_date = new_end,
    subscription_status = 'active',
    is_active = true,
    updated_at = NOW()
  WHERE id = nfc_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Abonelik bitiş tarihine göre sıralı NFC listesi görünümü (admin için)
CREATE OR REPLACE VIEW nfc_subscription_status AS
SELECT 
  n.id,
  n.unique_key,
  n.name,
  n.type,
  n.is_active,
  n.scan_count,
  n.subscription_status,
  n.subscription_end_date,
  n.created_at,
  n.user_id,
  up.email as user_email,
  up.first_name as user_first_name,
  up.last_name as user_last_name,
  up.phone as user_phone,
  CASE 
    WHEN n.subscription_end_date IS NULL THEN 'unknown'
    WHEN n.subscription_end_date < NOW() THEN 'expired'
    WHEN n.subscription_end_date < NOW() + INTERVAL '7 days' THEN 'expiring_soon'
    ELSE 'active'
  END as status_category,
  CASE 
    WHEN n.subscription_end_date IS NULL THEN NULL
    ELSE EXTRACT(DAY FROM (n.subscription_end_date - NOW()))::INTEGER
  END as days_remaining
FROM nfcs n
LEFT JOIN user_profiles up ON n.user_id = up.id
ORDER BY n.subscription_end_date ASC NULLS LAST;

-- RLS policy for the view (if needed)
-- Views don't need RLS but the underlying table does

-- Cron job için pg_cron kullanılabilir (Supabase Pro plan gerektirir)
-- Alternatif: Edge Function ile günlük kontrol

-- ============================================
-- NOT: Supabase Free tier'da cron job yok
-- Bu durumda admin panel açıldığında veya
-- NFC sayfası görüntülendiğinde kontrol yapılır
-- ============================================

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Subscription expiry functions created!';
  RAISE NOTICE '📝 Use deactivate_expired_subscriptions() to manually deactivate expired subscriptions';
END $$;
