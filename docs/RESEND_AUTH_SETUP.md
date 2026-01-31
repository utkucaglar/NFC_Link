# Resend ile Auth Email'leri Kurulum Rehberi

Bu rehber, Supabase auth email'lerini (kayıt olma ve şifre sıfırlama) Resend ile göndermek için gerekli adımları içerir.

## ⚠️ Önemli Not

Supabase'in confirmation token'larını frontend'den direkt alamayız. Bu yüzden iki yaklaşım var:

1. **Email Confirmation Disable** (Şu anki yaklaşım)
   - Kullanıcılar otomatik confirm edilir
   - Resend ile hoş geldiniz emaili gönderilir
   - Şifre sıfırlama için Supabase'in kendi email sistemini kullanır

2. **Supabase Email Hook Kullan** (Önerilen - Production için)
   - Supabase Dashboard'da email hook ayarlanır
   - Auth event'lerinde Resend ile email gönderilir
   - Tüm email'ler Resend üzerinden gider

---

## 📋 Mevcut Durum

✅ **Yapılanlar:**
- Resend email servisi kuruldu
- Email şablonları hazır (`EMAIL_CONFIRMATION`, `PASSWORD_RESET`)
- `signUp` sonrası hoş geldiniz emaili gönderiliyor
- Email confirmation disabled - kullanıcılar otomatik confirm ediliyor

⚠️ **Eksikler:**
- Şifre sıfırlama email'i hala Supabase üzerinden gidiyor
- Email confirmation email'i gönderilmiyor (disabled)

---

## 🎯 Production İçin Önerilen Yaklaşım

### Seçenek 1: Custom SMTP (Önerilen - En Kolay) ⭐

Supabase'i Resend SMTP kullanacak şekilde ayarlayın. Bu sayede tüm auth email'leri otomatik olarak Resend üzerinden gider.

**Detaylı rehber için:** `RESEND_SMTP_SETUP.md` dosyasına bakın.

#### Hızlı Kurulum:

1. **Supabase Dashboard → Settings → Auth → SMTP Settings**
2. **"Enable Custom SMTP"** seçeneğini açın
3. SMTP bilgilerini doldurun:
   ```
   Host: smtp.resend.com
   Port: 465
   Username: resend
   Password: [Resend API Key'iniz]
   Sender Email: noreply@noreply.esdodesign.com
   ```
4. Kaydedin

Bu ayarlardan sonra tüm auth email'leri Resend üzerinden otomatik gönderilir!

---

### Seçenek 2: Supabase Email Hook (Alternatif)

Supabase Dashboard'da "Send Email Hook" ayarlayarak tüm auth email'lerini Resend'e yönlendirin.

#### Adımlar:

1. **Supabase Dashboard → Settings → Auth → Auth Hooks**
2. **"Send Email Hook"** bölümüne gidin
3. Hook type: **HTTP(S)** seçin
4. Hook URL: Edge Function URL'inizi girin
5. Secret oluşturun ve kaydedin

#### Supabase Edge Function ile:

1. `supabase/functions/auth-email` function'ını deploy edin:
   ```bash
   supabase functions deploy auth-email
   ```

2. Hook URL'ini Supabase Dashboard'a ekleyin

---

### Seçenek 2: Database Trigger (Alternatif)

Supabase Database'de trigger kullanarak auth event'lerini yakalayın.

**Not:** `auth.users` tablosuna direkt trigger ekleyemeyiz. Alternatif yaklaşım gerekli.

---

## 🔧 Şu Anki Çalışan Sistem

### Kayıt Olma (Sign Up)

1. Kullanıcı kayıt olur
2. Supabase'de email confirmation disabled olduğu için otomatik confirm edilir
3. Resend ile hoş geldiniz emaili gönderilir ✅

### Şifre Sıfırlama

1. Kullanıcı şifre sıfırlama talebinde bulunur
2. Supabase'in `resetPasswordForEmail` fonksiyonu kullanılır
3. **Şu an:** Supabase'in kendi email sistemi ile gönderiliyor ⚠️
4. **İdeal:** Resend ile gönderilmeli (Supabase email hook gerekli)

---

## 📝 Supabase Ayarları

### Email Confirmation'ı Disable Etme

1. **Supabase Dashboard → Settings → Auth**
2. **Email Auth** sekmesine gidin
3. **"Enable email confirmations"** seçeneğini **KAPALI** yapın
4. Kaydedin

Bu ayar ile:
- Kullanıcılar otomatik confirm edilir
- Email confirmation emaili gönderilmez
- Resend ile hoş geldiniz emaili gönderebiliriz

---

## 🚀 İyileştirme Önerileri

### 1. Supabase Edge Function Deploy

```bash
# Supabase CLI ile
supabase functions deploy auth-email

# Service Role Key'i secret olarak ekle
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SITE_URL=https://esdodesign.com
```

### 2. Supabase Email Hook Ayarlama

Supabase Dashboard'da (eğer destekleniyorsa):
- Settings → Auth → Hooks
- Email hook ekleyin
- `auth-email` Edge Function'ını çağırın

---

## ✅ Test

1. **Kayıt Olma:**
   - Yeni kullanıcı kaydı oluşturun
   - Resend ile hoş geldiniz emaili gelmeli ✅

2. **Şifre Sıfırlama:**
   - Şifre sıfırlama talebinde bulunun
   - Şu an Supabase email'i geliyor ⚠️
   - Production'da Resend ile gelmeli

---

## 📚 Kaynaklar

- [Supabase Auth Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend API Documentation](https://resend.com/docs)

---

## 🎉 Özet

**Şu an çalışan:**
- ✅ Kayıt olma sonrası Resend ile hoş geldiniz emaili
- ✅ Email confirmation disabled - otomatik confirm

**Yapılması gereken (Production için):**
- ⚠️ Şifre sıfırlama email'ini Resend ile göndermek için Supabase email hook ayarlanmalı
- ⚠️ Veya Supabase Edge Function deploy edilmeli
