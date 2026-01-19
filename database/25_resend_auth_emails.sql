-- =================================================
-- Resend ile Auth Email'leri Gönderme
-- =================================================
-- Bu trigger'lar Supabase auth işlemlerinde Resend ile email gönderir

-- =================================================
-- 1. Email Doğrulama (Signup) için Trigger
-- =================================================

-- Supabase auth.users tablosuna yeni kullanıcı eklendiğinde
-- Resend ile email doğrulama emaili gönder
CREATE OR REPLACE FUNCTION send_signup_email()
RETURNS TRIGGER AS $$
DECLARE
  v_email_settings JSONB;
  v_email_enabled BOOLEAN;
  v_from_email TEXT;
  v_from_name TEXT;
  v_api_key TEXT;
  v_confirmation_url TEXT;
  v_first_name TEXT;
  v_response JSONB;
BEGIN
  -- Email ayarlarını kontrol et
  SELECT value INTO v_email_settings
  FROM site_settings
  WHERE key = 'email_settings';
  
  IF v_email_settings IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_email_enabled := (v_email_settings->>'is_enabled')::boolean;
  v_from_email := v_email_settings->>'from_email';
  v_from_name := v_email_settings->>'from_name';
  
  -- Email servisi kapalıysa çık
  IF NOT COALESCE(v_email_enabled, false) THEN
    RETURN NEW;
  END IF;
  
  -- Kullanıcı metadata'sından isim bilgisini al
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'Kullanıcı');
  
  -- Confirmation URL oluştur
  -- Not: Supabase'in confirmation token'ını direkt alamayız
  -- Bu yüzden Supabase'in oluşturduğu confirmation link'ini kullanmalıyız
  -- Alternatif: Supabase Admin API kullan veya email confirmation'ı enable et
  
  -- Şimdilik: Email confirmation disabled ise hoş geldiniz emaili gönder
  -- Confirmation link'i Supabase'in oluşturduğu link'i kullanır
  
  -- Resend API'ye istek gönder (Supabase Edge Function üzerinden)
  -- Not: Bu trigger'dan direkt Resend API'ye istek gönderemeyiz
  -- Bu yüzden Supabase Edge Function kullanmalıyız veya
  -- Frontend'den email göndermeliyiz
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger oluştur (auth.users tablosu için)
-- Not: auth.users tablosuna direkt trigger ekleyemeyiz
-- Bu yüzden alternatif yaklaşım: Supabase Edge Function veya Database Webhook kullan

-- =================================================
-- 2. Şifre Sıfırlama için Trigger
-- =================================================

-- auth.users tablosunda password reset token oluşturulduğunda
-- Resend ile şifre sıfırlama emaili gönder
-- Not: auth.users tablosuna trigger ekleyemeyiz, alternatif yaklaşım gerekli

-- =================================================
-- ALTERNATİF YAKLAŞIM: Supabase Edge Function Kullan
-- =================================================

-- Supabase'de email hook'ları kullanarak Resend ile email göndermek için:
-- 1. Supabase Dashboard → Settings → Auth → Email Templates
-- 2. Email template'lerini özelleştir (ama email'i Resend ile göndermek için hook gerekli)
-- 3. Veya Supabase Edge Function kullan

-- =================================================
-- ÖNERİLEN YAKLAŞIM: Supabase Email Hook + Resend
-- =================================================

-- Supabase'de email confirmation'ı enable et
-- Ama email template'lerini Resend'e yönlendirmek için:
-- 1. Supabase Dashboard → Settings → Auth → Email Templates
-- 2. Email template'lerini özelleştir
-- 3. Veya Supabase Edge Function kullanarak Resend ile email gönder

-- =================================================
-- NOT: Frontend'den Token Alamama Sorunu
-- =================================================

-- Supabase'in confirmation token'ını frontend'den direkt alamayız
-- Çözüm seçenekleri:
-- 1. Supabase Admin API kullan (backend gerektirir)
-- 2. Supabase Edge Function kullan (backend gerektirir)
-- 3. Supabase Database Trigger kullan (backend gerektirir)
-- 4. Supabase email confirmation'ı enable et ama email'i Resend ile gönder (hook gerektirir)

-- =================================================
-- GEÇİCİ ÇÖZÜM: Email Confirmation Disable + Hoş Geldiniz Emaili
-- =================================================

-- Email confirmation'ı disable et
-- signUp sonrası kullanıcıyı otomatik confirm et
-- Resend ile hoş geldiniz emaili gönder
-- Şifre sıfırlama için Supabase'in resetPasswordForEmail'ini kullan
-- ama email'i Resend ile göndermek için Supabase email hook kullan

DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ÖNEMLİ: Supabase auth email''lerini Resend ile göndermek için';
  RAISE NOTICE '   Supabase Edge Function veya Database Trigger kullanılmalıdır.';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Önerilen yaklaşım:';
  RAISE NOTICE '   1. Supabase Dashboard → Settings → Auth → Email Templates';
  RAISE NOTICE '   2. Email template''lerini özelleştir';
  RAISE NOTICE '   3. Veya Supabase Edge Function kullanarak Resend ile email gönder';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Alternatif: Frontend''den email göndermek için';
  RAISE NOTICE '   Supabase Admin API veya Service Role Key gerekir (güvenlik riski).';
  RAISE NOTICE '';
END $$;
