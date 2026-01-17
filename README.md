# NFCLink - NFC E-Ticaret Platformu

NFC ürünleri e-ticaret sitesi - Dijital kartvizit, evcil hayvan kimliği ve özel yönlendirme çözümleri.

## Özellikler

- NFC Kartvizit, Bileklik ve Pet Tag ürünleri
- Kullanıcı kayıt/giriş sistemi
- Sepet yönetimi
- Sipariş takibi
- NFC cihaz yönetimi (Business Card, Pet ID, Redirect)
- Responsive tasarım
- Modern ve şık UI

## Teknolojiler

| Kategori | Teknoloji |
|----------|-----------|
| Frontend | React 18, TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Animasyon | Framer Motion |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| UI Components | shadcn/ui |

## Kurulum

### 1. Bağımlılıkları Yükle

```bash
yarn install
# veya
npm install
```

### 2. Environment Variables

Proje kök dizininde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> **Not:** Supabase URL ve Anon Key değerlerini [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > API bölümünden alabilirsiniz.

### 3. Veritabanı Kurulumu

Supabase SQL Editor'da aşağıdaki dosyaları sırasıyla çalıştırın:

```
database/
├── 01_schema.sql      # Tablo yapıları
├── 02_policies.sql    # RLS politikaları
├── 03_functions.sql   # PostgreSQL fonksiyonları
└── 04_seed_data.sql   # Örnek veriler
```

Detaylı bilgi için: [database/README.md](./database/README.md)

### 4. Geliştirme Sunucusu

```bash
yarn dev
# veya
npm run dev
```

Uygulama varsayılan olarak `http://localhost:8080` adresinde çalışır.

## Proje Yapısı

```
src/
├── assets/           # Görseller ve statik dosyalar
├── components/
│   ├── layout/       # Layout bileşenleri (Navbar, Footer, Layout)
│   └── ui/           # UI bileşenleri (Button, Dialog, Input, vb.)
├── contexts/
│   ├── AuthContext   # Kullanıcı kimlik doğrulama
│   └── CartContext   # Sepet yönetimi
├── hooks/            # Custom React hooks
├── lib/
│   ├── supabase.ts   # Supabase client
│   └── utils.ts      # Yardımcı fonksiyonlar
├── pages/
│   ├── Cart.tsx      # Sepet sayfası
│   ├── Index.tsx     # Ana sayfa
│   ├── Login.tsx     # Giriş/Kayıt sayfası
│   ├── MyNFC.tsx     # NFC cihazlarım
│   ├── Orders.tsx    # Siparişlerim
│   ├── Products.tsx  # Ürünler listesi
│   ├── ProductDetail.tsx
│   ├── Profile.tsx   # Kullanıcı profili
│   └── nfc/          # NFC public sayfaları
│       ├── BusinessCard.tsx
│       ├── PetId.tsx
│       └── Redirect.tsx
├── App.tsx           # Ana uygulama ve routing
├── main.tsx          # Entry point
└── index.css         # Global stiller
```

## Scripts

| Komut | Açıklama |
|-------|----------|
| `yarn dev` | Geliştirme sunucusunu başlatır |
| `yarn build` | Production build oluşturur |
| `yarn preview` | Production build'i önizler |
| `yarn lint` | ESLint ile kod kontrolü |

## Ortam Değişkenleri

| Değişken | Açıklama | Zorunlu |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase proje URL'i | Evet |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Evet |

## Lisans

Bu proje özel kullanım içindir.
