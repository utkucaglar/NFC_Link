-- =================================================
-- Email Unique Constraint
-- =================================================
-- Bu migration user_profiles tablosunda email'in unique olmasını sağlar
-- Ayrıca auth.users tablosunda da email zaten unique (Supabase tarafından)

-- =================================================
-- 1. Mevcut duplicate email'leri temizle (eğer varsa)
-- =================================================
-- Not: Bu sadece güvenlik için, normalde olmamalı
-- Eğer duplicate email varsa, en eski kaydı tut, diğerlerini sil
DO $$
DECLARE
  duplicate_record RECORD;
BEGIN
  FOR duplicate_record IN 
    SELECT email, array_agg(id ORDER BY created_at) as user_ids
    FROM user_profiles
    GROUP BY email
    HAVING count(*) > 1
  LOOP
    -- En eski kaydı tut, diğerlerini sil
    DELETE FROM user_profiles
    WHERE email = duplicate_record.email
      AND id != duplicate_record.user_ids[1];
    
    RAISE NOTICE 'Duplicate email removed: % (kept: %)', 
      duplicate_record.email, 
      duplicate_record.user_ids[1];
  END LOOP;
END $$;

-- =================================================
-- 2. Email Unique Constraint Ekle
-- =================================================
-- Eğer constraint zaten varsa, önce sil
ALTER TABLE user_profiles 
  DROP CONSTRAINT IF EXISTS user_profiles_email_unique;

-- Unique constraint ekle
ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- =================================================
-- 3. Index'i güncelle (unique constraint zaten index oluşturur)
-- =================================================
-- Unique constraint otomatik olarak unique index oluşturur
-- Eski index'i silebiliriz (ama gerek yok, zarar vermez)

-- =================================================
-- SUCCESS MESSAGE
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Email unique constraint added successfully!';
  RAISE NOTICE '📧 Email addresses are now guaranteed to be unique in user_profiles table';
END $$;
