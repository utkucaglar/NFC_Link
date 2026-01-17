import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft, Plus, Minus, Check, Truck, Shield, RefreshCw } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";

const products = [
  {
    id: 1,
    name: "NFC Kartvizit - Klasik Beyaz",
    price: 149,
    image: productCard,
    category: "Profesyonel",
    description: "Şık ve minimal tasarım ile profesyonel görünüm",
    longDescription: "Profesyonel hayatınızda fark yaratın. NFC Kartvizit ile iletişim bilgilerinizi, sosyal medya hesaplarınızı ve web sitenizi tek bir dokunuşla paylaşın. Klasik beyaz tasarımı her ortamda şık görünür ve kalıcı bir izlenim bırakır.",
    features: [
      "Yüksek kaliteli PVC malzeme",
      "Su ve çizilmeye dayanıklı",
      "10+ yıl dayanıklılık",
      "Tüm NFC uyumlu telefonlarla çalışır",
      "Uygulama indirme gerektirmez",
      "Anında aktivasyon"
    ],
    colors: ["Beyaz", "Siyah", "Gri"],
    specs: {
      "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
      "Kalınlık": "0.8 mm",
      "Malzeme": "Premium PVC",
      "NFC Chip": "NTAG216",
      "Hafıza": "888 bytes",
      "Okuma Mesafesi": "1-5 cm"
    }
  },
  {
    id: 2,
    name: "NFC Kartvizit - Premium Siyah",
    price: 179,
    image: productCard,
    category: "Profesyonel",
    description: "Metal kaplama, lüks hissiyat",
    longDescription: "Lüks ve profesyonelliği bir arada sunan Premium Siyah NFC Kartvizit, metal kaplama yüzeyi ile dikkat çeker. İş toplantılarında, networkıng etkinliklerinde fark yaratmak isteyenler için tasarlandı.",
    features: [
      "Metal kaplama premium yüzey",
      "Lazer gravür seçeneği",
      "Su ve çizilmeye dayanıklı",
      "15+ yıl dayanıklılık",
      "VIP müşteri desteği",
      "Özel kutu ile teslimat"
    ],
    colors: ["Siyah", "Altın", "Gümüş"],
    specs: {
      "Boyut": "85.6 x 54 mm (Standart kart boyutu)",
      "Kalınlık": "1.0 mm",
      "Malzeme": "Metal kaplama PVC",
      "NFC Chip": "NTAG216",
      "Hafıza": "888 bytes",
      "Okuma Mesafesi": "1-5 cm"
    }
  },
  {
    id: 3,
    name: "NFC Bileklik - Spor",
    price: 199,
    image: productBand,
    category: "Spor & Etkinlik",
    description: "Su geçirmez, dayanıklı silikon",
    longDescription: "Aktif yaşam tarzınız için tasarlandı. Su geçirmez silikon yapısı sayesinde spor yaparken, yüzerken bile bilekliğinizi çıkarmadan kullanabilirsiniz. Hafif ve rahat tasarımı gün boyu konfor sağlar.",
    features: [
      "IP68 su geçirmezlik",
      "Hipoalerjenik silikon",
      "Ayarlanabilir boyut",
      "Ter ve tuzlu suya dayanıklı",
      "Hafif tasarım (sadece 15g)",
      "6 farklı renk seçeneği"
    ],
    colors: ["Siyah", "Mavi", "Kırmızı", "Yeşil", "Beyaz", "Turuncu"],
    specs: {
      "Boyut": "Ayarlanabilir (16-22 cm)",
      "Genişlik": "12 mm",
      "Malzeme": "Medikal silikon",
      "NFC Chip": "NTAG213",
      "Hafıza": "144 bytes",
      "Okuma Mesafesi": "1-3 cm"
    }
  },
  {
    id: 4,
    name: "NFC Bileklik - Festival",
    price: 99,
    image: productBand,
    category: "Spor & Etkinlik",
    description: "Tek kullanımlık, etkinlikler için ideal",
    longDescription: "Festival ve etkinlikler için özel tasarlanmış ekonomik NFC bileklik. Kumaş yapısı ve güvenlik kilidi ile etkinlik boyunca güvenle kullanılır. Toplu siparişlerde özel fiyatlandırma mevcuttur.",
    features: [
      "Tek kullanımlık güvenlik kilidi",
      "Rahat kumaş yapı",
      "Özelleştirilebilir baskı",
      "Toplu sipariş indirimi",
      "Hızlı teslimat",
      "Çevre dostu malzeme"
    ],
    colors: ["Çok Renkli", "Siyah", "Beyaz"],
    specs: {
      "Boyut": "350 x 15 mm",
      "Malzeme": "Polyester kumaş",
      "NFC Chip": "NTAG213",
      "Hafıza": "144 bytes",
      "Okuma Mesafesi": "1-3 cm",
      "Min. Sipariş": "1 adet"
    }
  },
  {
    id: 5,
    name: "Pet Tag - Altın",
    price: 129,
    image: productPetTag,
    category: "Evcil Hayvan",
    description: "Paslanmaz çelik, altın kaplama",
    longDescription: "Evcil dostunuz için şık ve güvenli bir kimlik. Altın kaplama paslanmaz çelik yapısı ile hem dayanıklı hem de estetik. QR kod ve NFC teknolojisi sayesinde kaybolma durumunda hızlı iletişim sağlar.",
    features: [
      "Paslanmaz çelik gövde",
      "24K altın kaplama",
      "Su geçirmez",
      "QR kod + NFC çift teknoloji",
      "Acil durum bilgileri",
      "GPS takip entegrasyonu (opsiyonel)"
    ],
    colors: ["Altın", "Rose Gold"],
    specs: {
      "Boyut": "30 mm çap",
      "Kalınlık": "2 mm",
      "Malzeme": "Paslanmaz çelik + Altın kaplama",
      "NFC Chip": "NTAG213",
      "Hafıza": "144 bytes",
      "Ağırlık": "8g"
    }
  },
  {
    id: 6,
    name: "Pet Tag - Gümüş",
    price: 119,
    image: productPetTag,
    category: "Evcil Hayvan",
    description: "Paslanmaz çelik, gümüş kaplama",
    longDescription: "Klasik gümüş tasarımı ile evcil hayvanınız için zarif bir kimlik etiketi. Dayanıklı paslanmaz çelik yapısı uzun ömürlü kullanım sağlar. Kaybolma durumunda iletişim bilgilerinize anında ulaşılabilir.",
    features: [
      "Paslanmaz çelik gövde",
      "Gümüş kaplama",
      "Su geçirmez",
      "QR kod + NFC çift teknoloji",
      "Acil durum bilgileri",
      "Ücretsiz gravür"
    ],
    colors: ["Gümüş", "Antik Gümüş"],
    specs: {
      "Boyut": "30 mm çap",
      "Kalınlık": "2 mm",
      "Malzeme": "Paslanmaz çelik + Gümüş kaplama",
      "NFC Chip": "NTAG213",
      "Hafıza": "144 bytes",
      "Ağırlık": "8g"
    }
  }
];

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);

  const product = products.find(p => p.id === Number(id));

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Ürün bulunamadı</h1>
          <Button onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ürünlere Dön
          </Button>
        </div>
      </Layout>
    );
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        customization: {
          color: product.colors[selectedColor]
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
                src={product.image}
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
              
              <p className="text-muted-foreground mb-6">{product.longDescription}</p>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gradient">₺{product.price}</span>
                <span className="text-muted-foreground">+ ₺29/ay abonelik</span>
              </div>

              {/* Color Selection */}
              <div className="mb-6">
                <label className="text-sm font-medium mb-3 block">
                  Renk: <span className="text-muted-foreground">{product.colors[selectedColor]}</span>
                </label>
                <div className="flex gap-2">
                  {product.colors.map((color, index) => (
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
                {product.features.map((feature, index) => (
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
                {Object.entries(product.specs).map(([key, value]) => (
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
                        src={relatedProduct.image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{relatedProduct.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{relatedProduct.description}</p>
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
