# Supabase API Keys Rehberi

Supabase'de kullanılan tüm key'lerin nereden bulunacağı.

---

## 🔑 Supabase Dashboard'dan Key'leri Bulma

### Adım 1: Supabase Dashboard'a Giriş

1. [Supabase Dashboard](https://supabase.com/dashboard) → Giriş yapın
2. Projenizi seçin

### Adım 2: Settings'e Gidin

1. Sol menüden **Settings** (⚙️) ikonuna tıklayın
2. **API** sekmesine gidin

---

## 📋 Key'ler ve Nerede Kullanılır

### 1. Project URL

**Nerede:**
- Settings → API → **Project URL**

**Format:**
```
https://xxxxxxxxxxxxx.supabase.co
```

**Nerede Kullanılır:**
- `.env` dosyasında: `VITE_SUPABASE_URL`
- Edge Function secrets: `SUPABASE_URL`

**Örnek:**
```
https://abcdefghijklmnop.supabase.co
```

---

### 2. anon public Key

**Nerede:**
- Settings → API → **Project API keys** → **`anon` `public`**

**Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Nerede Kullanılır:**
- `.env` dosyasında: `VITE_SUPABASE_ANON_KEY`
- Frontend kodunda (güvenli, herkese açık)

**⚠️ Not:** Bu key herkese açık, frontend'de kullanılabilir.

---

### 3. service_role secret Key ⚠️ ÇOK GİZLİ

**Nerede:**
- Settings → API → **Project API keys** → **`service_role` `secret`**
- 👁️ (göz) ikonuna tıklayarak görebilirsiniz

**Format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Nerede Kullanılır:**
- **SADECE** Edge Function secrets: `SUPABASE_SERVICE_ROLE_KEY`
- **ASLA** frontend'de kullanmayın!
- **ASLA** GitHub'a commit etmeyin!

**⚠️ GÜVENLİK UYARISI:**
- Bu key **RLS'yi bypass eder** (Row Level Security)
- Tüm veritabanına erişim sağlar
- **ÇOK GİZLİDİR** - sadece backend/Edge Function'larda kullanın

---

## 🎯 Edge Function için Gerekli Secrets

Edge Function deploy ederken şu 3 secret gerekli:

```bash
# 1. Resend API Key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# 2. Supabase Service Role Key (RLS bypass için)
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Supabase URL
supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
```

---

## 📸 Görsel Rehber

### Supabase Dashboard'da Key'leri Bulma:

1. **Settings** → **API** sekmesi
2. **Project API keys** bölümünde:
   ```
   ┌─────────────────────────────────────┐
   │ Project API keys                    │
   ├─────────────────────────────────────┤
   │ anon        public    [👁️ Reveal]   │ ← Frontend için
   │ service_role secret   [👁️ Reveal]   │ ← Edge Function için ⭐
   └─────────────────────────────────────┘
   ```

3. **Project URL** bölümünde:
   ```
   ┌─────────────────────────────────────┐
   │ Project URL                          │
   ├─────────────────────────────────────┤
   │ https://xxxxx.supabase.co           │
   └─────────────────────────────────────┘
   ```

---

## ✅ Kontrol Listesi

Edge Function deploy etmeden önce:

- [ ] Supabase Dashboard'a giriş yaptım
- [ ] Settings → API sekmesine gittim
- [ ] `service_role` key'i buldum ve kopyaladım
- [ ] Project URL'i buldum ve kopyaladım
- [ ] Resend API Key'i hazırladım
- [ ] Tüm secret'ları `supabase secrets set` ile ayarladım

---

## 🆘 Sorun Giderme

### Problem: "service_role key göremiyorum"

**Çözüm:**
1. Settings → API sekmesine gidin
2. **Project API keys** bölümünde **`service_role`** satırını bulun
3. Sağdaki **👁️ (göz) ikonuna** tıklayın
4. Key görünecektir

### Problem: "Key çok uzun, kopyalayamıyorum"

**Çözüm:**
1. Key'in başını seçin
2. Shift + End tuşlarına basın (tüm satırı seçer)
3. Ctrl + C ile kopyalayın

### Problem: "Key'i yanlış kopyaladım"

**Çözüm:**
- Key'in başında `eyJ` olmalı
- Key çok uzun olmalı (200+ karakter)
- Tekrar göz ikonuna tıklayıp kopyalayın

---

## 📝 Örnek Kullanım

### Edge Function Deploy

```bash
# 1. Supabase'e login
supabase login

# 2. Projeyi link et
supabase link --project-ref your-project-ref

# 3. Secrets ayarla
supabase secrets set RESEND_API_KEY=re_7fy8qLFw_AUuj1AjyFdxF4MPTcS3JqaNE
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set SUPABASE_URL=https://abcdefghijklmnop.supabase.co

# 4. Function deploy et
supabase functions deploy notify-admin-ticket
```

---

## 🎉 Tamamlandı!

Artık tüm key'leri bulabilir ve Edge Function'ı deploy edebilirsiniz!
