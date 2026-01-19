import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Calendar,
  Percent,
  DollarSign,
  Save,
  Users,
  ShoppingBag,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Discount {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  applicable_categories: string[] | null;
  applicable_products: number[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const emptyDiscount: Partial<Discount> = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_order_amount: 0,
  max_discount_amount: null,
  usage_limit: null,
  usage_count: 0,
  per_user_limit: 1,
  is_active: true,
  starts_at: new Date().toISOString(),
  expires_at: null,
  applicable_categories: null,
  applicable_products: null,
};

export default function AdminDiscounts() {
  const { user } = useAuth();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Partial<Discount> | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error("İndirimler yüklenirken hata:", error);
      toast.error("İndirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditingDiscount({ ...editingDiscount, code });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Kod kopyalandı");
  };

  const handleSave = async () => {
    if (!editingDiscount?.code || !editingDiscount?.discount_value) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    setSaving(true);
    try {
      const discountData = {
        ...editingDiscount,
        code: editingDiscount.code.toUpperCase(),
        updated_at: new Date().toISOString(),
      };

      if (editingDiscount.id) {
        // Update existing discount
        const { error } = await supabase
          .from("discounts")
          .update(discountData)
          .eq("id", editingDiscount.id);

        if (error) throw error;
        toast.success("İndirim güncellendi");
      } else {
        // Create new discount
        const { error } = await supabase
          .from("discounts")
          .insert({
            ...discountData,
            created_by: user?.id,
            created_at: new Date().toISOString(),
          });

        if (error) throw error;
        toast.success("İndirim oluşturuldu");
      }

      setShowModal(false);
      setEditingDiscount(null);
      fetchDiscounts();
    } catch (error: any) {
      console.error("Kaydetme hatası:", error);
      if (error.message?.includes("unique constraint")) {
        toast.error("Bu kod zaten kullanımda");
      } else {
        toast.error(error.message || "İndirim kaydedilemedi");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (discountId: string) => {
    try {
      const { error } = await supabase
        .from("discounts")
        .delete()
        .eq("id", discountId);

      if (error) throw error;

      setDiscounts(discounts.filter(d => d.id !== discountId));
      toast.success("İndirim silindi");
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error("Silme hatası:", error);
      const errorMessage = error?.message || "İndirim silinemedi";
      toast.error(errorMessage.includes("foreign key") 
        ? "Bu indirim kullanılmış siparişlerde bulunduğu için silinemiyor. Lütfen veritabanı migration'ını çalıştırın."
        : errorMessage
      );
    }
  };

  const toggleActive = async (discount: Discount) => {
    try {
      const { error } = await supabase
        .from("discounts")
        .update({ is_active: !discount.is_active, updated_at: new Date().toISOString() })
        .eq("id", discount.id);

      if (error) throw error;

      setDiscounts(discounts.map(d =>
        d.id === discount.id ? { ...d, is_active: !d.is_active } : d
      ));
      toast.success(discount.is_active ? "İndirim pasife alındı" : "İndirim aktif edildi");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      toast.error("Durum güncellenemedi");
    }
  };

  const isExpired = (discount: Discount) => {
    return discount.expires_at && new Date(discount.expires_at) < new Date();
  };

  const isUsageLimitReached = (discount: Discount) => {
    return discount.usage_limit && discount.usage_count >= discount.usage_limit;
  };

  const getStatus = (discount: Discount) => {
    if (!discount.is_active) return { label: "Pasif", color: "bg-muted text-muted-foreground" };
    if (isExpired(discount)) return { label: "Süresi Doldu", color: "bg-destructive/10 text-destructive" };
    if (isUsageLimitReached(discount)) return { label: "Limit Doldu", color: "bg-yellow-500/10 text-yellow-600" };
    return { label: "Aktif", color: "bg-accent/10 text-accent" };
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">İndirimler</span>
            </h1>
            <p className="text-muted-foreground">
              {discounts.length} indirim kodu, {discounts.filter(d => d.is_active && !isExpired(d) && !isUsageLimitReached(d)).length} aktif
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingDiscount(emptyDiscount);
              setShowModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni İndirim
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Kod veya açıklama ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Discounts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-medium">Kod</th>
                  <th className="text-left p-4 font-medium">İndirim</th>
                  <th className="text-left p-4 font-medium">Kullanım</th>
                  <th className="text-left p-4 font-medium">Geçerlilik</th>
                  <th className="text-left p-4 font-medium">Durum</th>
                  <th className="text-right p-4 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Tag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">İndirim kodu bulunamadı</p>
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => {
                    const status = getStatus(discount);
                    return (
                      <tr key={discount.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                              {discount.code}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8"
                              onClick={() => copyCode(discount.code)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                          {discount.description && (
                            <p className="text-xs text-muted-foreground mt-1">{discount.description}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {discount.discount_type === "percentage" ? (
                              <>
                                <Percent className="w-4 h-4 text-primary" />
                                <span className="font-semibold">{discount.discount_value}%</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 text-accent" />
                                <span className="font-semibold">₺{discount.discount_value}</span>
                              </>
                            )}
                          </div>
                          {discount.min_order_amount > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Min. ₺{discount.min_order_amount}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>
                              {discount.usage_count}
                              {discount.usage_limit && ` / ${discount.usage_limit}`}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Kişi başı: {discount.per_user_limit}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {discount.expires_at
                                ? new Date(discount.expires_at).toLocaleDateString("tr-TR")
                                : "Süresiz"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("border-none", status.color)}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => toggleActive(discount)}
                              title={discount.is_active ? "Pasife Al" : "Aktif Et"}
                            >
                              {discount.is_active ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingDiscount(discount);
                                setShowModal(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirm(discount.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Discount Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscount?.id ? "İndirimi Düzenle" : "Yeni İndirim"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Code */}
            <div>
              <Label htmlFor="code">İndirim Kodu *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  value={editingDiscount?.code || ""}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, code: e.target.value.toUpperCase() })}
                  placeholder="YENIUYE20"
                  className="font-mono uppercase"
                />
                <Button variant="outline" onClick={generateCode}>
                  Oluştur
                </Button>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Input
                id="description"
                value={editingDiscount?.description || ""}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, description: e.target.value })}
                placeholder="Yeni üyelere özel indirim"
              />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">İndirim Tipi</Label>
                <select
                  id="type"
                  value={editingDiscount?.discount_type || "percentage"}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, discount_type: e.target.value as "percentage" | "fixed" })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="percentage">Yüzde (%)</option>
                  <option value="fixed">Sabit Tutar (₺)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="value">
                  İndirim {editingDiscount?.discount_type === "percentage" ? "(%)" : "(₺)"} *
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={editingDiscount?.discount_value || ""}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, discount_value: parseFloat(e.target.value) || 0 })}
                  placeholder={editingDiscount?.discount_type === "percentage" ? "20" : "50"}
                />
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_order">Min. Sipariş Tutarı (₺)</Label>
                <Input
                  id="min_order"
                  type="number"
                  value={editingDiscount?.min_order_amount || ""}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, min_order_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              {editingDiscount?.discount_type === "percentage" && (
                <div>
                  <Label htmlFor="max_discount">Max. İndirim (₺)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={editingDiscount?.max_discount_amount || ""}
                    onChange={(e) => setEditingDiscount({ ...editingDiscount, max_discount_amount: parseFloat(e.target.value) || null })}
                    placeholder="100"
                  />
                </div>
              )}
            </div>

            {/* Usage Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usage_limit">Toplam Kullanım Limiti</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={editingDiscount?.usage_limit || ""}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, usage_limit: parseInt(e.target.value) || null })}
                  placeholder="Sınırsız"
                />
              </div>
              <div>
                <Label htmlFor="per_user">Kişi Başı Limit</Label>
                <Input
                  id="per_user"
                  type="number"
                  value={editingDiscount?.per_user_limit || ""}
                  onChange={(e) => setEditingDiscount({ ...editingDiscount, per_user_limit: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <Label htmlFor="expires">Bitiş Tarihi</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={editingDiscount?.expires_at?.slice(0, 16) || ""}
                onChange={(e) => setEditingDiscount({ ...editingDiscount, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Boş bırakılırsa süresiz geçerli olur
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
              <div>
                <p className="font-medium">İndirim Durumu</p>
                <p className="text-sm text-muted-foreground">
                  Pasif indirimler kullanılamaz
                </p>
              </div>
              <Switch
                checked={editingDiscount?.is_active ?? true}
                onCheckedChange={(checked) => setEditingDiscount({ ...editingDiscount, is_active: checked })}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowModal(false);
                  setEditingDiscount(null);
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>İndirimi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bu indirim kodunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
