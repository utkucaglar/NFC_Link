# Email Validation Edge Function Deploy Rehberi

## 🚀 Hızlı Deploy (npx ile - Kurulum Gerektirmez)

### Adım 1: Supabase'e Giriş Yapın

PowerShell veya Terminal'de proje klasörüne gidin:

```powershell
cd c:\Users\utkuc\Desktop\Website\NFC_Link
```

Supabase'e giriş yapın (tarayıcı açılacak):

```powershell
npx supabase login
```

### Adım 2: Projeyi Bağlayın

Proje referans numaranızı bulun:
1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. Settings → General → Reference ID'yi kopyalayın

Projeyi bağlayın:

```powershell
npx supabase link --project-ref YOUR_PROJECT_REF
```

**Örnek:**
```powershell
npx supabase link --project-ref ajldsveljbqkykrwnrpn
```

### Adım 3: Edge Function'ı Deploy Edin

```powershell
npx supabase functions deploy validate-email-mx
```

### Adım 4: Test Edin

1. Supabase Dashboard → Edge Functions → `validate-email-mx` → Logs
2. Uygulamanızda email input'una bir email yazın ve input'tan çıkın
3. Logs'da MX kontrolü sonuçlarını görebilirsiniz

---

## 📋 Alternatif: Scoop ile Kalıcı Kurulum

Eğer sık sık deploy yapacaksanız, Supabase CLI'yi kalıcı olarak kurabilirsiniz:

### 1. Scoop'u Kurun (Eğer yoksa)

PowerShell'i **Admin olarak** açın ve şunu çalıştırın:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### 2. Supabase CLI'yi Kurun

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 3. Artık `supabase` komutunu direkt kullanabilirsiniz:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy validate-email-mx
```

---

## ✅ Deploy Sonrası Kontrol

### Function'ın Çalıştığını Kontrol Edin

1. **Supabase Dashboard** → **Edge Functions** → `validate-email-mx`
2. **Logs** sekmesine gidin
3. Uygulamanızda email input'una bir email yazın
4. Logs'da şu şekilde kayıtlar görmelisiniz:

```
Email validation request: test@example.com
MX records found: [{"exchange":"mail.example.com","priority":10}]
```

### Test Email'leri

- ✅ **Geçerli email:** `test@gmail.com` → MX kaydı bulunmalı
- ❌ **Geçersiz domain:** `test@nonexistentdomain12345.com` → Hata vermeli
- ❌ **MX kaydı yok:** `test@example.com` (eğer MX yoksa) → Hata vermeli

---

## 🔧 Sorun Giderme

### "Function not found" hatası
- Function henüz deploy edilmemiş
- `npx supabase functions deploy validate-email-mx` komutunu tekrar çalıştırın

### "Project not linked" hatası
- Projeyi bağlamamışsınız
- `npx supabase link --project-ref YOUR_PROJECT_REF` komutunu çalıştırın

### "Not authenticated" hatası
- Supabase'e giriş yapmamışsınız
- `npx supabase login` komutunu çalıştırın

### CORS hatası
- Edge Function'daki CORS headers zaten ekli
- Eğer hala sorun varsa, browser console'da hata mesajını kontrol edin

---

## 📝 Notlar

- **npx** kullanarak Supabase CLI'yi kurmadan kullanabilirsiniz
- Her deploy işleminde `npx` kullanmanız gerekir
- Kalıcı kurulum için Scoop yöntemini kullanın
- Deploy işlemi genellikle 30-60 saniye sürer

---

## 🎯 Başarılı Deploy Sonrası

Email validation artık çalışıyor! Kullanıcılar email input'una yazdıklarında:

1. ✅ **Geçerli email:** Yeşil tik ve "Email adresi doğrulandı" mesajı
2. ❌ **Geçersiz email:** Kırmızı uyarı ve hata mesajı
3. 🔄 **Kontrol ediliyor:** Loading spinner
