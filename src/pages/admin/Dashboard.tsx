import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Tag,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  activeDiscounts: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  user_profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Beklemede", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  confirmed: { label: "Onaylandı", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  production: { label: "Üretimde", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
  shipped: { label: "Kargoda", color: "bg-primary/10 text-primary border-primary/20" },
  delivered: { label: "Teslim Edildi", color: "bg-accent/10 text-accent border-accent/20" },
  cancelled: { label: "İptal", color: "bg-destructive/10 text-destructive border-destructive/20" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeDiscounts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Siparişleri getir
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*, user_profiles(first_name, last_name, email)")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Ürünleri say
      const { count: productsCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Aktif indirimleri say
      const { count: discountsCount } = await supabase
        .from("discounts")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

      setStats({
        totalOrders,
        pendingOrders,
        totalProducts: productsCount || 0,
        activeDiscounts: discountsCount || 0,
        totalRevenue,
      });

      setRecentOrders((orders || []).slice(0, 5));
    } catch (error) {
      console.error("Dashboard veri çekme hatası:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Toplam Sipariş",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "from-blue-500 to-blue-600",
      link: "/admin/orders",
    },
    {
      title: "Bekleyen Sipariş",
      value: stats.pendingOrders,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
      link: "/admin/orders?status=pending",
    },
    {
      title: "Toplam Gelir",
      value: `₺${stats.totalRevenue.toLocaleString("tr-TR")}`,
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Aktif Ürün",
      value: stats.totalProducts,
      icon: Package,
      color: "from-purple-500 to-violet-500",
      link: "/admin/products",
    },
  ];

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
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">
            NFCLink yönetim paneline hoş geldiniz
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {stat.link ? (
                <Link to={stat.link}>
                  <StatCard {...stat} />
                </Link>
              ) : (
                <StatCard {...stat} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Son Siparişler</h2>
            <Link to="/admin/orders">
              <Button variant="ghost" size="sm">
                Tümünü Gör
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Henüz sipariş yok</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  to={`/admin/orders?id=${order.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.user_profiles?.first_name} {order.user_profiles?.last_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      className={cn(
                        "border",
                        statusConfig[order.status]?.color || "bg-muted"
                      )}
                    >
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                    <span className="font-semibold text-gradient">
                      ₺{order.total?.toLocaleString("tr-TR")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Link to="/admin/products">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <Package className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-semibold mb-1">Yeni Ürün Ekle</h3>
              <p className="text-sm text-muted-foreground">
                Mağazaya yeni ürün ekleyin
              </p>
            </div>
          </Link>
          <Link to="/admin/discounts">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <Tag className="w-8 h-8 text-secondary mb-4" />
              <h3 className="font-semibold mb-1">İndirim Oluştur</h3>
              <p className="text-sm text-muted-foreground">
                Yeni indirim kodu oluşturun
              </p>
            </div>
          </Link>
          <Link to="/admin/orders?status=pending">
            <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
              <Clock className="w-8 h-8 text-accent mb-4" />
              <h3 className="font-semibold mb-1">Bekleyen Siparişler</h3>
              <p className="text-sm text-muted-foreground">
                {stats.pendingOrders} sipariş işlem bekliyor
              </p>
            </div>
          </Link>
        </motion.div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  link?: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-card border border-border/50 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br",
            color
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}
