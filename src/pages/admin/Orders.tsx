import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  Truck,
  CircleDot,
  X,
  Save,
  Eye,
  Edit,
  Check,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import productCard from "@/assets/product-nfc-card.png";
import productBand from "@/assets/product-nfc-band.png";
import productPetTag from "@/assets/product-pet-tag.png";

// Helper function to get product image with fallback
const getProductImage = (imageUrl: string | null | undefined, productName: string) => {
  if (imageUrl && imageUrl.startsWith('http')) {
    return imageUrl;
  }
  // Fallback based on product name
  const name = productName?.toLowerCase() || '';
  if (name.includes('kartvizit') || name.includes('card')) return productCard;
  if (name.includes('bileklik') || name.includes('band')) return productBand;
  if (name.includes('pet') || name.includes('tag')) return productPetTag;
  return productCard;
};

interface OrderItem {
  id: string;
  product_id: number;
  quantity: number;
  price: number;
  customization: Record<string, any> | null;
  admin_notes: string | null;
  customization_confirmed: boolean;
  confirmed_at: string | null;
  products?: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number | null;
  discount_amount: number | null;
  tracking_number: string | null;
  shipping_address: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  order_items?: OrderItem[];
}

type OrderStatus = "pending" | "confirmed" | "production" | "shipped" | "delivered" | "cancelled";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Beklemede", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", icon: Clock },
  confirmed: { label: "Onaylandı", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: CheckCircle2 },
  production: { label: "Üretimde", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: CircleDot },
  shipped: { label: "Kargoda", color: "bg-primary/10 text-primary border-primary/20", icon: Truck },
  delivered: { label: "Teslim Edildi", color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle2 },
  cancelled: { label: "İptal Edildi", color: "bg-destructive/10 text-destructive border-destructive/20", icon: X },
};

const statusOrder: OrderStatus[] = ["pending", "confirmed", "production", "shipped", "delivered"];

