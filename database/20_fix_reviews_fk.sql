-- =================================================
-- Fix reviews foreign key for user_profiles join
-- =================================================

-- Mevcut foreign key constraint'i kaldır
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

-- user_profiles tablosuna foreign key ekle
ALTER TABLE reviews 
  ADD CONSTRAINT reviews_user_id_user_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- =================================================
-- Success Message
-- =================================================
DO $$ 
BEGIN 
  RAISE NOTICE '';
  RAISE NOTICE '✅ Reviews foreign key düzeltildi!';
  RAISE NOTICE '   Artık yorumlarda kullanıcı adları görünecek.';
  RAISE NOTICE '';
END $$;
