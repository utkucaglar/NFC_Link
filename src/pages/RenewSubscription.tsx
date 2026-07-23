import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CreditCard,
  Calendar,
  Clock,
  Check,
  ArrowLeft,
  Loader2,
  Shield,
  Wifi,
  PawPrint,
  Link2,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createPayTRToken, loadPayTRIframe, encodeBasket, checkPaymentStatus } from "@/lib/paytr";
import { sendSubscriptionRenewalNotificationToAdmins, sendSubscriptionRenewedEmail } from "@/lib/email";

interface NFCRecord {
  id: string;
  unique_key: string;
  name: string;
  type: string;
  is_active: boolean;
  data: Record<string, any>;
  scan_count: number;
  subscription_status: string;
  subscription_end_date: string | null;
  created_at: string;
  product_id?: number;
}

interface Product {
  id: number;
  name: string;
  monthly_subscription_fee: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  months: number;
  price: number;
  discount: number;
  popular: boolean;
}

const typeIcons: Record<string, React.ElementType> = {
  "business-card": CreditCard,
  "pet-id": PawPrint,
  "redirect": Link2,
};

const typeLabels: Record<string, string> = {
  "business-card": "Dijital Kartvizit",
  "pet-id": "Evcil Hayvan Kimliği",
  "redirect": "Özel Yönlendirme",
};