export default function AdminOrders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(searchParams.get("id") || null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      console.log("Fetching orders...");
      
      // Önce siparişleri çek
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items(
            *,
            products(name, image_url)
          )
        `)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
        throw ordersError;
      }

      // Kullanıcı bilgilerini ayrı çek
      if (ordersData && ordersData.length > 0) {
        const userIds = [...new Set(ordersData.map(o => o.user_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email, phone")
          .in("id", userIds);

        if (profilesError) {
          console.error("Profiles fetch error:", profilesError);
        }

        // Profilleri siparişlere ekle
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        const ordersWithProfiles = ordersData.map(order => ({
          ...order,
          user_profiles: profilesMap.get(order.user_id) || null
        }));

        console.log("Orders fetched:", ordersWithProfiles.length, "orders found");
        setOrders(ordersWithProfiles);
      } else {
        console.log("No orders found");
        setOrders([]);
      }
    } catch (error: any) {
      console.error("Siparişler yüklenirken hata:", error);
      console.error("Error details:", error?.message, error?.code, error?.details);
      toast.error(`Siparişler yüklenemedi: ${error?.message || "Bilinmeyen hata"}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => {
    setUpdatingStatus(orderId);
    try {
      const updates: Record<string, any> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (trackingNumber) {
        updates.tracking_number = trackingNumber;
      }

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, status: newStatus, tracking_number: trackingNumber || o.tracking_number }
          : o
      ));
      
      toast.success("Sipariş durumu güncellendi");
      setTrackingInput("");
    } catch (error) {
      console.error("Durum güncelleme hatası:", error);
      toast.error("Durum güncellenemedi");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const saveAdminNotes = async (orderItemId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("order_items")
        .update({ 
          admin_notes: notes,
          customization_confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq("id", orderItemId);

      if (error) throw error;

      // Update local state
      setOrders(orders.map(order => ({
        ...order,
        order_items: order.order_items?.map(item =>
          item.id === orderItemId
            ? { ...item, admin_notes: notes, customization_confirmed: true }
            : item
        )
      })));

      toast.success("Kişiselleştirme notları kaydedildi");
      setEditingNotes(null);
    } catch (error) {
      console.error("Not kaydetme hatası:", error);
      toast.error("Notlar kaydedilemedi");
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user_profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.user_profiles?.first_name} ${order.user_profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Siparişler</span>
          </h1>
          <p className="text-muted-foreground">
            {orders.length} sipariş, {orders.filter(o => o.status === "pending").length} beklemede
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Sipariş no, e-posta veya müşteri adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              Tümü
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(key)}
              >
                {config.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card rounded-2xl"
            >
              <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Sipariş bulunamadı</p>
            </motion.div>
          ) : (
            filteredOrders.map((order, index) => {
              const StatusIcon = statusConfig[order.status as OrderStatus]?.icon || Clock;
              const isExpanded = expandedOrder === order.id;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
                >
                  {/* Order Header */}
                  <div
                    className="p-4 md:p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Package className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{order.order_number}</h3>
                            <Badge className={cn("border", statusConfig[order.status as OrderStatus]?.color)}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[order.status as OrderStatus]?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.user_profiles?.first_name} {order.user_profiles?.last_name} • {order.user_profiles?.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold text-gradient">
                          ₺{order.total?.toLocaleString("tr-TR")}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
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
                        <div className="p-4 md:p-6 space-y-6">
                          {/* Customer Info */}
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-medium mb-2">Müşteri Bilgileri</h4>
                              <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                                <p><span className="text-muted-foreground">Ad Soyad:</span> {order.user_profiles?.first_name} {order.user_profiles?.last_name}</p>
                                <p><span className="text-muted-foreground">E-posta:</span> {order.user_profiles?.email}</p>
                                <p><span className="text-muted-foreground">Telefon:</span> {order.user_profiles?.phone || "-"}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Teslimat Adresi</h4>
                              <div className="bg-muted/30 rounded-xl p-4 text-sm">
                                <p>{order.shipping_address || "Adres belirtilmemiş"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Order Items with Customizations */}
                          <div>
                            <h4 className="font-medium mb-3">Sipariş Kalemleri</h4>
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
                                            {item.quantity} adet × ₺{item.price}
                                          </p>
                                        </div>
                                        <span className="font-semibold">
                                          ₺{(item.quantity * item.price).toLocaleString("tr-TR")}
                                        </span>
                                      </div>

                                      {/* Customization Details */}
                                      {item.customization && Object.keys(item.customization).length > 0 && (
                                        <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-primary">Müşteri Kişiselleştirmesi</p>
                                            {item.customization_confirmed && (
                                              <Badge className="bg-accent/10 text-accent border-accent/20 text-xs">
                                                <Check className="w-3 h-3 mr-1" />
                                                Onaylandı
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="space-y-1 text-sm">
                                            {Object.entries(item.customization).map(([key, value]) => (
                                              <p key={key}>
                                                <span className="text-muted-foreground capitalize">{key}:</span>{" "}
                                                {typeof value === 'string' ? value : JSON.stringify(value)}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Admin Notes */}
                                      <div className="mt-3">
                                        {editingNotes === item.id ? (
                                          <div className="space-y-2">
                                            <textarea
                                              value={noteText}
                                              onChange={(e) => setNoteText(e.target.value)}
                                              placeholder="Kişiselleştirme notları..."
                                              className="w-full p-3 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                              rows={3}
                                            />
                                            <div className="flex gap-2">
                                              <Button
                                                size="sm"
                                                onClick={() => saveAdminNotes(item.id, noteText)}
                                              >
                                                <Save className="w-4 h-4 mr-1" />
                                                Kaydet & Onayla
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingNotes(null)}
                                              >
                                                İptal
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex items-start justify-between gap-2">
                                            {item.admin_notes ? (
                                              <div className="flex-1 p-3 bg-primary/5 rounded-lg border border-primary/20">
                                                <p className="text-sm font-medium text-primary mb-1">Admin Notu</p>
                                                <p className="text-sm">{item.admin_notes}</p>
                                              </div>
                                            ) : null}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => {
                                                setEditingNotes(item.id);
                                                setNoteText(item.admin_notes || "");
                                              }}
                                            >
                                              <Edit className="w-4 h-4 mr-1" />
                                              {item.admin_notes ? "Düzenle" : "Not Ekle"}
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Update */}
                          <div>
                            <h4 className="font-medium mb-3">Sipariş Durumu</h4>
                            <div className="flex flex-wrap gap-2">
                              {statusOrder.map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant={order.status === status ? "default" : "outline"}
                                  disabled={updatingStatus === order.id}
                                  onClick={() => {
                                    if (status === "shipped" && !order.tracking_number && !trackingInput) {
                                      toast.error("Kargo takip numarası girin");
                                      return;
                                    }
                                    updateOrderStatus(order.id, status, trackingInput || undefined);
                                  }}
                                >
                                  {statusConfig[status].label}
                                </Button>
                              ))}
                              <Button
                                size="sm"
                                variant={order.status === "cancelled" ? "destructive" : "outline"}
                                disabled={updatingStatus === order.id}
                                onClick={() => updateOrderStatus(order.id, "cancelled")}
                              >
                                İptal Et
                              </Button>
                            </div>

                            {/* Tracking Number Input */}
                            <div className="mt-4 flex gap-2 max-w-md">
                              <Input
                                placeholder="Kargo takip numarası"
                                value={trackingInput || order.tracking_number || ""}
                                onChange={(e) => setTrackingInput(e.target.value)}
                              />
                              {trackingInput && trackingInput !== order.tracking_number && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, order.status as OrderStatus, trackingInput)}
                                  disabled={updatingStatus === order.id}
                                >
                                  Kaydet
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Order Summary */}
                          <div className="border-t border-border pt-4">
                            <div className="flex justify-end">
                              <div className="w-64 space-y-2 text-sm">
                                {order.subtotal && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Ara Toplam:</span>
                                    <span>₺{order.subtotal.toLocaleString("tr-TR")}</span>
                                  </div>
                                )}
                                {order.discount_amount && order.discount_amount > 0 && (
                                  <div className="flex justify-between text-accent">
                                    <span>İndirim:</span>
                                    <span>-₺{order.discount_amount.toLocaleString("tr-TR")}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                                  <span>Toplam:</span>
                                  <span className="text-gradient">₺{order.total.toLocaleString("tr-TR")}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
