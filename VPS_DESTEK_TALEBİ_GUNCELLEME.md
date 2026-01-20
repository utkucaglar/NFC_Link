# VPS Güncelleme - Destek Talebi Admin Email Özelliği

Destek talebi açıldığında admin'e email gönderme özelliği için VPS'te yapılması gerekenler.

---

## ✅ VPS'te Yapılacaklar

### Yöntem 1: Otomatik (GitHub Actions) ⭐ ÖNERİLEN

Eğer GitHub'a push yaptıysanız, GitHub Actions otomatik olarak deploy edecek:

1. **GitHub'a push yapın:**
   ```bash
   git add .
   git commit -m "Destek talebi admin email bildirimi eklendi"
   git push origin erberk
   ```

2. **GitHub Actions kontrol edin:**
   - GitHub → Actions sekmesi
   - Deployment'ın başarılı olduğunu kontrol edin

---

### Yöntem 2: Manuel Deployment

GitHub Actions çalışmıyorsa manuel yapın:

#### Adım 1: VPS'e SSH ile Bağlanın

```bash
ssh root@your-vps-ip
```

#### Adım 2: Proje Dizinine Gidin

```bash
cd /var/www/nfclink/NFC_Link
```

#### Adım 3: Git Pull Yapın

```bash
git pull origin erberk
```

**Not:** Eğer "divergent branches" hatası alırsanız:
```bash
git config pull.rebase false
git pull origin erberk
```

#### Adım 4: Bağımlılıkları Kontrol Edin

```bash
npm install
```

**Not:** Yeni dependency eklenmedi, ama kontrol edin.

#### Adım 5: Build Oluşturun

```bash
npm run build
```

#### Adım 6: Nginx'i Yeniden Yükleyin

```bash
sudo systemctl reload nginx
```

#### Adım 7: Kontrol Edin

```bash
# Nginx durumunu kontrol et
sudo systemctl status nginx

# Son commit'i kontrol et
git log -1 --oneline
```

---

## 🔍 Kontrol Listesi

- [ ] GitHub'a push yapıldı mı?
- [ ] VPS'te git pull yapıldı mı?
- [ ] Build başarılı mı? (`npm run build` hatasız mı?)
- [ ] Nginx çalışıyor mu?
- [ ] Site açılıyor mu? (`https://esdodesign.com`)

---

## ⚠️ ÖNEMLİ: Supabase Tarafında Yapılacaklar

VPS'te kod güncellemesi yeterli değil! Aşağıdakileri de kontrol edin:

### 1. Admin Kullanıcı Kontrolü

Supabase SQL Editor'da:
```sql
SELECT email, role FROM user_profiles WHERE role = 'admin';
```

**Eğer admin yoksa:**
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

### 2. RLS Politikası (Gerekirse)

Normal kullanıcılar admin email'lerini göremeyebilir. Geçici çözüm:

```sql
-- Geçici: Herkes email ve role görebilsin (sadece bildirim için)
CREATE POLICY IF NOT EXISTS "Anyone can view email and role for notifications"
  ON user_profiles FOR SELECT
  USING (true);
```

**Not:** Bu güvenlik açığı yaratabilir. Daha iyi çözüm için `DESTEK_TALEBİ_DEBUG.md` dosyasına bakın.

### 3. Email Ayarları

Admin Panel → Settings → Email Ayarları:
- ✅ Email servisi aktif mi? (`is_enabled: true`)
- ✅ API key doğru mu?
- ✅ From email doğru mu?

### 4. Edge Function Kontrolü

Supabase Dashboard → Edge Functions → `send-email`:
- ✅ Function deploy edilmiş mi?
- ✅ `RESEND_API_KEY` secret ayarlı mı?

---

## 🧪 Test

### Test 1: Site Açılıyor mu?

```bash
curl -I https://esdodesign.com
```

### Test 2: Destek Talebi Oluşturun

1. Siteye gidin: `https://esdodesign.com/contact`
2. Giriş yapın
3. Yeni destek talebi oluşturun
4. Browser Console'u açın (F12)
5. Logları kontrol edin:
   - `🔔 Admin bildirimi başlatılıyor...`
   - `📧 Bulunan admin sayısı: X`
   - `✅ Admin bildirimleri tamamlandı`

### Test 3: Admin Email Kontrolü

Admin email'inizi kontrol edin:
- Email geldi mi?
- Email içeriği doğru mu?
- Link çalışıyor mu?

---

## 🆘 Sorun Giderme

### Problem: Site açılmıyor

```bash
# Nginx loglarını kontrol et
sudo tail -50 /var/log/nginx/error.log

# Nginx config'i kontrol et
sudo nginx -t

# Nginx'i restart et
sudo systemctl restart nginx
```

### Problem: Build hatası

```bash
# node_modules'ı temizle
rm -rf node_modules package-lock.json

# Yeniden yükle
npm install

# Build yap
npm run build
```

### Problem: Email gelmiyor

1. Browser Console'u kontrol edin (F12)
2. Supabase Logs'u kontrol edin
3. Resend Dashboard'u kontrol edin
4. `DESTEK_TALEBİ_DEBUG.md` dosyasına bakın

---

## 📋 Özet

**VPS'te yapılacaklar:**
1. ✅ `git pull origin erberk`
2. ✅ `npm install` (gerekirse)
3. ✅ `npm run build`
4. ✅ `sudo systemctl reload nginx`

**Supabase'de yapılacaklar:**
1. ✅ Admin kullanıcı var mı kontrol et
2. ✅ RLS politikası kontrol et (gerekirse)
3. ✅ Email ayarları kontrol et
4. ✅ Edge Function deploy edilmiş mi kontrol et

---

## 🎉 Tamamlandı!

Tüm adımları tamamladıktan sonra:
- ✅ Site güncel kodla çalışıyor
- ✅ Destek talebi oluşturulduğunda admin'e email gidiyor
- ✅ Email sistemi çalışıyor
