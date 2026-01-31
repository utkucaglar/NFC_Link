# Edge Function Deploy - Admin Ticket Notification

Yeni destek talebi bildirimi için Edge Function deploy rehberi.

---

## 🚀 Edge Function Deploy

### Adım 1: Supabase CLI Kurulumu (Eğer yoksa)

```bash
# Windows (PowerShell)
irm https://github.com/supabase/cli/releases/latest/download/supabase_windows_amd64.zip -OutFile supabase.zip
Expand-Archive supabase.zip -DestinationPath .
Move-Item supabase.exe C:\Windows\System32\supabase.exe

# Linux/Mac
brew install supabase/tap/supabase
```

### Adım 2: Supabase'e Login

```bash
supabase login
```

### Adım 3: Projeyi Link Et

```bash
cd c:\Users\Erberk\Projeler\NFC_Link
supabase link --project-ref your-project-ref
```

**Project Ref'i bulmak için:**
- Supabase Dashboard → Settings → General → Reference ID

### Adım 4: Secrets Ayarla

#### 4.1. Resend API Key

Resend Dashboard'dan alın:
- [Resend Dashboard](https://resend.com/dashboard) → API Keys
- Mevcut key'i kopyalayın veya yeni oluşturun

```bash
supabase secrets set RESEND_API_KEY=re_7fy8qLFw_AUuj1AjyFdxF4MPTcS3JqaNE
```

#### 4.2. Supabase Service Role Key ⚠️ ÖNEMLİ

**Nereden Bulunur:**

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. Sol menüden **Settings** (⚙️) ikonuna tıklayın
3. **API** sekmesine gidin
4. **Project API keys** bölümünde:
   - **`anon` `public`** key'i göreceksiniz (bu değil)
   - **`service_role` `secret`** key'i göreceksiniz ⭐ **BU GEREKLİ**
5. **`service_role` key'in yanındaki 👁️ (göz) ikonuna tıklayın**
6. Key'i kopyalayın (çok uzun bir string, `eyJhbGci...` ile başlar)

**⚠️ GÜVENLİK UYARISI:**
- Service Role Key **ÇOK GİZLİDİR** - RLS'yi bypass eder
- **ASLA** frontend kodunda kullanmayın
- **ASLA** GitHub'a commit etmeyin
- Sadece Edge Function'larda kullanın

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 4.3. Supabase URL

**Nereden Bulunur:**

1. Supabase Dashboard → Settings → API
2. **Project URL** bölümünde:
   - `https://xxxxxxxxxxxxx.supabase.co` formatında bir URL göreceksiniz
3. Bu URL'i kopyalayın

```bash
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
```

**Örnek:**
```bash
supabase secrets set SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

### Adım 5: Edge Function Deploy

```bash
supabase functions deploy notify-admin-ticket
```

### Adım 6: Test Et

```bash
# Function loglarını izle
supabase functions logs notify-admin-ticket
```

---

## ✅ Kontrol

1. **Supabase Dashboard → Edge Functions**
   - `notify-admin-ticket` function'ı görünüyor mu?
   - Status: Active mi?

2. **Secrets Kontrolü**
   ```bash
   supabase secrets list
   ```
   - `RESEND_API_KEY` var mı?
   - `SUPABASE_SERVICE_ROLE_KEY` var mı?
   - `SUPABASE_URL` var mı?

3. **Test Email Gönder**
   - Site'de destek talebi oluşturun
   - Browser Console'u kontrol edin
   - Admin email'inizi kontrol edin

---

## 🆘 Sorun Giderme

### Problem: "Function not found"

```bash
# Function'ı tekrar deploy et
supabase functions deploy notify-admin-ticket
```

### Problem: "RESEND_API_KEY not found"

```bash
# Secret'ı tekrar ayarla
supabase secrets set RESEND_API_KEY=your_key
```

### Problem: "Admin kullanıcı bulunamadı"

Supabase SQL Editor'da:
```sql
SELECT email, role FROM user_profiles WHERE role = 'admin';
```

Yoksa admin oluşturun:
```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

---

## 📋 Hızlı Komutlar

```bash
# Deploy
supabase functions deploy notify-admin-ticket

# Logs
supabase functions logs notify-admin-ticket

# Secrets list
supabase secrets list

# Secrets set
supabase secrets set RESEND_API_KEY=your_key
```

---

## 🎉 Tamamlandı!

Edge Function deploy edildikten sonra:
- ✅ RLS sorunu çözüldü (Service Role Key ile bypass)
- ✅ Admin email'leri otomatik bulunuyor
- ✅ Email'ler Resend üzerinden gönderiliyor
