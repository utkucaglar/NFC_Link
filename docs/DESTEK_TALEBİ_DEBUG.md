# Destek Talebi Admin Email Sorunu - Debug Rehberi

Admin'e email gelmiyor sorununu çözmek için adım adım kontrol listesi.

---

## 🔍 Kontrol Listesi

### 1. Browser Console Kontrolü

1. Tarayıcıda **F12** tuşuna basın
2. **Console** sekmesine gidin
3. Destek talebi oluşturun
4. Console'da şu logları arayın:
   - `🔔 Admin bildirimi başlatılıyor...`
   - `📧 Bulunan admin sayısı: X`
   - `📧 Admin email'leri: [...]`
   - `📨 Admin'lere email gönderiliyor...`
   - `✅ Admin bildirimleri tamamlandı: X başarılı, Y başarısız`

**Eğer loglar görünmüyorsa:** Email gönderme fonksiyonu çağrılmıyor demektir.

---

### 2. Admin Kullanıcı Kontrolü

Supabase SQL Editor'da şu sorguyu çalıştırın:

```sql
SELECT id, email, first_name, last_name, role 
FROM user_profiles 
WHERE role = 'admin';
```

**Sonuç:**
- ✅ Admin kullanıcı varsa → Email listesini not edin
- ❌ Admin kullanıcı yoksa → Admin oluşturun:

```sql
-- Örnek: Mevcut bir kullanıcıyı admin yap
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

---

### 3. RLS (Row Level Security) Kontrolü

Normal kullanıcılar admin email'lerini göremeyebilir. Kontrol edin:

**Supabase SQL Editor'da:**

```sql
-- user_profiles tablosunun RLS politikalarını kontrol et
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles';
```

**Eğer RLS engelliyorsa:** Edge Function kullanmalıyız veya RLS politikasını güncellemeliyiz.

---

### 4. Email Ayarları Kontrolü

Admin Panel → Settings → Email Ayarları:
- ✅ Email servisi aktif mi? (`is_enabled: true`)
- ✅ API key doğru mu?
- ✅ From email doğru mu? (`noreply@noreply.esdodesign.com`)

---

### 5. Edge Function Kontrolü

Email gönderme Edge Function'ı çalışıyor mu?

**Supabase Dashboard → Edge Functions → `send-email`**
- ✅ Function deploy edilmiş mi?
- ✅ Logs'da hata var mı?
- ✅ `RESEND_API_KEY` secret ayarlı mı?

---

## 🛠️ Çözümler

### Çözüm 1: RLS Politikasını Güncelle (Hızlı)

Normal kullanıcılar admin email'lerini görebilsin (sadece email, başka bilgi değil):

```sql
-- user_profiles tablosunda email ve role alanlarını herkes görebilsin
CREATE POLICY IF NOT EXISTS "Anyone can view email and role for notifications"
  ON user_profiles FOR SELECT
  USING (true);
```

**Not:** Bu güvenlik açığı yaratabilir. Daha iyi çözüm: Edge Function kullanmak.

---

### Çözüm 2: Edge Function Kullan (Önerilen)

Admin email'lerini Edge Function'dan al:

1. **Yeni Edge Function oluştur:** `get-admin-emails`
2. **Function içinde admin email'lerini al** (RLS bypass)
3. **Frontend'den Edge Function'ı çağır**

---

### Çözüm 3: Database Trigger Kullan (En İyi)

Database trigger ile otomatik email gönder:

1. **Trigger oluştur:** `support_tickets` tablosuna INSERT olduğunda
2. **Trigger içinde:** Admin email'lerini al ve email gönder
3. **Edge Function çağır** veya direkt Resend API kullan

---

## 🧪 Test Adımları

### Test 1: Console Logları

1. Destek talebi oluşturun
2. Console'u açın
3. Logları kontrol edin:
   - Admin bulundu mu?
   - Email gönderildi mi?
   - Hata var mı?

### Test 2: Admin Email Kontrolü

```sql
-- Admin kullanıcı var mı?
SELECT COUNT(*) FROM user_profiles WHERE role = 'admin';
```

### Test 3: Email Ayarları

Admin Panel → Settings → Email Ayarları → **Test Email Gönder**

Email geliyorsa → Email sistemi çalışıyor
Email gelmiyorsa → Email ayarlarını kontrol edin

---

## 📋 Debug Checklist

- [ ] Browser console'da loglar görünüyor mu?
- [ ] Admin kullanıcı var mı? (`role = 'admin'`)
- [ ] Email ayarları aktif mi?
- [ ] Edge Function deploy edilmiş mi?
- [ ] RLS politikaları engelliyor mu?
- [ ] Resend Dashboard'da email görünüyor mu?

---

## 🆘 Hala Çalışmıyorsa

1. **Console loglarını paylaşın** (F12 → Console)
2. **Supabase Logs'u kontrol edin** (Dashboard → Logs)
3. **Resend Dashboard'u kontrol edin** (Emails sekmesi)
4. **Edge Function logs'unu kontrol edin** (Supabase → Edge Functions → Logs)

---

## 💡 Hızlı Test

Console'da manuel test:

```javascript
// Browser console'da çalıştırın
import { sendNewTicketNotificationToAdmins } from '@/lib/email';

sendNewTicketNotificationToAdmins(
  'TKT-202401-0001',
  'Test Konu',
  'general',
  'Test Müşteri',
  'test@example.com',
  'Test mesajı'
).then(result => console.log('Sonuç:', result));
```
