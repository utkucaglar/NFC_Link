# Supabase Edge Functions Kurulumu

## 1. Supabase CLI Kurulumu

### Windows (PowerShell - Admin olarak çalıştırın)
```powershell
# Scoop ile kurulum (önerilen)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Alternatif: npm ile
```bash
npm install -g supabase
```

## 2. Supabase'e Giriş

```bash
supabase login
```
Bu komut tarayıcıda Supabase'e giriş yapmanızı isteyecek.

## 3. Projeyi Bağlama

```bash
cd c:\Users\Erberk\Projeler\NFC_Link
supabase link --project-ref ajldsveljbqkykrwnrpn
```

## 4. Resend API Key'i Secret Olarak Ekleme

```bash
supabase secrets set RESEND_API_KEY=re_XXXXXXXXXX
```

> **Not:** `re_XXXXXXXXXX` yerine Resend'den aldığınız gerçek API key'i yazın.

## 5. Edge Function'ı Deploy Etme

```bash
supabase functions deploy send-email
```

## 6. Test Etme

Supabase Dashboard → Edge Functions → send-email → Logs bölümünden logları görebilirsiniz.

Admin panelinden test email göndermeyi deneyin.

---

## Sorun Giderme

### "Function not found" hatası
Edge function henüz deploy edilmemiş. `supabase functions deploy send-email` komutunu çalıştırın.

### "RESEND_API_KEY is not configured" hatası
Secret ayarlanmamış. `supabase secrets set RESEND_API_KEY=...` komutunu çalıştırın.

### CORS hatası
Edge function'daki CORS headers'ı kontrol edin. Zaten ekli olmalı.

---

## Resend Ayarları

1. https://resend.com adresinden hesap oluşturun
2. API Keys bölümünden yeni key oluşturun
3. Domain ekleyin ve DNS kayıtlarını yapın (production için gerekli)
4. Development için "onboarding@resend.dev" kullanabilirsiniz

---

## Faydalı Komutlar

```bash
# Function loglarını görüntüle
supabase functions logs send-email

# Tüm secretları listele
supabase secrets list

# Function'ı yerel olarak çalıştır (test için)
supabase functions serve send-email
```
