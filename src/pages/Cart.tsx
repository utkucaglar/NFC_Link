import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, Tag, X, CheckCircle2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Kişiselleştirme gerektiren NFC tipleri
const CUSTOMIZATION_NFC_TYPES = ["business-card", "pet-id", "redirect"];

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
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

  // Ürünün kişiselleştirme gerektirip gerektirmediğini kontrol et
  const requiresCustomization = (item: typeof cartItems[0]): boolean => {
    const nfcType = item.customization?.nfcType || item.customization?.type;
    return CUSTOMIZATION_NFC_TYPES.includes(nfcType);
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
                          <div className="text-sm text-muted-foreground mb-2">
                            {item.customization.renk && (
                              <span>Renk: {item.customization.renk}</span>
                            )}
                            {item.customization.nfcType === "business-card" && item.customization.name && (
                              <span className="block">Kartvizit: {item.customization.name}</span>
                            )}
                            {item.customization.nfcType === "pet-id" && item.customization.petName && (
                              <span className="block">Pet: {item.customization.petName}</span>
                            )}
                            {item.customization.type === "business-card" && item.customization.name && (
                              <span className="block">Kartvizit: {item.customization.name}</span>
                            )}
                            {item.customization.type === "pet-id" && item.customization.petName && (
                              <span className="block">Pet: {item.customization.petName}</span>
                            )}
                          </div>
                        )}
                        <p className="text-lg font-bold text-gradient">₺{item.price}</p>
                        {requiresCustomization(item) && (
                          <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            Her NFC için ayrı bilgi gerekli
                          </p>
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
    </Layout>
  );
}
