import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Plus, Minus, Check, Truck, Shield, RefreshCw, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";

// Helper function to get product image with fallback
const getProductImage = (imageUrl: string | null, category: string) => {
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // Fallback to local images based on category
  if (category === "Profesyonel" || category === "Premium") return productCard;
  if (category === "Spor & Etkinlik") return productBand;
  if (category === "Evcil Hayvan") return productPetTag;
  return productCard;
};

// Varsayılan özellikler (veritabanında yoksa kullanılır)
const defaultFeaturesByCategory: Record<string, string[]> = {
  "Profesyonel": [
    "Yüksek kaliteli PVC malzeme",
    "Su ve çizilmeye dayanıklı",
    "10+ yıl dayanıklılık",
    "Tüm NFC uyumlu telefonlarla çalışır",
    "Uygulama indirme gerektirmez",
    "Anında aktivasyon"
  ],
  "Premium": [
    "Metal kaplama premium yüzey",
    "Lazer gravür seçeneği",
    "Su ve çizilmeye dayanıklı",
    "15+ yıl dayanıklılık",
    "VIP müşteri desteği",
    "Özel kutu ile teslimat"
  ],
  "Spor & Etkinlik": [
    "IP68 su geçirmezlik",
    "Hipoalerjenik silikon",
    "Ayarlanabilir boyut",
    "Ter ve tuzlu suya dayanıklı",
    "Hafif tasarım",
    "Farklı renk seçenekleri"
  ],
  "Evcil Hayvan": [
    "Paslanmaz çelik gövde",
    "Su geçirmez",
    "QR kod + NFC çift teknoloji",
    "Acil durum bilgileri",
    "Hafif ve dayanıklı",
    "Ücretsiz gravür seçeneği"
  ]
};

const defaultSpecsByCategory: Record<string, Record<string, string>> = {
  "Profesyonel": {
    "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
    "Kalınlık": "0.8 mm",
    "Malzeme": "Premium PVC",
    "NFC Chip": "NTAG216",
    "Hafıza": "888 bytes",
    "Okuma Mesafesi": "1-5 cm"
  },
  "Premium": {
    "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
    "Kalınlık": "1.0 mm",
    "Malzeme": "Metal kaplama PVC",
    "NFC Chip": "NTAG216",
    "Hafıza": "888 bytes",
    "Okuma Mesafesi": "1-5 cm"
  },
  "Spor & Etkinlik": {
    "Boyut": "Ayarlanabilir (16-22 cm)",
    "Genişlik": "12 mm",
    "Malzeme": "Medikal silikon",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Okuma Mesafesi": "1-3 cm"
  },
  "Evcil Hayvan": {
    "Boyut": "30 mm çap",
    "Kalınlık": "2 mm",
    "Malzeme": "Paslanmaz çelik",
    "NFC Chip": "NTAG213",
    "Hafıza": "144 bytes",
    "Ağırlık": "8g"
  }
};

const defaultColorsByCategory: Record<string, string[]> = {
  "Profesyonel": ["Beyaz", "Siyah", "Gri"],
  "Premium": ["Siyah", "Altın", "Gümüş"],
  "Spor & Etkinlik": ["Siyah", "Mavi", "Kırmızı", "Yeşil", "Beyaz"],
  "Evcil Hayvan": ["Altın", "Gümüş", "Rose Gold"]
};

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
}

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
  const features = (product.features && product.features.length > 0) 
    ? product.features 
    : defaultFeaturesByCategory[product.category] || defaultFeaturesByCategory["Profesyonel"];
  
  const specs = (product.specs && Object.keys(product.specs).length > 0)
    ? product.specs
    : defaultSpecsByCategory[product.category] || defaultSpecsByCategory["Profesyonel"];
  
  const colors = (product.colors && product.colors.length > 0)
    ? product.colors
    : defaultColorsByCategory[product.category] || ["Standart"];
  
  const productImage = getProductImage(product.image_url, product.category);
  const longDescription = product.long_description || product.description || "Profesyonel NFC çözümü ile dijital varlığınızı paylaşın.";

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        image: productImage,
        customization: {
          renk: colors[selectedColor]
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
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gradient">₺{product.price}</span>
                <span className="text-muted-foreground">+ ₺{product.monthly_subscription_fee || 29}/ay abonelik</span>
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
              <Button size="lg" className="w-full mb-6" onClick={handleAddToCart}>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Sepete Ekle - ₺{product.price * quantity}
              </Button>

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
    </Layout>
  );
}
