import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  Wifi, QrCode, Edit, RefreshCw, ExternalLink, 
  Copy, Check, CreditCard, PawPrint, Link2, Download, Loader2,
  Eye, Save, X, Calendar, AlertTriangle, ShoppingCart
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessCardForm, BusinessCardData, defaultBusinessCardData } from "@/components/forms/BusinessCardForm";
import { PetIdForm, PetIdData, defaultPetIdData } from "@/components/forms/PetIdForm";

type NFCType = "business-card" | "pet-id" | "redirect";

interface NFCRecord {
  id: string;
  unique_key: string;
  name: string;
  type: NFCType;
  is_active: boolean;
  data: Record<string, any>;
  theme: string;
  scan_count: number;
  subscription_status: string;
  subscription_end_date: string | null;
  created_at: string;
  updated_at: string;
}

const typeIcons: Record<NFCType, React.ElementType> = {
  "business-card": CreditCard,
  "pet-id": PawPrint,
  "redirect": Link2
};

const typeLabels: Record<NFCType, string> = {
  "business-card": "Dijital Kartvizit",
  "pet-id": "Evcil Hayvan Kimliği",
  "redirect": "Özel Yönlendirme"
};

const typePaths: Record<NFCType, string> = {
  "business-card": "business",
  "pet-id": "pet",
  "redirect": "redirect"
};

