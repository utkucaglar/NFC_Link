#!/bin/bash

# VPS Deployment Script
# Kullanım: ./deploy-vps.sh

set -e  # Hata durumunda dur

echo "🚀 Deployment başlıyor..."

cd /var/www/nfclink/NFC_Link

# Git'ten son değişiklikleri çek
echo "📥 Git pull yapılıyor..."
git pull origin erberk

# Bağımlılıkları güncelle
echo "📦 Bağımlılıklar güncelleniyor..."
npm install

# Environment variables kontrolü
if [ ! -f ".env" ] && [ -f ".env.production" ]; then
    cp .env.production .env
fi

# Build oluştur
echo "🔨 Production build oluşturuluyor..."
npm run build

# Nginx'i yeniden yükle
echo "🔄 Nginx yeniden yükleniyor..."
sudo systemctl reload nginx

echo "✅ Deployment tamamlandı!"
echo "📅 Tarih: $(date)"
