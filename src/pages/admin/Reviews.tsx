import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Search,
  Check,
  X,
  MessageSquare,
  User,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Save,
  Trash2,
  Send,
  Eye,
  EyeOff,
  Loader2,
  Filter,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string;
  is_approved: boolean;
  is_visible: boolean;
  admin_response: string | null;
  admin_response_at: string | null;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
  products?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    avgRating: 0,
  });

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("reviews")
        .select(`
          *,
          user_profiles:user_id (first_name, last_name, email),
          products:product_id (id, name, image_url)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") {
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);

      // Calculate stats
      const allReviews = data || [];
      const pending = allReviews.filter((r) => !r.is_approved).length;
      const approved = allReviews.filter((r) => r.is_approved).length;
      const avgRating =
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0;

      setStats({
        total: allReviews.length,
        pending,
        approved,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (err) {
      console.error("Yorumlar yüklenemedi:", err);
      toast.error("Yorumlar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (review: Review) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved: true, updated_at: new Date().toISOString() })
        .eq("id", review.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, is_approved: true } : r))
      );
      toast.success("Yorum onaylandı");
    } catch (err) {
      console.error("Onaylama hatası:", err);
      toast.error("Onaylama başarısız");
    }
  };

  const handleReject = async (review: Review) => {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          is_approved: false,
          is_visible: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_approved: false, is_visible: false } : r
        )
      );
      toast.success("Yorum reddedildi");
    } catch (err) {
      console.error("Reddetme hatası:", err);
      toast.error("Reddetme başarısız");
    }
  };

  const handleToggleVisibility = async (review: Review) => {
    try {
      const newVisibility = !review.is_visible;
      const { error } = await supabase
        .from("reviews")
        .update({
          is_visible: newVisibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", review.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === review.id ? { ...r, is_visible: newVisibility } : r
        )
      );
      toast.success(newVisibility ? "Yorum görünür yapıldı" : "Yorum gizlendi");
    } catch (err) {
      console.error("Görünürlük hatası:", err);
      toast.error("İşlem başarısız");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedReview || !responseText.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          admin_response: responseText.trim(),
          admin_response_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedReview.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? {
                ...r,
                admin_response: responseText.trim(),
                admin_response_at: new Date().toISOString(),
              }
            : r
        )
      );

      toast.success("Yanıt gönderildi");
      setShowResponseDialog(false);
      setResponseText("");
      setSelectedReview(null);
    } catch (err) {
      console.error("Yanıt gönderme hatası:", err);
      toast.error("Yanıt gönderilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedReview) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          title: editTitle.trim() || null,
          comment: editComment.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedReview.id);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, title: editTitle.trim() || null, comment: editComment.trim() }
            : r
        )
      );

      toast.success("Yorum güncellendi");
      setShowEditDialog(false);
      setSelectedReview(null);
    } catch (err) {
      console.error("Güncelleme hatası:", err);
      toast.error("Güncelleme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedReview) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", selectedReview.id);

      if (error) throw error;

      setReviews((prev) => prev.filter((r) => r.id !== selectedReview.id));
      toast.success("Yorum silindi");
      setShowDeleteDialog(false);
      setSelectedReview(null);
    } catch (err) {
      console.error("Silme hatası:", err);
      toast.error("Silme başarısız");
    } finally {
      setSaving(false);
    }
  };

  const openResponseDialog = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.admin_response || "");
    setShowResponseDialog(true);
  };

  const openEditDialog = (review: Review) => {
    setSelectedReview(review);
    setEditTitle(review.title || "");
    setEditComment(review.comment);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (review: Review) => {
    setSelectedReview(review);
    setShowDeleteDialog(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4",
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      review.comment.toLowerCase().includes(search) ||
      review.title?.toLowerCase().includes(search) ||
      review.user_profiles?.first_name?.toLowerCase().includes(search) ||
      review.user_profiles?.last_name?.toLowerCase().includes(search) ||
      review.user_profiles?.email?.toLowerCase().includes(search) ||
      (review.products?.name ?? '').toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Değerlendirmeler</h1>
            <p className="text-muted-foreground">
              Müşteri yorumlarını yönetin
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Toplam Yorum</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Onay Bekleyen</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Onaylanmış</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating}</p>
                <p className="text-sm text-muted-foreground">Ort. Puan</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Yorum, kullanıcı veya ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "approved"] as FilterStatus[]).map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === "all" && "Tümü"}
                {status === "pending" && "Bekleyen"}
                {status === "approved" && "Onaylı"}
              </Button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Yorum bulunamadı</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "bg-card rounded-xl p-5 border transition-all",
                  !review.is_approved
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/50"
                )}
              >
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">
                          {review.user_profiles?.first_name || "Anonim"}{" "}
                          {review.user_profiles?.last_name || ""}
                        </p>
                        {!review.is_approved && (
                          <Badge variant="outline" className="border-amber-500 text-amber-500">
                            <Clock className="w-3 h-3 mr-1" />
                            Onay Bekliyor
                          </Badge>
                        )}
                        {review.is_approved && !review.is_visible && (
                          <Badge variant="outline" className="border-red-500 text-red-500">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Gizli
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.user_profiles?.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{review.products?.name}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-4">
                  {review.title && (
                    <h4 className="font-semibold mb-1">{review.title}</h4>
                  )}
                  <p className="text-muted-foreground">{review.comment}</p>
                </div>

                {/* Admin Response */}
                {review.admin_response && (
                  <div className="mb-4 pl-4 border-l-2 border-primary/30 bg-primary/5 rounded-r-lg p-3">
                    <p className="text-xs font-medium text-primary mb-1">
                      Esdodesign Yanıtı -{" "}
                      {review.admin_response_at &&
                        new Date(review.admin_response_at).toLocaleDateString("tr-TR")}
                    </p>
                    <p className="text-sm text-muted-foreground">{review.admin_response}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
                  {!review.is_approved && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                        onClick={() => handleApprove(review)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Onayla
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500 text-red-500 hover:bg-red-500/10"
                        onClick={() => handleReject(review)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reddet
                      </Button>
                    </>
                  )}

                  {review.is_approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(review)}
                    >
                      {review.is_visible ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Gizle
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Göster
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openResponseDialog(review)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    {review.admin_response ? "Yanıtı Düzenle" : "Yanıtla"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(review)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Düzenle
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={() => openDeleteDialog(review)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Sil
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yoruma Yanıt Ver</DialogTitle>
            <DialogDescription>
              Müşterinin yorumuna yanıt verin. Bu yanıt ürün sayfasında görünecektir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">
                {selectedReview?.user_profiles?.first_name}{" "}
                {selectedReview?.user_profiles?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedReview?.comment}</p>
            </div>

            <div>
              <Label htmlFor="response">Yanıtınız</Label>
              <textarea
                id="response"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Yanıtınızı yazın..."
                className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSendResponse} disabled={saving || !responseText.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yorumu Düzenle</DialogTitle>
            <DialogDescription>
              Müşterinin yorumunu düzenleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="editTitle">Başlık</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Başlık (opsiyonel)"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="editComment">Yorum</Label>
              <textarea
                id="editComment"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Yorum..."
                className="w-full mt-1 px-4 py-3 rounded-lg border border-input bg-background min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving || !editComment.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yorumu Sil</DialogTitle>
            <DialogDescription>
              Bu yorumu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm font-medium mb-1">
                {selectedReview?.user_profiles?.first_name}{" "}
                {selectedReview?.user_profiles?.last_name}
              </p>
              <p className="text-sm text-muted-foreground">{selectedReview?.comment}</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