export default function RenewSubscription() {
  const { nfcId } = useParams<{ nfcId: string }>();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  const [nfc, setNfc] = useState<NFCRecord | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("3-months");
  
  // PayTR state
  const [showPayTRIframe, setShowPayTRIframe] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Abonelik planları - aylık fiyat üzerinden hesaplanacak
  const getPlans = (monthlyFee: number): SubscriptionPlan[] => [
    {
      id: "1-month",
      name: "1 Ay",
      months: 1,
      price: monthlyFee,
      discount: 0,
      popular: false,
    },
    {
      id: "3-months",
      name: "3 Ay",
      months: 3,
      price: monthlyFee * 3 * 0.9, // %10 indirim
      discount: 10,
      popular: true,
    },
    {
      id: "6-months",
      name: "6 Ay",
      months: 6,
      price: monthlyFee * 6 * 0.85, // %15 indirim
      discount: 15,
      popular: false,
    },
    {
      id: "12-months",
      name: "1 Yıl",
      months: 12,
      price: monthlyFee * 12 * 0.75, // %25 indirim
      discount: 25,
      popular: false,
    },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && nfcId) {
      fetchNfcData();
    }
  }, [user, nfcId]);

  const fetchNfcData = async () => {
    try {
      setLoading(true);

      // NFC verisini çek
      const { data: nfcData, error: nfcError } = await supabase
        .from("nfcs")
        .select("*")
        .eq("id", nfcId)
        .eq("user_id", user?.id)
        .single();

      if (nfcError || !nfcData) {
        toast.error("NFC bulunamadı");
        navigate("/my-nfc");
        return;
      }

      setNfc(nfcData);

      // Ürün fiyatını çekmek için
      let monthlyFee = 29; // Varsayılan
      let productName = "NFC Abonelik";
      let productId = 0;

      // NFC'ye bağlı product_id varsa o ürünün fiyatını çek
      if (nfcData.product_id) {
        const { data: productData } = await supabase
          .from("products")
          .select("id, name, monthly_subscription_fee")
          .eq("id", nfcData.product_id)
          .single();

        if (productData && productData.monthly_subscription_fee) {
          monthlyFee = productData.monthly_subscription_fee;
          productName = productData.name;
          productId = productData.id;
        }
      } else {
        // product_id yoksa, NFC tipine (nfc_type) göre ürün ara
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, monthly_subscription_fee")
          .eq("nfc_type", nfcData.type)
          .eq("is_active", true)
          .limit(1);

        if (productsData && productsData.length > 0 && productsData[0].monthly_subscription_fee) {
          monthlyFee = productsData[0].monthly_subscription_fee;
          productName = productsData[0].name;
          productId = productsData[0].id;
        }
      }

      setProduct({
        id: productId,
        name: productName,
        monthly_subscription_fee: monthlyFee,
      });
    } catch (error) {
      console.error("Veri çekme hatası:", error);
      toast.error("Bir hata oluştu");
      navigate("/my-nfc");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!nfc || !product || !user) return;

    const plans = getPlans(product.monthly_subscription_fee);
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    // Telefon numarası kontrolü - eksikse profil sayfasına yönlendir
    const userPhone = profile?.phone?.trim() || "";
    if (!userPhone) {
      toast.info("Ödeme yapmak için telefon numaranızı eklemeniz gerekiyor");
      navigate("/profile");
      return;
    }

    // Telefon numarasını parse et ve PayTR formatına çevir
    // Profil telefonu genellikle "+905538064115" formatında gelir
    // PayTR için "05538064115" formatına (0 ile başlayan 11 haneli) çevirmemiz gerekiyor
    let phoneNumber = userPhone.replace(/\s/g, '');
    
    // Eğer +90 ile başlıyorsa, +90'ı kaldır ve başına 0 ekle
    if (phoneNumber.startsWith('+90')) {
      phoneNumber = '0' + phoneNumber.substring(3);
    } 
    // Eğer 90 ile başlıyorsa (ama + yok), 90'ı kaldır ve başına 0 ekle
    else if (phoneNumber.startsWith('90') && phoneNumber.length > 10) {
      phoneNumber = '0' + phoneNumber.substring(2);
    }
    // Eğer zaten 0 ile başlıyorsa, olduğu gibi kullan
    // Eğer hiçbiri değilse, başına 0 ekle (eğer 10 haneli ise)
    else if (!phoneNumber.startsWith('0') && phoneNumber.length === 10) {
      phoneNumber = '0' + phoneNumber;
    }

    // PayTR format kontrolü: 0 ile başlayan 11 haneli olmalı
    if (!/^0[0-9]{10}$/.test(phoneNumber)) {
      toast.info("Geçerli bir telefon numarası eklemeniz gerekiyor (örn: 05XXXXXXXXX). Lütfen profil bilgilerinizi kontrol edin.");
      navigate("/profile");
      return;
    }

    setProcessing(true);

    try {
      // Kullanıcı bilgilerini hazırla
      const userName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : user.email?.split("@")[0] || "Kullanıcı";
      const userEmail = user.email || "";
      const userAddress = profile?.address || "Türkiye";

      // Sipariş numarası oluştur (PayTR sadece alfanumerik kabul eder)
      const orderNumber = `RENEW${new Date().getFullYear()}${Date.now().toString().slice(-8)}`;

      // Siparişi veritabanına kaydet (subscription renewal için)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          status: "pending",
          total: plan.price,
          shipping_address: `Abonelik Yenileme - ${nfc.name}`,
          phone: phoneNumber,
          notes: `NFC Abonelik Yenileme: ${plan.months} ay - ${nfc.name}`,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      
      setOrderId(orderData.id);

      // PayTR için sepet bilgilerini hazırla
      const basketItems = [{
        name: `NFC Abonelik Yenileme - ${plan.name}`,
        price: plan.price,
        quantity: 1,
      }];
      const userBasket = encodeBasket(basketItems);

      // PayTR token oluştur
      const tokenResult = await createPayTRToken({
        order_id: orderData.id,
        order_number: orderNumber,
        amount: Math.round(plan.price * 100), // PayTR kuruş cinsinden ister
        user_name: userName,
        user_email: userEmail,
        user_phone: phoneNumber,
        user_address: userAddress,
        user_basket: userBasket,
        currency: "TL",
      });

      if (!tokenResult.success || !tokenResult.token) {
        throw new Error(tokenResult.error || "Ödeme başlatılamadı");
      }

      if (tokenResult.payment_id) {
        setPaymentId(tokenResult.payment_id);
      }

      // PayTR iframe'i göster
      setShowPayTRIframe(true);
      setProcessing(false);

      // DOM güncellemesini bekle, sonra iframe'i yükle
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadPayTRIframe(tokenResult.token);

      // Ödeme durumunu kontrol et (polling)
      const currentPaymentId = tokenResult.payment_id;
      const checkInterval = setInterval(async () => {
        try {
          if (currentPaymentId) {
            const status = await checkPaymentStatus(currentPaymentId);
            if (status.status === "succeeded") {
              clearInterval(checkInterval);
              await handlePaymentSuccess(orderData.id, orderNumber, plan);
            } else if (status.status === "failed") {
              clearInterval(checkInterval);
              toast.error("Ödeme başarısız oldu");
              // Callback gecikirse pending kalmasın
              try {
                await supabase
                  .from("orders")
                  .update({ status: "cancelled", updated_at: new Date().toISOString() })
                  .eq("id", orderData.id);
              } catch (e) {
                console.warn("Order cancel update failed:", e);
              }
              setShowPayTRIframe(false);
            }
          }
        } catch (error) {
          console.error("Payment status check error:", error);
        }
      }, 2000);

      // 5 dakika sonra polling'i durdur
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 5 * 60 * 1000);

    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || "Ödeme başlatılırken hata oluştu");
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async (orderId: string, orderNumber: string, plan: SubscriptionPlan) => {
    if (!nfc || !user) return;

    try {
      setProcessing(true);

      // Mevcut bitiş tarihini al veya şu anı kullan
      const currentEnd = nfc.subscription_end_date
        ? new Date(nfc.subscription_end_date)
        : new Date();

      // Eğer süresi dolmuşsa şu andan itibaren başlat
      const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
      const newEndDate = new Date(
        baseDate.getTime() + plan.months * 30 * 24 * 60 * 60 * 1000
      );

      const newEndDateStr = newEndDate.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Sipariş durumunu güncelle
      const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (orderUpdateError) {
        console.error("Order update error:", orderUpdateError);
      }

      // NFC'yi güncelle
      const { error: updateError } = await supabase
        .from("nfcs")
        .update({
          subscription_end_date: newEndDate.toISOString(),
          subscription_status: "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nfc.id);

      if (updateError) throw updateError;

      // Kullanıcı bilgilerini hazırla
      const customerName = profile?.first_name && profile?.last_name
        ? `${profile.first_name} ${profile.last_name}`
        : user.email?.split("@")[0] || "Kullanıcı";
      const customerEmail = user.email || "";

      // Admin'lere bildirim gönder (arka planda, hata olsa bile devam et)
      sendSubscriptionRenewalNotificationToAdmins(
        nfc.name,
        plan.name,
        plan.months,
        plan.price,
        customerName,
        customerEmail,
        newEndDateStr
      ).then((result) => {
        if (result.success) {
          console.log("✅ Admin bildirimi gönderildi");
        } else {
          console.warn("⚠️ Admin bildirimi gönderilemedi:", result.error);
        }
      }).catch((err) => {
        console.warn("⚠️ Admin bildirimi hatası:", err);
      });

      // Kullanıcıya bildirim emaili gönder (arka planda)
      if (customerEmail) {
        sendSubscriptionRenewedEmail(
          customerEmail,
          nfc.name,
          plan.name,
          newEndDateStr
        ).then((result) => {
          if (result.success) {
            console.log("✅ Kullanıcıya email gönderildi");
          } else {
            console.warn("⚠️ Kullanıcı emaili gönderilemedi:", result.error);
          }
        }).catch((err) => {
          console.warn("⚠️ Kullanıcı emaili hatası:", err);
        });
      }

      toast.success(
        `Abonelik ${plan.months} ay uzatıldı! Yeni bitiş: ${newEndDate.toLocaleDateString("tr-TR")}`
      );
      
      setShowPayTRIframe(false);
      navigate("/my-nfc");
    } catch (error: any) {
      console.error('Payment success handler error:', error);
      toast.error(error.message || "Abonelik güncellenirken bir hata oluştu");
    } finally {
      setProcessing(false);
    }
  };

  const getDaysRemaining = (endDate: string | null): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!nfc || !product) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">NFC bulunamadı</p>
            <Link to="/my-nfc">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                NFC'lerime Dön
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const TypeIcon = typeIcons[nfc.type] || Wifi;
  const daysRemaining = getDaysRemaining(nfc.subscription_end_date);
  const isExpired = daysRemaining < 0;
  const plans = getPlans(product.monthly_subscription_fee);
  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/my-nfc" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              NFC'lerime Dön
            </Link>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Abonelik Yenile</span>
            </h1>
            <p className="text-muted-foreground">
              NFC aboneliğinizi yenileyerek kesintisiz hizmet alın
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* NFC Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border/50"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                    isExpired ? "bg-muted" : "gradient-primary"
                  )}
                >
                  <TypeIcon
                    className={cn(
                      "w-7 h-7",
                      isExpired ? "text-muted-foreground" : "text-primary-foreground"
                    )}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{nfc.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {typeLabels[nfc.type] || nfc.type}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={isExpired ? "destructive" : "default"}>
                      {isExpired
                        ? "Süresi Dolmuş"
                        : `${daysRemaining} gün kaldı`}
                    </Badge>
                    {nfc.subscription_end_date && (
                      <span className="text-xs text-muted-foreground">
                        Bitiş: {new Date(nfc.subscription_end_date).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Subscription Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-semibold mb-4">Abonelik Planı Seçin</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 text-left transition-all",
                      selectedPlan === plan.id
                        ? "border-primary bg-primary/5"
                        : "border-border/50 hover:border-primary/50 bg-card"
                    )}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">
                        Popüler
                      </Badge>
                    )}
                    {plan.discount > 0 && (
                      <Badge
                        variant="outline"
                        className="absolute -top-2 left-4 border-accent text-accent"
                      >
                        %{plan.discount} İndirim
                      </Badge>
                    )}
                    <div className="flex items-center gap-3 mb-3 mt-2">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          selectedPlan === plan.id
                            ? "border-primary bg-primary"
                            : "border-muted-foreground"
                        )}
                      >
                        {selectedPlan === plan.id && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <span className="font-semibold">{plan.name}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-gradient">
                        ₺{plan.price.toFixed(0)}
                      </span>
                      {plan.discount > 0 && (
                        <span className="text-sm text-muted-foreground line-through">
                          ₺{(product.monthly_subscription_fee * plan.months).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₺{(plan.price / plan.months).toFixed(0)}/ay
                    </p>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Order Summary & Payment - Below Plans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Order Summary */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Sipariş Özeti</h3>

                    <div className="space-y-3 pb-4 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">NFC</span>
                        <span>{nfc.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plan</span>
                        <span>{selectedPlanData?.name}</span>
                      </div>
                      {selectedPlanData && selectedPlanData.discount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">İndirim</span>
                          <span className="text-accent">%{selectedPlanData.discount}</span>
                        </div>
                      )}
                    </div>

                    <div className="py-4 border-b border-border">
                      <div className="flex justify-between">
                        <span className="font-semibold">Toplam</span>
                        <span className="text-2xl font-bold text-gradient">
                          ₺{selectedPlanData?.price.toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* New End Date Preview */}
                    {selectedPlanData && (
                      <div className="pt-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Yeni bitiş tarihi:</span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {(() => {
                            const currentEnd = nfc.subscription_end_date
                              ? new Date(nfc.subscription_end_date)
                              : new Date();
                            const baseDate =
                              currentEnd < new Date() ? new Date() : currentEnd;
                            const newEnd = new Date(
                              baseDate.getTime() +
                                selectedPlanData.months * 30 * 24 * 60 * 60 * 1000
                            );
                            return newEnd.toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            });
                          })()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Payment Section */}
                  <div className="flex flex-col justify-center">
                    {!showPayTRIframe ? (
                      <div className="space-y-4">
                        <Button
                          variant="hero"
                          className="w-full"
                          size="lg"
                          onClick={handlePayment}
                          disabled={processing}
                        >
                          {processing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              İşleniyor...
                            </>
                          ) : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Ödeme Yap
                            </>
                          )}
                        </Button>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
                          <Shield className="w-4 h-4" />
                          <span>256-bit SSL ile güvenli ödeme</span>
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
                            // Kullanıcı ödeme ekranını kapattıysa siparişi iptal et
                            if (orderId) {
                              supabase
                                .from("orders")
                                .update({ status: "cancelled", updated_at: new Date().toISOString() })
                                .eq("id", orderId)
                                .then(({ error }) => {
                                  if (error) console.warn("Order cancel update failed:", error);
                                });
                            }
                          }}
                          className="w-full"
                        >
                          Ödeme Sayfasını Kapat
                        </Button>
                      </div>
                    )}
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
