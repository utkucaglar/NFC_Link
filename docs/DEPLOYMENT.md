# 🚀 Production Deployment Rehberi

Bu rehber, NFC Link projenizi VPS ve domain'e deploy etmek için adım adım talimatlar içerir.

## 📋 Ön Gereksinimler

- ✅ VPS sunucusu (Ubuntu 20.04/22.04 önerilir)
- ✅ Domain adı
- ✅ Domain'in VPS IP'sine yönlendirilmesi
- ✅ Supabase projesi hazır
- ✅ SSH erişimi

---

## 1️⃣ VPS Sunucu Kurulumu

### 1.1. Sunucuya Bağlanma

```bash
ssh root@YOUR_VPS_IP
# veya
ssh kullanici_adi@YOUR_VPS_IP
```

### 1.2. Sistem Güncellemesi

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3. Node.js Kurulumu (v20 LTS)

```bash
# NodeSource repository ekle
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.js kur
sudo apt install -y nodejs

# Versiyon kontrolü
node --version  # v20.x.x olmalı
npm --version
```

### 1.4. Nginx Kurulumu

```bash
sudo apt install -y nginx

# Nginx'i başlat ve otomatik başlatmayı etkinleştir
sudo systemctl start nginx
sudo systemctl enable nginx

# Durum kontrolü
sudo systemctl status nginx
```

### 1.5. Git Kurulumu

```bash
sudo apt install -y git
```

### 1.6. PM2 Kurulumu (Opsiyonel - Production process manager)

```bash
sudo npm install -g pm2
```

---

## 2️⃣ Domain DNS Ayarları

Domain sağlayıcınızın panelinden aşağıdaki DNS kayıtlarını ekleyin:

### A Kaydı (Ana Domain)
```
Type: A
Name: @
Value: YOUR_VPS_IP
TTL: 3600 (veya otomatik)
```

### A Kaydı (WWW)
```
Type: A
Name: www
Value: YOUR_VPS_IP
TTL: 3600
```

**Not:** DNS değişikliklerinin yayılması 24-48 saat sürebilir. Kontrol için:
```bash
nslookup yourdomain.com
# veya
dig yourdomain.com
```

---

## 3️⃣ Projeyi Sunucuya Yükleme

### 3.1. Proje Dizini Oluşturma

```bash
# Ana dizin oluştur
sudo mkdir -p /var/www/nfclink
sudo chown -R $USER:$USER /var/www/nfclink
cd /var/www/nfclink
```

### 3.2. Projeyi Git ile Klonlama

```bash
# GitHub'dan klonla (eğer repo varsa)
git clone https://github.com/YOUR_USERNAME/NFC_Link.git .

# VEYA manuel olarak dosyaları yükle (FTP/SFTP ile)
```

### 3.3. Bağımlılıkları Yükleme

```bash
npm install
# veya
yarn install
```

---

## 4️⃣ Environment Variables Ayarlama

### 4.1. Production .env Dosyası Oluşturma

```bash
nano /var/www/nfclink/.env.production
```

Aşağıdaki içeriği ekleyin (Supabase bilgilerinizi girin):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**ÖNEMLİ:** Production URL'lerini kullanın!

### 4.2. .env Dosyasını Kopyalama

```bash
cp .env.production .env
```

---

## 5️⃣ Production Build

```bash
# Build oluştur
npm run build

# Build başarılı olursa dist/ klasörü oluşur
ls -la dist/
```

---

## 6️⃣ Nginx Konfigürasyonu

### 6.1. Nginx Site Konfigürasyonu

```bash
sudo nano /etc/nginx/sites-available/nfclink
```

Aşağıdaki konfigürasyonu ekleyin:

```nginx
server {
    listen 80;
    server_name esdodesign.com www.esdodesign.com;
    
    root /var/www/nfclink/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # React Router için - tüm route'ları index.html'e yönlendir
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Favicon
    location = /favicon.ico {
        access_log off;
        log_not_found off;
    }

    # robots.txt
    location = /robots.txt {
        access_log off;
        log_not_found off;
    }
}
```

### 6.2. Site'ı Aktif Etme

```bash
# Symbolic link oluştur
sudo ln -s /etc/nginx/sites-available/nfclink /etc/nginx/sites-enabled/

# Varsayılan site'ı kaldır (opsiyonel)
sudo rm /etc/nginx/sites-enabled/default

# Nginx konfigürasyonunu test et
sudo nginx -t

# Hata yoksa Nginx'i yeniden yükle
sudo systemctl reload nginx
```

---

## 7️⃣ SSL Sertifikası (Let's Encrypt)

### 7.1. Certbot Kurulumu

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 7.2. SSL Sertifikası Alma

```bash
sudo certbot --nginx -d esdodesign.com -d www.esdodesign.com
```

Certbot size şunları soracak:
- Email adresi (gerekli)
- Terms of Service kabulü (A)
- Email paylaşımı (opsiyonel - N)

