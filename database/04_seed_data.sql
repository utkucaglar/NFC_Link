-- ============================================
-- NFCLink Seed Data
-- File: 04_seed_data.sql
-- ============================================
-- Bu dosya örnek ürün verilerini ekler
-- ÖNEMLİ: 03_functions.sql'i çalıştırdıktan SONRA çalıştırın
-- ============================================

-- Önce var olan verileri temizle (opsiyonel - dikkatli kullanın!)
-- TRUNCATE products RESTART IDENTITY CASCADE;

-- ============================================
-- PRODUCTS
-- ============================================

INSERT INTO products (id, name, description, price, category, image_url, is_active) VALUES
(1, 
 'NFC Kartvizit - Klasik Beyaz',
 'Şık ve minimal tasarım ile profesyonel görünüm. Yüksek kaliteli PVC malzeme, su ve çizilmeye dayanıklı.',
 149.00,
 'Profesyonel',
 '/product-nfc-card.png',
 true
),

(2,
 'NFC Kartvizit - Premium Siyah',
 'Metal kaplama, lüks hissiyat. Lazer gravür seçeneği ile kişiselleştirilebilir premium kartvizit.',
 179.00,
 'Profesyonel',
 '/product-nfc-card.png',
 true
),

(3,
 'NFC Bileklik - Spor',
 'Su geçirmez, dayanıklı silikon. IP68 su geçirmezlik ile spor ve günlük kullanım için ideal.',
 199.00,
 'Spor & Etkinlik',
 '/product-nfc-band.png',
 true
),

(4,
 'NFC Bileklik - Festival',
 'Tek kullanımlık, etkinlikler için ideal. Özelleştirilebilir baskı ile toplu siparişler için uygun.',
 99.00,
 'Spor & Etkinlik',
 '/product-nfc-band.png',
 true
),

(5,
 'Pet Tag - Altın',
 'Paslanmaz çelik, altın kaplama. Evcil hayvanınız için şık ve güvenli kimlik etiketi.',
 129.00,
 'Evcil Hayvan',
 '/product-pet-tag.png',
 true
),

(6,
 'Pet Tag - Gümüş',
 'Paslanmaz çelik, gümüş kaplama. Ücretsiz gravür ile kişiselleştirilebilir pet tag.',
 119.00,
 'Evcil Hayvan',
 '/product-pet-tag.png',
 true
)

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Reset sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

-- ============================================
-- VERIFICATION
-- ============================================

DO $$ 
DECLARE
  product_count INTEGER;
BEGIN 
  SELECT COUNT(*) INTO product_count FROM products;
  
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '📦 Products: % items', product_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - 6 tables created';
  RAISE NOTICE '  - RLS policies enabled';
  RAISE NOTICE '  - Auto functions active';
  RAISE NOTICE '  - % products loaded', product_count;
  RAISE NOTICE '';
  RAISE NOTICE '👉 Next Steps:';
  RAISE NOTICE '  1. Update .env file with Supabase credentials';
  RAISE NOTICE '  2. Create your first user account';
  RAISE NOTICE '  3. Make a user admin (see README.md)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Your NFCLink database is ready to use!';
END $$;

-- ============================================
-- QUICK TESTS (Optional - Uncomment to run)
-- ============================================

-- View all products
-- SELECT id, name, price, category FROM products ORDER BY id;

-- Check table sizes
-- SELECT 
--   schemaname,
--   tablename,
--   pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
