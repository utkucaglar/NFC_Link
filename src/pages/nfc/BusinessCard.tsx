import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Linkedin, Instagram, Globe, User, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface BusinessCardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  theme?: string;
}

// Demo data
const demoData: BusinessCardData = {
  name: "Ahmet Yılmaz",
  title: "Senior Software Engineer",
  company: "Tech Startup A.Ş.",
  phone: "+90 555 123 4567",
  email: "ahmet@techstartup.com",
  whatsapp: "+905551234567",
  linkedin: "ahmetyilmaz",
  instagram: "ahmet.dev",
  website: "https://ahmetyilmaz.dev",
  bio: "10+ yıllık yazılım geliştirme deneyimi. React, Node.js ve cloud teknolojileri konusunda uzman.",
  theme: "default"
};

// Tema renkleri
const themeStyles: Record<string, { gradient: string; accent: string }> = {
  default: { gradient: "from-violet-500 to-purple-600", accent: "bg-violet-500" },
  modern: { gradient: "from-blue-500 to-cyan-500", accent: "bg-blue-500" },
  minimal: { gradient: "from-gray-700 to-gray-900", accent: "bg-gray-700" },
  gradient: { gradient: "from-pink-500 via-purple-500 to-indigo-500", accent: "bg-purple-500" },
};

export default function NFCBusinessCard() {
  const { key } = useParams();
  const [data, setData] = useState<BusinessCardData | null>(null);
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
          .eq("type", "business-card")
          .single();

        if (nfcError) {
          if (nfcError.code === "PGRST116") {
            setError("Bu NFC kartı bulunamadı");
          } else {
            throw nfcError;
          }
          setLoading(false);
          return;
        }

        if (!nfcData.is_active) {
          setError("Bu NFC kartı şu anda aktif değil");
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
            
            setError("Bu NFC kartının abonelik süresi dolmuştur. Kart sahibi aboneliğini yenileyene kadar erişilemez.");
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

        setData(nfcData.data as BusinessCardData);
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
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl p-8 text-center max-w-md shadow-2xl">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">{error || "Sayfa Bulunamadı"}</h1>
          <p className="text-muted-foreground mb-6">
            Bu NFC kartı mevcut değil veya erişilemez durumda.
          </p>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    );
  }

  const theme = themeStyles[data.theme || "default"] || themeStyles.default;
  const whatsappNumber = data.whatsapp || data.phone?.replace(/[\s\-\(\)]/g, "");

  const socialLinks = [
    { icon: Phone, label: "Ara", href: `tel:${data.phone}`, color: "bg-green-500" },
    { icon: Mail, label: "E-posta", href: `mailto:${data.email}`, color: "bg-primary" },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${whatsappNumber}`, color: "bg-emerald-500" },
  ];

  const otherLinks = [
    { icon: Linkedin, label: "LinkedIn", href: data.linkedin ? `https://linkedin.com/in/${data.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "")}` : null },
    { icon: Instagram, label: "Instagram", href: data.instagram ? `https://instagram.com/${data.instagram.replace(/^@/, "").replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")}` : null },
    { icon: Globe, label: "Website", href: data.website },
  ].filter(link => link.href);

  // VCF dosyası oluştur
  const generateVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${data.name}
TITLE:${data.title}
ORG:${data.company}
TEL:${data.phone}
EMAIL:${data.email}
${data.website ? `URL:${data.website}` : ""}
${data.linkedin ? `X-SOCIALPROFILE;type=linkedin:https://linkedin.com/in/${data.linkedin}` : ""}
NOTE:${data.bio || ""}
END:VCARD`;

    const blob = new Blob([vcard], { type: "text/vcard" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.name.replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={cn("bg-gradient-to-r p-8 text-center relative", theme.gradient)}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-28 h-28 mx-auto bg-card rounded-full flex items-center justify-center shadow-xl mb-4 relative z-10 overflow-hidden"
            >
              {data.avatar ? (
                <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-14 h-14 text-primary" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-foreground">{data.name}</h1>
            <p className="text-primary-foreground/80 mt-1">{data.title}</p>
            {data.company && <p className="text-primary-foreground/60 text-sm">{data.company}</p>}
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-border">
            <div className="flex justify-center gap-4">
              {socialLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className={`w-14 h-14 ${link.color} rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">{link.label}</span>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Bio */}
          {data.bio && (
            <div className="px-6 py-4 border-b border-border">
              <p className="text-sm text-muted-foreground text-center">{data.bio}</p>
            </div>
          )}

          {/* Links */}
          {otherLinks.length > 0 && (
            <div className="p-6 space-y-3">
              {otherLinks.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <link.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium">{link.label}</span>
                </motion.a>
              ))}
            </div>
          )}

          {/* Save Contact */}
          <div className="p-6 pt-0">
            <Button 
              variant="hero" 
              className="w-full" 
              size="lg"
              onClick={generateVCard}
            >
              Kişilere Kaydet
            </Button>
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
