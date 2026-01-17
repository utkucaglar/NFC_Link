import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const navigate = useNavigate();

  const handleQuantityChange = (id: number, change: number) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: number) => {
    removeFromCart(id);
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error("Lütfen bir indirim kodu girin");
      return;
    }
    toast.info("İndirim kodu uygulanıyor...");
    // TODO: Implement coupon validation
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Sepetiniz boş");
      return;
    }
    toast.info("Ödeme sayfasına yönlendiriliyorsunuz...");
    // TODO: Navigate to checkout page or integrate payment
    // navigate("/checkout");
  };

  const monthlyFee = cartItems.reduce((sum, item) => sum + 29 * item.quantity, 0);
  const subtotal = cartTotal;
  const total = subtotal;

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
                    className="bg-card rounded-2xl p-4 md:p-6 shadow-card border border-border/50"
                  >
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image */}
                      <Link to={`/product/${item.id}`} className="w-full sm:w-24 h-24 bg-muted/30 rounded-xl flex items-center justify-center shrink-0 hover:bg-muted/50 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 object-contain"
                        />
                      </Link>

                      {/* Details */}
                      <div className="flex-1">
                        <Link to={`/product/${item.id}`}>
                          <h3 className="font-semibold mb-1 hover:text-primary transition-colors cursor-pointer">{item.name}</h3>
                        </Link>
                        {item.customization && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Özelleştirme: {item.customization.text}, {item.customization.color}
                          </p>
                        )}
                        <p className="text-lg font-bold text-gradient">₺{item.price}</p>
                        <p className="text-xs text-muted-foreground">+ ₺29/ay abonelik</p>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
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
                      <span className="text-muted-foreground">Ara Toplam</span>
                      <span>₺{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Aylık Abonelik</span>
                      <span>₺{monthlyFee}/ay</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kargo</span>
                      <span className="text-accent">Ücretsiz</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">İlk Ay</span>
                      <span className="text-accent">Ücretsiz</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Toplam</span>
                      <span className="text-2xl font-bold text-gradient">₺{total}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      İlk aydan sonra aylık ₺{monthlyFee} abonelik ücreti
                    </p>
                  </div>

                  {/* Coupon */}
                  <div className="flex gap-2 mb-6">
                    <Input 
                      placeholder="İndirim kodu" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleApplyCoupon}>Uygula</Button>
                  </div>

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
    </Layout>
  );
}
