import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, CircleDot } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "confirmed" | "production" | "shipped" | "delivered";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  trackingNumber?: string;
}

const orders: Order[] = [
  {
    id: "1",
    orderNumber: "NFC-2024-0001",
    date: "2024-01-10",
    status: "delivered",
    items: [
      { name: "NFC Kartvizit - Klasik Beyaz", quantity: 1, price: 149 }
    ],
    total: 149,
    trackingNumber: "1234567890"
  },
  {
    id: "2",
    orderNumber: "NFC-2024-0015",
    date: "2024-02-01",
    status: "shipped",
    items: [
      { name: "NFC Bileklik - Spor", quantity: 2, price: 199 }
    ],
    total: 398,
    trackingNumber: "0987654321"
  },
  {
    id: "3",
    orderNumber: "NFC-2024-0023",
    date: "2024-02-10",
    status: "production",
    items: [
      { name: "Pet Tag - Altın", quantity: 1, price: 129 },
      { name: "NFC Kartvizit - Premium Siyah", quantity: 1, price: 179 }
    ],
    total: 308
  },
  {
    id: "4",
    orderNumber: "NFC-2024-0030",
    date: "2024-02-15",
    status: "pending",
    items: [
      { name: "NFC Kartvizit - Klasik Beyaz", quantity: 3, price: 149 }
    ],
    total: 447
  }
];

const statusConfig = {
  pending: {
    label: "Beklemede",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    icon: Clock
  },
  confirmed: {
    label: "Onaylandı",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: CheckCircle2
  },
  production: {
    label: "Üretimde",
    color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    icon: CircleDot
  },
  shipped: {
    label: "Kargoda",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck
  },
  delivered: {
    label: "Teslim Edildi",
    color: "bg-accent/10 text-accent border-accent/20",
    icon: CheckCircle2
  }
};

export default function Orders() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

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
              const StatusIcon = statusConfig[order.status].icon;
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
                >
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{order.orderNumber}</h3>
                        <Badge className={cn("border", statusConfig[order.status].color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[order.status].label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.date).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gradient">₺{order.total}</p>
                      {order.trackingNumber && (
                        <p className="text-xs text-muted-foreground">
                          Takip: {order.trackingNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-border pt-4">
                    <div className="space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                          </span>
                          <span className="font-medium">₺{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar for Active Orders */}
                  {order.status !== "delivered" && (
                    <div className="mt-6">
                      <div className="flex justify-between mb-2">
                        {["pending", "confirmed", "production", "shipped", "delivered"].map((step, i) => {
                          const stepIndex = ["pending", "confirmed", "production", "shipped", "delivered"].indexOf(order.status);
                          const currentIndex = i;
                          const isCompleted = currentIndex <= stepIndex;
                          
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                isCompleted ? "gradient-primary" : "bg-muted"
                              )} />
                              <span className={cn(
                                "text-xs mt-1 hidden sm:block",
                                isCompleted ? "text-primary" : "text-muted-foreground"
                              )}>
                                {statusConfig[step as OrderStatus].label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full gradient-primary transition-all duration-500"
                          style={{
                            width: `${(["pending", "confirmed", "production", "shipped", "delivered"].indexOf(order.status) + 1) * 20}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {orders.length === 0 && (
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
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
}
