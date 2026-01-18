import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShoppingCart, Loader2, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { getProductImage } from "@/lib/helpers";

// Kişiselleştirme gerektiren kategoriler (tüm NFC ürünleri)
const CUSTOMIZATION_CATEGORIES = ["Profesyonel", "Premium", "Evcil Hayvan", "Spor & Etkinlik"];

const categories = ["Tümü", "Profesyonel", "Spor & Etkinlik", "Evcil Hayvan"];

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  monthly_subscription_fee: number;
}

export default function Products() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  // Ürünün kişiselleştirme gerektirip gerektirmediğini kontrol et
  const requiresCustomization = (category: string): boolean => {
    return CUSTOMIZATION_CATEGORIES.some(c => 
      category.toLowerCase().includes(c.toLowerCase())
    );
  };

  // Sepete ekle veya detay sayfasına yönlendir
  const handleAddToCart = (product: Product) => {
    if (requiresCustomization(product.category)) {
      // Kişiselleştirme gerektiren ürünler için detay sayfasına yönlendir
      navigate(`/product/${product.id}`);
      toast.info("Bu ürün için bilgilerinizi girmeniz gerekiyor");
    } else {
      // Diğer ürünler için doğrudan sepete ekle
      const totalPrice = product.price + (product.monthly_subscription_fee || 29);
      addToCart({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: totalPrice, // Ürün + ilk ay abonelik
        image: getProductImage(product.image_url, product.category),
        customization: {
          subscriptionFee: product.monthly_subscription_fee || 29
        }
      });
    }
  };

  // Fetch products from Supabase - Native fetch API kullanarak (Chrome uyumluluğu için)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase yapılandırması eksik');
        }

        console.log('Fetching products with native fetch...');
        
        // Native fetch API kullan - Supabase client yerine
        const response = await fetch(
          `${supabaseUrl}/rest/v1/products?select=id,name,description,price,category,image_url,monthly_subscription_fee&is_active=eq.true&order=id.asc`,
          {
            method: 'GET',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            signal: controller.signal
          }
        );

        // Component unmount olduysa state güncelleme yapma
        if (!isMounted) {
          console.log('Component unmounted, skipping state update');
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Fetch error:', response.status, errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetch response:', data);

        if (!data || data.length === 0) {
          setError('Veritabanında ürün bulunamadı. SQL dosyalarını çalıştırdığınızdan emin olun.');
          toast.warning('Veritabanında ürün yok');
          setLoading(false);
          return;
        }

        setProducts(data);
        setLoading(false);
        console.log(`${data.length} ürün yüklendi`);
      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        console.error('Error fetching products:', err);
        setError(`Bağlantı hatası: ${err.message}`);
        toast.error('Ürünler yüklenemedi');
        setLoading(false);
      }
    };

    fetchProducts();

    // Cleanup function - component unmount olduğunda çalışır
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "Tümü" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Ürünler Yüklenemedi</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-lg">
              <p className="font-medium">Kontrol edilecekler:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Supabase SQL Editor'da 01-04 dosyalarını çalıştırın</li>
                <li>.env dosyasında doğru API key olduğundan emin olun</li>
                <li>Supabase projesinin aktif olduğunu kontrol edin</li>
              </ol>
            </div>
            <Button 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tekrar Dene
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-gradient">NFC Ürünleri</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              İhtiyacınıza uygun NFC çözümünü bulun. Tüm ürünler ilk ay ücretsiz abonelik ile gelir.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col md:flex-row gap-4 mb-8"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 border border-border/50"
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
                    <h3 className="text-lg font-semibold mt-3 mb-1 hover:text-primary transition-colors">{product.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gradient">
                        ₺{(product.price + (product.monthly_subscription_fee || 29)).toFixed(0)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        ₺{product.price} ürün + ₺{product.monthly_subscription_fee || 29} (ilk ay abonelik)
                      </p>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                    >
                      {requiresCustomization(product.category) ? (
                        <>
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Bilgileri Gir
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Sepete Ekle
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aradığınız kriterlere uygun ürün bulunamadı.</p>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
