# Email Spam Sorunu Çözüm Rehberi

Email'lerin spam'a düşmesinin nedenleri ve çözümleri.

---

## 🔍 Spam'a Düşme Nedenleri

### 1. Domain Doğrulama Eksik/Yanlış (EN ÖNEMLİ) ⚠️
- SPF kaydı eksik/yanlış
- DKIM imzası eksik/yanlış
- DMARC politikası eksik/yanlış

### 2. Gönderen Adresi Sorunu
- `noreply@noreply.esdodesign.com` - Çift subdomain kullanımı spam filtrelerini tetikleyebilir
- Daha iyi: `noreply@esdodesign.com` veya `info@esdodesign.com`

### 3. Email İçeriği
- Spam trigger kelimeler
- Çok fazla link
- Tracking linkler (Resend'de açık olabilir)

### 4. Domain Reputation
- Yeni domain
- Düşük gönderim hacmi
- Yüksek bounce rate

---

## ✅ Çözüm 1: Domain Doğrulama (SPF, DKIM, DMARC)

### Adım 1: Resend Dashboard'da Domain Kontrolü

1. [Resend Dashboard](https://resend.com/dashboard) → **Domains** sekmesine gidin
2. `noreply.esdodesign.com` domain'inizi seçin
3. **DNS Records** bölümünü kontrol edin:
   - ✅ SPF kaydı var mı?
   - ✅ DKIM kaydı var mı?
   - ✅ DMARC kaydı var mı?

### Adım 2: Cloudflare DNS'te Kayıtları Kontrol Edin

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Domain'inizi seçin
2. **DNS** → **Records** sekmesine gidin
3. Resend'den aldığınız DNS kayıtlarını ekleyin:

#### SPF Kaydı (TXT)
```
Type: TXT
Name: @ (veya noreply.esdodesign.com)
Content: v=spf1 include:resend.com ~all
TTL: Auto
```

#### DKIM Kaydı (TXT)
Resend Dashboard'dan alacağınız DKIM kaydı (genellikle şöyle görünür):
```
Type: TXT
Name: resend._domainkey (veya Resend'in verdiği name)
Content: [Resend'den alacağınız uzun string]
TTL: Auto
```

#### DMARC Kaydı (TXT)
```
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@esdodesign.com
TTL: Auto
```

**Not:** `p=quarantine` yerine `p=none` ile başlayabilirsiniz (test için), sonra `p=quarantine` veya `p=reject` yapabilirsiniz.

### Adım 3: DNS Kayıtlarını Doğrulayın

1. Resend Dashboard'da **"Verify Domain"** butonuna tıklayın
2. Tüm kayıtların ✅ yeşil tik olduğundan emin olun
3. DNS propagation 24-48 saat sürebilir, bekleyin

---

## ✅ Çözüm 2: Gönderen Adresini Düzeltin

### Mevcut: `noreply@noreply.esdodesign.com` ❌
### Önerilen: `noreply@esdodesign.com` ✅

### Adım 1: Resend'de Yeni Domain Ekleyin (Opsiyonel)

Eğer `esdodesign.com` domain'ini kullanmak istiyorsanız:

1. Resend Dashboard → **Domains** → **Add Domain**
2. `esdodesign.com` ekleyin
3. DNS kayıtlarını Cloudflare'e ekleyin
4. Domain'i doğrulayın

### Adım 2: Gönderen Adresini Güncelleyin

1. **Resend Dashboard** → Settings → From Email**
   - `noreply@esdodesign.com` olarak güncelleyin

2. **Supabase Dashboard** → Settings → Auth → SMTP Settings
   - **Sender Email**: `noreply@esdodesign.com` olarak güncelleyin

3. **Proje Kodunda** (`src/lib/email.ts` veya admin panel)
   - `from_email` değerini `noreply@esdodesign.com` olarak güncelleyin

---

## ✅ Çözüm 3: Resend Ayarlarını Optimize Edin

### Adım 1: Link Tracking'i Kapatın

1. Resend Dashboard → **Settings** → **Tracking**
2. **Link Tracking** → **OFF** yapın
3. **Open Tracking** → **OFF** yapın (opsiyonel)

**Neden?** Tracking linkler spam filtrelerini tetikleyebilir, özellikle auth email'lerinde.

### Adım 2: Email Template'lerini Optimize Edin

Spam trigger kelimelerden kaçının:
- ❌ "FREE", "WIN", "URGENT", "CLICK NOW"
- ❌ Çok fazla büyük harf
- ❌ Çok fazla ünlem işareti (!!!)
- ❌ Çok fazla link

✅ İyi örnek:
```
Subject: Şifre Sıfırlama - Esdodesign
İçerik: Profesyonel, sade, az link
```

---

## ✅ Çözüm 4: Email İçeriğini İyileştirin

### Mevcut Template Kontrolü

`src/lib/email.ts` dosyasındaki template'leri kontrol edin:

1. **Spam trigger kelimeler var mı?**
2. **Çok fazla link var mı?**
3. **HTML yapısı geçerli mi?**

### Öneriler

- ✅ Plain text alternatifi ekleyin
- ✅ HTML'i geçerli yapın (W3C validator)
- ✅ Inline CSS kullanın (zaten kullanıyorsunuz ✅)
- ✅ Responsive tasarım (zaten var ✅)
- ✅ Unsubscribe linki ekleyin (opsiyonel, ama iyi practice)

---

## ✅ Çözüm 5: Domain Reputation'ı İyileştirin

### Adım 1: Warm-up Yapın

Yeni domain için:
1. İlk hafta: Günde 10-20 email
2. İkinci hafta: Günde 50-100 email
3. Üçüncü hafta: Günde 200-500 email
4. Sonra: Normal hacim

### Adım 2: Bounce Rate'i Düşürün

- ✅ Geçerli email adreslerine gönderin
- ✅ Bounce'ları takip edin (Resend Dashboard)
- ✅ Bounce rate %5'in altında tutun

### Adım 3: Engagement'i Artırın

- ✅ Kullanıcılar email'leri açsın
- ✅ Link'lere tıklasın
- ✅ Spam'a işaretlemesin

---

## 🔍 Test ve Kontrol

### 1. Email Test Araçları

- **Mail-Tester**: https://www.mail-tester.com/
  - Email gönderin, spam skorunu öğrenin (10/10 hedef)
  
- **MXToolbox**: https://mxtoolbox.com/
  - SPF, DKIM, DMARC kontrolü

- **Google Postmaster Tools**: https://postmaster.google.com/
  - Gmail deliverability raporları

### 2. Resend Dashboard Kontrolü

1. **Emails** sekmesi → Email durumlarını kontrol edin
2. **Bounces** → Bounce rate'i kontrol edin
3. **Complaints** → Spam şikayetlerini kontrol edin

---

## 📋 Hızlı Kontrol Listesi

- [ ] SPF kaydı Cloudflare'de var mı?
- [ ] DKIM kaydı Cloudflare'de var mı?
- [ ] DMARC kaydı Cloudflare'de var mı?
- [ ] Resend'de domain doğrulandı mı? (✅ yeşil tik)
- [ ] Gönderen adresi `noreply@esdodesign.com` mi? (veya doğru domain)
- [ ] Resend'de link tracking kapalı mı?
- [ ] Email template'lerinde spam trigger kelimeler yok mu?
- [ ] HTML geçerli mi? (W3C validator)
- [ ] Bounce rate %5'in altında mı?

---

## 🎯 Öncelik Sırası

1. **EN ÖNEMLİ**: SPF, DKIM, DMARC kayıtlarını ekleyin ve doğrulayın
2. Gönderen adresini `noreply@esdodesign.com` yapın (çift subdomain yerine)
3. Resend'de link tracking'i kapatın
4. Email template'lerini optimize edin
5. Domain warm-up yapın (yeni domain ise)

---

## 🆘 Hala Spam'a Düşüyorsa

1. **Mail-Tester** ile test edin, skorunu öğrenin
2. **Google Postmaster Tools**'a domain'inizi ekleyin
3. **Resend Support** ile iletişime geçin
4. Email içeriğini daha da sadeleştirin
5. Gönderim hacmini azaltın, warm-up yapın

---

## 📚 İlgili Dosyalar

- `src/lib/email.ts` - Email template'leri
- `RESEND_SMTP_SETUP.md` - Resend SMTP kurulumu
- `SUPABASE_SMTP_KURULUM.md` - Supabase SMTP kurulumu

---

## 🎉 Başarı Kriterleri

- ✅ Mail-Tester skoru: 8-10/10
- ✅ Bounce rate: %5'in altında
- ✅ Complaint rate: %0.1'in altında
- ✅ Inbox placement: %95'in üzerinde
