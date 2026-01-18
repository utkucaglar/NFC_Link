-- ============================================
-- NFCLink NFC Customization Schema Update
-- File: 13_nfc_customization.sql
-- ============================================
-- Bu dosya NFC özelleştirme alanlarını ekler
-- Supabase SQL Editor'da çalıştırın
-- ============================================

-- Products tablosuna nfc_type alanı ekle
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS nfc_type TEXT CHECK (nfc_type IN ('business-card', 'pet-id', 'redirect'));

-- Mevcut ürünlerin nfc_type'ını güncelle (kategori bazlı)
UPDATE products SET nfc_type = 'business-card' WHERE category IN ('Profesyonel', 'Premium');
UPDATE products SET nfc_type = 'pet-id' WHERE category = 'Evcil Hayvan';
UPDATE products SET nfc_type = 'redirect' WHERE category = 'Spor & Etkinlik';

-- Order Items tablosuna customization_data alanı ekle (zaten var ama yapıyı genişletelim)
-- customization alanı zaten JSONB, onu kullanacağız

-- NFCs tablosunu genişlet - tema desteği ekle
ALTER TABLE nfcs 
ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';

-- ============================================
-- NFC Customization Data Yapısı (JSONB içinde)
-- ============================================
-- 
-- business-card için:
-- {
--   "name": "İsim Soyisim",
--   "title": "Meslek Ünvanı",
--   "company": "Şirket İsmi",
--   "phone": "Telefon",
--   "email": "E-posta",
--   "bio": "Tecrübeler ve İş Açıklaması",
--   "linkedin": "LinkedIn hesabı",
--   "instagram": "Instagram hesabı",
--   "website": "Website URL",
--   "theme": "default|modern|minimal|gradient"
-- }
--
-- pet-id için:
-- {
--   "petName": "Evcil Hayvan Adı",
--   "petImage": "Resim URL",
--   "ownerName": "Sahibi İsim Soyisim",
--   "ownerPhone": "Sahibi Telefon",
--   "address": "Ev Adresi",
--   "healthNotes": "Sağlık Notları",
--   "microchipNumber": "Mikroçip Numarası",
--   "theme": "default|warm|cool|nature"
-- }
--
-- redirect için:
-- {
--   "partnerNames": "İsimler (örn: Doğukan & Mısra)",
--   "startDate": "İlişki Başlangıç Tarihi",
--   "email": "E-posta",
--   "message": "Özel Mesaj",
--   "backgroundType": "stars|aurora|sunset|custom",
--   "backgroundImage": "Özel Arka Plan URL",
--   "theme": "romantic|minimal|elegant"
-- }
-- ============================================

-- Products tablosuna sort_order ekle (yoksa)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ NFC Customization schema updated!';
END $$;
