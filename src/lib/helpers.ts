import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";
import { supabase } from "./supabase";

/**
 * Ürün görseli için fallback ile URL döndürür
 * Eğer image_url geçerli bir HTTP URL değilse, kategoriye göre yerel görsel döner
 */
export const getProductImage = (
  imageUrl: string | null | undefined,
  categoryOrName: string
): string => {
  // Geçerli HTTP URL ise direkt döndür
  if (imageUrl && imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Kategori veya ürün adına göre fallback görsel
  const text = categoryOrName?.toLowerCase() || "";

  if (
    text.includes("kartvizit") ||
    text.includes("card") ||
    text.includes("profesyonel") ||
    text.includes("premium")
  ) {
    return productCard;
  }

  if (
    text.includes("bileklik") ||
    text.includes("band") ||
    text.includes("spor")
  ) {
    return productBand;
  }

  if (text.includes("pet") || text.includes("tag") || text.includes("evcil")) {
    return productPetTag;
  }

  // Varsayılan
  return productCard;
};

/**
 * Ürün görselini renge göre getirir
 * Önce product_images tablosundan renge özel görseli arar, yoksa fallback kullanır
 * Birden fazla görsel varsa ilk görseli (sort_order'a göre) döndürür
 */
export const getProductImageByColor = async (
  productId: number,
  color: string,
  fallbackImageUrl: string | null | undefined,
  categoryOrName: string
): Promise<string> => {
  try {
    // Önce product_images tablosundan renge özel görselleri ara
    const { data: productImages, error } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", productId)
      .eq("color", color)
      .order("sort_order", { ascending: true })
      .limit(1);

    if (!error && productImages && productImages.length > 0 && productImages[0]?.image_url) {
      return productImages[0].image_url;
    }

    // Renk bazlı görsel yoksa, fallback görseli kullan
    return getProductImage(fallbackImageUrl, categoryOrName);
  } catch (error) {
    console.error("Renk bazlı görsel getirilemedi:", error);
    // Hata durumunda fallback görseli döndür
    return getProductImage(fallbackImageUrl, categoryOrName);
  }
};

/**
 * Ürünün belirli bir rengi için tüm görselleri getirir (sort_order'a göre sıralı)
 * @returns Görsel URL'lerinin dizisi (sort_order'a göre sıralı)
 */
export const getProductImagesByColor = async (
  productId: number,
  color: string,
  fallbackImageUrl: string | null | undefined,
  categoryOrName: string
): Promise<string[]> => {
  try {
    // product_images tablosundan renge özel tüm görselleri ara
    const { data: productImages, error } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", productId)
      .eq("color", color)
      .order("sort_order", { ascending: true });

    if (!error && productImages && productImages.length > 0) {
      // Sadece geçerli image_url'leri filtrele
      const validImages = productImages
        .map(img => img.image_url)
        .filter((url): url is string => !!url);
      
      if (validImages.length > 0) {
        return validImages;
      }
    }

    // Renk bazlı görsel yoksa, fallback görseli tek elemanlı dizi olarak döndür
    return [getProductImage(fallbackImageUrl, categoryOrName)];
  } catch (error) {
    console.error("Renk bazlı görseller getirilemedi:", error);
    return [getProductImage(fallbackImageUrl, categoryOrName)];
  }
};

/**
 * Fiyatı Türk Lirası formatında döndürür
 */
export const formatPrice = (price: number): string => {
  return `₺${price.toLocaleString("tr-TR")}`;
};

/**
 * Tarihi Türkçe formatında döndürür
 */
export const formatDate = (
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return new Date(dateString).toLocaleDateString("tr-TR", options || defaultOptions);
};

/**
 * Tarihi saat ile birlikte Türkçe formatında döndürür
 */
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Sipariş durumu konfigürasyonu
 */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "production"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  pending: {
    label: "Beklemede",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  confirmed: {
    label: "Onaylandı",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  production: {
    label: "Üretimde",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  shipped: {
    label: "Kargoda",
    color: "bg-primary/10 text-primary border-primary/20",
  },
  delivered: {
    label: "Teslim Edildi",
    color: "bg-accent/10 text-accent border-accent/20",
  },
  cancelled: {
    label: "İptal Edildi",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "production",
  "shipped",
  "delivered",
];

/**
 * Varsayılan ürün özellikleri (kategori bazlı)
 */
export const DEFAULT_FEATURES: Record<string, string[]> = {
  Profesyonel: [
    "Yüksek kaliteli PVC malzeme",
    "Su ve çizilmeye dayanıklı",
    "10+ yıl dayanıklılık",
    "Tüm NFC uyumlu telefonlarla çalışır",
    "Uygulama indirme gerektirmez",
    "Anında aktivasyon",
  ],
  Premium: [
    "Metal kaplama premium yüzey",
    "Lazer gravür seçeneği",
    "Su ve çizilmeye dayanıklı",
    "15+ yıl dayanıklılık",
    "VIP müşteri desteği",
    "Özel kutu ile teslimat",
  ],
  "Spor & Etkinlik": [
    "Kişiselleştirilmiş sevgililer sayfası",
    "Fotoğraf galerisi özelliği",
    "Anılar ve manifest bölümleri",
    "Özel tema seçenekleri",
    "İlişki sayacı",
    "Sınırsız içerik ekleme",
  ],
  "Evcil Hayvan": [
    "Paslanmaz çelik gövde",
    "Su geçirmez",
    "QR kod + NFC çift teknoloji",
    "Acil durum bilgileri",
    "Hafif ve dayanıklı",
    "Ücretsiz gravür seçeneği",
  ],
};

/**
 * Varsayılan teknik özellikler (kategori bazlı)
 */
export const DEFAULT_SPECS: Record<string, Record<string, string>> = {
  Profesyonel: {
    Boyut: "85.6 x 54 mm (Standart kart boyutu)",
    Kalınlık: "0.8 mm",
    Malzeme: "Premium PVC",
    "NFC Chip": "NTAG216",
    Hafıza: "888 bytes",
    "Okuma Mesafesi": "1-5 cm",
  },
  Premium: {
    Boyut: "85.6 x 54 mm (Standart kart boyutu)",
    Kalınlık: "1.0 mm",
    Malzeme: "Metal kaplama PVC",
    "NFC Chip": "NTAG216",
    Hafıza: "888 bytes",
    "Okuma Mesafesi": "1-5 cm",
  },
  "Spor & Etkinlik": {
    Boyut: "Ayarlanabilir bileklik",
    Genişlik: "12 mm",
    Malzeme: "Medikal silikon",
    "NFC Chip": "NTAG213",
    Hafıza: "144 bytes",
    "Okuma Mesafesi": "1-3 cm",
  },
  "Evcil Hayvan": {
    Boyut: "30 mm çap",
    Kalınlık: "2 mm",
    Malzeme: "Paslanmaz çelik",
    "NFC Chip": "NTAG213",
    Hafıza: "144 bytes",
    Ağırlık: "8g",
  },
};

/**
 * Varsayılan renkler (kategori bazlı)
 */
export const DEFAULT_COLORS: Record<string, string[]> = {
  Profesyonel: ["Beyaz", "Siyah", "Gri"],
  Premium: ["Siyah", "Altın", "Gümüş"],
  "Spor & Etkinlik": ["Siyah", "Beyaz", "Pembe", "Kırmızı"],
  "Evcil Hayvan": ["Altın", "Gümüş", "Rose Gold"],
};
