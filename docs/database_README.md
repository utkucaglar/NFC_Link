# NFCLink Database Setup

## Hızlı Başlangıç

Admin panelinin çalışması için SQL dosyalarını şu sırayla çalıştırın:

```
01_schema.sql          → Temel tablolar
02_policies.sql        → Kullanıcı RLS politikaları
03_functions.sql       → Yardımcı fonksiyonlar
04_seed_data.sql       → Örnek ürünler
08_admin_discounts.sql → Admin tabloları
09_admin_policies.sql  → Admin RLS politikaları
12_fix_orders_rls.sql  → Sipariş politikaları düzeltmesi
```

### Admin Kullanıcı Oluşturma

1. Normal kullanıcı olarak kayıt olun
2. Supabase SQL Editor'da şu sorguyu çalıştırın:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

---

## 🔄 Sıfırdan Başlama (Reset)

Supabase'i tamamen sıfırlamak için **SQL Editor**'da sırayla çalıştır:

```
1. 00_reset.sql               → Her şeyi siler
2. 01_schema.sql              → Tabloları oluşturur
3. 02_policies.sql            → RLS politikaları
4. 03_functions.sql           → Trigger'lar (profil oluşturma dahil)
5. 04_seed_data.sql           → Örnek ürünler
6. 05_schema_update.sql       → Shipping addresses
7. 06_subscriptions_payments.sql → Abonelik tabloları (opsiyonel)
8. 08_admin_discounts.sql     → Admin ve indirim tabloları
9. 09_admin_policies.sql      → Admin RLS politikaları
10. 10_product_details.sql    → Kategoriler tablosu ve ürün detayları
```

---

## 📊 Tablolar

| Tablo | Açıklama |
|-------|----------|
| `user_profiles` | Kullanıcı profilleri (first_name, last_name, full_name) |
| `categories` | Ürün kategorileri (admin tarafından yönetilir) |
| `products` | Ürün kataloğu (özellikler, renkler, teknik bilgiler dahil) |
| `orders` | Siparişler |
| `order_items` | Sipariş kalemleri (kişiselleştirme bilgileri dahil) |
| `shipping_addresses` | Teslimat adresleri |
| `subscriptions` | Abonelikler |
| `payments` | Ödemeler |
| `discounts` | İndirim kodları |
| `discount_usages` | İndirim kullanım kayıtları |
| `admin_logs` | Admin işlem logları |

---

## 🔑 .env Ayarları

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

---

## 👤 Admin Yapmak

```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 🛠️ Admin Panel Özellikleri

Admin paneline erişim için kullanıcının `role = 'admin'` olması gerekir.

### Admin Panel Sayfaları:
- `/admin` - Dashboard (özet istatistikler)
- `/admin/orders` - Sipariş yönetimi (durum güncelleme, kişiselleştirme onayı)
- `/admin/products` - Ürün yönetimi (ekleme, düzenleme, silme)
- `/admin/discounts` - İndirim kodu yönetimi

### Admin Fonksiyonları:
- `is_admin()` - Kullanıcının admin olup olmadığını kontrol eder
- `admin_update_order_status()` - Sipariş durumunu günceller
- `admin_confirm_customization()` - Kişiselleştirmeyi onaylar
- `validate_discount_code()` - İndirim kodunu doğrular

---

## 🧪 Test

```sql
SELECT * FROM products;
SELECT id, email, first_name, last_name, role FROM user_profiles;
SELECT * FROM discounts;
```
