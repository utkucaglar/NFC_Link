# Resend API Email Gönderme Hatası Çözümü

Edge Function çalışıyor ama Resend API'ye email gönderilemiyor. Olası nedenler ve çözümleri.

---

## 🔍 Sorun: "Email gönderilemedi"

Console'da görünen hata:
```
Admin bildirisi başarısız: {
  error: "Email gönderilemedi",
  success: false
}
```

---

## ✅ Kontrol Listesi

### 1. RESEND_API_KEY Kontrolü

VPS'te veya local'de:

```bash
supabase secrets list
```

**Kontrol edin:**
- ✅ `RESEND_API_KEY` var mı?
- ✅ Key doğru mu? (Resend Dashboard'dan kontrol edin)

**Eğer eksikse veya yanlışsa:**

```bash
# Resend Dashboard'dan yeni key alın
# https://resend.com/dashboard → API Keys
supabase secrets set RESEND_API_KEY=re_xxxxx
```

### 2. Resend API Key Formatı

Resend API Key şu formatta olmalı:
- `re_` ile başlamalı
- Örnek: `re_7fy8qLFw_AUuj1AjyFdxF4MPTcS3JqaNE`

**Kontrol:**
```bash
# Secret'ı kontrol edin (sadece uzunluğu gösterir)
supabase secrets list
```

### 3. Edge Function Loglarını Kontrol Edin

Supabase Dashboard'dan:
1. **Edge Functions** → `notify-admin-ticket` → **Logs**
2. Şu logları arayın:
   - `📧 Resend API Key uzunluğu: X` → Key var mı?
   - `📧 Resend API yanıtı:` → Resend'den ne dönüyor?
   - `❌ Resend API hatası:` → Hata detayları

**Veya terminal'de:**
```bash
supabase functions logs notify-admin-ticket
```

### 4. Resend Dashboard Kontrolü

1. [Resend Dashboard](https://resend.com/dashboard) → **Emails** sekmesi
2. Son gönderilen email'leri kontrol edin
3. Hata mesajları var mı?

**Eğer email görünmüyorsa:** Resend API'ye istek gitmiyor demektir.

---

## 🛠️ Yaygın Hatalar ve Çözümleri

### Hata 1: "Invalid API Key"

**Neden:** RESEND_API_KEY yanlış veya eksik

**Çözüm:**
```bash
# Resend Dashboard'dan yeni key alın
# https://resend.com/dashboard → API Keys → Create API Key
supabase secrets set RESEND_API_KEY=re_yeni_key_buraya
```

### Hata 2: "Invalid 'from' field"

**Neden:** `from` email adresi doğrulanmamış domain'den

**Çözüm:**
- Resend Dashboard → **Domains** → Domain doğrulandı mı?
- `noreply@noreply.esdodesign.com` doğrulanmış mı?

**Kontrol:**
```sql
-- Edge Function'da from adresi
from: "Esdodesign <noreply@noreply.esdodesign.com>"
```

### Hata 3: "Rate limit exceeded"

**Neden:** Çok fazla email gönderildi

**Çözüm:**
- Resend Dashboard → **Usage** → Limit kontrolü
- Free tier'da günlük limit var mı?

### Hata 4: "Domain not verified"

**Neden:** Domain doğrulanmamış

**Çözüm:**
1. Resend Dashboard → **Domains**
2. `noreply.esdodesign.com` domain'i doğrulandı mı?
3. DNS kayıtları doğru mu? (SPF, DKIM, DMARC)

---

## 🔍 Debug Adımları

### Adım 1: Edge Function Loglarını Kontrol

```bash
supabase functions logs notify-admin-ticket
```

**Ne arayalım:**
- `📧 Resend API Key uzunluğu: X` → 0 ise key yok
- `📧 Resend API yanıtı:` → Hata mesajı var mı?
- `❌ Resend API hatası:` → Detaylı hata

### Adım 2: Resend API'yi Manuel Test Edin

```bash
# Terminal'de test edin
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer re_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Esdodesign <noreply@noreply.esdodesign.com>",
    "to": ["your-email@example.com"],
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

**Yanıt:**
- ✅ `{"id": "..."}` → API çalışıyor
- ❌ `{"message": "..."}` → Hata var, mesajı kontrol edin

### Adım 3: Resend Dashboard Kontrolü

1. **API Keys** → Key aktif mi?
2. **Domains** → Domain doğrulandı mı?
3. **Emails** → Son email'ler, hata var mı?

---

## 📋 Hızlı Kontrol Listesi

- [ ] `RESEND_API_KEY` secret ayarlı mı? (`supabase secrets list`)
- [ ] Key doğru mu? (Resend Dashboard'dan kontrol)
- [ ] Domain doğrulandı mı? (`noreply.esdodesign.com`)
- [ ] Edge Function loglarında hata var mı?
- [ ] Resend Dashboard'da email görünüyor mu?
- [ ] Resend API manuel test edildi mi?

---

## 🎯 Sonraki Adımlar

1. **Edge Function loglarını kontrol edin** (en önemli)
2. **Resend Dashboard'u kontrol edin**
3. **RESEND_API_KEY'i yeniden ayarlayın** (gerekirse)
4. **Domain doğrulamasını kontrol edin**

Logları paylaşın, birlikte çözelim!
