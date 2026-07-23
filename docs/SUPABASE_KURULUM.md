# Supabase Kurulum Rehberi

Bu rehber, NFC e-ticaret siteniz için Supabase'de yapmanız gereken tüm adımları içerir.

## 1. Supabase Projesi Oluşturma

1. [Supabase](https://supabase.com) hesabınıza giriş yapın
2. "New Project" butonuna tıklayın
3. Proje bilgilerini doldurun:
   - **Name**: NFC Website (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre oluşturun (KAYDEDİN!)
   - **Region**: En yakın region'ı seçin (Avrupa önerilir)
4. Projeyi oluşturun (2-3 dakika sürebilir)

## 2. Environment Variables Yapılandırması

### 2.1. Supabase API Anahtarlarını Alma

Projeniz oluştuktan sonra:

1. Sol menüden **Settings** (⚙️) → **API** sekmesine gidin
2. Aşağıdaki değerleri kopyalayın:
   - **Project URL** (örnek: `https://xxxxxxxxxxx.supabase.co`)
   - **anon/public key** (çok uzun bir string)

### 2.2. .env Dosyası Oluşturma

Proje ana dizininde `.env` dosyası oluşturun ve aşağıdaki değerleri ekleyin:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**ÖNEMLİ:**
- `.env` dosyası `.gitignore` içinde olmalı (güvenlik için)
- Değerleri kopyalarken başında/sonunda boşluk bırakmayın
- Tırnak işareti kullanmayın

## 3. Veritabanı Tablolarını Oluşturma

Supabase Dashboard'da **SQL Editor** sekmesine gidin ve aşağıdaki SQL'leri sırayla çalıştırın:

### 3.1. Products Tablosu (Ürünler)

```sql
-- Ürünler tablosu
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  monthly_subscription_fee DECIMAL(10, 2) DEFAULT 29.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ürünler için RLS (Row Level Security) aktif et
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes ürünleri okuyabilir
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (is_active = true);
```

### 3.2. Users Tablosu (Kullanıcı Profilleri)

```sql
-- Kullanıcı profilleri tablosu (auth.users'a ek bilgi)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  address TEXT,
  email TEXT,
  avatar_url TEXT,
  subscription_plan TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi profillerini görebilir/düzenleyebilir
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 3.3. Cart Items Tablosu (Sepet)

```sql
-- Sepet öğeleri tablosu
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  customization JSONB, -- Özelleştirme bilgileri (text, color vb.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, customization)
);

-- RLS aktif et
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi sepetlerini görebilir/düzenleyebilir
CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id);
```

### 3.4. Orders Tablosu (Siparişler)

```sql
-- Siparişler tablosu
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', 
  -- status: pending, confirmed, production, shipped, delivered
  total_amount DECIMAL(10, 2) NOT NULL,
  tracking_number TEXT,
  shipping_address JSONB, -- Adres bilgileri
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi siparişlerini görebilir
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);
```

### 3.5. Order Items Tablosu (Sipariş Öğeleri)

```sql
-- Sipariş öğeleri tablosu
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL, -- Sipariş anındaki fiyat
  customization JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar siparişlerine ait öğeleri görebilir
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );
```

### 3.6. NFCs Tablosu (NFC Ürünleri)

```sql
-- NFC ürünleri tablosu
CREATE TABLE nfcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unique_key TEXT UNIQUE NOT NULL, -- Her NFC'nin benzersiz anahtarı
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id), -- Hangi siparişten geldiği
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'business-card', 'pet-id', 'redirect'
  is_active BOOLEAN DEFAULT true,
  active_until TIMESTAMP WITH TIME ZONE,
  has_subscription BOOLEAN DEFAULT false,
  subscription_renews_at TIMESTAMP WITH TIME ZONE,
  scans_count INTEGER DEFAULT 0,
  nfc_data JSONB, -- NFC içeriği (type'a göre farklı veriler)
  -- business-card: {name, title, company, email, phone, website, social}
  -- pet-id: {petName, ownerName, ownerPhone, ownerEmail, petInfo}
  -- redirect: {url, description}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE nfcs ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi NFC'lerini görebilir/düzenleyebilir
CREATE POLICY "Users can view own nfcs"
  ON nfcs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nfcs"
  ON nfcs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nfcs"
  ON nfcs FOR UPDATE
  USING (auth.uid() = user_id);

-- Public olarak NFC'lere unique_key ile erişim (tarama için)
CREATE POLICY "NFCs are viewable by key (public)"
  ON nfcs FOR SELECT
  USING (true); -- Bu politika daha sonra unique_key kontrolü ile kısıtlanacak
```

### 3.7. NFC Scans Tablosu (NFC Taramaları)

```sql
-- NFC taramaları/istatistikleri tablosu
CREATE TABLE nfc_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nfc_id UUID NOT NULL REFERENCES nfcs(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  referrer TEXT
);

-- Index ekle (performans için)
CREATE INDEX idx_nfc_scans_nfc_id ON nfc_scans(nfc_id);
CREATE INDEX idx_nfc_scans_scanned_at ON nfc_scans(scanned_at);

-- RLS aktif et
ALTER TABLE nfc_scans ENABLE ROW LEVEL SECURITY;

-- Herkes tarama kaydı oluşturabilir (public NFC taramaları için)
CREATE POLICY "Anyone can insert scans"
  ON nfc_scans FOR INSERT
  WITH CHECK (true);

-- Kullanıcılar sadece kendi NFC'lerinin taramalarını görebilir
CREATE POLICY "Users can view scans for own nfcs"
  ON nfc_scans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nfcs 
      WHERE nfcs.id = nfc_scans.nfc_id 
      AND nfcs.user_id = auth.uid()
    )
  );
