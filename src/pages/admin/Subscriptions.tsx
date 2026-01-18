import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Calendar,
  Wifi,
  User,
  ExternalLink,
  Power,
  Mail,
  Filter,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NFCSubscription {
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
  updated_at: string;
  user_id: string;
  user_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

type FilterStatus = "all" | "active" | "expiring" | "expired";

const typeLabels: Record<string, string> = {
  "business-card": "Kartvizit",
  "pet-id": "Pet ID",
  "redirect": "Yönlendirme"
};

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<NFCSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
    // Otomatik olarak süresi dolmuş abonelikleri devre dışı bırak
    checkAndDeactivateExpired();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Tüm NFC'leri çek
      const { data: nfcsData, error: nfcsError } = await supabase
        .from("nfcs")
        .select("*")
        .order("subscription_end_date", { ascending: true });

      if (nfcsError) throw nfcsError;

      if (nfcsData?.length) {
        // Kullanıcı bilgilerini çek
        const userIds = [...new Set(nfcsData.map(n => n.user_id))];
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email, phone")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        setSubscriptions(nfcsData.map(nfc => ({
          ...nfc,
          user_profile: profilesMap.get(nfc.user_id) || null
        })));
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error("Abonelikler yüklenemedi:", error);
      toast.error("Abonelikler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Süresi dolmuş abonelikleri otomatik devre dışı bırak
  const checkAndDeactivateExpired = async () => {
    try {
      const now = new Date().toISOString();
      
      // Süresi dolmuş ve hala aktif olan NFC'leri bul ve devre dışı bırak
      const { data, error } = await supabase
        .from("nfcs")
        .update({ 
          is_active: false, 
          subscription_status: "expired",
          updated_at: now 
        })
        .lt("subscription_end_date", now)
        .eq("is_active", true)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        toast.info(`${data.length} adet süresi dolmuş abonelik devre dışı bırakıldı`);
        fetchSubscriptions(); // Listeyi yenile
      }
    } catch (error) {
      console.error("Otomatik devre dışı bırakma hatası:", error);
    }
  };

  const getSubscriptionStatus = (nfc: NFCSubscription): { status: string; color: string; icon: React.ElementType } => {
    if (!nfc.subscription_end_date) {
      return { status: "Belirsiz", color: "bg-gray-500/10 text-gray-500", icon: Clock };
    }

    const endDate = new Date(nfc.subscription_end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: "Süresi Doldu", color: "bg-destructive/10 text-destructive", icon: XCircle };
    } else if (daysLeft <= 7) {
      return { status: `${daysLeft} gün kaldı`, color: "bg-amber-500/10 text-amber-600", icon: AlertTriangle };
    } else if (daysLeft <= 30) {
      return { status: `${daysLeft} gün kaldı`, color: "bg-yellow-500/10 text-yellow-600", icon: Clock };
    } else {
      return { status: "Aktif", color: "bg-accent/10 text-accent", icon: CheckCircle2 };
    }
  };

  const getDaysRemaining = (endDate: string | null): number => {
    if (!endDate) return -999;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const extendSubscription = async (nfc: NFCSubscription, days: number) => {
    setProcessingId(nfc.id);
    try {
      const currentEnd = nfc.subscription_end_date 
        ? new Date(nfc.subscription_end_date)
        : new Date();
      
      // Eğer süresi dolmuşsa şu andan itibaren uzat
      const baseDate = currentEnd < new Date() ? new Date() : currentEnd;
      const newEndDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from("nfcs")
        .update({
          subscription_end_date: newEndDate.toISOString(),
          subscription_status: "active",
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nfc.id);

      if (error) throw error;

      setSubscriptions(prev => prev.map(n => 
        n.id === nfc.id 
          ? { ...n, subscription_end_date: newEndDate.toISOString(), subscription_status: "active", is_active: true }
          : n
      ));

      toast.success(`Abonelik ${days} gün uzatıldı`);
    } catch (error) {
      console.error("Abonelik uzatma hatası:", error);
      toast.error("Abonelik uzatılamadı");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleNfcActive = async (nfc: NFCSubscription) => {
    setProcessingId(nfc.id);
    try {
      const { error } = await supabase
        .from("nfcs")
        .update({ 
          is_active: !nfc.is_active,
          updated_at: new Date().toISOString() 
        })
        .eq("id", nfc.id);

      if (error) throw error;

      setSubscriptions(prev => prev.map(n => 
        n.id === nfc.id ? { ...n, is_active: !n.is_active } : n
      ));

      toast.success(nfc.is_active ? "NFC devre dışı bırakıldı" : "NFC aktif edildi");
    } catch (error) {
      console.error("NFC durum güncelleme hatası:", error);
      toast.error("Durum güncellenemedi");
    } finally {
      setProcessingId(null);
    }
  };

  // Filtreleme
  const filteredSubscriptions = subscriptions.filter(nfc => {
    // Arama filtresi
    const searchMatch = 
      nfc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfc.user_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfc.user_profile?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfc.user_profile?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nfc.unique_key.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Durum filtresi
    const daysLeft = getDaysRemaining(nfc.subscription_end_date);
    
    switch (filterStatus) {
      case "active":
        return daysLeft > 7;
      case "expiring":
        return daysLeft >= 0 && daysLeft <= 7;
      case "expired":
        return daysLeft < 0;
      default:
        return true;
    }
  });

  // İstatistikler
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(n => getDaysRemaining(n.subscription_end_date) > 7).length,
    expiring: subscriptions.filter(n => {
      const d = getDaysRemaining(n.subscription_end_date);
      return d >= 0 && d <= 7;
    }).length,
    expired: subscriptions.filter(n => getDaysRemaining(n.subscription_end_date) < 0).length,
  };

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
            <span className="text-gradient">Abonelikler</span>
          </h1>
          <p className="text-muted-foreground">
            NFC aboneliklerini yönetin ve takip edin
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Toplam NFC</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Aktif</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{stats.expiring}</p>
                <p className="text-xs text-muted-foreground">Süresi Doluyor</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-2xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
                <p className="text-xs text-muted-foreground">Süresi Dolmuş</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Müşteri adı, e-posta veya NFC adı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Tümü ({stats.total})
            </Button>
            <Button
              variant={filterStatus === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("active")}
              className={filterStatus === "active" ? "" : "text-accent hover:text-accent"}
            >
              Aktif ({stats.active})
            </Button>
            <Button
              variant={filterStatus === "expiring" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("expiring")}
              className={filterStatus === "expiring" ? "" : "text-amber-500 hover:text-amber-500"}
            >
              Süresi Doluyor ({stats.expiring})
            </Button>
            <Button
              variant={filterStatus === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("expired")}
              className={filterStatus === "expired" ? "" : "text-destructive hover:text-destructive"}
            >
              Süresi Dolmuş ({stats.expired})
            </Button>
          </div>
        </motion.div>

        {/* Subscriptions List */}
        <div className="space-y-4">
          {filteredSubscriptions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-card rounded-2xl"
            >
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Kriterlere uygun abonelik bulunamadı" 
                  : "Henüz abonelik yok"}
              </p>
            </motion.div>
          ) : (
            filteredSubscriptions.map((nfc, index) => {
              const subStatus = getSubscriptionStatus(nfc);
              const StatusIcon = subStatus.icon;
              const daysLeft = getDaysRemaining(nfc.subscription_end_date);

              return (
                <motion.div
                  key={nfc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "bg-card rounded-2xl p-6 border transition-all",
                    daysLeft < 0 ? "border-destructive/30 bg-destructive/5" :
                    daysLeft <= 7 ? "border-amber-500/30 bg-amber-500/5" :
                    "border-border/50"
                  )}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* NFC Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        nfc.is_active ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Wifi className={cn(
                          "w-6 h-6",
                          nfc.is_active ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{nfc.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {typeLabels[nfc.type] || nfc.type}
                          </Badge>
                          <Badge className={cn("text-xs", subStatus.color)}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {subStatus.status}
                          </Badge>
                          {!nfc.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Devre Dışı
                            </Badge>
                          )}
                        </div>
                        
                        {/* User Info */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {nfc.user_profile?.first_name} {nfc.user_profile?.last_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {nfc.user_profile?.email}
                          </span>
                        </div>

                        {/* Dates */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Oluşturulma: {new Date(nfc.created_at).toLocaleDateString('tr-TR')}
                          </span>
                          {nfc.subscription_end_date && (
                            <span className={cn(
                              "flex items-center gap-1 font-medium",
                              daysLeft < 0 ? "text-destructive" :
                              daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"
                            )}>
                              <Clock className="w-3 h-3" />
                              Bitiş: {new Date(nfc.subscription_end_date).toLocaleDateString('tr-TR')}
                              {daysLeft >= 0 && ` (${daysLeft} gün)`}
                            </span>
                          )}
                          <span>
                            {nfc.scan_count || 0} tarama
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extendSubscription(nfc, 30)}
                        disabled={processingId === nfc.id}
                      >
                        <RefreshCw className={cn(
                          "w-4 h-4 mr-1",
                          processingId === nfc.id && "animate-spin"
                        )} />
                        +30 Gün
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extendSubscription(nfc, 365)}
                        disabled={processingId === nfc.id}
                      >
                        +1 Yıl
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNfcActive(nfc)}
                        disabled={processingId === nfc.id}
                      >
                        <Power className="w-4 h-4 mr-1" />
                        {nfc.is_active ? "Durdur" : "Aktif Et"}
                      </Button>
                      <a
                        href={`/nfc/${nfc.type === "business-card" ? "business" : nfc.type === "pet-id" ? "pet" : "redirect"}/${nfc.unique_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Auto-deactivation Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground"
        >
          <p className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>
              <strong>Otomatik Devre Dışı Bırakma:</strong> Abonelik süresi dolan NFC sayfaları otomatik olarak devre dışı bırakılır. 
              Müşteriler aboneliklerini yenileyene kadar NFC sayfaları erişilemez durumda kalır.
            </span>
          </p>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