export default function MyNFC() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [nfcs, setNfcs] = useState<NFCRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedNfc, setSelectedNfc] = useState<NFCRecord | null>(null);
  
  // Dialog states
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  
  // Edit form states
  const [editName, setEditName] = useState("");
  const [businessCardData, setBusinessCardData] = useState<BusinessCardData>(defaultBusinessCardData);
  const [petIdData, setPetIdData] = useState<PetIdData>(defaultPetIdData);
  const [saving, setSaving] = useState(false);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Fetch NFCs
  useEffect(() => {
    if (user) {
      fetchNfcs();
    }
  }, [user]);

  const fetchNfcs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("nfcs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNfcs(data || []);
      
      // NFC'ler yüklendikten sonra süresi dolmuş olanları kontrol et
      if (data && data.length > 0) {
        await deactivateExpiredNfcs(data);
      }
    } catch (error) {
      console.error("NFC'ler yüklenemedi:", error);
      toast.error("NFC'ler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (nfc: NFCRecord) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/nfc/${typePaths[nfc.type]}/${nfc.unique_key}`;
  };

  const copyToClipboard = (nfc: NFCRecord) => {
    const url = getFullUrl(nfc);
    navigator.clipboard.writeText(url);
    setCopiedKey(nfc.unique_key);
    toast.success("URL kopyalandı");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQrCode = (nfc: NFCRecord) => {
    setSelectedNfc(nfc);
    setIsQrDialogOpen(true);
  };

  const handlePreview = (nfc: NFCRecord) => {
    window.open(getFullUrl(nfc), '_blank');
  };

  const handleEdit = (nfc: NFCRecord) => {
    setSelectedNfc(nfc);
    setEditName(nfc.name);
    
    // Load existing data into form
    if (nfc.type === "business-card") {
      setBusinessCardData({
        name: nfc.data?.name || "",
        title: nfc.data?.title || "",
        company: nfc.data?.company || "",
        phone: nfc.data?.phone || "",
        email: nfc.data?.email || "",
        bio: nfc.data?.bio || "",
        linkedin: nfc.data?.linkedin || "",
        instagram: nfc.data?.instagram || "",
        website: nfc.data?.website || "",
        theme: nfc.data?.theme || nfc.theme || "default",
      });
    } else if (nfc.type === "pet-id") {
      setPetIdData({
        petName: nfc.data?.petName || "",
        petImage: nfc.data?.petImage || "",
        petMessage: nfc.data?.petMessage || "",
        ownerName: nfc.data?.ownerName || "",
        ownerPhone: nfc.data?.ownerPhone || "",
        address: nfc.data?.address || "",
        healthNotes: nfc.data?.healthNotes || "",
        microchipNumber: nfc.data?.microchipNumber || "",
        theme: nfc.data?.theme || nfc.theme || "default",
      });
    }
    
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedNfc) return;
    
    setSaving(true);
    try {
      let newData: Record<string, any> = {};
      
      if (selectedNfc.type === "business-card") {
        newData = { ...businessCardData };
      } else if (selectedNfc.type === "pet-id") {
        newData = { ...petIdData };
      }

      const { error } = await supabase
        .from("nfcs")
        .update({
          name: editName,
          data: newData,
          theme: newData.theme || "default",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedNfc.id);

      if (error) throw error;

      // Update local state
      setNfcs(prev => prev.map(nfc => 
        nfc.id === selectedNfc.id 
          ? { ...nfc, name: editName, data: newData, theme: newData.theme || "default" }
          : nfc
      ));

      toast.success("NFC bilgileri güncellendi");
      setIsEditDialogOpen(false);
      setSelectedNfc(null);
    } catch (error) {
      console.error("NFC güncelleme hatası:", error);
      toast.error("NFC güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleRenewSubscription = (nfc: NFCRecord) => {
    // Abonelik yenileme sayfasına yönlendir
    navigate(`/renew-subscription/${nfc.id}`);
  };

  const getDaysRemaining = (endDate: string | null): number => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTimeRemaining = (endDate: string | null): string => {
    if (!endDate) return "Süre bilgisi yok";
    
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "0 dakika kaldı";
    
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    const days = Math.floor(totalSeconds / (60 * 60 * 24));
    const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    
    const parts: string[] = [];
    if (days > 0) parts.push(`${days} gün`);
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes} dakika`);
    
    return parts.join(", ") + " kaldı";
  };

  // Süresi dolmuş NFC'leri otomatik pasife al
  const deactivateExpiredNfcs = async (currentNfcs?: NFCRecord[]) => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      const nfcsToCheck = currentNfcs || nfcs;
      
      // Süresi dolmuş ve hala aktif olan NFC'leri bul
      const expiredNfcs = nfcsToCheck.filter((nfc) => {
        if (!nfc.is_active) return false;
        if (!nfc.subscription_end_date) return false;
        return new Date(nfc.subscription_end_date) < new Date();
      });

      if (expiredNfcs.length > 0) {
        // Pasife al
        const { error: updateError } = await supabase
          .from("nfcs")
          .update({
            is_active: false,
            subscription_status: "expired",
            updated_at: now,
          })
          .in(
            "id",
            expiredNfcs.map((nfc) => nfc.id)
          );

        if (updateError) throw updateError;

        // Local state'i güncelle (eğer currentNfcs verilmediyse)
        if (!currentNfcs) {
          setNfcs((prev) =>
            prev.map((nfc) => {
              const isExpired = expiredNfcs.some((expired) => expired.id === nfc.id);
              if (isExpired) {
                return {
                  ...nfc,
                  is_active: false,
                  subscription_status: "expired",
                };
              }
              return nfc;
            })
          );
        } else {
          // currentNfcs verildiyse, direkt state'i güncelle
          const updatedNfcs = currentNfcs.map((nfc) => {
            const isExpired = expiredNfcs.some((expired) => expired.id === nfc.id);
            if (isExpired) {
              return {
                ...nfc,
                is_active: false,
                subscription_status: "expired",
              };
            }
            return nfc;
          });
          setNfcs(updatedNfcs);
        }

        // Kullanıcıya bilgi ver
        if (expiredNfcs.length === 1) {
          toast.error(`${expiredNfcs[0].name} NFC'sinin abonelik süresi doldu ve pasife alındı.`);
        } else {
          toast.error(`${expiredNfcs.length} NFC'nin abonelik süresi doldu ve pasife alındı.`);
        }
      }
    } catch (error) {
      console.error("Süresi dolmuş NFC'ler pasife alınamadı:", error);
    }
  };

  const getQrCodeUrl = (nfc: NFCRecord) => {
    const url = encodeURIComponent(getFullUrl(nfc));
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}`;
  };

  const downloadQrCode = async (nfc: NFCRecord) => {
    try {
      const response = await fetch(getQrCodeUrl(nfc));
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${nfc.name.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("QR kod indirildi");
    } catch (error) {
      toast.error("QR kod indirilemedi");
    }
  };

  const isSubscriptionActive = (nfc: NFCRecord) => {
    // Eğer pasif ise direkt false dön
    if (!nfc.is_active) return false;
    
    // Eğer expired status ise false dön
    if (nfc.subscription_status === "expired") return false;
    
    // Eğer subscription_end_date yoksa false dön
    if (!nfc.subscription_end_date) return false;
    
    // Süre kontrolü - eğer süre dolmuşsa false dön
    const endDate = new Date(nfc.subscription_end_date);
    const now = new Date();
    return endDate > now;
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
              <span className="text-gradient">NFC'lerim</span>
            </h1>
            <p className="text-muted-foreground">
              {nfcs.length === 0 
                ? "Henüz NFC ürününüz yok" 
                : `${nfcs.length} NFC ürününüz var`}
            </p>
          </motion.div>

          {nfcs.length > 0 ? (
            <div className="grid gap-6">
              {nfcs.map((nfc, index) => {
                const TypeIcon = typeIcons[nfc.type] || Wifi;
                const subscriptionActive = isSubscriptionActive(nfc);
                
                return (
                  <motion.div
                    key={nfc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "bg-card rounded-2xl p-6 shadow-card border transition-all",
                      nfc.is_active && subscriptionActive 
                        ? "border-border/50" 
                        : "border-destructive/30 bg-destructive/5"
                    )}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left - Icon & Status */}
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                          nfc.is_active && subscriptionActive ? "gradient-primary" : "bg-muted"
                        )}>
                          <TypeIcon className={cn(
                            "w-7 h-7",
                            nfc.is_active && subscriptionActive 
                              ? "text-primary-foreground" 
                              : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-lg">{nfc.name}</h3>
                            <Badge variant={nfc.is_active ? "default" : "destructive"}>
                              {nfc.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                            {!subscriptionActive && (
                              <Badge variant="outline" className="border-amber-500 text-amber-500">
                                Abonelik Süresi Dolmuş
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                            <span>{typeLabels[nfc.type]}</span>
                            <span>•</span>
                            <span>{nfc.scan_count || 0} tarama</span>
                            <span>•</span>
                            <span>Oluşturulma: {new Date(nfc.created_at).toLocaleDateString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle - URL */}
                      <div className="flex-1 flex items-center">
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 w-full max-w-lg">
                          <code className="text-sm text-muted-foreground truncate flex-1">
                            {getFullUrl(nfc).replace('http://', '').replace('https://', '')}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => copyToClipboard(nfc)}
                          >
                            {copiedKey === nfc.unique_key ? (
                              <Check className="w-4 h-4 text-accent" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => handlePreview(nfc)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Right - Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleQrCode(nfc)}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR Kod
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(nfc)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Düzenle
                        </Button>
                      </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Abonelik Durumu</span>
                          </div>
                          {subscriptionActive ? (
                            <div className="space-y-1">
                              <p className="text-sm text-accent font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
                                Aktif
                              </p>
                              {nfc.subscription_end_date && (
                                <p className="text-xs text-muted-foreground">
                                  Bitiş: {new Date(nfc.subscription_end_date).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} 
                                  <span className="ml-1">({getTimeRemaining(nfc.subscription_end_date)})</span>
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                <p className="text-sm text-destructive font-medium flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Abonelik Süresi Doldu
                                </p>
                                {nfc.subscription_end_date && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    Sona erme: {new Date(nfc.subscription_end_date).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                )}
                                <p className="text-xs text-destructive font-medium mb-2">
                                  NFC sayfanız şu anda görüntülenemiyor. Devam etmek için abonelik satın alın.
                                </p>
                                <Button
                                  variant="hero"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() => handleRenewSubscription(nfc)}
                                >
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Abonelik Satın Al
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        {subscriptionActive && (
                          <div className="flex items-center">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRenewSubscription(nfc)}
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Süre Uzat
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Preview of Data */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Kayıtlı Bilgiler:</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {nfc.type === "business-card" && nfc.data && (
                          <>
                            {nfc.data.name && <Badge variant="outline">{nfc.data.name}</Badge>}
                            {nfc.data.title && <Badge variant="outline">{nfc.data.title}</Badge>}
                            {nfc.data.company && <Badge variant="outline">{nfc.data.company}</Badge>}
                            {nfc.data.email && <Badge variant="outline">{nfc.data.email}</Badge>}
                          </>
                        )}
                        {nfc.type === "pet-id" && nfc.data && (
                          <>
                            {nfc.data.petName && <Badge variant="outline">{nfc.data.petName}</Badge>}
                            {nfc.data.ownerName && <Badge variant="outline">Sahip: {nfc.data.ownerName}</Badge>}
                            {nfc.data.ownerPhone && <Badge variant="outline">{nfc.data.ownerPhone}</Badge>}
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Henüz NFC'niz Yok</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                İlk NFC ürününüzü satın alın ve dijital varlığınızı paylaşmaya başlayın.
                Sipariş tamamlandıktan sonra NFC'leriniz burada görünecek.
              </p>
              <Link to="/products">
                <Button variant="hero">
                  Ürünleri Keşfet
                </Button>
              </Link>
            </motion.div>
          )}
        </div>

        {/* QR Code Dialog */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>QR Kod</DialogTitle>
              <DialogDescription>
                {selectedNfc?.name} için QR kodu
              </DialogDescription>
            </DialogHeader>
            {selectedNfc && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <img 
                    src={getQrCodeUrl(selectedNfc)} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center break-all px-4">
                  {getFullUrl(selectedNfc)}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => downloadQrCode(selectedNfc)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  QR Kodu İndir
                </Button>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQrDialogOpen(false)}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit NFC Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>NFC Düzenle</DialogTitle>
              <DialogDescription>
                NFC bilgilerinizi güncelleyin. Değişiklikler anında yayınlanacaktır.
              </DialogDescription>
            </DialogHeader>
            
            {selectedNfc && (
              <div className="space-y-6 py-4">
                {/* NFC Name */}
                <div className="space-y-2">
                  <Label htmlFor="nfcName">NFC Adı (Sadece sizin göreceğiniz)</Label>
                  <Input 
                    id="nfcName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Örn: İş Kartvizitim"
                  />
                </div>

                {/* Type-specific form */}
                {selectedNfc.type === "business-card" && (
                  <BusinessCardForm
                    data={businessCardData}
                    onChange={setBusinessCardData}
                  />
                )}
                
                {selectedNfc.type === "pet-id" && (
                  <PetIdForm
                    data={petIdData}
                    onChange={setPetIdData}
                  />
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="w-4 h-4 mr-1" />
                İptal
              </Button>
              <Button 
                variant="outline"
                onClick={() => selectedNfc && handlePreview(selectedNfc)}
              >
                <Eye className="w-4 h-4 mr-1" />
                Önizle
              </Button>
              <Button variant="hero" onClick={handleSaveEdit} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Kaydet
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
