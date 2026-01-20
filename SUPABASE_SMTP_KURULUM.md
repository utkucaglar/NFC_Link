# Supabase SMTP Kurulum Rehberi - Resend Entegrasyonu

Bu rehber, Supabase auth email'lerini Resend SMTP üzerinden göndermek için gerekli adımları içerir.

---

## 📋 Adım 1: Resend API Key'inizi Bulun

1. [Resend Dashboard](https://resend.com/dashboard)'a giriş yapın
2. Sol menüden **API Keys** sekmesine gidin
3. Mevcut API Key'inizi kopyalayın (veya yeni bir key oluşturun)
   - ⚠️ **ÖNEMLİ**: API Key'i bir yere kaydedin, tekrar gösterilmez!

---

## 📋 Adım 2: Supabase Dashboard'a Giriş Yapın

1. [Supabase Dashboard](https://supabase.com/dashboard)'a gidin
2. Projenizi seçin

---

## 📋 Adım 3: SMTP Ayarlarını Yapın

1. Sol menüden **Settings** (⚙️) ikonuna tıklayın
2. **Auth** sekmesine gidin
3. Sayfayı aşağı kaydırın ve **SMTP Settings** bölümünü bulun
4. **"Enable Custom SMTP"** toggle'ını **AÇIN** (yeşil olmalı)

5. Aşağıdaki bilgileri doldurun:

   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [Resend API Key'iniz - Adım 1'den kopyaladığınız]
   Sender Name: Esdodesign
   Sender Email: noreply@noreply.esdodesign.com
   ```

6. **"Save"** butonuna tıklayın

---

## 📋 Adım 4: Email Template'lerini Özelleştirin (Opsiyonel)

1. Aynı **Settings → Auth** sayfasında
2. **Email Templates** sekmesine gidin
3. İstediğiniz template'leri özelleştirin:
   - **Confirm signup** (Kayıt doğrulama - şu an disabled)
   - **Reset password** (Şifre sıfırlama) ⭐ **ÖNEMLİ**
   - **Magic Link** (eğer kullanıyorsanız)

### Şifre Sıfırlama Template Örneği:

```
Konu: Şifre Sıfırlama - Esdodesign

Merhaba,

Hesabınız için şifre sıfırlama talebinde bulundunuz.

Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
{{ .ConfirmationURL }}

Bu linkin geçerlilik süresi 1 saattir.

Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.

Saygılarımızla,
Esdodesign Ekibi
```

**Kullanılabilir Değişkenler:**
- `{{ .ConfirmationURL }}` - Doğrulama/Reset linki
- `{{ .Token }}` - Token
- `{{ .Email }}` - Kullanıcı email'i
- `{{ .SiteURL }}` - Site URL'i

---

## 📋 Adım 5: Test Edin

### Test 1: Şifre Sıfırlama

1. Sitenizde **"Şifremi Unuttum"** linkine tıklayın
2. Email adresinizi girin
3. Email'inizi kontrol edin
4. Email'in `noreply@noreply.esdodesign.com` adresinden geldiğini doğrulayın
5. Resend Dashboard → **Emails** sekmesinden gönderilen email'i görebilirsiniz

### Test 2: Yeni Kullanıcı Kaydı (Eğer Email Confirmation açıksa)

1. Yeni bir kullanıcı kaydı oluşturun
2. Email'inizi kontrol edin
3. Email'in Resend üzerinden geldiğini doğrulayın

---

## ✅ Sonuç

Bu ayarlardan sonra:
- ✅ Tüm Supabase auth email'leri Resend SMTP üzerinden gider
- ✅ Email'ler `noreply@noreply.esdodesign.com` adresinden gönderilir
- ✅ Resend Dashboard'dan email loglarını görebilirsiniz
- ✅ Email template'lerini Supabase Dashboard'dan özelleştirebilirsiniz
- ✅ Şifre sıfırlama email'leri artık Resend üzerinden gönderilir

---

## 🔄 Mevcut Kod Durumu

SMTP ayarlarından sonra:
- ✅ `AuthContext.tsx`'teki `resetPassword` fonksiyonu artık Resend üzerinden email gönderecek
- ✅ `signUp` fonksiyonu zaten Resend ile hoş geldiniz emaili gönderiyor (Edge Function üzerinden)
- ✅ Email confirmation email'i de Resend üzerinden gidecek (eğer enable ederseniz)

---

## 📝 Notlar

- **Email Confirmation**: Şu an disabled. Enable ederseniz, confirmation email'i de Resend üzerinden gider
- **Şifre Sıfırlama**: Artık Resend SMTP üzerinden otomatik gönderilir
- **Email Template'leri**: Supabase Dashboard'dan özelleştirilebilir
- **Resend API Key**: SMTP için aynı API key kullanılır (API key'iniz)

---

## 🎉 Tamamlandı!

Artık tüm auth email'leri Resend üzerinden gönderiliyor!

---

## 🆘 Sorun Giderme

### Email gönderilmiyor

1. Resend API Key'inin doğru olduğundan emin olun
2. SMTP ayarlarının kaydedildiğini kontrol edin
3. Resend Dashboard → **Emails** sekmesinden hata mesajlarını kontrol edin
4. Supabase Dashboard → **Logs** sekmesinden auth loglarını kontrol edin

### Email spam klasörüne düşüyor

1. Resend Dashboard'da domain doğrulamasını kontrol edin
2. DKIM ve SPF kayıtlarının doğru olduğundan emin olun
3. Cloudflare DNS ayarlarını kontrol edin

---

## 📚 İlgili Dosyalar

- `RESEND_SMTP_SETUP.md` - Genel SMTP kurulum rehberi
- `RESEND_AUTH_SETUP.md` - Auth email entegrasyonu rehberi
- `src/lib/email.ts` - Email gönderme fonksiyonları
- `src/contexts/AuthContext.tsx` - Auth context ve fonksiyonlar
