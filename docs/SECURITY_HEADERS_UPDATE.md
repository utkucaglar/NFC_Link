# Güvenlik Başlıkları Güncelleme Rehberi

Bu rehber, ZAP güvenlik taramasında tespit edilen güvenlik açıklarını düzeltmek için VPS'te yapılması gereken değişiklikleri açıklar.

---

## 🔐 Tespit Edilen Güvenlik Sorunları ve Çözümleri

| Sorun | Risk | Çözüm |
|-------|------|-------|
| Content Security Policy (CSP) Header Not Set | Medium | CSP başlığı eklendi |
| Sub Resource Integrity Attribute Missing | Medium | Google Fonts için crossorigin eklendi* |
| X-Frame-Options Setting Malformed | Medium | Doğru format kullanıldı |
| Strict-Transport-Security Header Not Set | Low | HSTS başlığı eklendi |
| X-Content-Type-Options Header Missing | Low | nosniff başlığı eklendi |
| Cache-Control Directives | Informational | Cache başlıkları düzenlendi |

> *Not: Google Fonts dinamik CSS döndürdüğü için SRI (integrity hash) kullanılamaz. Bu, Google'ın bilinen bir sınırlamasıdır ve false-positive olarak değerlendirilebilir.

---

## 🚀 VPS Güncelleme Adımları

### Adım 1: VPS'e Bağlanın

```bash
ssh root@your-vps-ip
```

### Adım 2: Mevcut Nginx Konfigürasyonunu Yedekleyin

```bash
sudo cp /etc/nginx/sites-available/nfclink /etc/nginx/sites-available/nfclink.backup
```

### Adım 3: Nginx Konfigürasyonunu Düzenleyin

```bash
sudo nano /etc/nginx/sites-available/nfclink
```

### Adım 4: Aşağıdaki Güvenlik Başlıklarını Ekleyin

**Server bloğunun içine (gzip ayarlarından sonra) ekleyin:**

```nginx
# ============================================
# GÜVENLİK BAŞLIKLARI (Security Headers)
# ============================================

# Content Security Policy (CSP) - XSS ve injection saldırılarını önler
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com https://*.supabase.co https://*.paytr.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in; connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.resend.com https://*.paytr.com; frame-src 'self' https://*.paytr.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://*.paytr.com;" always;

# Strict-Transport-Security (HSTS) - HTTPS zorunlu kılar (1 yıl)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# X-Frame-Options - Clickjacking koruması
add_header X-Frame-Options "SAMEORIGIN" always;

# X-Content-Type-Options - MIME-sniffing koruması
add_header X-Content-Type-Options "nosniff" always;

# X-XSS-Protection - Legacy XSS koruması
add_header X-XSS-Protection "1; mode=block" always;

# Referrer-Policy - Referrer bilgisi kontrolü
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions-Policy - Tarayıcı özelliklerini kısıtlar
add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
```

### Adım 5: Location Bloklarını Güncelleyin

**ÖNEMLİ:** Nginx'te location blokları parent'tan header'ları miras almaz. Her location bloğuna güvenlik başlıklarını eklemeniz gerekir.

**Ana location bloğu:**

```nginx
location / {
    try_files $uri $uri/ /index.html;
    
    # HTML için cache devre dışı
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    
    # Güvenlik başlıkları
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com https://fonts.gstatic.com https://*.supabase.co https://*.paytr.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in; connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.resend.com https://*.paytr.com; frame-src 'self' https://*.paytr.com; frame-ancestors 'self'; base-uri 'self'; form-action 'self' https://*.paytr.com;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()" always;
}
```

**Static assets location bloğu:**

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|otf|webp|avif)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    access_log off;
    
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
}

location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    access_log off;
    
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
```

**robots.txt location bloğu:**

```nginx
location = /robots.txt {
    access_log off;
    log_not_found off;
    add_header Cache-Control "public, max-age=86400" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

### Adım 6: Nginx Konfigürasyonunu Test Edin

```bash
sudo nginx -t
```

Çıktı şöyle olmalı:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Adım 7: Nginx'i Yeniden Yükleyin

```bash
sudo systemctl reload nginx
```

### Adım 8: Projeyi Güncelleyin (index.html değişiklikleri için)

```bash
cd /var/www/nfclink/NFC_Link
git pull origin erberk
npm install
npm run build
```

---

## ✅ Doğrulama

Güvenlik başlıklarını kontrol etmek için:

### Curl ile Test

```bash
curl -I https://esdodesign.com
```

Aşağıdaki başlıkları görmelisiniz:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`

### Online Araçlar

- [Security Headers](https://securityheaders.com/) - Başlıkları test edin
- [SSL Labs](https://www.ssllabs.com/ssltest/) - SSL yapılandırmasını test edin
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) - CSP politikasını değerlendirin

---

## 📝 Tam Nginx Konfigürasyonu

Referans için güncellenmiş tam konfigürasyon `nginx.conf.example` dosyasında bulunabilir.

---

## ⚠️ Önemli Notlar

1. **HSTS Uyarısı**: HSTS etkinleştirildikten sonra, kullanıcılar sadece HTTPS ile bağlanabilir. SSL sertifikanızın geçerli olduğundan emin olun.

2. **CSP Sorunları**: Eğer site düzgün çalışmıyorsa, tarayıcı console'unda CSP ihlallerini kontrol edin ve politikayı buna göre güncelleyin.

3. **Geri Alma**: Sorun çıkarsa yedekten geri dönebilirsiniz:
   ```bash
   sudo cp /etc/nginx/sites-available/nfclink.backup /etc/nginx/sites-available/nfclink
   sudo systemctl reload nginx
   ```

---

## 📊 Beklenen ZAP Sonuçları

Bu güncellemelerden sonra ZAP taramasında aşağıdaki uyarılar çözülmüş olmalı:

- ✅ Content Security Policy (CSP) Header Not Set
- ✅ Strict-Transport-Security Header Not Set  
- ✅ X-Frame-Options Setting Malformed
- ✅ X-Content-Type-Options Header Missing
- ✅ Cache-Control Directives

**Kalan Bilgilendirme Uyarıları (False Positive veya Düşük Öncelik):**

- ⚠️ Sub Resource Integrity Attribute Missing (Google Fonts - SRI desteklemez)
- ⚠️ Bilginin Açığa Çıkması - Şüpheli Yorumlar (Minified JS'de normal)
- ⚠️ Modern Web Application (Bilgi amaçlı)
- ⚠️ Retrieved from Cache (Bilgi amaçlı)
