import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Wifi, CreditCard, PawPrint, Link2, Zap, Shield, Smartphone, ChevronRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import heroImage from "@/assets/hero-nfc.png";
import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";

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

const products = [
  {
    id: 1,
    name: "NFC Kartvizit",
    price: 149,
    image: productCard,
    category: "Profesyonel"
  },
  {
    id: 3,
    name: "NFC Bileklik",
    price: 199,
    image: productBand,
    category: "Spor & Etkinlik"
  },
  {
    id: 5,
    name: "Pet Tag",
    price: 129,
    image: productPetTag,
    category: "Evcil Hayvan"
  }
];

export default function Index() {
  const { addToCart } = useCart();

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
                  <p className="text-3xl font-bold text-gradient">10K+</p>
                  <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient">50K+</p>
                  <p className="text-sm text-muted-foreground">NFC Tarama</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <p className="text-3xl font-bold text-gradient">4.9</p>
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
              <div className="relative">
                <img 
                  src={heroImage} 
                  alt="NFC Card" 
                  className="w-full max-w-lg mx-auto animate-float rounded-3xl shadow-2xl"
                />
                <div className="absolute -bottom-4 -right-4 w-32 h-32 gradient-primary rounded-3xl blur-2xl opacity-50" />
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/30 rounded-3xl blur-2xl" />
              </div>
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
              Neden <span className="text-gradient">NFCLink</span>?
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
                      src={product.image} 
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
                    <span className="text-2xl font-bold text-gradient">₺{product.price}</span>
                    <Button 
                      size="sm"
                      onClick={() => addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image
                      })}
                    >
                      Sepete Ekle
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

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
                <p className="text-sm text-muted-foreground">İlk ay tamamen ücretsiz</p>
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
              Binlerce profesyonel ve işletme zaten NFCLink kullanıyor. 
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
