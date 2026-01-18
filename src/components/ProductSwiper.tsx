import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Link } from "react-router-dom";
import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
}

interface ProductSwiperProps {
  autoPlayInterval?: number; // Otomatik geçiş süresi (ms)
}

// Helper function to get product image
const getProductImage = (imageUrl: string | null, category: string) => {
  if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('https'))) {
    return imageUrl;
  }
  // Fallback to local images based on category
  if (category === "Profesyonel") return productCard;
  if (category === "Spor & Etkinlik") return productBand;
  if (category === "Evcil Hayvan") return productPetTag;
  return productCard;
};

export default function ProductSwiper({ autoPlayInterval = 4000 }: ProductSwiperProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragDirection, setDragDirection] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Veritabanından ürünleri çek
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase yapılandırması eksik');
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/products?select=id,name,description,price,category,image_url&is_active=eq.true&order=id.asc`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            signal: controller.signal
          }
        );

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0 && isMounted) {
          setProducts(data);
          setCurrentIndex(0);
        }
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Error fetching products:', err);
        setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  // Otomatik geçiş
  useEffect(() => {
    if (products.length <= 1) return;

    const startAutoPlay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, autoPlayInterval);
    };

    startAutoPlay();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [products.length, autoPlayInterval]);

  // Swipe işlemleri
  const handleDragStart = () => {
    setIsDragging(true);
    setHasDragged(false);
    // Otomatik geçişi durdur
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    const wasSignificantDrag = Math.abs(info.offset.x) > swipeThreshold;
    
    setIsDragging(false);
    setHasDragged(wasSignificantDrag);
    
    if (wasSignificantDrag && products.length > 0) {
      if (info.offset.x > 0) {
        // Sağa swipe - önceki ürün (sarmalama ile)
        const newIndex = currentIndex > 0 ? currentIndex - 1 : products.length - 1;
        goToSlide(newIndex);
      } else {
        // Sola swipe - sonraki ürün (sarmalama ile)
        const newIndex = (currentIndex + 1) % products.length;
        goToSlide(newIndex);
      }
    } else {
      // Swipe yeterli değilse otomatik geçişi yeniden başlat
      if (products.length > 1) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % products.length);
        }, autoPlayInterval);
      }
    }
    // Drag direction'ı biraz geciktirerek sıfırla (animasyon bitene kadar)
    setTimeout(() => {
      setDragDirection(0);
      setHasDragged(false);
    }, 300);
  };

  const goToSlide = (index: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex(index);
    
    // Otomatik geçişi yeniden başlat
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
      }, autoPlayInterval);
    }, 100);
  };

  // Resme tıklama - drag ile çakışmaması için kontrol
  const handleImageClick = (e: React.MouseEvent) => {
    // Eğer anlamlı bir drag işlemi yapıldıysa link'e gitme
    if (hasDragged) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Normal tıklamada link çalışır
  };

  if (loading) {
    return (
      <div className="relative w-full max-w-lg mx-auto">
        <div className="aspect-square rounded-3xl shadow-2xl bg-muted/30 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    // Fallback görsel
    return (
      <div className="relative w-full max-w-lg mx-auto">
        <div className="aspect-square rounded-3xl shadow-2xl bg-muted/30 flex items-center justify-center">
          <p className="text-muted-foreground">Ürün bulunamadı</p>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Swiper Container */}
      <motion.div
        className="relative overflow-hidden rounded-3xl shadow-2xl"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDrag={(_, info) => setDragDirection(info.offset.x)}
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: isDragging && dragDirection !== 0 ? (dragDirection > 0 ? -100 : 100) : 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isDragging && dragDirection !== 0 ? (dragDirection > 0 ? 100 : -100) : -100 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Link 
              to={`/product/${currentProduct.id}`}
              onClick={handleImageClick}
              className="block aspect-square bg-muted/30 flex items-center justify-center overflow-hidden relative group cursor-pointer"
            >
              <img
                src={getProductImage(currentProduct.image_url, currentProduct.category)}
                alt={currentProduct.name}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                style={{ maxHeight: '100%', maxWidth: '100%' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Fallback görselini göster
                  const fallbackSrc = getProductImage(null, currentProduct.category);
                  if (target.src !== fallbackSrc) {
                    target.src = fallbackSrc;
                  } else {
                    // Eğer fallback da çalışmazsa, metni göster
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'text-muted-foreground p-8 text-center';
                      fallbackDiv.innerHTML = `
                        <p class="text-lg font-semibold">${currentProduct.name}</p>
                        <p class="text-sm mt-2">₺${currentProduct.price}</p>
                      `;
                      target.parentElement.appendChild(fallbackDiv);
                    }
                  }
                }}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 rounded-3xl" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Dekoratif glow efektleri */}
        <div className="absolute -bottom-4 -right-4 w-32 h-32 gradient-primary rounded-3xl blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/30 rounded-3xl blur-2xl pointer-events-none" />
      </motion.div>

      {/* Dot Indicators */}
      {products.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-3 bg-primary"
                  : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Ürün ${index + 1}'e geç`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
