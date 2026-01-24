import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowLeft, Plus, Minus, Check, Truck, Shield, RefreshCw, Loader2, ChevronRight, ChevronLeft, X, Star, MessageSquare, User, ThumbsUp, Send } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  getProductImage, 
  getProductImageByColor,
  getProductImagesByColor,
  formatPrice,
  DEFAULT_FEATURES, 
  DEFAULT_SPECS, 
  DEFAULT_COLORS 
} from "@/lib/helpers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BusinessCardForm, BusinessCardData, defaultBusinessCardData } from "@/components/forms/BusinessCardForm";
import { PetIdForm, PetIdData, defaultPetIdData } from "@/components/forms/PetIdForm";
import { RedirectForm, RedirectData, defaultRedirectData } from "@/components/forms/RedirectForm";

type NFCType = "business-card" | "pet-id" | "redirect" | "nfc-yok" | null;

interface Product {
  id: number;
  name: string;
  description: string | null;
  short_description: string | null;
  long_description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  features: string[] | null;
  colors: string[] | null;
  specs: Record<string, string> | null;
  monthly_subscription_fee: number;
  free_subscription_months: number;
  has_subscription?: boolean;
  is_active: boolean;
  nfc_type: NFCType;
  // İndirim alanları
  discount_percentage: number;
  is_discounted: boolean;
  discount_start_date: string | null;
  discount_end_date: string | null;
}

// İndirim aktif mi kontrol eden yardımcı fonksiyon
const isDiscountActive = (product: Product): boolean => {
  if (!product.is_discounted || !product.discount_percentage || product.discount_percentage <= 0) {
    return false;
  }
  const now = new Date();
  if (product.discount_start_date && new Date(product.discount_start_date) > now) {
    return false;
  }
  if (product.discount_end_date && new Date(product.discount_end_date) < now) {
    return false;
  }
  return true;
};

// İndirimli fiyatı hesaplayan yardımcı fonksiyon
const getDiscountedPrice = (product: Product): number => {
  if (!isDiscountActive(product)) {
    return product.price;
  }
  return Math.round(product.price * (1 - product.discount_percentage / 100));
};

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string;
  is_approved: boolean;
  admin_response: string | null;
  admin_response_at: string | null;
  helpful_count: number;
  created_at: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
  };
}

