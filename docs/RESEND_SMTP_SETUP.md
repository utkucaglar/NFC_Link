# Resend SMTP ile Supabase Auth Email'leri Kurulumu

Bu rehber, Supabase auth email'lerini (kayıt olma ve şifre sıfırlama) Resend SMTP üzerinden göndermek için gerekli adımları içerir.

## 🎯 Yöntem: Custom SMTP (Önerilen - En Kolay)

Supabase'i Resend SMTP kullanacak şekilde ayarlayın. Bu sayede tüm auth email'leri otomatik olarak Resend üzerinden gider.

---

## 📋 Adım Adım Kurulum

### 1. Resend'de Domain Doğrulama

✅ Zaten yaptınız: `noreply.esdodesign.com` domain'i doğrulandı

### 2. Resend SMTP Bilgilerini Alın

Resend Dashboard'da:
1. **Settings** → **SMTP** sekmesine gidin
2. SMTP bilgilerini görüntüleyin:
   - **Host**: `smtp.resend.com`
   - **Port**: `465` (SSL) veya `587` (TLS)
   - **Username**: `resend`
   - **Password**: Resend API Key'iniz (SMTP için aynı key kullanılır)

### 3. Supabase Dashboard'da SMTP Ayarları

1. **Supabase Dashboard** → Projenizi seçin
2. **Settings** → **Auth** sekmesine gidin
3. **SMTP Settings** bölümünü bulun
4. **"Enable Custom SMTP"** seçeneğini **AÇIN**

5. SMTP bilgilerini doldurun:
   ```
   Host: smtp.resend.com
   Port: 465 (veya 587)
   Username: resend
   Password: [Resend API Key'iniz]
   Sender Name: Esdodesign
   Sender Email: noreply@noreply.esdodesign.com
   ```

6. **"Save"** butonuna tıklayın

### 4. Email Template'lerini Özelleştirin (Opsiyonel)

1. **Settings** → **Auth** → **Email Templates** sekmesine gidin
2. Email template'lerini özelleştirin:
   - **Confirm signup** (Kayıt doğrulama)
   - **Reset password** (Şifre sıfırlama)
   - **Magic Link** (eğer kullanıyorsanız)

3. Template'lerde şu değişkenleri kullanabilirsiniz:
   - `{{ .ConfirmationURL }}` - Doğrulama linki
   - `{{ .Token }}` - Token
   - `{{ .Email }}` - Kullanıcı email'i
   - `{{ .SiteURL }}` - Site URL'i

### 5. Test Edin

1. Yeni bir kullanıcı kaydı oluşturun
2. Email'in Resend üzerinden geldiğini kontrol edin
3. Resend Dashboard → **Emails** sekmesinden gönderilen email'leri görebilirsiniz

---

## ✅ Sonuç

Bu ayarlardan sonra:
- ✅ Tüm Supabase auth email'leri Resend SMTP üzerinden gider
- ✅ Email'ler `noreply@noreply.esdodesign.com` adresinden gönderilir
- ✅ Resend Dashboard'dan email loglarını görebilirsiniz
- ✅ Email template'lerini Supabase Dashboard'dan özelleştirebilirsiniz

---

## 🔄 Mevcut Kod Değişiklikleri

SMTP ayarlarından sonra:
- `AuthContext.tsx`'teki `resetPassword` fonksiyonu artık Resend üzerinden email gönderecek
- `signUp` fonksiyonu zaten Resend ile hoş geldiniz emaili gönderiyor
- Email confirmation email'i de Resend üzerinden gidecek (eğer enable ederseniz)

---

## 📝 Notlar

- **Email Confirmation**: Şu an disabled. Enable ederseniz, confirmation email'i de Resend üzerinden gider
- **Şifre Sıfırlama**: Artık Resend SMTP üzerinden otomatik gönderilir
- **Email Template'leri**: Supabase Dashboard'dan özelleştirilebilir

---

## 🎉 Tamamlandı!

Artık tüm auth email'leri Resend üzerinden gönderiliyor!
