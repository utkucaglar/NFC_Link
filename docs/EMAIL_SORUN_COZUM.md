# Email Gönderme Sorunu Çözümü

Email göndermeme sorununun nedenleri ve çözümleri.

---

## 🔍 Sorun: Email Göndermiyor

### Olası Nedenler:

1. **Domain Doğrulaması Eksik** ⚠️ EN ÖNEMLİ
   - `noreply@esdodesign.com` kullanıyorsunuz
   - Ama Resend'de sadece `noreply.esdodesign.com` domain'i doğrulanmış
   - `esdodesign.com` domain'i Resend'de doğrulanmamış olabilir

2. **Resend API İzni**
   - Resend'de bu email adresini kullanma izni yok

3. **Edge Function Hatası**
   - Edge Function deploy edilmemiş olabilir
   - Environment variable eksik olabilir

---

## ✅ Çözüm 1: Eski Domain'i Kullan (Hızlı Çözüm)

Eğer `noreply.esdodesign.com` domain'i Resend'de doğrulanmışsa, eski email adresini kullanın:

### Adım 1: Admin Panel'de Geri Alın

1. Admin Panel → Settings → Email Ayarları
2. **Gönderici Email**: `noreply@noreply.esdodesign.com` olarak değiştirin
3. Kaydedin

### Adım 2: Supabase SMTP Settings'te Geri Alın

1. Supabase Dashboard → Settings → Auth → SMTP Settings
2. **Sender Email**: `noreply@noreply.esdodesign.com` olarak değiştirin
3. Kaydedin

### Adım 3: Test Edin

Email göndermeyi test edin.

---

## ✅ Çözüm 2: Yeni Domain Ekleyin (Kalıcı Çözüm)

Eğer `noreply@esdodesign.com` kullanmak istiyorsanız:

### Adım 1: Resend'de Yeni Domain Ekleyin

1. [Resend Dashboard](https://resend.com/dashboard) → **Domains** sekmesine gidin
2. **Add Domain** butonuna tıklayın
3. `esdodesign.com` yazın (sadece domain, subdomain değil)
4. **Add Domain** butonuna tıklayın

### Adım 2: DNS Kayıtlarını Cloudflare'e Ekleyin

Resend size DNS kayıtlarını gösterecek:

1. **SPF Kaydı** (TXT)
   ```
   Type: TXT
   Name: @
   Content: v=spf1 include:resend.com ~all
   TTL: Auto
   ```

2. **DKIM Kaydı** (TXT)
   - Resend'den alacağınız DKIM kaydını ekleyin
   - Genellikle: `resend._domainkey` veya benzeri

3. **DMARC Kaydı** (TXT)
   ```
   Type: TXT
   Name: _dmarc
   Content: v=DMARC1; p=none; rua=mailto:dmarc@esdodesign.com
   TTL: Auto
   ```

### Adım 3: Domain'i Doğrulayın

1. Resend Dashboard'da **"Verify Domain"** butonuna tıklayın
2. Tüm kayıtların ✅ yeşil tik olduğundan emin olun
3. DNS propagation 24-48 saat sürebilir

### Adım 4: Email Adresini Güncelleyin

Domain doğrulandıktan sonra:

1. Admin Panel → Settings → Email Ayarları
2. **Gönderici Email**: `noreply@esdodesign.com` olarak ayarlayın
3. Supabase SMTP Settings → **Sender Email**: `noreply@esdodesign.com`
4. Kaydedin

---

## 🔍 Hata Kontrolü

### 1. Browser Console'u Kontrol Edin

1. Tarayıcıda F12 tuşuna basın
2. **Console** sekmesine gidin
3. Email göndermeyi deneyin
4. Hata mesajlarını kontrol edin

### 2. Resend Dashboard'u Kontrol Edin

1. [Resend Dashboard](https://resend.com/dashboard) → **Emails** sekmesine gidin
2. Son gönderilen email'leri kontrol edin
3. Hata mesajlarını kontrol edin

### 3. Supabase Edge Function Loglarını Kontrol Edin

1. Supabase Dashboard → **Edge Functions** → `send-email`
2. **Logs** sekmesine gidin
3. Hata mesajlarını kontrol edin

---

## 📋 Kontrol Listesi

- [ ] Resend'de hangi domain'ler doğrulanmış? (`noreply.esdodesign.com` mı, `esdodesign.com` mı?)
- [ ] Admin Panel'de gönderici email doğru mu?
- [ ] Supabase SMTP Settings'te gönderici email doğru mu?
- [ ] Edge Function deploy edilmiş mi?
- [ ] `RESEND_API_KEY` environment variable ayarlı mı?
- [ ] Browser console'da hata var mı?
- [ ] Resend Dashboard'da hata var mı?

---

## 🎯 Hızlı Test

### Test 1: Admin Panel'den Test Email Gönderin

1. Admin Panel → Settings → Email Ayarları
2. **"Test Email Gönder"** butonuna tıklayın
3. Email'inizin geldiğini kontrol edin

### Test 2: Şifre Sıfırlama Email'i

1. Login sayfasında **"Şifremi Unuttum"** linkine tıklayın
2. Email adresinizi girin
3. Email'inizin geldiğini kontrol edin

---

## 🆘 Hala Çalışmıyorsa

### 1. Resend API Key Kontrolü

```bash
# Supabase CLI ile secret'ı kontrol edin
npx supabase secrets list
```

### 2. Edge Function'ı Yeniden Deploy Edin

```bash
# Edge Function'ı deploy edin
npx supabase functions deploy send-email
```

### 3. Resend Support ile İletişime Geçin

1. [Resend Support](https://resend.com/support)
2. Domain doğrulama sorununu bildirin
3. Hata mesajlarını paylaşın

---

## 📝 Notlar

- **Domain Doğrulama**: Resend'de domain doğrulanmış olmalı
- **Email Format**: `noreply@domain.com` formatında olmalı
- **Subdomain**: `noreply.esdodesign.com` subdomain'i doğrulanmışsa, `noreply@noreply.esdodesign.com` kullanabilirsiniz
- **Ana Domain**: `esdodesign.com` ana domain'i doğrulanmışsa, `noreply@esdodesign.com` kullanabilirsiniz

---

## 🎉 Başarı Kriterleri

- ✅ Email gönderiliyor
- ✅ Email'in gönderen adresi doğru
- ✅ Email spam'a düşmüyor
- ✅ Resend Dashboard'da email görünüyor
