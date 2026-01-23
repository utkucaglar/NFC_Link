import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, MapPin, Heart, AlertCircle, PawPrint, Hash, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface PetIdData {
  petName: string;
  petImage?: string;
  petMessage?: string;
  ownerName: string;
  ownerPhone: string;
  address?: string;
  healthNotes?: string;
  microchipNumber?: string;
  theme?: string;
}

// Demo data
const demoData: PetIdData = {
  petName: "Pamuk",
  petImage: "",
  petMessage: "Kayıp değilim, sadece maceraperestim!",
  ownerName: "Ayşe Demir",
  ownerPhone: "+90 555 987 6543",
  address: "Beşiktaş, İstanbul",
  healthNotes: "Düzenli aşıları tam. Kuru mama dışında yiyecek vermeyin.",
  microchipNumber: "982000123456789",
  theme: "default"
};

// Tema renkleri
const themeStyles: Record<string, { gradient: string; accent: string; light: string }> = {
  default: { gradient: "from-orange-400 via-pink-500 to-rose-500", accent: "text-orange-500", light: "bg-orange-50" },
  warm: { gradient: "from-amber-400 via-orange-500 to-red-500", accent: "text-amber-500", light: "bg-amber-50" },
  cool: { gradient: "from-blue-400 via-cyan-500 to-teal-500", accent: "text-blue-500", light: "bg-blue-50" },
  nature: { gradient: "from-green-400 via-emerald-500 to-teal-500", accent: "text-green-500", light: "bg-green-50" },
};

export default function NFCPetId() {
  const { key } = useParams();
  const [data, setData] = useState<PetIdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDemo = !key || key === "demo";

  useEffect(() => {
    const fetchNFCData = async () => {
      // Demo mod
      if (isDemo) {
        setData(demoData);
        setLoading(false);
        return;
      }

      try {
        // NFC verisini veritabanından çek
        const { data: nfcData, error: nfcError } = await supabase
          .from("nfcs")
          .select("*")
          .eq("unique_key", key)
          .eq("type", "pet-id")
          .single();

        if (nfcError) {
          if (nfcError.code === "PGRST116") {
            setError("Bu evcil hayvan kimliği bulunamadı");
          } else {
            throw nfcError;
          }
          setLoading(false);
          return;
        }

        if (!nfcData.is_active) {
          setError("Bu evcil hayvan kimliği şu anda aktif değil");
          setLoading(false);
          return;
        }

        // Abonelik süresi kontrolü
        if (nfcData.subscription_end_date) {
          const endDate = new Date(nfcData.subscription_end_date);
          if (endDate < new Date()) {
            // Abonelik süresi dolmuş, NFC'yi devre dışı bırak
            await supabase
              .from("nfcs")
              .update({ 
                is_active: false, 
                subscription_status: "expired",
                updated_at: new Date().toISOString() 
              })
              .eq("id", nfcData.id);
            
            setError("Bu evcil hayvan kimliğinin abonelik süresi dolmuştur. Kart sahibi aboneliğini yenileyene kadar erişilemez.");
            setLoading(false);
            return;
          }
        }

        // NFC scan kaydı oluştur (trigger otomatik olarak scan_count'u artıracak)
        await supabase
          .from("nfc_scans")
          .insert({
            nfc_id: nfcData.id,
            user_agent: navigator.userAgent,
            scanned_at: new Date().toISOString(),
          });

        setData(nfcData.data as PetIdData);
      } catch (err) {
        console.error("NFC veri çekme hatası:", err);
        setError("Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchNFCData();
  }, [key, isDemo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl p-8 text-center max-w-md shadow-2xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{error || "Sayfa Bulunamadı"}</h1>
          <p className="text-muted-foreground mb-6">
            Bu evcil hayvan kimliği mevcut değil veya erişilemez durumda.
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const theme = themeStyles[data.theme || "default"] || themeStyles.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient and pet image */}
          <div className={cn("bg-gradient-to-br p-8 text-center relative", theme.gradient)}>
            {/* Decorative elements */}
            <div className="absolute top-4 left-4">
              <PawPrint className="w-6 h-6 text-white/30" />
            </div>
            <div className="absolute top-4 right-4">
              <PawPrint className="w-6 h-6 text-white/30" />
            </div>
            
            {/* Pet Image */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-xl mb-4 relative z-10 overflow-hidden border-4 border-white/50"
            >
              {data.petImage ? (
                <img src={data.petImage} alt={data.petName} className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <PawPrint className="w-12 h-12 text-orange-400 mx-auto" />
                </div>
              )}
            </motion.div>
            
            {/* Pet Name */}
            <h1 className="text-3xl font-bold text-white mb-2">{data.petName}</h1>
            
            {/* Pet Message */}
            {data.petMessage && (
              <div className="flex items-center justify-center gap-2 text-white/90">
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-sm">{data.petMessage}</span>
              </div>
            )}
          </div>

          {/* Alert Box */}
          <div className="px-6 pt-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Beni buldunuz mu?</h3>
                  <p className="text-sm text-amber-700">Lütfen aşağıdaki numaradan sahibime ulaşın!</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Owner Info */}
          <div className="p-6 space-y-4">
            {/* Owner Name */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sahibim</p>
              <p className="font-semibold text-lg">{data.ownerName}</p>
            </div>

            {/* Call Button */}
            <motion.a
              href={`tel:${data.ownerPhone}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn(
                "flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r",
                theme.gradient
              )}
            >
              <Phone className="w-5 h-5" />
              Sahibimi Ara: {data.ownerPhone}
            </motion.a>

            {/* Address */}
            {data.address && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-start gap-3 p-4 bg-muted/30 rounded-2xl"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Evim</p>
                  <p className="font-medium">{data.address}</p>
                </div>
              </motion.div>
            )}

            {/* Health Notes */}
            {data.healthNotes && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-4"
              >
                <h4 className="font-semibold text-green-700 mb-1 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Sağlık Notları
                </h4>
                <p className="text-sm text-green-600">{data.healthNotes}</p>
              </motion.div>
            )}

            {/* Microchip */}
            {data.microchipNumber && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl"
              >
                <Hash className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Mikroçip Numarası</p>
                  <p className="font-mono font-medium">{data.microchipNumber}</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <a href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              Powered by <span className="text-gradient font-semibold">Esdodesign</span>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
