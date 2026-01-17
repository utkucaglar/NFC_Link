# NFCLink Database Setup

Bu klasör NFCLink uygulaması için Supabase veritabanı kurulum dosyalarını içerir.

## 🚀 Kurulum

**Supabase Dashboard → SQL Editor** sekmesinde sırayla çalıştırın:

```
1. 01_schema.sql      → Tabloları oluşturur
2. 02_policies.sql    → Güvenlik politikaları
3. 03_functions.sql   → Otomatik fonksiyonlar
4. 04_seed_data.sql   → Örnek ürün verileri
```

**Her dosyayı sırayla çalıştırın!** Bir sonrakine geçmeden önce "Success" mesajı görmelisiniz.

---

## 📊 Tablolar

| Tablo | Açıklama |
|-------|----------|
| `user_profiles` | Kullanıcı profilleri |
| `products` | Ürün kataloğu |
| `orders` | Siparişler |
| `order_items` | Sipariş detayları |
| `nfcs` | NFC ürünleri |
| `nfc_scans` | Tarama geçmişi |

---

## 🔑 .env Ayarları

Supabase Dashboard → **Settings** → **API**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**anon public** key'i kullanın (uzun, `eyJ` ile başlayan).

---

## 👤 Admin Oluşturma

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

---

## 🧪 Test

```sql
SELECT * FROM products;
```

6 ürün görmelisiniz.
