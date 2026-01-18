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
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, profile, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
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

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      toast.error("Ödeme yapmak için giriş yapmalısınız");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const validateShippingForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = "İsim gereklidir";
    if (!formData.lastName.trim()) newErrors.lastName = "Soyisim gereklidir";
    if (!formData.phone.trim()) newErrors.phone = "Telefon numarası gereklidir";
    else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Geçerli bir telefon numarası girin (10-11 haneli)";
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
    setLoading(true);
    
    try {
      // TODO: Burada Stripe integration yapılacak
      // 1. Backend'de payment intent oluştur
      // 2. Stripe Checkout'a yönlendir veya Stripe Elements kullan
      // 3. Ödeme başarılı olursa sipariş oluştur
      
      // Şimdilik mock ödeme işlemi
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Sipariş numarası oluştur
      const orderNumber = `NFC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
      
      // Teslimat adresi oluştur
      const shippingAddress = `${formData.firstName} ${formData.lastName}
${formData.phone}
${formData.addressLine1}
${formData.addressLine2 ? formData.addressLine2 + '\n' : ''}${formData.district ? formData.district + ', ' : ''}${formData.city} ${formData.postalCode}
${formData.notes ? 'Not: ' + formData.notes : ''}`.trim();

      // Siparişi veritabanına kaydet
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          status: "pending",
          subtotal,
          discount_amount: 0,
          total,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Sipariş kalemlerini kaydet
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.productId || item.id,
        quantity: item.quantity,
        price: item.price,
        customization: item.customization || null,
        admin_notes: null,
        customization_confirmed: false,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;
      
      toast.success(`Siparişiniz alındı! Sipariş No: ${orderNumber}`);
      clearCart();
      navigate("/orders");
      
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Sipariş oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const monthlyFee = cartItems.reduce((sum, item) => sum + 29 * item.quantity, 0);
  const subtotal = cartTotal;
  const shipping = 0; // Ücretsiz kargo
  const total = subtotal + shipping;

  if (cartItems.length === 0) {
    return null;
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

                  <div className="grid gap-4">
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="05XX XXX XX XX"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                        />
                      </div>
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

                    {/* Stripe Payment Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Güvenli Ödeme</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Kredi kartı bilgileriniz Stripe tarafından 256-bit SSL şifreleme ile korunmaktadır. 
                            Kart bilgileriniz sunucularımızda saklanmaz.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <div className="border border-primary rounded-xl p-4 bg-primary/5">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            value="card" 
                            defaultChecked
                            className="w-4 h-4 text-primary"
                          />
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">Kredi / Banka Kartı</span>
                        </label>
                        
                        {/* Stripe Elements Placeholder */}
                        <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                          <p className="text-sm text-muted-foreground text-center">
                            Stripe ödeme formu burada görünecek
                          </p>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            (Stripe integration yapıldığında aktif olacak)
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="hero" 
                      className="w-full mt-6" 
                      size="lg"
                      onClick={handlePayment}
                      disabled={loading}
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

                    <p className="text-xs text-muted-foreground text-center mt-4">
                      "Öde" butonuna tıklayarak{" "}
                      <Link to="/terms" className="text-primary hover:underline">Kullanım Şartları</Link>
                      {" "}ve{" "}
                      <Link to="/privacy" className="text-primary hover:underline">Gizlilik Politikası</Link>
                      'nı kabul etmiş olursunuz.
                    </p>
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
                      <div className="w-16 h-16 bg-muted/30 rounded-lg flex items-center justify-center shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Adet: {item.quantity}</p>
                        <p className="text-sm font-semibold text-gradient">₺{item.price * item.quantity}</p>
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
                    <span className="text-accent">Ücretsiz</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Aylık Abonelik</span>
                    <span>₺{monthlyFee}/ay</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">İlk Ay</span>
                    <span className="text-accent">Ücretsiz</span>
                  </div>
                </div>

                <div className="border-t border-border mt-4 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Toplam</span>
                    <span className="text-2xl font-bold text-gradient">₺{total}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    İlk aydan sonra aylık ₺{monthlyFee} abonelik ücreti
                  </p>
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