Certbot otomatik olarak:
- SSL sertifikasını alacak
- Nginx konfigürasyonunu güncelleyecek
- Otomatik yenileme ayarlayacak

### 7.3. SSL Otomatik Yenileme Testi

```bash
sudo certbot renew --dry-run
```

---

## 8️⃣ Supabase Production Ayarları

### 8.1. Supabase Dashboard'da Ayarlar

1. **Supabase Dashboard** → **Settings** → **API**
   - Production URL'lerini kontrol edin

2. **Settings** → **Authentication** → **URL Configuration**
   - **Site URL**: `https://yourdomain.com`
   - **Redirect URLs**: 
     ```
     https://yourdomain.com/**
     https://yourdomain.com/auth/callback
     https://www.yourdomain.com/**
     https://www.yourdomain.com/auth/callback
     ```

3. **Settings** → **Authentication** → **Email Templates**
   - Email şablonlarını production URL'leri ile güncelleyin

---

## 9️⃣ Firewall Ayarları

```bash
# UFW firewall kurulumu
sudo apt install -y ufw

# HTTP ve HTTPS portlarını aç
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH

# Firewall'u aktif et
sudo ufw enable

# Durum kontrolü
sudo ufw status
```

---

## 🔟 Otomatik Deployment Script (Opsiyonel)

### 10.1. Deploy Script Oluşturma

```bash
nano /var/www/nfclink/deploy.sh
```

İçeriği:

```bash
#!/bin/bash

echo "🚀 Deployment başlıyor..."

# Proje dizinine git
cd /var/www/nfclink

# Git'ten son değişiklikleri çek
git pull origin main

# Bağımlılıkları güncelle
npm install

# Build oluştur
npm run build

# Nginx'i yeniden yükle
sudo systemctl reload nginx

echo "✅ Deployment tamamlandı!"
```

### 10.2. Script'i Çalıştırılabilir Yapma

```bash
chmod +x /var/www/nfclink/deploy.sh
```

### 10.3. Kullanım

```bash
./deploy.sh
```

---

## 1️⃣1️⃣ Monitoring ve Logs

### 11.1. Nginx Logları

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 11.2. Sistem Kaynakları

```bash
# CPU ve Memory kullanımı
htop
# veya
top

# Disk kullanımı
df -h
```

---

## 1️⃣2️⃣ Yedekleme Stratejisi

### 12.1. Manuel Yedekleme Script

```bash
nano /var/www/nfclink/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/nfclink"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Build dosyalarını yedekle
tar -czf $BACKUP_DIR/nfclink_$DATE.tar.gz /var/www/nfclink/dist

# Eski yedekleri temizle (30 günden eski)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "✅ Yedekleme tamamlandı: $BACKUP_DIR/nfclink_$DATE.tar.gz"
```

### 12.2. Cron Job ile Otomatik Yedekleme

```bash
crontab -e
```

Haftalık yedekleme için ekleyin:
```
0 2 * * 0 /var/www/nfclink/backup.sh
```

---

## 1️⃣3️⃣ Troubleshooting

### Problem: Site açılmıyor

```bash
# Nginx durumunu kontrol et
sudo systemctl status nginx

# Nginx loglarını kontrol et
sudo tail -50 /var/log/nginx/error.log

# Port kontrolü
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
```

### Problem: 404 hatası (React Router)

Nginx konfigürasyonunda `try_files` direktifinin olduğundan emin olun:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Problem: SSL sertifikası çalışmıyor

```bash
# Sertifika durumunu kontrol et
sudo certbot certificates

# Manuel yenileme
sudo certbot renew
```

### Problem: Build hatası

```bash
# Node.js versiyonunu kontrol et
node --version

# Cache temizle
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## ✅ Deployment Checklist

- [ ] VPS sunucusu hazır
- [ ] Node.js kuruldu (v20+)
- [ ] Nginx kuruldu ve çalışıyor
- [ ] Domain DNS ayarları yapıldı
- [ ] Proje sunucuya yüklendi
- [ ] Environment variables ayarlandı
- [ ] Production build oluşturuldu
- [ ] Nginx konfigürasyonu yapıldı
- [ ] SSL sertifikası alındı
- [ ] Supabase production ayarları güncellendi
- [ ] Firewall ayarları yapıldı
- [ ] Site test edildi
- [ ] Yedekleme stratejisi kuruldu

---

## 📞 Destek

Sorun yaşarsanız:
1. Nginx error loglarını kontrol edin
2. Browser console'da hataları kontrol edin
3. Supabase dashboard'da API ayarlarını kontrol edin
4. DNS propagation'ı kontrol edin: https://www.whatsmydns.net/

---

## 🎉 Başarılı Deployment!

Site artık `https://yourdomain.com` adresinde yayında!

**Sonraki Adımlar:**
- Google Analytics ekleyin
- SEO ayarlarını yapın
- Performance monitoring kurun
- CDN ekleyin (Cloudflare, vb.)
