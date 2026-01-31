# ⚡ Hızlı Deployment Özeti

## 🎯 5 Dakikada Deployment

### 1. VPS'e Bağlan
```bash
ssh root@YOUR_VPS_IP
```

### 2. Temel Kurulumlar
```bash
# Sistem güncelle
sudo apt update && sudo apt upgrade -y

# Node.js kur (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx kur
sudo apt install -y nginx git
sudo systemctl enable nginx
```

### 3. Projeyi Yükle
```bash
# Dizin oluştur
sudo mkdir -p /var/www/nfclink
sudo chown -R $USER:$USER /var/www/nfclink
cd /var/www/nfclink

# Projeyi klonla veya yükle
git clone YOUR_REPO_URL .
# VEYA dosyaları SFTP ile yükle

# Bağımlılıkları yükle
npm install
```

### 4. Environment Variables
```bash
nano .env.production
```

İçeriği:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
cp .env.production .env
```

### 5. Build
```bash
npm run build
```

### 6. Nginx Ayarları
```bash
sudo nano /etc/nginx/sites-available/nfclink
```

`nginx.conf.example` dosyasındaki içeriği kopyalayın ve `yourdomain.com` kısmını değiştirin.

```bash
sudo ln -s /etc/nginx/sites-available/nfclink /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 8. Supabase Ayarları
Supabase Dashboard → Settings → Authentication → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/**`

## ✅ Tamamlandı!

Site artık `https://yourdomain.com` adresinde!

---

## 🔄 Güncelleme

```bash
cd /var/www/nfclink
git pull
npm install
npm run build
sudo systemctl reload nginx
```

---

## 📚 Detaylı Rehber

Tüm detaylar için `DEPLOYMENT.md` dosyasına bakın.
