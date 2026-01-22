# PayTR Ödeme Entegrasyonu Rehberi

Bu dokümantasyon, NFC Link projesine PayTR ödeme entegrasyonunun nasıl yapıldığını ve kullanıldığını açıklar.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Kurulum Adımları](#kurulum-adımları)
3. [Veritabanı Kurulumu](#veritabanı-kurulumu)
4. [Supabase Edge Functions Kurulumu](#supabase-edge-functions-kurulumu)
5. [Environment Variables](#environment-variables)
6. [PayTR Hesap Ayarları](#paytr-hesap-ayarları)
7. [Test Etme](#test-etme)
8. [Güvenlik Notları](#güvenlik-notları)

## 🔧 Gereksinimler

- PayTR hesabı (https://www.paytr.com)
- Supabase projesi
- PayTR Merchant ID, Merchant Key ve Merchant Salt bilgileri

## 📦 Kurulum Adımları

### 1. Veritabanı Kurulumu

PayTR entegrasyonu için veritabanı şemasını güncelleyin:

```sql
-- Supabase SQL Editor'da çalıştırın
-- Dosya: database/29_paytr_integration.sql
```

Bu script şunları yapar:
- `payments` tablosuna PayTR kolonları ekler
- `orders` tablosuna `payment_id` referansı ekler (eğer yoksa)
- PayTR konfigürasyon tablosu oluşturur

### 2. Supabase Edge Functions Kurulumu

#### 2.1. PayTR Token Oluşturma Fonksiyonu

```bash
cd NFC_Link
npx supabase functions deploy create-paytr-token
```

#### 2.2. PayTR Callback Handler Fonksiyonu

```bash
npx supabase functions deploy paytr-callback
```

### 3. Environment Variables

Supabase projenizde aşağıdaki environment variables'ları ayarlayın:

```bash
# Supabase Dashboard > Project Settings > Edge Functions > Secrets

# PayTR API Bilgileri
PAYTR_MERCHANT_ID=your_merchant_id
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt

# Supabase Bilgileri (zaten olmalı)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Önemli:** `SUPABASE_SERVICE_ROLE_KEY` callback handler için gereklidir çünkü payment kayıtlarını güncellemek için admin yetkisi gerekiyor.

### 4. Frontend Environment Variables

`.env` dosyanıza ekleyin (opsiyonel - test modu için):

```env
VITE_PAYTR_TEST_MODE=false
```

## 🔐 PayTR Hesap Ayarları

### 1. PayTR Dashboard'a Giriş

1. https://www.paytr.com adresine giriş yapın
2. Dashboard > Ayarlar > Entegrasyon Ayarları bölümüne gidin

### 2. Callback URL Ayarlama

PayTR callback URL'inizi ayarlayın:

```
https://your-project-ref.supabase.co/functions/v1/paytr-callback
```

**Not:** `your-project-ref` yerine Supabase proje referansınızı yazın.

### 3. Test Modu

Test modunda ödeme yapmak için:
- PayTR Dashboard'da test modunu aktif edin
- Frontend'de `VITE_PAYTR_TEST_MODE=true` ayarlayın

## 🧪 Test Etme

### 1. Test Kartları

PayTR test modunda aşağıdaki kartları kullanabilirsiniz:

- **Kart Numarası:** 4355 0808 0000 0008
- **Son Kullanma:** Herhangi bir gelecek tarih (örn: 12/25)
- **CVV:** Herhangi bir 3 haneli sayı (örn: 123)
- **3D Secure Şifresi:** Test için PayTR'den alacağınız şifre

### 2. Test Senaryoları

1. **Başarılı Ödeme:**
   - Checkout sayfasına gidin
   - Adres bilgilerini doldurun
   - "Öde" butonuna tıklayın
   - PayTR iframe'i açılmalı
   - Test kartı ile ödeme yapın
   - Ödeme başarılı olmalı ve sipariş onaylanmalı

2. **Başarısız Ödeme:**
   - Aynı adımları takip edin
   - Ödeme iptal edin veya hatalı kart bilgisi girin
   - Sipariş durumu "cancelled" olmalı

## 🔒 Güvenlik Notları

### 1. Hash Doğrulama

PayTR callback'inde hash doğrulaması yapılır:
- PayTR'den gelen hash ile hesaplanan hash karşılaştırılır
- Hash uyuşmazsa ödeme reddedilir

### 2. Environment Variables

- **ASLA** PayTR bilgilerini frontend koduna yazmayın
- Tüm hassas bilgiler Supabase Edge Functions secrets'ında saklanır
- Production'da test modunu kapatın

### 3. SSL/HTTPS

- PayTR callback URL'i mutlaka HTTPS olmalı
- Supabase Edge Functions otomatik olarak HTTPS sağlar

### 4. Rate Limiting

Production'da callback handler'a rate limiting ekleyin (gelecekte).

## 📊 Ödeme Akışı

```
1. Kullanıcı Checkout sayfasında "Öde" butonuna tıklar
   ↓
2. Frontend create-paytr-token Edge Function'ını çağırır
   ↓
3. Edge Function PayTR API'ye token isteği gönderir
   ↓
4. PayTR token döner
   ↓
5. Frontend PayTR iframe'ini gösterir
   ↓
6. Kullanıcı ödeme bilgilerini girer
   ↓
7. PayTR ödemeyi işler
   ↓
8. PayTR callback URL'e POST isteği gönderir
   ↓
9. paytr-callback Edge Function hash doğrular
   ↓
10. Payment ve Order durumları güncellenir
   ↓
11. Kullanıcı başarı sayfasına yönlendirilir
```

## 🐛 Sorun Giderme

### Problem: PayTR token oluşturulamıyor

**Çözüm:**
- Environment variables'ların doğru ayarlandığından emin olun
- PayTR Dashboard'da API erişiminin aktif olduğunu kontrol edin
- Edge Function loglarını kontrol edin: `npx supabase functions logs create-paytr-token`

### Problem: Callback çalışmıyor

**Çözüm:**
- PayTR Dashboard'da callback URL'in doğru ayarlandığını kontrol edin
- Callback URL'in HTTPS olduğundan emin olun
- Edge Function loglarını kontrol edin: `npx supabase functions logs paytr-callback`
- `SUPABASE_SERVICE_ROLE_KEY`'in ayarlandığından emin olun

### Problem: Hash doğrulama başarısız

**Çözüm:**
- Merchant Salt'ın doğru olduğundan emin olun
- Hash hesaplama formatını kontrol edin (PayTR dokümantasyonuna göre)

## 📚 Ek Kaynaklar

- [PayTR Dokümantasyonu](https://dev.paytr.com/)
- [PayTR API Referansı](https://dev.paytr.com/odeme-formu-entegrasyonu)
- [Supabase Edge Functions Dokümantasyonu](https://supabase.com/docs/guides/functions)

## ✅ Checklist

Kurulum tamamlandığında kontrol edin:

- [ ] Veritabanı şeması güncellendi
- [ ] Edge Functions deploy edildi
- [ ] Environment variables ayarlandı
- [ ] PayTR callback URL ayarlandı
- [ ] Test ödemesi başarılı oldu
- [ ] Production'da test modu kapatıldı

## 🆘 Destek

Sorun yaşarsanız:
1. Edge Function loglarını kontrol edin
2. PayTR Dashboard'da işlem geçmişini kontrol edin
3. Supabase Dashboard'da database loglarını kontrol edin

---

**Son Güncelleme:** 2024
**Versiyon:** 1.0.0
