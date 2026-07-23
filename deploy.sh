#!/bin/bash

# NFC Link - Hızlı Deployment Script
# Kullanım: ./deploy.sh

set -e  # Hata durumunda dur

echo "🚀 NFC Link Deployment Başlıyor..."
echo ""

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kontroller
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Hata: package.json bulunamadı. Proje dizininde olduğunuzdan emin olun.${NC}"
    exit 1
fi

# Environment variables kontrolü
if [ ! -f ".env" ] && [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Uyarı: .env dosyası bulunamadı.${NC}"
    echo "Lütfen .env.production dosyası oluşturun veya .env dosyasını ekleyin."
    read -p "Devam etmek istiyor musunuz? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# .env.production varsa .env'e kopyala
if [ -f ".env.production" ] && [ ! -f ".env" ]; then
    echo -e "${GREEN}📋 .env.production dosyası .env olarak kopyalanıyor...${NC}"
    cp .env.production .env
fi

# Eski build'i temizle
if [ -d "dist" ]; then
    echo -e "${YELLOW}🧹 Eski build temizleniyor...${NC}"
    rm -rf dist
fi

# Bağımlılıkları kontrol et
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}📦 Bağımlılıklar yükleniyor...${NC}"
    npm install
else
    echo -e "${GREEN}📦 Bağımlılıklar güncelleniyor...${NC}"
    npm install
fi

# Build oluştur
echo -e "${GREEN}🔨 Production build oluşturuluyor...${NC}"
npm run build

# Build kontrolü
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Hata: Build başarısız! dist/ klasörü oluşturulmadı.${NC}"
    exit 1
fi

# Build başarılı
echo ""
echo -e "${GREEN}✅ Build başarıyla tamamlandı!${NC}"
echo ""
echo "📁 Build dosyaları: $(du -sh dist | cut -f1)"
echo ""
echo "📝 Sonraki adımlar:"
echo "   1. dist/ klasörünü sunucuya yükleyin"
echo "   2. Nginx konfigürasyonunu yapın"
echo "   3. SSL sertifikası alın"
echo ""
echo "Detaylı bilgi için docs/DEPLOYMENT.md dosyasına bakın."
