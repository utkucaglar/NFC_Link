import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Wifi, QrCode, Edit, RefreshCw, Power, ExternalLink, 
  Copy, Check, CreditCard, PawPrint, Link2, Download
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type NFCType = "business-card" | "pet-id" | "redirect";

interface NFC {
  id: string;
  uniqueKey: string;
  name: string;
  type: NFCType;
  isActive: boolean;
  activeUntil: string;
  hasSubscription: boolean;
  scans: number;
}

const initialNfcs: NFC[] = [
  {
    id: "1",
    uniqueKey: "abc123xyz",
    name: "İş Kartvizitim",
    type: "business-card",
    isActive: true,
    activeUntil: "2024-03-15",
    hasSubscription: true,
    scans: 127
  },
  {
    id: "2",
    uniqueKey: "pet456def",
    name: "Pamuk'un Kimliği",
    type: "pet-id",
    isActive: true,
    activeUntil: "2024-02-28",
    hasSubscription: true,
    scans: 45
  },
  {
    id: "3",
    uniqueKey: "red789ghi",
    name: "Portfolio Yönlendirme",
    type: "redirect",
    isActive: false,
    activeUntil: "2024-01-15",
    hasSubscription: false,
    scans: 89
  }
];

const typeIcons = {
  "business-card": CreditCard,
  "pet-id": PawPrint,
  "redirect": Link2
};

const typeLabels = {
  "business-card": "Kartvizit",
  "pet-id": "Evcil Hayvan",
  "redirect": "Yönlendirme"
};

export default function MyNFC() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const [nfcs, setNfcs] = useState<NFC[]>(initialNfcs);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedNfc, setSelectedNfc] = useState<NFC | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");

  const copyToClipboard = (key: string) => {
    const url = `https://nfclink.app/nfc/${key}`;
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("URL kopyalandı");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQrCode = (nfc: NFC) => {
    setSelectedNfc(nfc);
    setIsQrDialogOpen(true);
  };

  const handleEdit = (nfc: NFC) => {
    setSelectedNfc(nfc);
    setEditName(nfc.name);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNfc || !editName.trim()) {
      toast.error("Lütfen bir isim girin");
      return;
    }
    // TODO: Update NFC name via backend
    setNfcs(prev => prev.map(nfc => 
      nfc.id === selectedNfc.id ? { ...nfc, name: editName } : nfc
    ));
    toast.success("NFC adı güncellendi");
    setIsEditDialogOpen(false);
    setSelectedNfc(null);
  };

  const handleRenew = (nfc: NFC) => {
    // TODO: Renew subscription via backend
    toast.success(`${nfc.name} aboneliği yenilendi`);
  };

  const handleManageSubscription = (nfc: NFC) => {
    // TODO: Navigate to subscription management
    toast.info("Abonelik yönetim sayfasına yönlendiriliyorsunuz...");
  };

  const getQrCodeUrl = (key: string) => {
    // Using a QR code API service
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://nfclink.app/nfc/${key}`;
  };

  const downloadQrCode = (key: string, name: string) => {
    const url = getQrCodeUrl(key);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${name.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR kod indirildi");
  };

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
              {nfcs.length} NFC ürününüz var
            </p>
          </motion.div>

          <div className="grid gap-6">
            {nfcs.map((nfc, index) => {
              const TypeIcon = typeIcons[nfc.type];
              
              return (
                <motion.div
                  key={nfc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "bg-card rounded-2xl p-6 shadow-card border transition-all",
                    nfc.isActive ? "border-border/50" : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left - Icon & Status */}
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                        nfc.isActive ? "gradient-primary" : "bg-muted"
                      )}>
                        <Wifi className={cn(
                          "w-7 h-7",
                          nfc.isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{nfc.name}</h3>
                          <Badge variant={nfc.isActive ? "default" : "destructive"}>
                            {nfc.isActive ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TypeIcon className="w-4 h-4" />
                          <span>{typeLabels[nfc.type]}</span>
                          <span>•</span>
                          <span>{nfc.scans} tarama</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle - URL */}
                    <div className="flex-1 flex items-center">
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2 w-full max-w-md">
                        <code className="text-sm text-muted-foreground truncate flex-1">
                          nfclink.app/nfc/{nfc.uniqueKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyToClipboard(nfc.uniqueKey)}
                        >
                          {copiedKey === nfc.uniqueKey ? (
                            <Check className="w-4 h-4 text-accent" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          asChild
                        >
                          <a 
                            href={`/nfc/${nfc.type}/${nfc.uniqueKey}`} 
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
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
                      {!nfc.hasSubscription && (
                        <Button 
                          variant="hero" 
                          size="sm"
                          onClick={() => handleRenew(nfc)}
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Yenile
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Subscription Info */}
                  <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Abonelik: </span>
                      {nfc.hasSubscription ? (
                        <span className="text-accent font-medium">
                          Aktif (Yenileme: {new Date(nfc.activeUntil).toLocaleDateString('tr-TR')})
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">
                          Süresi doldu ({new Date(nfc.activeUntil).toLocaleDateString('tr-TR')})
                        </span>
                      )}
                    </div>
                    {nfc.hasSubscription && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground"
                        onClick={() => handleManageSubscription(nfc)}
                      >
                        <Power className="w-4 h-4 mr-1" />
                        Aboneliği Yönet
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {nfcs.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <Wifi className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Henüz NFC'niz Yok</h2>
              <p className="text-muted-foreground mb-6">
                İlk NFC ürününüzü satın alın ve dijital varlığınızı paylaşmaya başlayın.
              </p>
              <Button variant="hero" asChild>
                <a href="/products">Ürünleri Keşfet</a>
              </Button>
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
                <div className="bg-white p-4 rounded-lg">
                  <img 
                    src={getQrCodeUrl(selectedNfc.uniqueKey)} 
                    alt="QR Code" 
                    className="w-64 h-64"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {`https://nfclink.app/nfc/${selectedNfc.uniqueKey}`}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => downloadQrCode(selectedNfc.uniqueKey, selectedNfc.name)}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>NFC Düzenle</DialogTitle>
              <DialogDescription>
                NFC adını değiştirin
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nfcName">NFC Adı</Label>
                <Input 
                  id="nfcName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="NFC adını girin"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                İptal
              </Button>
              <Button variant="hero" onClick={handleSaveEdit}>
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