```

### 3.8. Subscriptions Tablosu (Abonelikler)

```sql
-- Abonelikler tablosu
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nfc_id UUID REFERENCES nfcs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired
  plan_type TEXT NOT NULL, -- 'monthly', 'yearly'
  amount DECIMAL(10, 2) NOT NULL,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT, -- Stripe subscription ID (ödeme entegrasyonu için)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS aktif et
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar sadece kendi aboneliklerini görebilir
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
```

## 4. Fonksiyonlar ve Trigger'lar

### 4.1. Otomatik Order Number Oluşturma

```sql
-- Sipariş numarası otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  new_order_number TEXT;
  year_part TEXT;
  seq_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Bu yıl için maksimum sipariş numarasını bul
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '(\d+)$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM orders
  WHERE order_number LIKE 'NFC-' || year_part || '-%';
  
  -- Yeni sipariş numarası oluştur
  new_order_number := 'NFC-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  NEW.order_number := new_order_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle
CREATE TRIGGER set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();
```

### 4.2. NFC Taraması Kaydı ve Sayacı Güncelleme

```sql
-- NFC tarandığında scans_count'u güncelleyen fonksiyon
CREATE OR REPLACE FUNCTION update_nfc_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE nfcs
  SET scans_count = scans_count + 1,
      updated_at = NOW()
  WHERE id = NEW.nfc_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle
CREATE TRIGGER increment_nfc_scans
  AFTER INSERT ON nfc_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_nfc_scan_count();
```

### 4.3. User Profile Otomatik Oluşturma

```sql
-- Yeni kullanıcı kaydolduğunda profil oluştur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı ekle
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

### 4.4. Updated At Otomatik Güncelleme

```sql
-- updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tüm tablolar için trigger ekle
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nfcs_updated_at BEFORE UPDATE ON nfcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 5. Index'ler (Performans İçin)

```sql
-- Performans için index'ler
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_nfcs_user_id ON nfcs(user_id);
CREATE INDEX idx_nfcs_unique_key ON nfcs(unique_key);
CREATE INDEX idx_nfcs_type ON nfcs(type);
CREATE INDEX idx_nfcs_is_active ON nfcs(is_active);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_nfc_id ON subscriptions(nfc_id);
```

## 6. Örnek Veri Ekleme (Test İçin)

```sql
-- Örnek ürünler ekle
INSERT INTO products (name, description, price, category, monthly_subscription_fee) VALUES
('NFC Kartvizit - Klasik Beyaz', 'Şık ve minimal tasarım ile profesyonel görünüm', 149.00, 'Profesyonel', 29.00),
('NFC Kartvizit - Premium Siyah', 'Metal kaplama, lüks hissiyat', 179.00, 'Profesyonel', 29.00),
('NFC Bileklik - Spor', 'Su geçirmez, dayanıklı silikon', 199.00, 'Spor & Etkinlik', 29.00),
('NFC Bileklik - Festival', 'Tek kullanımlık, etkinlikler için ideal', 99.00, 'Spor & Etkinlik', 29.00),
('Pet Tag - Altın', 'Paslanmaz çelik, altın kaplama', 129.00, 'Evcil Hayvan', 29.00),
('Pet Tag - Gümüş', 'Paslanmaz çelik, gümüş kaplama', 119.00, 'Evcil Hayvan', 29.00);
```

## 7. Authentication Ayarları

1. **Settings** → **Authentication** → **Providers** sekmesine gidin
2. İstediğiniz authentication yöntemlerini aktif edin:
   - **Email** (varsayılan açık)
   - **Google** (isteğe bağlı)
   - **GitHub** (isteğe bağlı)
3. **Email Templates** bölümünden e-posta şablonlarını Türkçeleştirebilirsiniz
4. **URL Configuration** bölümünde:
   - **Site URL**: `http://localhost:5173` (development için)
   - **Redirect URLs**: Uygulamanızın URL'lerini ekleyin

## 8. Storage Bucket (Resimler İçin)

Eğer ürün resimlerini Supabase Storage'da saklayacaksanız:

1. **Storage** sekmesine gidin
2. **New bucket** oluşturun:
   - **Name**: `product-images`
   - **Public bucket**: ✅ (Herkes görebilsin)
3. **Policies** sekmesinde:
   - **Select**: `true` (herkes okuyabilir)
   - **Insert/Update/Delete**: Sadece authenticated kullanıcılar

## 9. Environment Variables (.env Dosyası)

Proje kök dizininizde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**ÖNEMLİ**: `.env` dosyasını `.gitignore`'a ekleyin!

## 10. Supabase Client Kurulumu

Projenizde Supabase client'ı kullanmak için:

```bash
npm install @supabase/supabase-js
```

Sonra `src/lib/supabase.ts` dosyası oluşturun:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Özet Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] Environment variables alındı ve `.env` dosyasına eklendi
- [ ] Tüm tablolar oluşturuldu
- [ ] RLS politikaları eklendi
- [ ] Fonksiyonlar ve trigger'lar oluşturuldu
- [ ] Index'ler eklendi
- [ ] Örnek veri eklendi (test için)
- [ ] Authentication ayarları yapıldı
- [ ] Storage bucket oluşturuldu (isteğe bağlı)
- [ ] `@supabase/supabase-js` paketi kuruldu
- [ ] Supabase client dosyası oluşturuldu

## Sonraki Adımlar

1. Supabase client'ı projenize entegre edin
2. Authentication flow'unu ekleyin (login/signup)
3. Products sayfasını Supabase'den veri çekecek şekilde güncelleyin
4. Cart functionality'yi Supabase'e bağlayın
5. Orders sayfasını Supabase'den siparişleri çekecek şekilde güncelleyin
6. NFC yönetim sayfalarını Supabase'e bağlayın

İyi çalışmalar! 🚀
