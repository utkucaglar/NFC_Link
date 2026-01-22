import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, Tag, X, CheckCircle2, Loader2, Edit, User, Briefcase, Building, Mail, Phone, PawPrint, Heart, Calendar, Palette, Hash, MapPin, Linkedin, Instagram, Globe, FileText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { BusinessCardForm, BusinessCardData, defaultBusinessCardData } from "@/components/forms/BusinessCardForm";
import { PetIdForm, PetIdData, defaultPetIdData } from "@/components/forms/PetIdForm";
import { RedirectForm, RedirectData, defaultRedirectData } from "@/components/forms/RedirectForm";

// Kişiselleştirme gerektiren NFC tipleri
const CUSTOMIZATION_NFC_TYPES = ["business-card", "pet-id", "redirect"];

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, updateCustomization, cartTotal } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState("");
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    id: string;
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    discountAmount: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const navigate = useNavigate();

  // Edit customization state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData>(defaultBusinessCardData);
  const [petIdData, setPetIdData] = useState<PetIdData>(defaultPetIdData);
  const [redirectData, setRedirectData] = useState<RedirectData>(defaultRedirectData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [emailValidated, setEmailValidated] = useState(false);
  const [emailValidationAttempted, setEmailValidationAttempted] = useState(false);

  // Ürünün kişiselleştirme gerektirip gerektirmediğini kontrol et
  const requiresCustomization = (item: typeof cartItems[0]): boolean => {
    const nfcType = item.customization?.nfcType || item.customization?.type;
    return CUSTOMIZATION_NFC_TYPES.includes(nfcType);
  };

  // Tema ID'sini Türkçe isme çevir
  const getThemeName = (themeId: string, nfcType: string): string => {
    if (!themeId) return "";
    
    // Pet ID temaları
    if (nfcType === "pet-id") {
      const petThemes: Record<string, string> = {
        "default": "Turuncu",
        "warm": "Sıcak",
        "cool": "Mavi",
        "nature": "Doğa",
      };
      return petThemes[themeId] || themeId;
    }
    
    // Business Card temaları
    if (nfcType === "business-card") {
      const businessCardThemes: Record<string, string> = {
        "default": "Klasik",
        "modern": "Modern",
        "minimal": "Minimal",
        "gradient": "Gradient",
      };
      return businessCardThemes[themeId] || themeId;
    }
    
    // Redirect temaları
    if (nfcType === "redirect") {
      const redirectThemes: Record<string, string> = {
        "romantic": "Romantik",
        "elegant": "Zarif",
        "modern": "Modern",
        "nature": "Doğa",
        "ocean": "Okyanus",
        "sunset": "Gün Batımı",
      };
      return redirectThemes[themeId] || themeId;
    }
    
    return themeId;
  };

  // Telefon numarasını formatla (görüntüleme için)
  const formatPhoneForDisplay = (phone: string): string => {
    if (!phone) return "";
    const cleanPhone = phone.replace(/\s/g, "");
    // Country code'u bul
    const countryCodes = [
      "+358", "+971", "+966",
      "+90", "+44", "+49", "+33", "+39", "+34", "+31", "+32", "+41", "+43", "+46", "+47", "+45", "+86", "+81", "+82", "+91", "+20", "+27", "+61", "+64", "+55", "+52", "+54",
      "+1", "+7"
    ];
    let countryCode = "";
    for (const code of countryCodes) {
      if (cleanPhone.startsWith(code)) {
        countryCode = code;
        break;
      }
    }
    if (countryCode) {
      const number = cleanPhone.substring(countryCode.length);
      // Türkiye için özel format: +90 123 456 78 90
      if (countryCode === "+90" && number.length === 10) {
        return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 8)} ${number.slice(8, 10)}`;
      }
      return `${countryCode} ${number}`;
    }
    return phone;
  };

  // Customization bilgilerini render et
  const renderCustomizationInfo = (item: typeof cartItems[0]) => {
    if (!item.customization) return null;

    const nfcType = item.customization.nfcType || item.customization.type;
    const customization = item.customization;

    if (nfcType === "business-card") {
      return (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary/80 mb-2">
            <Briefcase className="w-3 h-3" />
            <span>Dijital Kartvizit Bilgileri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {customization.name && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">İsim:</span>
                  <span className="ml-1 font-medium">{customization.name}</span>
                </div>
              </div>
            )}
            {customization.title && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Ünvan:</span>
                  <span className="ml-1 font-medium">{customization.title}</span>
                </div>
              </div>
            )}
            {customization.company && (
              <div className="flex items-start gap-2">
                <Building className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Şirket:</span>
                  <span className="ml-1 font-medium">{customization.company}</span>
                </div>
              </div>
            )}
            {customization.email && (
              <div className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">E-posta:</span>
                  <span className="ml-1 font-medium truncate block">{customization.email}</span>
                </div>
              </div>
            )}
            {customization.phone && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Telefon:</span>
                  <span className="ml-1 font-medium">{formatPhoneForDisplay(customization.phone)}</span>
                </div>
              </div>
            )}
            {customization.theme && (
              <div className="flex items-start gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Tema:</span>
                  <span className="ml-1 font-medium">{getThemeName(customization.theme, "business-card")}</span>
                </div>
              </div>
            )}
            {/* Tecrübeler ve iş açıklaması */}
            {customization.bio && (
              <div className="flex items-start gap-2 sm:col-span-2 pt-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">Tecrübeler ve İş Açıklaması:</span>
                  <p className="ml-1 font-medium text-sm mt-0.5">{customization.bio}</p>
                </div>
              </div>
            )}
            {/* Sosyal medya ve web - tik işareti ile */}
            {(customization.linkedin || customization.instagram || customization.website) && (
              <div className="flex items-center gap-3 sm:col-span-2 pt-1">
                {customization.linkedin && (
                  <div className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-muted-foreground" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                )}
                {customization.instagram && (
                  <div className="flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-muted-foreground" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                )}
                {customization.website && (
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (nfcType === "pet-id") {
      return (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary/80 mb-2">
            <PawPrint className="w-3 h-3" />
            <span>Evcil Hayvan Kimliği Bilgileri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {customization.petName && (
              <div className="flex items-start gap-2">
                <PawPrint className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Evcil Hayvan:</span>
                  <span className="ml-1 font-medium">{customization.petName}</span>
                </div>
              </div>
            )}
            {customization.ownerName && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Sahibi:</span>
                  <span className="ml-1 font-medium">{customization.ownerName}</span>
                </div>
              </div>
            )}
            {customization.ownerPhone && (
              <div className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Telefon:</span>
                  <span className="ml-1 font-medium">{formatPhoneForDisplay(customization.ownerPhone)}</span>
                </div>
              </div>
            )}
            {customization.address && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">Adres:</span>
                  <span className="ml-1 font-medium">{customization.address}</span>
                </div>
              </div>
            )}
            {customization.microchipNumber && (
              <div className="flex items-start gap-2">
                <Hash className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Mikroçip:</span>
                  <span className="ml-1 font-medium font-mono text-xs">{customization.microchipNumber}</span>
                </div>
              </div>
            )}
            {customization.healthNotes && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Heart className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">Sağlık Notları:</span>
                  <span className="ml-1 font-medium">{customization.healthNotes}</span>
                </div>
              </div>
            )}
            {customization.theme && (
              <div className="flex items-start gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Tema:</span>
                  <span className="ml-1 font-medium">{getThemeName(customization.theme, "pet-id")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (nfcType === "redirect") {
      return (
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-2 text-xs font-medium text-primary/80 mb-2">
            <Heart className="w-3 h-3" />
            <span>Sevgililer Sayfası Bilgileri</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {customization.partnerName1 && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">1. Kişi:</span>
                  <span className="ml-1 font-medium">{customization.partnerName1}</span>
                </div>
              </div>
            )}
            {customization.partnerName2 && (
              <div className="flex items-start gap-2">
                <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">2. Kişi:</span>
                  <span className="ml-1 font-medium">{customization.partnerName2}</span>
                </div>
              </div>
            )}
            {customization.relationshipStartDate && (
              <div className="flex items-start gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Başlangıç:</span>
                  <span className="ml-1 font-medium">
                    {new Date(customization.relationshipStartDate).toLocaleDateString("tr-TR")}
                  </span>
                </div>
              </div>
            )}
            {customization.subtitle && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <Heart className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-muted-foreground">Mesaj:</span>
                  <span className="ml-1 font-medium italic">{customization.subtitle}</span>
                </div>
              </div>
            )}
            {customization.theme && (
              <div className="flex items-start gap-2">
                <Palette className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <span className="text-muted-foreground">Tema:</span>
                  <span className="ml-1 font-medium">{getThemeName(customization.theme, "redirect")}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const handleQuantityChange = (id: number, change: number, item: typeof cartItems[0]) => {
    // Artırma işlemi ve kişiselleştirme gerektiren ürün
    if (change > 0 && requiresCustomization(item)) {
      // Ürün detay sayfasına yönlendir
      toast.info("Her NFC için ayrı bilgi girmeniz gerekiyor");
      navigate(`/product/${item.productId || item.id}`);
      return;
    }

    const newQuantity = Math.max(1, item.quantity + change);
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: number) => {
    removeFromCart(id);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setDiscountError("İndirim kodu giriniz");
      return;
    }

    setDiscountLoading(true);
    setDiscountError("");

    try {
      // İndirim kodunu kontrol et
      const { data: discount, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !discount) {
        setDiscountError("Geçersiz indirim kodu");
        setDiscountLoading(false);
        return;
      }

      // Tarih kontrolü
      const now = new Date();
      if (discount.starts_at && new Date(discount.starts_at) > now) {
        setDiscountError("Bu indirim kodu henüz aktif değil");
        setDiscountLoading(false);
        return;
      }
      if (discount.expires_at && new Date(discount.expires_at) < now) {
        setDiscountError("Bu indirim kodunun süresi dolmuş");
        setDiscountLoading(false);
        return;
      }

      // Kullanım limiti kontrolü
      if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
        setDiscountError("Bu indirim kodu kullanım limitine ulaşmış");
        setDiscountLoading(false);
        return;
      }

      // Minimum tutar kontrolü
      if (discount.min_order_amount && subtotal < discount.min_order_amount) {
        setDiscountError(`Minimum sipariş tutarı: ₺${discount.min_order_amount}`);
        setDiscountLoading(false);
        return;
      }

      // Kullanıcı başına kullanım kontrolü
      if (user && discount.per_user_limit) {
        const { count } = await supabase
          .from("discount_usages")
          .select("*", { count: "exact", head: true })
          .eq("discount_id", discount.id)
          .eq("user_id", user.id);

        if (count && count >= discount.per_user_limit) {
          setDiscountError("Bu indirim kodunu daha önce kullandınız");
          setDiscountLoading(false);
          return;
        }
      }

      // İndirim miktarını hesapla
      let calculatedDiscount = 0;
      if (discount.discount_type === "percentage") {
        calculatedDiscount = (subtotal * discount.discount_value) / 100;
        // Max indirim limiti kontrolü
        if (discount.max_discount_amount && calculatedDiscount > discount.max_discount_amount) {
          calculatedDiscount = discount.max_discount_amount;
        }
      } else {
        calculatedDiscount = discount.discount_value;
      }

      // İndirim tutarı sipariş tutarını geçemez
      calculatedDiscount = Math.min(calculatedDiscount, subtotal);

      setAppliedDiscount({
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        discountAmount: calculatedDiscount,
      });

      // İndirim bilgisini localStorage'a kaydet (checkout'ta kullanmak için)
      localStorage.setItem("appliedDiscount", JSON.stringify({
        id: discount.id,
        code: discount.code,
        discount_type: discount.discount_type,
        discount_value: discount.discount_value,
        discountAmount: calculatedDiscount,
      }));

      toast.success(`İndirim kodu uygulandı: ₺${calculatedDiscount.toFixed(2)} indirim`);
    } catch (err) {
      console.error("İndirim kodu hatası:", err);
      setDiscountError("İndirim kodu uygulanamadı");
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setCouponCode("");
    setDiscountError("");
    localStorage.removeItem("appliedDiscount");
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Sepetiniz boş");
      return;
    }
    navigate("/checkout");
  };

  // Basit telefon numarası validasyonu
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone || !phone.trim()) return false;
    const cleanPhone = phone.replace(/\s/g, "");
    const countryCodes = [
      "+358", "+971", "+966",
      "+90", "+44", "+49", "+33", "+39", "+34", "+31", "+32", "+41", "+43", "+46", "+47", "+45", "+86", "+81", "+82", "+91", "+20", "+27", "+61", "+64", "+55", "+52", "+54",
      "+1", "+7"
    ];
    let countryCode = "";
    for (const code of countryCodes) {
      if (cleanPhone.startsWith(code)) {
        countryCode = code;
        break;
      }
    }
    if (!countryCode) return false;
    const afterCountryCode = cleanPhone.substring(countryCode.length);
    const phoneNumberDigits = afterCountryCode.replace(/\D/g, "").length;
    return phoneNumberDigits === 10;
  };

  // Form doğrulama
  const validateBusinessCardForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!businessCardData.name.trim()) errors.name = "İsim soyisim gereklidir";
    if (!businessCardData.title.trim()) errors.title = "Meslek ünvanı gereklidir";
    if (!businessCardData.phone.trim()) {
      errors.phone = "Telefon numarası gereklidir";
    } else if (!validatePhoneNumber(businessCardData.phone)) {
      errors.phone = "Lütfen telefon numarasını tam giriniz";
    }
    if (!businessCardData.email.trim()) {
      errors.email = "E-posta gereklidir";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessCardData.email)) {
      errors.email = "Geçerli bir e-posta adresi girin";
    } else if (!emailValidationAttempted) {
      errors.email = "Lütfen emailin doğrulanmasını bekleyiniz";
    } else if (!emailValidated) {
      errors.email = "Email adresi doğrulanamadı. Lütfen geçerli bir email adresi girin";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePetIdForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!petIdData.petName.trim()) errors.petName = "Evcil hayvan adı gereklidir";
    if (!petIdData.ownerName.trim()) errors.ownerName = "Sahibi adı gereklidir";
    if (!petIdData.ownerPhone.trim()) {
      errors.ownerPhone = "Telefon numarası gereklidir";
    } else if (!validatePhoneNumber(petIdData.ownerPhone)) {
      errors.ownerPhone = "Lütfen telefon numarasını tam giriniz";
    }
    if (petIdData.microchipNumber && petIdData.microchipNumber.trim().length > 0) {
      const digitsOnly = petIdData.microchipNumber.replace(/\D/g, "");
      if (digitsOnly.length !== 15) {
        errors.microchipNumber = "Mikroçip numarası 15 haneli olmalıdır";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRedirectForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!redirectData.partnerName1.trim()) errors.partnerName1 = "1. kişi adı gereklidir";
    if (!redirectData.partnerName2.trim()) errors.partnerName2 = "2. kişi adı gereklidir";
    if (!redirectData.relationshipStartDate) errors.relationshipStartDate = "İlişki başlangıç tarihi gereklidir";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Düzenle butonuna tıklandığında
  const handleEditClick = (item: typeof cartItems[0]) => {
    if (!requiresCustomization(item)) return;
    
    setEditingItemId(item.id);
    const nfcType = item.customization?.nfcType || item.customization?.type;
    
    // Mevcut customization verilerini form state'lerine yükle
    if (nfcType === "business-card") {
      setBusinessCardData({
        name: item.customization?.name || "",
        title: item.customization?.title || "",
        company: item.customization?.company || "",
        phone: item.customization?.phone || "",
        email: item.customization?.email || "",
        bio: item.customization?.bio || "",
        linkedin: item.customization?.linkedin || "",
        instagram: item.customization?.instagram || "",
        website: item.customization?.website || "",
        theme: item.customization?.theme || "default",
      });
      setEmailValidated(false);
      setEmailValidationAttempted(false);
    } else if (nfcType === "pet-id") {
      setPetIdData({
        petName: item.customization?.petName || "",
        petImage: item.customization?.petImage || "",
        petMessage: item.customization?.petMessage || defaultPetIdData.petMessage,
        ownerName: item.customization?.ownerName || "",
        ownerPhone: item.customization?.ownerPhone || "",
        address: item.customization?.address || "",
        healthNotes: item.customization?.healthNotes || "",
        microchipNumber: item.customization?.microchipNumber || "",
        theme: item.customization?.theme || "default",
      });
    } else if (nfcType === "redirect") {
      setRedirectData({
        partnerName1: item.customization?.partnerName1 || "",
        partnerName2: item.customization?.partnerName2 || "",
        relationshipStartDate: item.customization?.relationshipStartDate || "",
        backgroundImage: item.customization?.backgroundImage || "",
        subtitle: item.customization?.subtitle || defaultRedirectData.subtitle,
        theme: item.customization?.theme || "romantic",
      });
    }
    
    setFormErrors({});
    setIsEditFormOpen(true);
  };

  // Form submit
  const handleEditFormSubmit = async () => {
    if (editingItemId === null) return;

    // Aktif input'tan çık
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.blur();
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    await new Promise(resolve => setTimeout(resolve, 200));

    const item = cartItems.find(i => i.id === editingItemId);
    if (!item) return;

    const nfcType = item.customization?.nfcType || item.customization?.type;
    let isValid = false;
    let customizationData: any = null;

    if (nfcType === "business-card") {
      isValid = validateBusinessCardForm();
      if (isValid) customizationData = { type: "business-card", ...businessCardData };
    } else if (nfcType === "pet-id") {
      isValid = validatePetIdForm();
      if (isValid) customizationData = { type: "pet-id", ...petIdData };
    } else if (nfcType === "redirect") {
      isValid = validateRedirectForm();
      if (isValid) customizationData = { type: "redirect", ...redirectData };
    }

    if (isValid && customizationData) {
      // Mevcut customization'ı koru (renk, nfcType, subscriptionFee gibi)
      const updatedCustomization = {
        ...item.customization,
        ...customizationData,
        nfcType: nfcType,
      };
      
      updateCustomization(editingItemId, updatedCustomization);
      setIsEditFormOpen(false);
      setEditingItemId(null);
      setFormErrors({});
      setBusinessCardData(defaultBusinessCardData);
      setPetIdData(defaultPetIdData);
      setRedirectData(defaultRedirectData);
      setEmailValidated(false);
      setEmailValidationAttempted(false);
    }
  };

  const subtotal = cartTotal;
  const discountAmount = appliedDiscount?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Sepetim</span>
            </h1>
            <p className="text-muted-foreground">
              {cartItems.length} ürün sepetinizde
            </p>
          </motion.div>

          {cartItems.length > 0 ? (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-2xl p-4 md:p-6 shadow-card border border-border/50 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                      {/* Image */}
                      <Link 
                        to={`/product/${item.productId || item.id}`} 
                        className="w-full sm:w-28 h-28 md:w-32 md:h-32 bg-muted/30 rounded-xl flex items-center justify-center shrink-0 hover:bg-muted/50 transition-colors overflow-hidden group"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 md:w-24 md:h-24 object-contain group-hover:scale-110 transition-transform duration-300"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.productId || item.id}`}>
                          <h3 className="font-semibold mb-2 hover:text-primary transition-colors cursor-pointer text-lg">
                            {item.name}
                          </h3>
                        </Link>
                        
                        {/* Renk bilgisi */}
                        {item.customization?.renk && (
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-md mb-2">
                            <div 
                              className="w-3 h-3 rounded-full border border-border"
                              style={{
                                backgroundColor: item.customization.renk.toLowerCase().includes('pembe') ? '#fce7f3' :
                                                item.customization.renk.toLowerCase().includes('mavi') ? '#dbeafe' :
                                                item.customization.renk.toLowerCase().includes('yeşil') ? '#d1fae5' :
                                                item.customization.renk.toLowerCase().includes('kırmızı') ? '#fee2e2' :
                                                item.customization.renk.toLowerCase().includes('siyah') ? '#1f2937' :
                                                item.customization.renk.toLowerCase().includes('beyaz') ? '#ffffff' :
                                                '#e5e7eb'
                              }}
                            />
                            <span className="text-xs font-medium text-muted-foreground">
                              {item.customization.renk}
                            </span>
                          </div>
                        )}

                        {/* Kişiselleştirme bilgileri */}
                        {item.customization && renderCustomizationInfo(item)}

                        {/* Fiyat */}
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xl font-bold text-gradient">
                            ₺{Math.round(item.price)}
                            {item.customization?.subscriptionFee != null ? (
                              <span className="text-sm font-normal text-muted-foreground"> (1 ay abonelik dahil)</span>
                            ) : (
                              <span className="text-sm font-normal text-muted-foreground"> (Abonelik yok)</span>
                            )}
                          </p>
                        </div>

                        {/* Bilgilendirme ve Düzenle butonu */}
                        {requiresCustomization(item) && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                              <p className="text-xs text-amber-700 leading-relaxed">
                                Her NFC için ayrı bilgi girmeniz gerekmektedir. Miktar artırmak için ürün detay sayfasından yeni ekleme yapabilirsiniz.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleEditClick(item)}
                            >
                              <Edit className="w-3.5 h-3.5 mr-1.5" />
                              Kişiselleştirmeyi Düzenle
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, -1, item)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          {requiresCustomization(item) ? (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, 1, item)}
                              title="Yeni NFC eklemek için bilgi girmeniz gerekiyor"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleQuantityChange(item.id, 1, item)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-1"
              >
                <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 sticky top-24">
                  <h2 className="text-xl font-semibold mb-6">Sipariş Özeti</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ürünler</span>
                      <span>₺{subtotal}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between text-sm text-accent">
                        <span>İndirim ({appliedDiscount.code})</span>
                        <span>-₺{appliedDiscount.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kargo</span>
                      <span className="text-accent">Ücretsiz</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Toplam</span>
                      <div className="text-right">
                        {appliedDiscount && (
                          <span className="text-sm text-muted-foreground line-through mr-2">
                            ₺{subtotal}
                          </span>
                        )}
                        <span className="text-2xl font-bold text-gradient">₺{total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon */}
                  {appliedDiscount ? (
                    <div className="flex items-center justify-between bg-accent/10 border border-accent/30 rounded-lg p-3 mb-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-sm font-medium">{appliedDiscount.code}</span>
                        <span className="text-xs text-accent">
                          (-₺{appliedDiscount.discountAmount.toFixed(2)})
                        </span>
                      </div>
                      <button
                        onClick={handleRemoveDiscount}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mb-6 space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            placeholder="İndirim kodu" 
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value.toUpperCase());
                              setDiscountError("");
                            }}
                            className="pl-10 uppercase"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={handleApplyCoupon}
                          disabled={discountLoading}
                        >
                          {discountLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Uygula"
                          )}
                        </Button>
                      </div>
                      {discountError && (
                        <p className="text-xs text-destructive">{discountError}</p>
                      )}
                    </div>
                  )}

                  <Button variant="hero" className="w-full" size="lg" onClick={handleCheckout}>
                    Ödemeye Geç
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Stripe ile güvenli ödeme
                  </p>
                </div>
              </motion.div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Sepetiniz Boş</h2>
              <p className="text-muted-foreground mb-6">
                Henüz sepetinize ürün eklemediniz.
              </p>
              <Link to="/products">
                <Button variant="hero">
                  Ürünleri Keşfet
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* Edit Customization Dialog */}
      {editingItemId !== null && (
        <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Kişiselleştirmeyi Düzenle
              </DialogTitle>
              <DialogDescription>
                NFC kartınızda görünecek bilgileri güncelleyin.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {(() => {
                const item = cartItems.find(i => i.id === editingItemId);
                if (!item) return null;
                const nfcType = item.customization?.nfcType || item.customization?.type;
                
                if (nfcType === "business-card") {
                  return (
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
                  );
                } else if (nfcType === "pet-id") {
                  return (
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
                  );
                } else if (nfcType === "redirect") {
                  return (
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
                  );
                }
                return null;
              })()}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditFormOpen(false);
                setEditingItemId(null);
                setFormErrors({});
              }}>
                İptal
              </Button>
              <Button variant="hero" onClick={handleEditFormSubmit}>
                <Edit className="w-4 h-4 mr-2" />
                Güncelle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
}
