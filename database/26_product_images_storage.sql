-- ============================================
-- PRODUCT IMAGES STORAGE BUCKET
-- File: 26_product_images_storage.sql
-- ============================================
-- Bu dosya ürün görselleri için storage bucket'ını oluşturur
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Önce mevcut policy'leri temizle (varsa)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

-- Herkes görselleri okuyabilir (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Sadece authenticated kullanıcılar yükleyebilir
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Sadece authenticated kullanıcılar güncelleyebilir
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Sadece authenticated kullanıcılar silebilir
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Product images storage bucket created!';
  RAISE NOTICE '📸 Bucket name: product-images';
  RAISE NOTICE '🔓 Public access: Enabled';
  RAISE NOTICE '🔐 Upload/Update/Delete: Authenticated users only';
END $$;
