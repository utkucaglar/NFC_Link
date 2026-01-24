# VPS Güncelleme Rehberi

GitHub'a push yaptıktan sonra VPS'te projeyi güncellemek için iki yöntem var:

---

## 🚀 Yöntem 1: Otomatik Deployment (GitHub Actions) ⭐ ÖNERİLEN

GitHub'a push yaptığınızda otomatik olarak VPS'e deploy edilir.

### Nasıl Çalışır?

1. **GitHub'a push yapın:**
   ```bash
   git add .
   git commit -m "Güncelleme mesajı"
   git push origin erberk
   ```

2. **GitHub Actions otomatik çalışır:**
   - `erberk` branch'ine push yapıldığında tetiklenir
   - VPS'e SSH ile bağlanır
   - `git pull` yapar
   - `npm install` çalıştırır
   - `npm run build` ile build oluşturur
   - Nginx'i reload eder

### GitHub Actions Durumunu Kontrol Etme

1. GitHub repository'nize gidin
2. **Actions** sekmesine tıklayın
3. En son deployment'ı kontrol edin:
   - ✅ Yeşil tik = Başarılı
   - ❌ Kırmızı X = Hata var (logları kontrol edin)

### GitHub Actions Çalışmıyorsa

**Kontrol Listesi:**
- ✅ GitHub Secrets doğru mu? (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`)
- ✅ SSH key VPS'te doğru mu? (`~/.ssh/authorized_keys`)
- ✅ Branch adı doğru mu? (`erberk`)
- ✅ VPS'te proje yolu doğru mu? (`/var/www/nfclink/NFC_Link`)

---

## 🔧 Yöntem 2: Manuel Deployment (SSH ile)

GitHub Actions çalışmıyorsa veya manuel kontrol etmek istiyorsanız:

### Adım 1: VPS'e SSH ile Bağlanın

```bash
ssh root@your-vps-ip
# veya
ssh your-username@your-vps-ip
```

### Adım 2: Proje Dizinine Gidin

```bash
cd /var/www/nfclink/NFC_Link
```

### Adım 3: Git Pull Yapın

```bash
git pull origin erberk
```

### Adım 4: Bağımlılıkları Güncelleyin

```bash
npm install
```

### Adım 5: Build Oluşturun

```bash
npm run build
```

### Adım 6: Nginx'i Yeniden Yükleyin

```bash
sudo systemctl reload nginx
```

### Adım 7: Kontrol Edin

```bash
# Nginx durumunu kontrol et
sudo systemctl status nginx

# Son commit'i kontrol et
git log -1
```

---

## 🎯 Hızlı Deployment Script (Manuel)

VPS'te hazır bir script kullanabilirsiniz:

### Script'i Çalıştırma

```bash
cd /var/www/nfclink/NFC_Link
./deploy-vps.sh
```

**Not:** Eğer script yoksa, aşağıdaki komutları tek tek çalıştırın.
---

## 📋 Deployment Checklist

Her deployment'tan önce kontrol edin:

- [ ] GitHub'a push yapıldı mı?
- [ ] GitHub Actions başarılı mı? (Actions sekmesinden kontrol)
- [ ] Environment variables güncel mi? (`.env` dosyası)
- [ ] Build başarılı mı? (`npm run build` hatasız mı?)
- [ ] Nginx çalışıyor mu? (`sudo systemctl status nginx`)
- [ ] Site açılıyor mu? (Tarayıcıdan test edin)

---

## 🔍 Sorun Giderme

### Problem: GitHub Actions başarısız

**Çözüm 1: GitHub Secrets Kontrolü**
1. GitHub → Settings → Secrets and variables → Actions
2. Şu secret'ların olduğundan emin olun:
   - `VPS_HOST` (örn: `123.456.789.0`)
   - `VPS_USER` (örn: `root`)
   - `VPS_SSH_KEY` (SSH private key - tamamı)

**Çözüm 2: SSH Bağlantısını Test Edin**
```bash
# VPS'te SSH key'in doğru olduğundan emin olun
cat ~/.ssh/authorized_keys
```

**Çözüm 3: Manuel Deployment Yapın**
Yukarıdaki "Yöntem 2: Manuel Deployment" adımlarını takip edin.

---

### Problem: `git pull` hata veriyor

**Hata: "divergent branches" veya "Need to specify how to reconcile divergent branches"**

Bu hata, VPS'teki ve GitHub'daki branch'lerin farklı commit'lere sahip olduğu anlamına gelir.

**Çözüm 1: Merge ile birleştir (ÖNERİLEN)**

```bash
# Git'e merge yapmasını söyle
git config pull.rebase false

# Tekrar pull yap
git pull origin erberk

# Eğer merge conflict varsa çöz, sonra:
git add .
git commit -m "Merge remote changes"
```

**Çözüm 2: Rebase ile birleştir (Temiz geçmiş için)**

```bash
# Git'e rebase yapmasını söyle
git config pull.rebase true

# Tekrar pull yap
git pull origin erberk
```

**Çözüm 3: Remote'u zorla kullan (VPS'teki değişiklikleri kaybetmek istiyorsanız)**

```bash
# ⚠️ DİKKAT: VPS'teki yerel değişiklikler kaybolur!
git fetch origin
git reset --hard origin/erberk
```

---

**Hata: "Your local changes would be overwritten"**

```bash
# Değişiklikleri stash'le
git stash

# Pull yap
git pull origin erberk

# Stash'i geri getir (gerekirse)
git stash pop
```

---

**Hata: "Permission denied" veya "Authentication failed"**

```bash
# Git config kontrol et
git config --list

# User ayarla
git config user.name "Your Name"
git config user.email "your@email.com"

# SSH key kullanıyorsanız, HTTPS yerine SSH URL kullanın:
git remote set-url origin git@github.com:utkucaglar/NFC_Link.git
```

---

### Problem: `npm run build` hata veriyor

**Hata: "Module not found"**

```bash
# node_modules'ı temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Hata: "Environment variables missing"**

```bash
# .env dosyasını kontrol et
cat .env

# Eksikse oluştur
nano .env
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

---

### Problem: Site açılmıyor

**Nginx Loglarını Kontrol Edin:**
```bash
sudo tail -50 /var/log/nginx/error.log
```

**Nginx Config'i Kontrol Edin:**
```bash
sudo nginx -t
```

**Nginx'i Restart Edin:**
```bash
sudo systemctl restart nginx
```

---

## 🎯 Hızlı Komutlar

### Tek Satırda Deployment (Manuel)

```bash
cd /var/www/nfclink/NFC_Link && git pull origin erberk && npm install && npm run build && sudo systemctl reload nginx && echo "✅ Deployment tamamlandı!"
```

### Deployment Durumunu Kontrol Et

```bash
# Son commit
cd /var/www/nfclink/NFC_Link && git log -1 --oneline

# Build tarihi
ls -lh dist/index.html

# Nginx durumu
sudo systemctl status nginx
```

---

## 📝 Notlar

- **GitHub Actions** otomatik çalışır, manuel müdahale gerekmez
- **Manuel deployment** sadece GitHub Actions çalışmıyorsa gerekli
- Her deployment'tan sonra siteyi test edin
- Önemli değişikliklerden önce yedek alın

---

## 🎉 Başarılı Deployment Sonrası

1. ✅ Site açılıyor mu? (`https://esdodesign.com`)
2. ✅ Yeni özellikler çalışıyor mu?
3. ✅ Console'da hata var mı? (F12 → Console)
4. ✅ Email sistemi çalışıyor mu? (Test email gönderin)

---

## 📚 İlgili Dosyalar

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `deploy-vps.sh` - Manuel deployment script
- `DEPLOYMENT.md` - Detaylı deployment rehberi
