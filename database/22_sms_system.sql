-- =================================================
-- SMS & Email System - Logs and Settings
-- =================================================

-- Site ayarları tablosu (eğer yoksa)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Logs tablosu
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- RLS Enable
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_settings
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings"
  ON site_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for sms_logs
DROP POLICY IF EXISTS "Admins can view sms logs" ON sms_logs;
CREATE POLICY "Admins can view sms logs"
  ON sms_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert sms logs" ON sms_logs;
CREATE POLICY "System can insert sms logs"
  ON sms_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update sms logs" ON sms_logs;
CREATE POLICY "System can update sms logs"
  ON sms_logs FOR UPDATE
  USING (true);

-- Varsayılan SMS ayarlarını ekle
INSERT INTO site_settings (key, value, description)
VALUES (
  'sms_settings',
  '{"provider":"netgsm","api_key":"","api_secret":"","sender_id":"ESDODESIGN","is_enabled":false}',
  'SMS servis ayarları (Netgsm, İletimerkezi vb.)'
)
ON CONFLICT (key) DO NOTHING;

-- =================================================
-- EMAIL SYSTEM
-- =================================================

-- Email Logs tablosu
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- RLS Enable
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_logs
DROP POLICY IF EXISTS "Admins can view email logs" ON email_logs;
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can insert email logs" ON email_logs;
CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Varsayılan Email ayarlarını ekle (Resend)
INSERT INTO site_settings (key, value, description)
VALUES (
  'email_settings',
  '{"api_key":"","from_email":"noreply@esdodesign.com","from_name":"Esdodesign","is_enabled":false}',
  'Email servis ayarları (Resend API)'
)
ON CONFLICT (key) DO NOTHING;

-- Email bildirim tercihleri için orders tablosuna sütun ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE;

-- SMS bildirim tercihleri için orders tablosuna sütun ekle
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP WITH TIME ZONE;

-- Sipariş durumu değiştiğinde SMS göndermek için trigger fonksiyonu
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_phone TEXT;
  v_sms_enabled BOOLEAN;
BEGIN
  -- SMS ayarlarını kontrol et
  SELECT (value::jsonb->>'is_enabled')::boolean INTO v_sms_enabled
  FROM site_settings WHERE key = 'sms_settings';
  
  IF NOT COALESCE(v_sms_enabled, false) THEN
    RETURN NEW;
  END IF;
  
  -- Durum değiştiyse
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Kullanıcının telefonunu al
    SELECT phone INTO v_phone
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Telefon varsa ve SMS gönderilmemişse işaretle (frontend tetikleyecek)
    IF v_phone IS NOT NULL AND v_phone != '' THEN
      NEW.sms_sent := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur
DROP TRIGGER IF EXISTS order_status_change_trigger ON orders;
CREATE TRIGGER order_status_change_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();

-- Destek talebi için SMS bildirimi
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sms_notified BOOLEAN DEFAULT false;

-- =================================================
-- SMS Gönderme RPC Fonksiyonu (Admin için)
-- =================================================
CREATE OR REPLACE FUNCTION send_test_sms(p_phone TEXT, p_message TEXT)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Admin kontrolü
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Yetkiniz yok');
  END IF;
  
  -- Log'a kaydet (gerçek SMS gönderimi frontend'den yapılacak)
  INSERT INTO sms_logs (phone, message, status)
  VALUES (p_phone, p_message, 'pending');
  
  RETURN jsonb_build_object('success', true, 'message', 'SMS kuyruğa eklendi');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ SMS sistemi kuruldu!';
  RAISE NOTICE '   - sms_logs tablosu oluşturuldu';
  RAISE NOTICE '   - site_settings tablosu oluşturuldu';
  RAISE NOTICE '   - SMS ayarları eklendi';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Admin panelinden SMS ayarlarını yapılandırın:';
  RAISE NOTICE '   - Provider: netgsm veya iletimerkezi';
  RAISE NOTICE '   - API Key ve Secret';
  RAISE NOTICE '   - Gönderici ID (örn: ESDODESIGN)';
  RAISE NOTICE '';
END $$;
