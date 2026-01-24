import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  CreditCard, 
  Shield, 
  Truck,
  ChevronRight,
  User,
  Building,
  Check,
  CheckCircle2,
  Loader2,
  X
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ShippingAddress } from "@/lib/supabase";
import { sendOrderStatusSms } from "@/lib/sms";
import { sendOrderStatusEmail, sendNewOrderNotificationToAdmins } from "@/lib/email";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { toUpperCaseTurkish } from "@/lib/helpers";
import { createPayTRToken, encodeBasket, loadPayTRIframe, checkPaymentStatus } from "@/lib/paytr";

const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

// Türkiye illeri
const cities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
  "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
  "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
  "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
  "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
  "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
  "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
  "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
  "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].sort();

interface ShippingFormData {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  district: string;
  postalCode: string;
  notes: string;
}

// Benzersiz NFC anahtarı oluştur
const generateUniqueKey = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
};

// Kargo ayarları interface
interface ShippingSettings {
  free_shipping_threshold: number;
  shipping_cost: number;
  is_enabled: boolean;
}

const defaultShippingSettings: ShippingSettings = {
  free_shipping_threshold: 500,
  shipping_cost: 50,
  is_enabled: true,
};

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [formData, setFormData] = useState<ShippingFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    postalCode: "",
    notes: ""
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // PayTR state
  const [showPayTRIframe, setShowPayTRIframe] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Terms acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Checkout completed flag - to prevent redirect to cart after clearing
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  // Load saved addresses
  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  // Kargo ayarlarını yükle
  useEffect(() => {
    const fetchShippingSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "shipping_settings")
          .single();

        if (data) {
          setShippingSettings(JSON.parse(data.value));
        }
      } catch (err) {
        console.error("Kargo ayarları yüklenemedi:", err);
      }
    };

    fetchShippingSettings();
  }, []);

  // Kargo ücretini hesapla
  const calculateShipping = (): number => {
    if (!shippingSettings.is_enabled) return 0;
    if (cartTotal >= shippingSettings.free_shipping_threshold) return 0;
    return shippingSettings.shipping_cost;
  };

  const shippingCost = calculateShipping();
  const isFreeShipping = shippingCost === 0;

  // Pre-fill form with user profile data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phone: profile.phone || ""
      }));
    }
  }, [profile]);

  // Load default address if available
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const defaultAddress = savedAddresses.find(addr => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
        setUseSavedAddress(true);
        loadAddressToForm(defaultAddress);
      }
    }
  }, [savedAddresses]);

  const fetchSavedAddresses = async () => {
    if (!user) return;
    
    setLoadingAddresses(true);
    try {
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true) // Sadece aktif adresleri getir
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadAddressToForm = (address: ShippingAddress) => {
    setFormData({
      firstName: address.first_name,
      lastName: address.last_name,
      phone: address.phone,
      addressLine1: address.address_line1,
      addressLine2: address.address_line2 || "",
      city: address.city,
      district: address.district || "",
      postalCode: address.postal_code,
      notes: address.notes || ""
    });
  };

  const handleSelectAddress = (address: ShippingAddress) => {
    setSelectedAddressId(address.id);
    setUseSavedAddress(true);
    loadAddressToForm(address);
  };

  const handleUseNewAddress = () => {
    setUseSavedAddress(false);
    setSelectedAddressId(null);
    // Reset form to profile data
    if (profile) {
      setFormData({
        firstName: profile.first_name || "",
        lastName: profile.last_name || "",
        phone: profile.phone || "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        postalCode: "",
        notes: ""
      });
    }
  };

  // Redirect if cart is empty (but not after successful checkout)
  useEffect(() => {
    if (cartItems.length === 0 && !checkoutCompleted) {
      navigate("/cart");
    }
  }, [cartItems, navigate, checkoutCompleted]);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Yalnızca auth durumu kontrol edildiğinde yönlendir
    if (user === null && !loading) {
      toast.error("Ödeme yapmak için giriş yapmalısınız");
      navigate("/login?redirect=/checkout");
    }
  }, [user, loading, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateShippingForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Kayıtlı adres kullanılsa bile telefon kontrolü yap
    if (!formData.phone || !formData.phone.trim()) {
      newErrors.phone = "Telefon numarası gereklidir";
    }

    // If using saved address, only check phone
    if (useSavedAddress && selectedAddressId) {
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    
    if (!formData.firstName.trim()) newErrors.firstName = "İsim gereklidir";
    if (!formData.lastName.trim()) newErrors.lastName = "Soyisim gereklidir";
    if (!formData.phone.trim()) newErrors.phone = "Telefon numarası gereklidir";
    else {
      const phoneNumber = formData.phone.replace(/\s/g, '');
      if (!/^0[0-9]{10}$/.test(phoneNumber)) {
        newErrors.phone = "Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır (örn: 05XXXXXXXXX)";
      }
    }
    if (!formData.addressLine1.trim()) newErrors.addressLine1 = "Adres gereklidir";
    if (!formData.city) newErrors.city = "İl seçiniz";
    if (!formData.postalCode.trim()) newErrors.postalCode = "Posta kodu gereklidir";
    else if (!/^[0-9]{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = "Geçerli bir posta kodu girin (5 haneli)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToPayment = () => {
    if (validateShippingForm()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePayment = async () => {
    // Sözleşme onayı kontrolü
    if (!termsAccepted) {
      toast.error("Ödeme yapmak için sözleşmeleri onaylamanız gerekmektedir.");
      return;
    }

    setLoading(true);
    
    try {
      // Profil bilgileri kontrolü - isim, soyisim ve telefon numarası
      if (!profile) {
        toast.error("Profil bilgileriniz yüklenemedi. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      const missingFields: string[] = [];
      
      if (!profile.first_name || !profile.first_name.trim()) {
        missingFields.push("isim");
      }
      
      if (!profile.last_name || !profile.last_name.trim()) {
        missingFields.push("soyisim");
      }
      
      if (!profile.phone || !profile.phone.trim()) {
        missingFields.push("telefon numarası");
      }

      if (missingFields.length > 0) {
        const missingText = missingFields
          .map(field => {
            if (field === "isim") return "İsim";
            if (field === "soyisim") return "Soyisim";
            if (field === "telefon numarası") return "Telefon Numarası";
            return field;
          })
          .join(", ");
        toast.error(`Ödeme yapmak için profil bilgilerinizi tamamlamanız gerekiyor. Eksik: ${missingText}`);
        setLoading(false);
        // Profil sayfasına yönlendir, eksik alanları belirt
        navigate(`/profile?missing=${missingFields.join(",")}`);
        return;
      }

      // Telefon kontrolü - PayTR için zorunlu (formData'dan da kontrol et)
      if (!formData.phone || !formData.phone.trim()) {
        toast.error("Telefon numarası gereklidir");
        setLoading(false);
        setCurrentStep(1); // Adres adımına geri dön
        return;
      }

      // Calculate totals (indirimler artık ürün bazlı, sepette uygulanmış durumda)
      const subtotal = cartTotal;
      const shipping = shippingCost; // Kargo ücreti (ayarlara göre)
      const total = subtotal + shipping;
      
      // Sipariş numarası oluştur (PayTR sadece alfanumerik kabul eder, tire yok)
      const orderNumber = `NFC${new Date().getFullYear()}${Date.now().toString().slice(-8)}`;
      
      // Teslimat adresi oluştur
      const shippingAddress = `${formData.firstName} ${formData.lastName}
${formData.phone}
${formData.addressLine1}
${formData.addressLine2 ? formData.addressLine2 + '\n' : ''}${formData.district ? formData.district + ', ' : ''}${formData.city} ${formData.postalCode}
${formData.notes ? 'Not: ' + formData.notes : ''}`.trim();

      // Save address to shipping_addresses if not using saved address
      let savedAddressId: string | null = null;
      if (!useSavedAddress || !selectedAddressId) {
        // Save the address used in order
        const { data: newAddress, error: addressError } = await supabase
          .from("shipping_addresses")
          .insert({
            user_id: user?.id,
            title: "Sipariş Adresi",
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            address_line1: formData.addressLine1,
            address_line2: formData.addressLine2 || null,
            city: formData.city,
            district: formData.district || null,
            postal_code: formData.postalCode,
            country: "Türkiye",
            notes: formData.notes || null,
            is_default: savedAddresses.length === 0, // İlk adres ise default
            is_active: true, // Yeni eklenen adresler aktif olmalı
          })
          .select()
          .single();

        if (!addressError && newAddress) {
          savedAddressId = newAddress.id;
        }
      } else {
        savedAddressId = selectedAddressId;
      }

      // Siparişi veritabanına kaydet
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          status: "pending",
          total: total,
          shipping_address: shippingAddress,
          shipping_address_id: savedAddressId,
          phone: formData.phone,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      
      setOrderId(orderData.id);

      // PayTR için sepet bilgilerini hazırla
      const basketItems = cartItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));
      const userBasket = encodeBasket(basketItems);

      // Kullanıcı bilgilerini hazırla
      const userName = `${formData.firstName} ${formData.lastName}`;
      const userEmail = user?.email || "";
      // PayTR için profil telefon numarasını kullan
      const userPhone = profile?.phone?.trim() || formData.phone;
      if (!userPhone) {
        throw new Error("Telefon numarası bulunamadı. Lütfen profil bilgilerinizi güncelleyin.");
      }
      const userAddress = `${formData.addressLine1}${formData.addressLine2 ? `, ${formData.addressLine2}` : ''}, ${formData.district ? `${formData.district}, ` : ''}${formData.city} ${formData.postalCode}`;

      // PayTR token oluştur
      const tokenResult = await createPayTRToken({
        order_id: orderData.id, // Order UUID
        order_number: orderNumber, // Order number for PayTR
        amount: Math.round(total * 100), // PayTR kuruş cinsinden ister
        user_name: userName,
        user_email: userEmail,
        user_phone: userPhone,
        user_address: userAddress,
        user_basket: userBasket,
        currency: "TL",
      });

      if (!tokenResult.success || !tokenResult.token) {
        throw new Error(tokenResult.error || "PayTR token oluşturulamadı");
      }

      if (!tokenResult.payment_id) {
        throw new Error("Payment ID alınamadı");
      }

      const currentPaymentId = tokenResult.payment_id;
      setPaymentId(currentPaymentId);

      // PayTR iframe'i göster
      setShowPayTRIframe(true);
      setLoading(false);

      // DOM güncellemesini bekle, sonra iframe'i yükle
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadPayTRIframe(tokenResult.token);

      // Ödeme durumunu kontrol et (polling)
      // paymentId state'ine güvenmek yerine doğrudan tokenResult.payment_id kullan
      const checkInterval = setInterval(async () => {
        try {
          const status = await checkPaymentStatus(currentPaymentId);
          if (status.status === "succeeded") {
            clearInterval(checkInterval);
            await handlePaymentSuccess(orderData.id, orderNumber, total);
          } else if (status.status === "failed") {
            clearInterval(checkInterval);
            toast.error("Ödeme başarısız oldu");
            setShowPayTRIframe(false);
          }
        } catch (error) {
          console.error("Payment status check error:", error);
        }
      }, 2000); // Her 2 saniyede bir kontrol et

      // 5 dakika sonra polling'i durdur
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || "Ödeme başlatılırken bir hata oluştu";
      
      // Oturum süresi dolmuşsa kullanıcıyı login sayfasına yönlendir
      if (errorMessage.includes("Oturum süresi dolmuş") || 
          errorMessage.includes("Oturum bulunamadı") ||
          errorMessage.includes("Unauthorized") ||
          errorMessage.includes("401")) {
        toast.error("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
        
        // Session'ı temizle
        await supabase.auth.signOut();
        
        // Login sayfasına yönlendir (return URL ile)
        setTimeout(() => {
          navigate("/login?redirect=/checkout");
        }, 1500);
        return;
      }
      
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (orderId: string, orderNumber: string, total: number) => {
    try {
      setLoading(true);

      // Sipariş kalemlerini kaydet
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.productId || item.id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization || null,
        admin_notes: null,
        customization_confirmed: false,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)
        .select();

      if (itemsError) throw itemsError;

      // NFC kayıtları oluştur (customization verisi olan ürünler için)
      const nfcRecords = [];
      for (let i = 0; i < cartItems.length; i++) {
        const item = cartItems[i];
        const customization = item.customization;
        
        if (customization && customization.nfcType) {
          // Her ürün için miktar kadar NFC kaydı oluştur
          for (let q = 0; q < item.quantity; q++) {
            // Benzersiz anahtar oluştur
            const uniqueKey = generateUniqueKey();
            
            // NFC verisi hazırla
            const nfcData = {
              type: customization.type,
              ...(customization.type === "business-card" ? {
                name: customization.name,
                title: customization.title,
                company: customization.company,
                phone: customization.phone,
                email: customization.email,
                bio: customization.bio,
                linkedin: customization.linkedin,
                instagram: customization.instagram,
                website: customization.website,
                theme: customization.theme,
              } : {}),
              ...(customization.type === "pet-id" ? {
                petName: customization.petName,
                petImage: customization.petImage,
                petMessage: customization.petMessage,
                ownerName: customization.ownerName,
                ownerPhone: customization.ownerPhone,
                address: customization.address,
                healthNotes: customization.healthNotes,
                microchipNumber: customization.microchipNumber,
                theme: customization.theme,
              } : {}),
              ...(customization.type === "redirect" ? {
                partnerName1: customization.partnerName1,
                partnerName2: customization.partnerName2,
                relationshipStartDate: customization.relationshipStartDate,
                backgroundImage: customization.backgroundImage,
                subtitle: customization.subtitle,
                theme: customization.theme,
              } : {}),
            };

            // NFC adını türe göre belirle
            let nfcName = "";
            if (customization.type === "business-card") {
              nfcName = `Kartvizit - ${customization.name}`;
            } else if (customization.type === "pet-id") {
              nfcName = `Pet ID - ${customization.petName}`;
            } else if (customization.type === "redirect") {
              nfcName = `Sevgililer - ${customization.partnerName1} & ${customization.partnerName2}`;
            }

            // Abonelik var mı? (aboneliği olmayan ürünlerde freeSubscriptionMonths gönderilmez)
            const hasSubscription = customization.freeSubscriptionMonths !== undefined && customization.freeSubscriptionMonths !== null;
            const freeMonths = Math.max(0, Number(customization.freeSubscriptionMonths ?? 0));

            nfcRecords.push({
              user_id: user?.id,
              name: nfcName,
              unique_key: uniqueKey,
              type: customization.nfcType,
              is_active: true,
              data: nfcData,
              theme: customization.theme || "default",
              subscription_status: hasSubscription ? "active" : "inactive",
              // Abonelik yoksa NULL; varsa admin panelindeki "Bedava Abonelik (Ay)" kadar başlat
              subscription_end_date: hasSubscription
                ? addMonths(new Date(), freeMonths).toISOString()
                : null,
              product_id: item.productId || item.id, // Ürün ID'si - abonelik yenileme için gerekli
            });
          }
        }
      }

      // NFC kayıtlarını veritabanına ekle
      if (nfcRecords.length > 0) {
        const { error: nfcError } = await supabase
          .from("nfcs")
          .insert(nfcRecords);

        if (nfcError) {
          console.error("NFC kayıt hatası:", nfcError);
          // NFC kaydı başarısız olsa bile siparişi tamamla
        }
      }
      
      toast.success(`Ödeme başarılı! Sipariş No: ${orderNumber}`);
      
      // SMS bildirimi gönder (arka planda)
      if (formData.phone) {
        sendOrderStatusSms(formData.phone, orderNumber, "confirmed").catch(console.error);
      }

      // Email bildirimi gönder (arka planda)
      if (user?.email) {
        const orderItemsForEmail = cartItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        }));
        // Müşteriye sipariş onay emaili
        sendOrderStatusEmail(user.email, orderNumber, "confirmed", orderItemsForEmail, total).catch(console.error);
        
        // Admin'lere yeni sipariş bildirimi
        const customerName = profile?.first_name && profile?.last_name 
          ? `${profile.first_name} ${profile.last_name}`
          : user.email;
        sendNewOrderNotificationToAdmins(
          orderNumber,
          customerName,
          user.email,
          total,
          orderItemsForEmail
        ).catch(console.error);
      }
      
      // Önce checkout tamamlandı flag'ini set et, sonra sepeti temizle
      // Bu sayede boş sepet kontrolü /cart'a yönlendirmez
      setCheckoutCompleted(true);
      clearCart();
      setShowPayTRIframe(false);
      navigate("/orders");
      
    } catch (error: any) {
      console.error('Payment success handler error:', error);
      toast.error(error.message || "Sipariş işlenirken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals for display (indirimler artık ürün bazlı, sepette uygulanmış durumda)
  const subtotal = cartTotal;
  const shipping = shippingCost; // Kargo ücreti (ayarlara göre)
  const total = subtotal + shipping;

  // Kullanıcı yükleniyor veya oturum açılmamışsa
  if (!user && !checkoutCompleted) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Sepet boşsa ve ödeme tamamlanmamışsa
  if (cartItems.length === 0 && !checkoutCompleted) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Sepete yönlendiriliyorsunuz...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button 
              onClick={() => currentStep === 1 ? navigate("/cart") : setCurrentStep(1)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {currentStep === 1 ? "Sepete Dön" : "Adres Bilgilerine Dön"}
            </button>
            
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Ödeme</span>
            </h1>
            
            {/* Steps */}
            <div className="flex items-center gap-4 mt-6">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className="font-medium">Teslimat</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  2
                </div>
                <span className="font-medium">Ödeme</span>
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
                >
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Teslimat Adresi
                  </h2>

                  {/* Saved Addresses Selection */}
                  {savedAddresses.length > 0 && (
                    <div className="mb-6 space-y-3">
                      <Label className="text-sm font-medium">Kayıtlı Adreslerim</Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {savedAddresses.map((address) => (
                          <div
                            key={address.id}
                            onClick={() => handleSelectAddress(address)}
                            className={`p-4 border rounded-xl cursor-pointer transition-all ${
                              selectedAddressId === address.id && useSavedAddress
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{address.title}</span>
                                  {address.is_default && (
                                    <Badge variant="outline" className="text-xs">
                                      Varsayılan
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-foreground">
                                  {address.first_name} {address.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">{address.phone}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {address.address_line1}
                                  {address.address_line2 && `, ${address.address_line2}`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {address.district && `${address.district}, `}
                                  {address.city} {address.postal_code}
                                </p>
                              </div>
                              <div className="ml-4">
                                <input
                                  type="radio"
                                  checked={selectedAddressId === address.id && useSavedAddress}
                                  onChange={() => handleSelectAddress(address)}
                                  className="w-4 h-4 text-primary"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseNewAddress}
                        className="w-full"
                      >
                        Yeni Adres Ekle
                      </Button>
                    </div>
                  )}

                  {/* Address Form */}
                  <div className={`grid gap-4 ${useSavedAddress && savedAddresses.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Name Fields */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">İsim *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="İsim"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Soyisim *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Soyisim"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`pl-10 ${errors.lastName ? 'border-destructive' : ''}`}
                          />
                        </div>
                        {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon Numarası *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="05XXXXXXXXX"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.phone ? 'border-destructive' : ''} ${!formData.phone ? 'text-transparent' : ''}`}
                          maxLength={11}
                        />
                        {!formData.phone && (
                          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm select-none">
                            05XXXXXXXXX
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">0 ile başlayan 11 haneli telefon numarası giriniz</p>
                      {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                    </div>

                    {/* Address Line 1 */}
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Adres *</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <textarea
                          id="addressLine1"
                          name="addressLine1"
                          placeholder="Mahalle, Sokak, Bina No"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-2 min-h-[80px] rounded-md border bg-background text-sm
                            ${errors.addressLine1 ? 'border-destructive' : 'border-input'}
                            focus:outline-none focus:ring-2 focus:ring-ring`}
                        />
                      </div>
                      {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1}</p>}
                    </div>

                    {/* Address Line 2 */}
                    <div className="space-y-2">
                      <Label htmlFor="addressLine2">Adres Detayı (Opsiyonel)</Label>
                      <Input
                        id="addressLine2"
                        name="addressLine2"
                        placeholder="Apartman adı, Daire no, Kat"
                        value={formData.addressLine2}
                        onChange={handleInputChange}
                      />
                    </div>

                    {/* City, District, Postal Code */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">İl *</Label>
                        <select
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={`w-full h-10 px-3 rounded-md border bg-background text-sm
                            ${errors.city ? 'border-destructive' : 'border-input'}
                            focus:outline-none focus:ring-2 focus:ring-ring`}
                        >
                          <option value="">İl Seçin</option>
                          {cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Input
                          id="district"
                          name="district"
                          placeholder="İlçe"
                          value={formData.district}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Posta Kodu *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          placeholder="34000"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className={errors.postalCode ? 'border-destructive' : ''}
                          maxLength={5}
                        />
                        {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Kurye Notu (Opsiyonel)</Label>
                      <Input
                        id="notes"
                        name="notes"
                        placeholder="Teslimat için özel notunuz..."
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    className="w-full mt-6" 
                    size="lg"
                    onClick={handleContinueToPayment}
                    disabled={useSavedAddress && !selectedAddressId}
                  >
                    Ödemeye Geç
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Shipping Summary */}
                  <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      Teslimat Bilgileri
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p className="font-medium text-foreground">{formData.firstName} {formData.lastName}</p>
                      <p>{formData.phone}</p>
                      <p>{formData.addressLine1}</p>
                      {formData.addressLine2 && <p>{formData.addressLine2}</p>}
                      <p>{formData.district && `${formData.district}, `}{formData.city} {formData.postalCode}</p>
                      {formData.notes && <p className="italic">Not: {formData.notes}</p>}
                    </div>
                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="text-primary text-sm hover:underline mt-3"
                    >
                      Değiştir
                    </button>
                  </div>

                  {/* Payment Section */}
                  <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50">
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Ödeme Yöntemi
                    </h2>

                    {/* PayTR Payment Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Güvenli Ödeme</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Kredi kartı bilgileriniz PayTR tarafından 256-bit SSL şifreleme ile korunmaktadır. 
                            Kart bilgileriniz sunucularımızda saklanmaz. Ödeme işlemi PayTR güvenli altyapısı üzerinden gerçekleşir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fatura Bilgisi */}
                    <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-accent mt-0.5" />
                        <div>
                          <p className="font-medium text-sm text-accent">Otomatik Fatura</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ödeme tamamlandığında faturanız otomatik olarak e-posta adresinize gönderilecektir. 
                            Fatura, sipariş detaylarınızı ve satıcı bilgilerini içermektedir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    {!showPayTRIframe ? (
                      <div className="space-y-4">
                        <div className="border border-primary rounded-xl p-4 bg-primary/5">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="paymentMethod" 
                              value="paytr" 
                              defaultChecked
                              className="w-4 h-4 text-primary"
                            />
                            <CreditCard className="w-5 h-5" />
                            <span className="font-medium">Kredi / Banka Kartı (PayTR)</span>
                          </label>
                          
                          <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                            <p className="text-sm text-muted-foreground text-center">
                              Güvenli ödeme için PayTR kullanıyoruz
                            </p>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              "Öde" butonuna tıklayarak PayTR ödeme sayfasına yönlendirileceksiniz
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-background rounded-lg border border-border p-4">
                          <h3 className="font-semibold mb-2">Ödeme İşlemi</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Lütfen aşağıdaki formu doldurarak ödemenizi tamamlayın.
                          </p>
                          <div id="paytr-iframe-container" className="w-full min-h-[600px]"></div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowPayTRIframe(false);
                            setPaymentId(null);
                            setOrderId(null);
                          }}
                          className="w-full"
                        >
                          Ödeme Sayfasını Kapat
                        </Button>
                      </div>
                    )}

                    {!showPayTRIframe && (
                      <>
                        {/* Terms Checkbox */}
                        <div className="flex items-start gap-3 mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                          <input
                            type="checkbox"
                            id="terms-checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          />
                          <label htmlFor="terms-checkbox" className="text-sm text-muted-foreground cursor-pointer select-none">
                            <Link to="/pre-information-form" target="_blank" className="text-primary hover:underline font-medium">
                              Ön Bilgilendirme Koşulları
                            </Link>
                            'nı ve{" "}
                            <Link to="/distance-sales-agreement" target="_blank" className="text-primary hover:underline font-medium">
                              Mesafeli Satış Sözleşmesi
                            </Link>
                            'ni okudum, onaylıyorum.
                          </label>
                        </div>

                        <Button 
                          variant="hero" 
                          className="w-full mt-4" 
                          size="lg"
                          onClick={handlePayment}
                          disabled={loading || !termsAccepted}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" />
                              ₺{total} Öde
                            </>
                          )}
                        </Button>

                        {!termsAccepted && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 text-center mt-2">
                            Ödeme yapmak için sözleşmeleri onaylamanız gerekmektedir.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 sticky top-24">
                <h2 className="text-xl font-semibold mb-6">Sipariş Özeti</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted/30 rounded-lg flex items-center justify-center shrink-0 relative">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-contain"
                        />
                        {/* İndirim Badge */}
                        {item.customization?.discountPercentage && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            %{item.customization.discountPercentage}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                        {/* İndirimli fiyat gösterimi */}
                        {item.customization?.originalPrice && item.customization?.discountPercentage ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground line-through">
                              ₺{item.customization.originalPrice * item.quantity}
                            </span>
                            <span className="text-sm font-semibold text-red-500">
                              ₺{item.price * item.quantity}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm font-semibold text-gradient">₺{item.price * item.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ara Toplam</span>
                    <span>₺{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Kargo</span>
                    {isFreeShipping ? (
                      <span className="text-accent">Ücretsiz</span>
                    ) : (
                      <span>₺{shippingCost}</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Toplam</span>
                    <span className="text-2xl font-bold text-gradient">₺{total}</span>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Shield className="w-4 h-4 text-accent" />
                    <span>SSL ile güvenli ödeme</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>2-5 iş günü içinde teslimat</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
