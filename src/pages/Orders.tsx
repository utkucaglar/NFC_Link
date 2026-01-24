import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, CircleDot, X, ChevronDown, ChevronUp, ExternalLink, Star, MessageSquare, MapPin, User, Briefcase, Building2, Mail, Phone, Globe, Linkedin, Instagram, Palette, CreditCard, Gift, Calendar } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { 
  getProductImage, 
  formatPrice, 
  formatDateTime, 
  ORDER_STATUS_CONFIG, 
  ORDER_STATUS_FLOW,
  type OrderStatus 
} from "@/lib/helpers";

interface OrderItem {
  id: string;
  product_id: number;
  quantity: number;
  price: number;
  customization: Record<string, any> | null;
  admin_notes: string | null;
  customization_confirmed: boolean;
  products?: { name: string; image_url: string };
}

interface Order {
  id: string;
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number | null;
  discount_amount: number | null;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

const statusIcons: Record<OrderStatus, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle2,
  production: CircleDot,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: X,
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            products(name, image_url)
          )
        `)
        .eq("user_id", user?.id)
        // Ödeme başarısız/pending siparişleri "Siparişlerim"de göstermeyelim
        // (PayTR'da sipariş kaydı ödeme başlamadan oluşabiliyor)
        .in("status", ["confirmed", "production", "shipped", "delivered"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Siparişler yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <Layout>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center min-h-[40vh]">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

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
              <span className="text-gradient">Siparişlerim</span>
            </h1>
            <p className="text-muted-foreground">
              {orders.length} sipariş
            </p>
          </motion.div>

          <div className="space-y-4">
            {orders.map((order, index) => {
              const StatusIcon = statusIcons[order.status] || Clock;
              const isExpanded = expandedOrder === order.id;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                  {/* Header - Clickable */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{order.order_number}</h3>
                          <Badge className={cn("border", ORDER_STATUS_CONFIG[order.status]?.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {ORDER_STATUS_CONFIG[order.status]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gradient">₺{order.total?.toLocaleString('tr-TR')}</p>
                          {order.tracking_number && (
                            <p className="text-xs text-muted-foreground">
                              Takip: {order.tracking_number}
                            </p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1.5">
                          <img
                            src={getProductImage(item.products?.image_url, item.products?.name || '')}
                            alt={item.products?.name}
                            className="w-6 h-6 object-contain"
                          />
                          <span className="text-sm">{item.products?.name}</span>
                          <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border"
                      >
                        <div className="p-6 space-y-6">
                          {/* Order Items Detail */}
                          <div>
                            <h4 className="font-medium mb-3">Sipariş Detayları</h4>
                            <div className="space-y-4">
                              {order.order_items?.map((item) => (
                                <div
                                  key={item.id}
                                  className="bg-muted/30 rounded-xl p-4"
                                >
                                  <div className="flex items-start gap-4">
                                    <img
                                      src={getProductImage(item.products?.image_url, item.products?.name || '')}
                                      alt={item.products?.name}
                                      className="w-16 h-16 object-contain rounded-lg bg-muted/50 p-1"
                                    />
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-medium">{item.products?.name}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.quantity} adet × ₺{item.price?.toLocaleString('tr-TR')}
                                          </p>
                                        </div>
                                        <span className="font-semibold">
                                          ₺{(item.quantity * item.price)?.toLocaleString('tr-TR')}
                                        </span>
                                      </div>

                                      {/* Customization Details - Customer's Submission */}
                                      {item.customization && Object.keys(item.customization).length > 0 && (() => {
                                        // Field configuration with icons and grouping
                                        const fieldConfig: Record<string, { label: string; icon: React.ElementType; group: string; priority: number }> = {
                                          // Kişisel Bilgiler
                                          name: { label: 'Ad Soyad', icon: User, group: 'personal', priority: 1 },
                                          title: { label: 'Ünvan', icon: Briefcase, group: 'personal', priority: 2 },
                                          company: { label: 'Şirket', icon: Building2, group: 'personal', priority: 3 },
                                          bio: { label: 'Hakkında', icon: User, group: 'personal', priority: 4 },
                                          // İletişim
                                          phone: { label: 'Telefon', icon: Phone, group: 'contact', priority: 10 },
                                          email: { label: 'E-posta', icon: Mail, group: 'contact', priority: 11 },
                                          whatsapp: { label: 'WhatsApp', icon: Phone, group: 'contact', priority: 12 },
                                          // Sosyal Medya
                                          linkedin: { label: 'LinkedIn', icon: Linkedin, group: 'social', priority: 20 },
                                          instagram: { label: 'Instagram', icon: Instagram, group: 'social', priority: 21 },
                                          website: { label: 'Web Sitesi', icon: Globe, group: 'social', priority: 22 },
                                          // Görünüm
                                          renk: { label: 'Renk', icon: Palette, group: 'appearance', priority: 30 },
                                          color: { label: 'Renk', icon: Palette, group: 'appearance', priority: 30 },
                                          theme: { label: 'Tema', icon: Palette, group: 'appearance', priority: 31 },
                                          // Abonelik
                                          subscriptionFee: { label: 'Aylık Abonelik', icon: CreditCard, group: 'subscription', priority: 40 },
                                          freeSubscriptionMonths: { label: 'Ücretsiz Süre', icon: Gift, group: 'subscription', priority: 41 },
                                          originalPrice: { label: 'Liste Fiyatı', icon: CreditCard, group: 'subscription', priority: 42 },
                                          discountPercentage: { label: 'İndirim', icon: Gift, group: 'subscription', priority: 43 },
                                          // Evcil Hayvan
                                          petName: { label: 'Hayvan Adı', icon: User, group: 'pet', priority: 50 },
                                          ownerName: { label: 'Sahip Adı', icon: User, group: 'pet', priority: 51 },
                                          ownerPhone: { label: 'Sahip Telefonu', icon: Phone, group: 'pet', priority: 52 },
                                          // Sevgili Sayfası
                                          partnerName1: { label: 'İsim 1', icon: User, group: 'couple', priority: 60 },
                                          partnerName2: { label: 'İsim 2', icon: User, group: 'couple', priority: 61 },
                                          relationshipStartDate: { label: 'Birliktelik Tarihi', icon: Calendar, group: 'couple', priority: 62 },
                                          subtitle: { label: 'Alt Başlık', icon: User, group: 'couple', priority: 63 },
                                        };

                                        // Hide these fields completely
                                        const hiddenFields = ['nfcType', 'type', 'SubscriptionFee', 'backgroundImage', 'petImage', 'petMessage', 'address', 'healthNotes', 'microchipNumber'];

                                        const themeMap: Record<string, string> = {
                                          dark: 'Koyu',
                                          light: 'Açık',
                                          minimal: 'Minimal',
                                          gradient: 'Gradyan',
                                          romantic: 'Romantik',
                                          elegant: 'Zarif',
                                          modern: 'Modern',
                                          nature: 'Doğa',
                                          ocean: 'Okyanus',
                                          sunset: 'Gün Batımı',
                                        };

                                        const formatValue = (key: string, value: unknown): string => {
                                          if (value === null || value === undefined || value === '') return '';
                                          
                                          // Tarih formatı
                                          if (key === 'relationshipStartDate' && typeof value === 'string') {
                                            const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                                            if (m) {
                                              const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
                                              if (!Number.isNaN(date.getTime())) {
                                                return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' });
                                              }
                                            }
                                          }
                                          
                                          // Para formatı
                                          if ((key === 'subscriptionFee' || key === 'originalPrice') && typeof value === 'number') {
                                            return `₺${value.toLocaleString('tr-TR')}`;
                                          }
                                          
                                          // Ay formatı
                                          if (key === 'freeSubscriptionMonths') {
                                            return `${value} ay`;
                                          }
                                          
                                          // Yüzde formatı
                                          if (key === 'discountPercentage') {
                                            return `%${value}`;
                                          }
                                          
                                          // Tema formatı
                                          if (key === 'theme' && typeof value === 'string') {
                                            return themeMap[value] || value.charAt(0).toUpperCase() + value.slice(1);
                                          }
                                          
                                          return String(value);
                                        };

                                        // Filter and sort entries
                                        const entries = Object.entries(item.customization)
                                          .filter(([key, value]) => {
                                            if (hiddenFields.includes(key)) return false;
                                            if (value === null || value === undefined || value === '') return false;
                                            return true;
                                          })
                                          .sort((a, b) => {
                                            const priorityA = fieldConfig[a[0]]?.priority ?? 100;
                                            const priorityB = fieldConfig[b[0]]?.priority ?? 100;
                                            return priorityA - priorityB;
                                          });

                                        // Group entries
                                        const groups: Record<string, Array<[string, unknown]>> = {};
                                        entries.forEach(([key, value]) => {
                                          const group = fieldConfig[key]?.group || 'other';
                                          if (!groups[group]) groups[group] = [];
                                          groups[group].push([key, value]);
                                        });

                                        const groupLabels: Record<string, string> = {
                                          personal: 'Kişisel Bilgiler',
                                          contact: 'İletişim',
                                          social: 'Sosyal Medya',
                                          appearance: 'Görünüm',
                                          subscription: 'Abonelik Bilgileri',
                                          pet: 'Evcil Hayvan',
                                          couple: 'Çift Bilgileri',
                                          other: 'Diğer',
                                        };

                                        const groupOrder = ['personal', 'contact', 'social', 'appearance', 'pet', 'couple', 'subscription', 'other'];

                                        return (
                                          <div className="mt-3 p-4 bg-muted/30 rounded-xl border border-border">
                                            <div className="flex items-center justify-between mb-4">
                                              <p className="text-sm font-semibold flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-primary" />
                                                Kişiselleştirme Bilgileri
                                              </p>
                                              {item.customization_confirmed && (
                                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                                  Onaylandı
                                                </Badge>
                                              )}
                                            </div>
                                            
                                            <div className="space-y-4">
                                              {groupOrder.filter(g => groups[g]?.length > 0).map((groupKey) => (
                                                <div key={groupKey}>
                                                  {Object.keys(groups).filter(g => groups[g]?.length > 0).length > 1 && (
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                                      {groupLabels[groupKey]}
                                                    </p>
                                                  )}
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {groups[groupKey]?.map(([key, value]) => {
                                                      const config = fieldConfig[key];
                                                      const Icon = config?.icon || User;
                                                      const label = config?.label || key;
                                                      const formattedValue = formatValue(key, value);
                                                      
                                                      if (!formattedValue) return null;
                                                      
                                                      // URL'leri link olarak göster
                                                      const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
                                                      
                                                      return (
                                                        <div key={key} className="flex items-start gap-2 p-2 rounded-lg bg-background/50">
                                                          <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                          <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground">{label}</p>
                                                            {isUrl ? (
                                                              <a 
                                                                href={formattedValue} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-sm font-medium text-primary hover:underline truncate block"
                                                              >
                                                                {formattedValue.replace(/^https?:\/\/(www\.)?/, '')}
                                                              </a>
                                                            ) : (
                                                              <p className="text-sm font-medium truncate">{formattedValue}</p>
                                                            )}
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })()}

                                      {/* Admin Notes - Production Notes */}
                                      {item.admin_notes && (
                                        <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                          <p className="text-sm font-medium text-primary mb-1">Üretim Notu</p>
                                          <p className="text-sm">{item.admin_notes}</p>
                                        </div>
                                      )}

                                      {/* Review Button - for delivered/shipped orders */}
                                      {(order.status === 'delivered' || order.status === 'shipped' || order.status === 'confirmed') && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              navigate(`/product/${item.product_id}#reviews`);
                                            }}
                                          >
                                            <Star className="w-4 h-4 mr-1" />
                                            Değerlendir
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (() => {
                            // Adres formatı: İsim Soyisim\nTelefon\nAdres1\nAdres2 (opsiyonel)\nİlçe, İl PostaKodu\nNot: ... (opsiyonel)
                            const lines = order.shipping_address.split('\n').map(l => l.trim()).filter(l => l);
                            
                            let name = '';
                            let phone = '';
                            let fullAddress = '';
                            let district = '';
                            let city = '';
                            let postalCode = '';
                            let notes = '';
                            
                            // Her satırı analiz et
                            const addressParts: string[] = [];
                            
                            lines.forEach((line, index) => {
                              // Not satırı
                              if (line.startsWith('Not:')) {
                                notes = line.replace('Not:', '').trim();
                                return;
                              }
                              
                              // Telefon - sayı ve + içeren, en az 10 karakter
                              if (line.match(/^[\+]?[0-9\s\-\(\)]{10,}$/)) {
                                phone = line;
                                return;
                              }
                              
                              // İlk satır genellikle isim
                              if (index === 0 && !line.match(/\d{5}/) && !line.includes('Mahalle') && !line.includes('Cad') && !line.includes('Sok')) {
                                name = line;
                                return;
                              }
                              
                              // Posta kodu içeren satır - İlçe, İl 34000 formatı
                              const postalMatch = line.match(/(\d{5})/);
                              if (postalMatch) {
                                postalCode = postalMatch[1];
                                const cityPart = line.replace(/\d{5}/, '').trim().replace(/,\s*$/, '');
                                
                                // İlçe, İl formatını ayır
                                if (cityPart.includes(',')) {
                                  const parts = cityPart.split(',').map(p => p.trim()).filter(p => p);
                                  if (parts.length >= 2) {
                                    district = parts[0];
                                    city = parts.slice(1).join(', ');
                                  } else if (parts.length === 1) {
                                    city = parts[0];
                                  }
                                } else {
                                  city = cityPart;
                                }
                                return;
                              }
                              
                              // Kalan satırlar adres parçaları
                              addressParts.push(line);
                            });
                            
                            fullAddress = addressParts.join(', ');
                            
                            return (
                              <div className="p-4 bg-muted/30 rounded-xl border border-border">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium mb-3">Teslimat Adresi</p>
                                    <div className="space-y-2 text-sm">
                                      {name && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">Alıcı:</span>
                                          <span className="text-foreground flex-1 font-medium">{name}</span>
                                        </p>
                                      )}
                                      {phone && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">Telefon:</span>
                                          <span className="text-foreground flex-1">{phone}</span>
                                        </p>
                                      )}
                                      {fullAddress && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">Adres:</span>
                                          <span className="text-foreground flex-1">{fullAddress}</span>
                                        </p>
                                      )}
                                      {(district || city) && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">İlçe/İl:</span>
                                          <span className="text-foreground flex-1">
                                            {[district, city].filter(Boolean).join(', ')}
                                          </span>
                                        </p>
                                      )}
                                      {postalCode && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">Posta Kodu:</span>
                                          <span className="text-foreground flex-1">{postalCode}</span>
                                        </p>
                                      )}
                                      {notes && (
                                        <p className="flex items-start gap-2">
                                          <span className="text-muted-foreground font-medium min-w-[120px]">Kurye Notu:</span>
                                          <span className="text-foreground flex-1 text-primary">{notes}</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Tracking Info */}
                          {order.tracking_number && (order.status === 'shipped' || order.status === 'delivered') && (
                            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-primary mb-1">Kargo Takip</p>
                                  <p className="text-sm">Takip No: <span className="font-mono">{order.tracking_number}</span></p>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://gonderitakip.ptt.gov.tr/Track/Verify?q=${order.tracking_number}`, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Takip Et
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Order Summary */}
                          <div className="border-t border-border pt-4">
                            <div className="flex justify-end">
                              <div className="w-64 space-y-2 text-sm">
                                {order.subtotal && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ara Toplam:</span>
                                    <span>₺{order.subtotal.toLocaleString('tr-TR')}</span>
                                  </div>
                                )}
                                {order.discount_amount && order.discount_amount > 0 && (
                                  <div className="flex justify-between text-accent">
                                    <span>İndirim:</span>
                                    <span>-₺{order.discount_amount.toLocaleString('tr-TR')}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                                  <span>Toplam:</span>
                                  <span className="text-gradient">₺{order.total?.toLocaleString('tr-TR')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar for Active Orders */}
                          {order.status !== "delivered" && order.status !== "cancelled" && (
                            <div className="pt-4 border-t border-border">
                              <h4 className="font-medium mb-4">Sipariş Durumu</h4>
                              <div className="flex justify-between mb-2">
                                {ORDER_STATUS_FLOW.map((step, i) => {
                                  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);
                                  const currentIndex = i;
                                  const isCompleted = currentIndex <= stepIndex;
                                  
                                  return (
                                    <div key={step} className="flex flex-col items-center">
                                      <div className={cn(
                                        "w-4 h-4 rounded-full flex items-center justify-center",
                                        isCompleted ? "gradient-primary" : "bg-muted"
                                      )}>
                                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                                      </div>
                                      <span className={cn(
                                        "text-xs mt-2 text-center max-w-[60px]",
                                        isCompleted ? "text-primary font-medium" : "text-muted-foreground"
                                      )}>
                                        {ORDER_STATUS_CONFIG[step].label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full gradient-primary transition-all duration-500"
                                  style={{
                                    width: `${(ORDER_STATUS_FLOW.indexOf(order.status) + 1) * 20}%`
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Cancelled Order Info */}
                          {order.status === "cancelled" && (
                            <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                              <p className="font-medium text-destructive mb-1">Sipariş İptal Edildi</p>
                              <p className="text-sm text-muted-foreground">
                                Bu sipariş iptal edilmiştir. Sorularınız için bizimle iletişime geçebilirsiniz.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {orders.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Henüz Siparişiniz Yok</h2>
              <p className="text-muted-foreground mb-6">
                İlk siparişinizi verin ve NFC deneyimine başlayın.
              </p>
              <Button onClick={() => navigate('/products')}>
                Ürünlere Göz At
              </Button>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
