import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Plus, Minus, Check, Truck, Shield, RefreshCw, Loader2, ChevronRight, X } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import { 
  getProductImage, 
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

type NFCType = "business-card" | "pet-id" | "redirect" | null;

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
  is_active: boolean;
  nfc_type: NFCType;
}

// Kategori bazlı NFC tipi belirleme (veritabanında nfc_type yoksa)
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
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Customization form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData>(defaultBusinessCardData);
  const [petIdData, setPetIdData] = useState<PetIdData>(defaultPetIdData);
  const [redirectData, setRedirectData] = useState<RedirectData>(defaultRedirectData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
  
  const productImage = getProductImage(product.image_url, product.category);
  const longDescription = product.long_description || product.description || "Profesyonel NFC çözümü ile dijital varlığınızı paylaşın.";
  
  // NFC tipi belirleme
  const nfcType = product.nfc_type || getNfcTypeFromCategory(product.category);
  const requiresCustomization = nfcType === "business-card" || nfcType === "pet-id" || nfcType === "redirect";

  // Form doğrulama
  const validateBusinessCardForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!businessCardData.name.trim()) errors.name = "İsim soyisim gereklidir";
    if (!businessCardData.title.trim()) errors.title = "Meslek ünvanı gereklidir";
    if (!businessCardData.phone.trim()) errors.phone = "Telefon numarası gereklidir";
    if (!businessCardData.email.trim()) errors.email = "E-posta gereklidir";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessCardData.email)) {
      errors.email = "Geçerli bir e-posta adresi girin";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePetIdForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!petIdData.petName.trim()) errors.petName = "Evcil hayvan adı gereklidir";
    if (!petIdData.ownerName.trim()) errors.ownerName = "Sahibi adı gereklidir";
    if (!petIdData.ownerPhone.trim()) errors.ownerPhone = "Sahibi telefonu gereklidir";
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

  // Sepete ekleme işleyicisi
  const handleAddToCartClick = () => {
    if (requiresCustomization) {
      setIsFormOpen(true);
    } else {
      addProductToCart(null);
    }
  };

  const handleFormSubmit = () => {
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
      addProductToCart(customizationData);
      setIsFormOpen(false);
      // Formu sıfırla
      setBusinessCardData(defaultBusinessCardData);
      setPetIdData(defaultPetIdData);
      setRedirectData(defaultRedirectData);
      setFormErrors({});
    }
  };

  const addProductToCart = (customization: any) => {
    const totalPrice = product.price + (product.monthly_subscription_fee || 29);
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: totalPrice, // Ürün + ilk ay abonelik
        image: productImage,
        customization: {
          renk: colors[selectedColor],
          nfcType: nfcType,
          subscriptionFee: product.monthly_subscription_fee || 29,
          ...customization
        }
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
              className="bg-muted/30 rounded-3xl p-8 lg:p-12 flex items-center justify-center"
            >
              <img
                src={productImage}
                alt={product.name}
                className="w-full max-w-md object-contain"
              />
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
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-gradient">
                    ₺{(product.price + (product.monthly_subscription_fee || 29)).toFixed(0)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  ₺{product.price} ürün + ₺{product.monthly_subscription_fee || 29} (ilk ay abonelik dahil)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Sonraki aylar: ₺{product.monthly_subscription_fee || 29}/ay
                </p>
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
                {requiresCustomization ? "Bilgileri Gir ve Sepete Ekle" : "Sepete Ekle"} - ₺{((product.price + (product.monthly_subscription_fee || 29)) * quantity).toFixed(0)}
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

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
              />
            )}
            {nfcType === "pet-id" && (
              <PetIdForm
                data={petIdData}
                onChange={setPetIdData}
                errors={formErrors}
              />
            )}
            {nfcType === "redirect" && (
              <RedirectForm
                data={redirectData}
                onChange={setRedirectData}
                errors={formErrors}
              />
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              İptal
            </Button>
            <Button variant="hero" onClick={handleFormSubmit}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Sepete Ekle - ₺{((product.price + (product.monthly_subscription_fee || 29)) * quantity).toFixed(0)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
