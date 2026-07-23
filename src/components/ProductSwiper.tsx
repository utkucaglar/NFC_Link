import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface ShowcaseImage {
  id: string;
  url: string;
  link?: string;
}

interface ProductSwiperProps {
  autoPlayInterval?: number; // Otomatik geçiş süresi (ms)
}

export default function ProductSwiper({ autoPlayInterval = 4000 }: ProductSwiperProps) {
  const [images, setImages] = useState<ShowcaseImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dragDirection, setDragDirection] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Veritabanından vitrin görsellerini çek
  useEffect(() => {
    let isMounted = true;

    const fetchShowcaseImages = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "showcase_images")
          .single();

        if (!isMounted) return;

        if (error) {
          console.error('Showcase images fetch error:', error);
          setLoading(false);
          return;
        }

        if (data && data.value) {
          try {
            const parsedImages = JSON.parse(data.value);
            if (Array.isArray(parsedImages) && parsedImages.length > 0) {
              setImages(parsedImages);
              setCurrentIndex(0);
            }
          } catch (parseErr) {
            console.error('JSON parse error:', parseErr);
          }
        }
        setLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching showcase images:', err);
        setLoading(false);
      }
    };

    fetchShowcaseImages();

    return () => {
      isMounted = false;
    };
  }, []);

  // Otomatik geçiş
  useEffect(() => {
    if (images.length <= 1) return;

    const startAutoPlay = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, autoPlayInterval);
    };

    startAutoPlay();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [images.length, autoPlayInterval]);

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
    
    if (wasSignificantDrag && images.length > 0) {
      if (info.offset.x > 0) {
        // Sağa swipe - önceki görsel (sarmalama ile)
        const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
        goToSlide(newIndex);
      } else {
        // Sola swipe - sonraki görsel (sarmalama ile)
        const newIndex = (currentIndex + 1) % images.length;
        goToSlide(newIndex);
      }
    } else {
      // Swipe yeterli değilse otomatik geçişi yeniden başlat
      if (images.length > 1) {
        intervalRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % images.length);
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
        setCurrentIndex((prev) => (prev + 1) % images.length);
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

  if (!images || images.length === 0) {
    // Görsel yoksa boş göster
    return (
      <div className="relative w-full max-w-lg mx-auto">
        <div className="aspect-square rounded-3xl shadow-2xl bg-muted/30 flex items-center justify-center">
          <p className="text-muted-foreground text-center px-4">
            Vitrin görseli bulunamadı.<br />
            <span className="text-sm">Admin panelinden görsel ekleyin.</span>
          </p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  const ImageContent = () => (
    <div className="block aspect-square bg-muted/30 flex items-center justify-center overflow-hidden relative group cursor-pointer">
      <img
        src={currentImage.url}
        alt={`Vitrin ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-300 rounded-3xl" />
    </div>
  );

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
            {currentImage.link ? (
              <Link to={currentImage.link} onClick={handleImageClick}>
                <ImageContent />
              </Link>
            ) : (
              <div onClick={handleImageClick}>
                <ImageContent />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dekoratif glow efektleri */}
        <div className="absolute -bottom-4 -right-4 w-32 h-32 gradient-primary rounded-3xl blur-2xl opacity-50 pointer-events-none" />
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/30 rounded-3xl blur-2xl pointer-events-none" />
      </motion.div>

      {/* Dot Indicators */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentIndex
                  ? "w-8 h-3 bg-primary"
                  : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Görsel ${index + 1}'e geç`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
