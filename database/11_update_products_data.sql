-- ============================================
-- NFCLink Update Products with Features, Colors, Specs
-- File: 11_update_products_data.sql
-- ============================================
-- Bu dosya mevcut ürünlere özellik, renk ve teknik bilgi ekler
-- ============================================

-- Önce features kolonunu TEXT[] olarak düzelt (eğer JSONB ise)
ALTER TABLE products DROP COLUMN IF EXISTS features;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[];

-- Colors ve specs kolonlarını ekle (10_product_details.sql çalıştırılmadıysa)
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;

-- ============================================
-- ÜRÜN VERİLERİNİ GÜNCELLE
-- ============================================

-- NFC Kartvizit - Klasik Beyaz (id=1)
UPDATE products SET
  features = ARRAY[
    'Yüksek kaliteli PVC malzeme',
    'Su ve çizilmeye dayanıklı',
    '10+ yıl dayanıklılık',
    'Tüm NFC uyumlu telefonlarla çalışır',
    'Uygulama indirme gerektirmez',
    'Anında aktivasyon'
  ],
  colors = ARRAY['Beyaz', 'Siyah', 'Gri'],
  specs = '{
    "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
    "Kalınlık": "0.8 mm",
    "Malzeme": "Premium PVC",
    "NFC Chip": "NTAG216",
    "Hafıza": "888 bytes",
    "Okuma Mesafesi": "1-5 cm"
  }'::jsonb,
  long_description = 'Profesyonel hayatınızda fark yaratın. NFC Kartvizit ile iletişim bilgilerinizi, sosyal medya hesaplarınızı ve web sitenizi tek bir dokunuşla paylaşın. Klasik beyaz tasarımı her ortamda şık görünür ve kalıcı bir izlenim bırakır.'
WHERE id = 1;

-- NFC Kartvizit - Premium Siyah (id=2)
UPDATE products SET
  features = ARRAY[
    'Metal kaplama premium yüzey',
    'Lazer gravür seçeneği',
    'Su ve çizilmeye dayanıklı',
    '15+ yıl dayanıklılık',
    'VIP müşteri desteği',
    'Özel kutu ile teslimat'
  ],
  colors = ARRAY['Siyah', 'Altın', 'Gümüş'],
  specs = '{
    "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
    "Kalınlık": "1.0 mm",
    "Malzeme": "Metal kaplama PVC",
    "NFC Chip": "NTAG216",
    "Hafıza": "888 bytes",
    "Okuma Mesafesi": "1-5 cm"
  }'::jsonb,
  long_description = 'Lüks ve profesyonelliği bir arada sunan Premium Siyah NFC Kartvizit, metal kaplama yüzeyi ile dikkat çeker. İş toplantılarında, networking etkinliklerinde fark yaratmak isteyenler için tasarlandı.'
WHERE id = 2;

-- NFC Bileklik - Spor (id=3)
UPDATE products SET
  features = ARRAY[
    'IP68 su geçirmezlik',
    'Hipoalerjenik silikon',
    'Ayarlanabilir boyut',
    'Ter ve tuzlu suya dayanıklı',
    'Hafif tasarım (sadece 15g)',
    '6 farklı renk seçeneği'
  ],
  colors = ARRAY['Siyah', 'Mavi', 'Kırmızı', 'Yeşil', 'Beyaz', 'Turuncu'],
  specs = '{
    "Boyut": "Ayarlanabilir (16-22 cm)",
    "Genişlik": "12 mm",
    "Malzeme": "Medikal silikon",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Okuma Mesafesi": "1-3 cm"
  }'::jsonb,
  long_description = 'Aktif yaşam tarzınız için tasarlandı. Su geçirmez silikon yapısı sayesinde spor yaparken, yüzerken bile bilekliğinizi çıkarmadan kullanabilirsiniz. Hafif ve rahat tasarımı gün boyu konfor sağlar.'
WHERE id = 3;

-- NFC Bileklik - Festival (id=4)
UPDATE products SET
  features = ARRAY[
    'Tek kullanımlık güvenlik kilidi',
    'Rahat kumaş yapı',
    'Özelleştirilebilir baskı',
    'Toplu sipariş indirimi',
    'Hızlı teslimat',
    'Çevre dostu malzeme'
  ],
  colors = ARRAY['Çok Renkli', 'Siyah', 'Beyaz', 'Kırmızı', 'Mavi'],
  specs = '{
    "Boyut": "350 x 15 mm",
    "Malzeme": "Polyester kumaş",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Okuma Mesafesi": "1-3 cm",
    "Min. Sipariş": "1 adet"
  }'::jsonb,
  long_description = 'Festival ve etkinlikler için özel tasarlanmış ekonomik NFC bileklik. Kumaş yapısı ve güvenlik kilidi ile etkinlik boyunca güvenle kullanılır. Toplu siparişlerde özel fiyatlandırma mevcuttur.'
WHERE id = 4;

-- Pet Tag - Altın (id=5)
UPDATE products SET
  features = ARRAY[
    'Paslanmaz çelik gövde',
    '24K altın kaplama',
    'Su geçirmez',
    'QR kod + NFC çift teknoloji',
    'Acil durum bilgileri',
    'GPS takip entegrasyonu (opsiyonel)'
  ],
  colors = ARRAY['Altın', 'Rose Gold'],
  specs = '{
    "Boyut": "30 mm çap",
    "Kalınlık": "2 mm",
    "Malzeme": "Paslanmaz çelik + Altın kaplama",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Ağırlık": "8g"
  }'::jsonb,
  long_description = 'Evcil dostunuz için şık ve güvenli bir kimlik. Altın kaplama paslanmaz çelik yapısı ile hem dayanıklı hem de estetik. QR kod ve NFC teknolojisi sayesinde kaybolma durumunda hızlı iletişim sağlar.'
WHERE id = 5;

-- Pet Tag - Gümüş (id=6)
UPDATE products SET
  features = ARRAY[
    'Paslanmaz çelik gövde',
    'Gümüş kaplama',
    'Su geçirmez',
    'QR kod + NFC çift teknoloji',
    'Acil durum bilgileri',
    'Ücretsiz gravür'
  ],
  colors = ARRAY['Gümüş', 'Antik Gümüş'],
  specs = '{
    "Boyut": "30 mm çap",
    "Kalınlık": "2 mm",
    "Malzeme": "Paslanmaz çelik + Gümüş kaplama",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Ağırlık": "8g"
  }'::jsonb,
  long_description = 'Klasik gümüş tasarımı ile evcil hayvanınız için zarif bir kimlik etiketi. Dayanıklı paslanmaz çelik yapısı uzun ömürlü kullanım sağlar. Kaybolma durumunda iletişim bilgilerinize anında ulaşılabilir.'
WHERE id = 6;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Products updated with features, colors, and specs!';
  RAISE NOTICE '📦 6 products updated';
END $$;