// Kategori bazlı NFC tipi belirleme (veritabanında nfc_type yoksa fallback)
const getNfcTypeFromCategory = (category: string): NFCType => {
  const cat = category?.toLowerCase() || "";
  if (cat.includes("profesyonel") || cat.includes("premium")) return "business-card";
  if (cat.includes("evcil") || cat.includes("pet")) return "pet-id";
  if (cat.includes("spor") || cat.includes("etkinlik")) return "redirect";
  return null;
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProductImage, setCurrentProductImage] = useState<string>("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagesByColor, setImagesByColor] = useState<Record<string, string[]>>({});
  
  // Customization form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData>(defaultBusinessCardData);
  const [petIdData, setPetIdData] = useState<PetIdData>(defaultPetIdData);
  const [redirectData, setRedirectData] = useState<RedirectData>(defaultRedirectData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [emailValidated, setEmailValidated] = useState(false);
  const [emailValidationAttempted, setEmailValidationAttempted] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError("Ürün ID bulunamadı");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Ürünü getir
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', parseInt(id))
          .single();

        if (productError) {
          if (productError.code === 'PGRST116') {
            setError("Ürün bulunamadı");
          } else {
            throw productError;
          }
          setLoading(false);
          return;
        }

        setProduct(productData);

        // Benzer ürünleri getir
        const { data: relatedData } = await supabase
          .from('products')
          .select('*')
          .eq('category', productData.category)
          .eq('is_active', true)
          .neq('id', productData.id)
          .limit(3);

        setRelatedProducts(relatedData || []);
      } catch (err: any) {
        console.error("Ürün yüklenirken hata:", err);
        setError("Ürün yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    // Sayfa değiştiğinde scroll'u sıfırla
    window.scrollTo(0, 0);
  }, [id]);

  // Yorumları yükle
  useEffect(() => {
    if (product?.id) {
      fetchReviews();
      checkCanReview();
    }
  }, [product?.id, user]);

  // Ürün yüklendiğinde tüm renklerin görsellerini önceden yükle
  useEffect(() => {
    const preloadAllColorImages = async () => {
      if (!product) return;
      
      const colors = product.colors?.length
        ? product.colors
        : DEFAULT_COLORS[product.category] || ["Standart"];
      
      // Tüm renklerin görsellerini paralel olarak yükle
      const imagePromises = colors.map(async (color) => {
        const images = await getProductImagesByColor(
          product.id,
          color,
          product.image_url,
          product.category
        );
        return { color, images };
      });
      
      const results = await Promise.all(imagePromises);
      const imagesMap: Record<string, string[]> = {};
      results.forEach(({ color, images }) => {
        imagesMap[color] = images;
        // Görselleri önceden yükle (preload)
        images.forEach((imgUrl) => {
          const img = new Image();
          img.src = imgUrl;
        });
      });
      
      setImagesByColor(imagesMap);
      
      // İlk rengin görsellerini ayarla
      const firstColor = colors[0];
      if (imagesMap[firstColor] && imagesMap[firstColor].length > 0) {
        setProductImages(imagesMap[firstColor]);
        setCurrentImageIndex(0);
        setCurrentProductImage(imagesMap[firstColor][0]);
      }
    };

    preloadAllColorImages();
  }, [product]);

  // Renk seçildiğinde görselleri güncelle (cache'den)
  useEffect(() => {
    if (!product || Object.keys(imagesByColor).length === 0) return;
    
    const colors = product.colors?.length
      ? product.colors
      : DEFAULT_COLORS[product.category] || ["Standart"];
    
    const selectedColorName = colors[selectedColor] || colors[0];
    
    // Cache'den görselleri al
    const images = imagesByColor[selectedColorName] || [];
    
    if (images.length > 0) {
      setProductImages(images);
      setCurrentImageIndex(0);
      setCurrentProductImage(images[0]);
    }
  }, [product, selectedColor, imagesByColor]);

  // Görsel değiştiğinde currentProductImage'i güncelle
  useEffect(() => {
    if (productImages.length > 0 && currentImageIndex < productImages.length) {
      setCurrentProductImage(productImages[currentImageIndex]);
    }
  }, [currentImageIndex, productImages]);

  // Klavye ile gezinme (sol/sağ ok tuşları)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (productImages.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentImageIndex((prev) => 
          prev > 0 ? prev - 1 : productImages.length - 1
        );
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentImageIndex((prev) => 
          prev < productImages.length - 1 ? prev + 1 : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productImages.length]);

  // Touch/swipe desteği için
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && productImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev < productImages.length - 1 ? prev + 1 : 0
      );
    }
    if (isRightSwipe && productImages.length > 1) {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : productImages.length - 1
      );
    }
  };

  // Görsel değiştirme fonksiyonları
  const goToPreviousImage = useCallback(() => {
    if (productImages.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev > 0 ? prev - 1 : productImages.length - 1
    );
  }, [productImages.length]);

  const goToNextImage = useCallback(() => {
    if (productImages.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev < productImages.length - 1 ? prev + 1 : 0
    );
  }, [productImages.length]);

  const fetchReviews = async () => {
    if (!product?.id) return;
    
    setReviewsLoading(true);
    try {
      // Onaylı yorumları getir
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          user_profiles:user_id (first_name, last_name)
        `)
        .eq("product_id", product.id)
        .eq("is_approved", true)
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      // Ortalama puan hesapla
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
        setReviewCount(data.length);
      }

      // Kullanıcının kendi yorumunu kontrol et
      if (user) {
        const { data: userReviewData } = await supabase
          .from("reviews")
          .select("*")
          .eq("product_id", product.id)
          .eq("user_id", user.id)
          .maybeSingle();
        
        setUserReview(userReviewData);
      }
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkCanReview = async () => {
    if (!user || !product?.id) {
      setCanReview(false);
      return;
    }

    try {
      // Kullanıcı bu ürünü satın almış mı? (orders tablosundan kontrol)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          order_items!inner (product_id)
        `)
        .eq("user_id", user.id)
        .eq("order_items.product_id", product.id)
        // Yorum için "ödeme başarısız/pending" siparişleri sayma
        .in("status", ["delivered", "shipped", "confirmed"]);

      console.log("Order check:", { orderData, orderError, productId: product.id, userId: user.id });

      const hasPurchased = orderData && orderData.length > 0;

      // Daha önce yorum yapmış mı?
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Review check:", { existingReview, hasPurchased });

      setCanReview(hasPurchased && !existingReview);
    } catch (err) {
      console.error("checkCanReview error:", err);
      setCanReview(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !product?.id || !reviewComment.trim()) {
      toast.error("Lütfen yorum yazınız");
      return;
    }

    setSubmittingReview(true);
    try {
      // RPC fonksiyonunu dene, yoksa direkt insert yap
      const { error: rpcError } = await supabase.rpc("create_review", {
        p_product_id: product.id,
        p_rating: reviewRating,
        p_title: reviewTitle.trim() || null,
        p_comment: reviewComment.trim(),
      });

      if (rpcError) {
        // RPC yoksa veya hata varsa, direkt insert dene
        if (rpcError.code === "PGRST202") {
          const { error: insertError } = await supabase.from("reviews").insert({
            user_id: user.id,
            product_id: product.id,
            rating: reviewRating,
            title: reviewTitle.trim() || null,
            comment: reviewComment.trim(),
            is_approved: false,
          });
          if (insertError) throw insertError;
        } else {
          throw rpcError;
        }
      }

      toast.success("Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır.");
      setShowReviewForm(false);
      setReviewRating(5);
      setReviewTitle("");
      setReviewComment("");
      setCanReview(false);
      checkCanReview();
    } catch (err: any) {
      console.error("Yorum gönderilemedi:", err);
      if (err.code === "23505") {
        toast.error("Bu ürüne zaten yorum yapmışsınız");
      } else {
        toast.error("Yorum gönderilemedi");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onSelect?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSelect?.(star)}
            className={`${interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Ürün yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Ürün bulunamadı"}</h1>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ürünlere Dön
          </Button>
        </div>
      </Layout>
    );
  }

  // Veritabanından gelen değerler veya kategori bazlı varsayılanlar
  const features = product.features?.length 
    ? product.features 
    : DEFAULT_FEATURES[product.category] || DEFAULT_FEATURES["Profesyonel"];
  
  const specs = product.specs && Object.keys(product.specs).length
    ? product.specs
    : DEFAULT_SPECS[product.category] || DEFAULT_SPECS["Profesyonel"];
  
  const colors = product.colors?.length
    ? product.colors
    : DEFAULT_COLORS[product.category] || ["Standart"];
  
  // İlk yüklemede görseli ayarla
  const productImage = currentProductImage || getProductImage(product.image_url, product.category);
  const longDescription = product.long_description || product.description || "Profesyonel NFC çözümü ile dijital varlığınızı paylaşın.";
  
  // NFC tipi belirleme
  const nfcType = product.nfc_type || getNfcTypeFromCategory(product.category);
  const hasSub = product.has_subscription !== false && nfcType !== "nfc-yok";
  const requiresCustomization = (nfcType === "business-card" || nfcType === "pet-id" || nfcType === "redirect");

  // Basit telefon numarası validasyonu - parse etmeden sadece rakam sayısını kontrol et
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || !phone.trim()) {
      console.log("validatePhoneNumber - phone is empty:", phone);
      return false;
    }
    
    // Önce tüm boşlukları temizle (input'ta boşluklarla gösteriliyor olabilir)
    const cleanPhone = phone.replace(/\s/g, "");
    console.log("validatePhoneNumber - input:", phone, "cleaned:", cleanPhone);
    
    // Bilinen country code'ları kontrol et (uzun olanlardan başla, yoksa +1 gibi kısa olanlar yanlış eşleşir)
    // Örnek: +358 ile başlıyorsa +3 ile eşleşmemeli
    const countryCodes = [
      "+358", "+971", "+966", // 3 haneli (önce kontrol et)
      "+90", "+44", "+49", "+33", "+39", "+34", "+31", "+32", "+41", "+43", "+46", "+47", "+45", "+86", "+81", "+82", "+91", "+20", "+27", "+61", "+64", "+55", "+52", "+54", // 2 haneli
      "+1", "+7" // 1 haneli (en son kontrol et)
    ];
    
    // Country code'u bul (uzun olanlardan başla)
    let countryCode = "";
    for (const code of countryCodes) {
      if (cleanPhone.startsWith(code)) {
        countryCode = code;
        break;
      }
    }
    
    if (!countryCode) {
      console.log("validatePhoneNumber - no known country code found");
      return false;
    }
    
    // Country code'dan sonraki kısmı al (sadece rakamlar)
    const afterCountryCode = cleanPhone.substring(countryCode.length);
    const phoneNumberDigits = afterCountryCode.replace(/\D/g, "").length;
    
    console.log("validatePhoneNumber - countryCode:", countryCode, "afterCountryCode:", afterCountryCode, "phoneNumberDigits:", phoneNumberDigits);
    
    return phoneNumberDigits === 10;
  };

  // Form doğrulama
  const validateBusinessCardForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    if (!businessCardData.name.trim()) errors.name = "İsim soyisim gereklidir";
    if (!businessCardData.title.trim()) errors.title = "Meslek ünvanı gereklidir";
    
    // Telefon numarası kontrolü - 10 haneli olmalı
    if (!businessCardData.phone.trim()) {
      errors.phone = "Telefon numarası gereklidir";
    } else if (!validatePhoneNumber(businessCardData.phone)) {
      errors.phone = "Lütfen telefon numarasını tam giriniz";
    }
    
    // Email kontrolü
    if (!businessCardData.email.trim()) {
      errors.email = "E-posta gereklidir";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessCardData.email)) {
      errors.email = "Geçerli bir e-posta adresi girin";
    } else if (!emailValidationAttempted) {
      // Email formatı geçerli ama henüz doğrulanmamış
      errors.email = "Lütfen emailin doğrulanmasını bekleyiniz";
    } else if (!emailValidated) {
      // Email doğrulanmaya çalışıldı ama geçersiz
      errors.email = "Email adresi doğrulanamadı. Lütfen geçerli bir email adresi girin";
    }
    
    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validatePetIdForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    if (!petIdData.petName.trim()) errors.petName = "Evcil hayvan adı gereklidir";
    if (!petIdData.ownerName.trim()) errors.ownerName = "Sahibi adı gereklidir";
    
    // Telefon numarası kontrolü - 10 haneli olmalı
    if (!petIdData.ownerPhone.trim()) {
      errors.ownerPhone = "Telefon numarası gereklidir";
    } else if (!validatePhoneNumber(petIdData.ownerPhone)) {
      errors.ownerPhone = "Lütfen telefon numarasını tam giriniz";
    }
    
    // Mikroçip numarası kontrolü - boşsa hata verme, doluysa 15 hane olmalı
    if (petIdData.microchipNumber && petIdData.microchipNumber.trim().length > 0) {
      const digitsOnly = petIdData.microchipNumber.replace(/\D/g, "");
      if (digitsOnly.length !== 15) {
        errors.microchipNumber = "Mikroçip numarası 15 haneli olmalıdır";
      }
    }
    
    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const validateRedirectForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    if (!redirectData.partnerName1.trim()) errors.partnerName1 = "1. kişi adı gereklidir";
    if (!redirectData.partnerName2.trim()) errors.partnerName2 = "2. kişi adı gereklidir";
    if (!redirectData.relationshipStartDate) errors.relationshipStartDate = "İlişki başlangıç tarihi gereklidir";
    setFormErrors(errors);
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  // Sepete ekleme işleyicisi
  const handleAddToCartClick = () => {
    if (requiresCustomization) {
      setIsFormOpen(true);
    } else {
      addProductToCart(null);
    }
  };

  const handleFormSubmit = async () => {
    // Aktif input'tan çık (blur event'ini tetikle)
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur();
      // Blur event'lerinin ve validasyonların tamamlanması için kısa bir süre bekle
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // State güncellemelerinin tamamlanması için bir sonraki render cycle'ı bekle
    // React state güncellemeleri asenkron olduğu için biraz daha uzun bekleyelim
    await new Promise(resolve => setTimeout(resolve, 200));

    let validationResult: { isValid: boolean; errors: Record<string, string> } | null = null;
    let customizationData: any = null;

    if (nfcType === "business-card") {
      validationResult = validateBusinessCardForm();
      if (validationResult.isValid) customizationData = { type: "business-card", ...businessCardData };
    } else if (nfcType === "pet-id") {
      validationResult = validatePetIdForm();
      if (validationResult.isValid) customizationData = { type: "pet-id", ...petIdData };
    } else if (nfcType === "redirect") {
      validationResult = validateRedirectForm();
      if (validationResult.isValid) customizationData = { type: "redirect", ...redirectData };
    }

    if (validationResult?.isValid && customizationData) {
      addProductToCart(customizationData);
      setIsFormOpen(false);
      // Formu sıfırla
      setBusinessCardData(defaultBusinessCardData);
      setPetIdData(defaultPetIdData);
      setRedirectData(defaultRedirectData);
      setFormErrors({});
      // Email validasyon durumunu da sıfırla
      setEmailValidated(false);
      setEmailValidationAttempted(false);
    } else if (validationResult) {
      // Validasyon başarısız oldu, ilk hatalı alana scroll yap
      scrollToFirstError(validationResult.errors);
    }
  };

  // İlk hatalı alana scroll yapma fonksiyonu
  const scrollToFirstError = (errors: Record<string, string>) => {
    // State güncellemesinin tamamlanması için kısa bir süre bekle
    setTimeout(() => {
      let firstErrorField: string | null = null;
      
      // İlk hatayı bul (sıralama önemli - formdaki sıraya göre)
      if (nfcType === "business-card") {
        // BusinessCard form alan sırası: name, title, phone, email
        if (errors.name) firstErrorField = "bc-name";
        else if (errors.title) firstErrorField = "bc-title";
        else if (errors.phone) firstErrorField = "bc-phone";
        else if (errors.email) firstErrorField = "bc-email";
      } else if (nfcType === "pet-id") {
        // PetId form alan sırası: petName, ownerName, ownerPhone, microchipNumber
        if (errors.petName) firstErrorField = "pet-name";
        else if (errors.ownerName) firstErrorField = "owner-name";
        else if (errors.ownerPhone) firstErrorField = "owner-phone";
        else if (errors.microchipNumber) firstErrorField = "microchip";
      } else if (nfcType === "redirect") {
        // Redirect form alan sırası: partnerName1, partnerName2, relationshipStartDate
        if (errors.partnerName1) firstErrorField = "partnerName1";
        else if (errors.partnerName2) firstErrorField = "partnerName2";
        else if (errors.relationshipStartDate) firstErrorField = "relationshipStartDate";
      }

      if (firstErrorField) {
        const errorElement = document.getElementById(firstErrorField);
        if (errorElement) {
          // Input alanına scroll yap, merkeze al
          errorElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Input'a focus yap
          errorElement.focus();
        }
      }
    }, 100);
  };

  const addProductToCart = (customization: any) => {
    // İndirimli fiyatı kullan
    const finalPrice = getDiscountedPrice(product);
    const baseCustomization: Record<string, unknown> = { renk: colors[selectedColor] };
    if (requiresCustomization) {
      baseCustomization.nfcType = nfcType;
      if (hasSub) {
        baseCustomization.subscriptionFee = product.monthly_subscription_fee || 29;
        // 0 geçerli bir değerdir (bedava ay yok); bu yüzden || yerine ?? kullan
        baseCustomization.freeSubscriptionMonths = product.free_subscription_months ?? 1;
      }
    }
    // İndirim bilgisini de ekle
    if (isDiscountActive(product)) {
      baseCustomization.originalPrice = product.price;
      baseCustomization.discountPercentage = product.discount_percentage;
    }
    if (customization) Object.assign(baseCustomization, customization);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: finalPrice,
        image: productImage,
        customization: { ...baseCustomization }
      });
    }
  };

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-primary transition-colors">Anasayfa</Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">Ürünler</Link>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          {/* Product Detail */}
          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-muted/30 rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center relative overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Image Container with Fade Animation */}
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImageIndex}
                    src={currentProductImage}
                    alt={`${product.name} - Görsel ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                  />
                </AnimatePresence>
              </div>
              
              {/* Discount Badge */}
              {isDiscountActive(product) && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                  <span className="text-sm font-bold">%{product.discount_percentage} İNDİRİM</span>
                </div>
              )}
              
              {/* Image Counter */}
              {productImages.length > 1 && (
                <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-muted-foreground">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              )}
              
              {/* Image Pagination Dots */}
              {productImages.length > 1 && (
                <div className="flex gap-2 mt-6">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentImageIndex === index
                          ? "bg-primary w-8"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
                      }`}
                      aria-label={`Görsel ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              
              {/* Navigation Arrows - Daha belirgin ve büyük */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/95 hover:bg-background backdrop-blur-sm border-2 border-border hover:border-primary flex items-center justify-center transition-all hover:scale-110 shadow-lg z-10 group"
                    aria-label="Önceki görsel"
                  >
                    <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-foreground group-hover:text-primary transition-colors" />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full bg-background/95 hover:bg-background backdrop-blur-sm border-2 border-border hover:border-primary flex items-center justify-center transition-all hover:scale-110 shadow-lg z-10 group"
                    aria-label="Sonraki görsel"
                  >
                    <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-foreground group-hover:text-primary transition-colors" />
                  </button>
                </>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col"
            >
              <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full w-fit mb-4">
                {product.category}
              </span>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4">{product.name}</h1>
              
              <p className="text-muted-foreground mb-6">
                {longDescription}
              </p>

              {/* Price */}
              <div className="mb-6">
                {/* İndirim Badge ve Fiyat */}
                {isDiscountActive(product) ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-lg">
                      <span className="text-sm font-bold">%{product.discount_percentage} İNDİRİM</span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl text-muted-foreground line-through">
                        ₺{product.price.toFixed(0)}
                      </span>
                      <span className="text-4xl font-bold text-red-500">
                        ₺{getDiscountedPrice(product)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gradient">
                      ₺{product.price.toFixed(0)}
                    </span>
                  </div>
                )}
                
                {hasSub ? (
                  <div className="mt-3 space-y-3">
                    <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                          {product.free_subscription_months || 1} Ay Bedava Abonelik Dahil!
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground pl-8">
                        Sadece ürün fiyatını ödeyin, ilk {product.free_subscription_months || 1} ay abonelik bizden hediye.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-xs font-medium">i</span>
                      <span>{product.free_subscription_months || 1} ay sonra aylık ₺{product.monthly_subscription_fee || 29} abonelik ücreti başlar</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Tek seferlik ödeme, abonelik yok</p>
                )}
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">
                  Renk: <span className="text-muted-foreground">{colors[selectedColor]}</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color, index) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(index)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedColor === index
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">Adet</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center text-lg font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart */}
              <Button size="lg" className="w-full mb-6" onClick={handleAddToCartClick}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                {requiresCustomization ? "Bilgileri Gir ve Sepete Ekle" : "Sepete Ekle"} - ₺{(getDiscountedPrice(product) * quantity).toFixed(0)}
              </Button>
              
              {requiresCustomization && (
                <p className="text-sm text-muted-foreground text-center -mt-4 mb-4">
                  * Bu ürün için NFC kartınızda görünecek bilgileri girmeniz gerekmektedir
                </p>
              )}

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t">
                <div className="flex flex-col items-center text-center">
                  <Truck className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">Ücretsiz Kargo</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">2 Yıl Garanti</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RefreshCw className="w-6 h-6 text-primary mb-2" />
                  <span className="text-xs text-muted-foreground">14 Gün İade</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Features & Specs */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h2 className="text-xl font-semibold mb-4">Özellikler</h2>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Specs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <h2 className="text-xl font-semibold mb-4">Teknik Özellikler</h2>
              <dl className="space-y-3">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">Değerlendirmeler</h2>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{averageRating}</span>
                    </div>
                    <span className="text-muted-foreground">({reviewCount} değerlendirme)</span>
                  </div>
                )}
              </div>
              {canReview && !showReviewForm && (
                <Button onClick={() => setShowReviewForm(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Yorum Yaz
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-card rounded-2xl p-6 border border-border/50 mb-6"
              >
                <h3 className="font-semibold mb-4">Değerlendirmenizi Yazın</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Puanınız</Label>
                    {renderStars(reviewRating, true, setReviewRating)}
                  </div>

                  <div>
                    <Label htmlFor="reviewTitle">Başlık (Opsiyonel)</Label>
                    <Input
                      id="reviewTitle"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Kısa bir başlık yazın..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reviewComment">Yorumunuz *</Label>
                    <textarea
                      id="reviewComment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Ürün hakkında deneyimlerinizi paylaşın..."
                      className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReviewForm(false);
                        setReviewRating(5);
                        setReviewTitle("");
                        setReviewComment("");
                      }}
                    >
                      İptal
                    </Button>
                    <Button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !reviewComment.trim()}
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Gönder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* User's pending review notice */}
            {userReview && !userReview.is_approved && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                <p className="text-amber-600 text-sm">
                  Yorumunuz admin onayı bekliyor. Onaylandıktan sonra burada görünecektir.
                </p>
              </div>
            )}

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-card rounded-2xl p-6 border border-border/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {review.user_profiles?.first_name || "Anonim"}{" "}
                            {review.user_profiles?.last_name?.charAt(0) || ""}.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>

                    {review.title && (
                      <h4 className="font-semibold mb-2">{review.title}</h4>
                    )}
                    <p className="text-muted-foreground">{review.comment}</p>

                    {/* Admin Response */}
                    {review.admin_response && (
                      <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-3">
                        <p className="text-xs font-medium text-primary mb-1">Esdodesign Yanıtı</p>
                        <p className="text-sm text-muted-foreground">{review.admin_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-2xl">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Henüz değerlendirme yok</p>
                {isAuthenticated() && !canReview && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Yorum yapabilmek için bu ürünü satın almanız gerekmektedir.
                  </p>
                )}
                {!isAuthenticated() && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <Link to="/login" className="text-primary hover:underline">Giriş yapın</Link> ve ürünü satın alarak yorum yapabilirsiniz.
                  </p>
                )}
              </div>
            )}
          </motion.div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold mb-6">Benzer Ürünler</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.id}
                    to={`/product/${relatedProduct.id}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 border border-border/50"
                  >
                    <div className="aspect-square p-6 bg-muted/30 flex items-center justify-center overflow-hidden">
                      <img
                        src={getProductImage(relatedProduct.image_url, relatedProduct.category)}
                        alt={relatedProduct.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{relatedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {relatedProduct.short_description || relatedProduct.description?.slice(0, 60)}
                      </p>
                      <span className="text-lg font-bold text-gradient">₺{relatedProduct.price}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* NFC Customization Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              {nfcType === "business-card" && "Dijital Kartvizit Bilgileri"}
              {nfcType === "pet-id" && "Evcil Hayvan Kimliği Bilgileri"}
              {nfcType === "redirect" && "Sevgililer Sayfası Bilgileri"}
            </DialogTitle>
            <DialogDescription>
              {nfcType === "redirect" 
                ? "Sevgilinizle özel sayfanızda görünecek bilgileri doldurun."
                : "NFC kartınızda görünecek bilgileri doldurun. Bu bilgiler siparişiniz onaylandıktan sonra NFC sayfanızda görünecektir."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {nfcType === "business-card" && (
              <BusinessCardForm
                data={businessCardData}
                onChange={setBusinessCardData}
                errors={formErrors}
                onEmailValidationChange={(attempted, isValid) => {
                  setEmailValidationAttempted(attempted);
                  setEmailValidated(isValid);
                }}
                onErrorClear={(field) => {
                  if (formErrors[field]) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[field];
                      return newErrors;
                    });
                  }
                }}
                onErrorSet={(field, message) => {
                  setFormErrors(prev => ({
                    ...prev,
                    [field]: message
                  }));
                }}
              />
            )}
            {nfcType === "pet-id" && (
              <PetIdForm
                data={petIdData}
                onChange={setPetIdData}
                errors={formErrors}
                onErrorClear={(field) => {
                  if (formErrors[field]) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[field];
                      return newErrors;
                    });
                  }
                }}
                onErrorSet={(field, message) => {
                  setFormErrors(prev => ({
                    ...prev,
                    [field]: message
                  }));
                }}
              />
            )}
            {nfcType === "redirect" && (
              <RedirectForm
                data={redirectData}
                onChange={setRedirectData}
                errors={formErrors}
                onErrorClear={(field) => {
                  if (formErrors[field]) {
                    setFormErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors[field];
                      return newErrors;
                    });
                  }
                }}
              />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              İptal
            </Button>
            <Button variant="hero" onClick={handleFormSubmit}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Sepete Ekle - ₺{(getDiscountedPrice(product) * quantity).toFixed(0)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
