import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Wifi, CreditCard, PawPrint, Link2, Zap, Shield, Smartphone, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import ProductSwiper from "@/components/ProductSwiper";
import { supabase } from "@/lib/supabase";
import { getProductImage, formatPrice } from "@/lib/helpers";
import { toast } from "sonner";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const features = [
  {
    icon: CreditCard,
    title: "Dijital Kartvizit",
    description: "Profesyonel bilgilerinizi tek dokunuşla paylaşın. İletişim, sosyal medya ve web siteniz anında aktarılır."
  },
  {
    icon: PawPrint,
    title: "Evcil Hayvan Kimliği",
    description: "Evcil hayvanınızın tüm bilgileri güvende. Kaybolma durumunda anında iletişime geçilebilir."
  },
  {
    icon: Link2,
    title: "Özel Yönlendirme",
    description: "İstediğiniz herhangi bir URL'ye yönlendirin. Menüler, portfolyolar veya promosyonlar için ideal."
  },
  {
    icon: Zap,
    title: "Anlık Aktivasyon",
    description: "NFC'nizi aldığınız anda aktif. Uygulama indirmenize gerek yok, hemen kullanmaya başlayın."
  }
];

const howItWorks = [
  {
    step: "01",
    title: "NFC Ürününüzü Seçin",
    description: "Kart, bileklik veya evcil hayvan etiketi. İhtiyacınıza uygun ürünü seçin."
  },
  {
    step: "02",
    title: "Siparişinizi Verin",
    description: "Güvenli ödeme ile siparişinizi tamamlayın. İlk ay ücretsiz!"
  },
  {
    step: "03",
    title: "Sayfanızı Özelleştirin",
    description: "Bilgilerinizi ekleyin, tasarımı kişiselleştirin."
  },
  {
    step: "04",
    title: "Paylaşmaya Başlayın",
    description: "Telefona dokundurarak bilgilerinizi anında paylaşın."
  }
];

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  monthly_subscription_fee: number;
  nfc_type: string | null;
  has_subscription?: boolean;
}

export default function Index() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [stats, setStats] = useState({ userCount: 0, scanCount: 0, avgRating: 4.9 });

  const requiresCustomization = (p: Product): boolean =>
    (p.nfc_type === "business-card" || p.nfc_type === "pet-id" || p.nfc_type === "redirect");

  const hasSub = (p: Product): boolean =>
    p.has_subscription !== false && p.nfc_type !== "nfc-yok";

  const handleAddToCart = (product: Product) => {
    if (requiresCustomization(product)) {
      navigate(`/product/${product.id}`);
      toast.info("Bu ürün için bilgilerinizi girmeniz gerekiyor");
    } else {
      const totalPrice = hasSub(product) ? product.price + (product.monthly_subscription_fee || 29) : product.price;
      const customization: Record<string, unknown> = {};
      if (hasSub(product)) customization.subscriptionFee = product.monthly_subscription_fee || 29;
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: totalPrice,
        image: getProductImage(product.image_url, product.category),
        customization,
      });
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, category, image_url, monthly_subscription_fee, nfc_type, has_subscription')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(3);

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Ürünler yüklenemedi:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    const fetchStats = async () => {
      try {
        // Kullanıcı sayısı
        const { count: userCount } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // NFC tarama sayısı
        const { count: scanCount } = await supabase
          .from('nfc_scans')
          .select('*', { count: 'exact', head: true });

        // Ortalama puan
        const { data: ratingData } = await supabase
          .from('reviews')
          .select('rating');

        let avgRating = 4.9;
        if (ratingData && ratingData.length > 0) {
          const sum = ratingData.reduce((acc, r) => acc + (r.rating || 0), 0);
          avgRating = Math.round((sum / ratingData.length) * 10) / 10;
        }

        setStats({
          userCount: userCount || 0,
          scanCount: scanCount || 0,
          avgRating
        });
      } catch (error) {
        console.error('İstatistikler yüklenemedi:', error);
      }
    };

    fetchProducts();
    fetchStats();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6"
              >
                <Wifi className="w-4 h-4" />
                Yeni Nesil Dijital Paylaşım
              </motion.span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Tek Dokunuşla{" "}
                <span className="text-gradient">Dijital Varlığınızı</span>{" "}
                Paylaşın
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                NFC teknolojisi ile kartvizitinizi, sosyal medyanızı veya herhangi 
                bir bilgiyi anında paylaşın. Kağıt israfına son, geleceğe merhaba!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/products">
                  <Button variant="hero" size="xl">
                    Hemen Başla
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="xl"
                  onClick={() => {
                    document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Nasıl Çalışır?
                </Button>
              </div>
              
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient">
                    {stats.userCount >= 1000 ? `${(stats.userCount / 1000).toFixed(1)}K+` : stats.userCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient">
                    {stats.scanCount >= 1000 ? `${(stats.scanCount / 1000).toFixed(1)}K+` : stats.scanCount}
                  </p>
                  <p className="text-sm text-muted-foreground">NFC Tarama</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient">{stats.avgRating}</p>
                  <p className="text-sm text-muted-foreground">Puan</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <ProductSwiper autoPlayInterval={4000} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-medium mb-4 block">Özellikler</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Neden <span className="text-gradient">Esdodesign</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Modern dünyada bağlantı kurmak artık çok daha kolay. 
              NFC teknolojisi ile her türlü bilgiyi anında paylaşın.
            </p>
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-6 bg-background rounded-2xl shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-medium mb-4 block">Adım Adım</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nasıl <span className="text-gradient">Çalışır</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Sadece 4 basit adımda dijital varlığınızı paylaşmaya başlayın.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
                {index < howItWorks.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-8 -right-4 w-8 h-8 text-primary/30" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Preview Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary font-medium mb-4 block">Ürünlerimiz</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Size Uygun <span className="text-gradient">NFC Çözümü</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              İhtiyacınıza göre tasarlanmış farklı NFC ürünleri keşfedin.
            </p>
          </motion.div>

          {loadingProducts ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Henüz ürün eklenmemiş.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-background rounded-2xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300"
                >
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-square p-8 bg-muted/30 flex items-center justify-center overflow-hidden">
                      <img 
                        src={getProductImage(product.image_url, product.category)} 
                        alt={product.name}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                  </Link>
                  <div className="p-6">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                      {product.category}
                    </span>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="text-lg font-semibold mt-3 mb-2 hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gradient">
                        ₺{(hasSub(product) ? product.price + (product.monthly_subscription_fee || 29) : product.price).toFixed(0)}
                      </span>
                      <Button 
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                      >
                        {requiresCustomization(product) ? "Bilgileri Gir" : "Sepete Ekle"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/products">
              <Button variant="outline" size="lg">
                Tüm Ürünleri Gör
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Güvenli Ödeme</h3>
                <p className="text-sm text-muted-foreground">Stripe ile 256-bit SSL şifreleme</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Tüm Cihazlarla Uyumlu</h3>
                <p className="text-sm text-muted-foreground">iOS ve Android desteği</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex items-start gap-4"
            >
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ücretsiz Deneme</h3>
                <p className="text-sm text-muted-foreground">İlk 3 ay tamamen ücretsiz</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-background/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Dijital Geleceğinize Adım Atın
            </h2>
            <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Binlerce profesyonel ve işletme zaten Esdodesign kullanıyor. 
              Siz de hemen başlayın, ilk ay ücretsiz!
            </p>
            <Link to="/products">
              <Button variant="glass" size="xl" className="bg-background/20 text-primary-foreground border-primary-foreground/20 hover:bg-background/30">
                Şimdi Başla
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
