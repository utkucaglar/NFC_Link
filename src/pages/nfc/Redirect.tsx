import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Loader2,
  AlertCircle,
  Plus,
  X,
  Trash2,
  LogIn,
  LogOut,
  Menu,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { parseDateString } from "@/lib/helpers";

// Types
interface CoupleData {
  partnerName1: string;
  partnerName2: string;
  relationshipStartDate: string;
  subtitle?: string;
  theme: string;
}

interface GalleryItem {
  id: string;
  image_url: string;
  caption?: string;
  date?: string;
}

interface MemoryItem {
  id: string;
  title: string;
  content: string;
  date: string;
  icon?: string;
}

interface ManifestItem {
  id: string;
  title: string;
  content: string;
  date: string;
  icon?: string;
}

// Demo data
const demoData: CoupleData = {
  partnerName1: "Doğukan",
  partnerName2: "Mısra",
  relationshipStartDate: "2025-08-08",
  subtitle: "Birlikte olduğumuz her an bir ömür gibi…",
  theme: "romantic",
};

// Theme styles
const themeStyles: Record<string, { gradient: string; accent: string; accentBg: string }> = {
  romantic: { gradient: "from-pink-500 via-rose-500 to-red-500", accent: "text-amber-400", accentBg: "bg-rose-500/30" },
  elegant: { gradient: "from-amber-400 via-yellow-500 to-orange-500", accent: "text-amber-300", accentBg: "bg-amber-500/30" },
  modern: { gradient: "from-violet-500 via-purple-500 to-fuchsia-500", accent: "text-violet-300", accentBg: "bg-violet-500/30" },
  nature: { gradient: "from-green-400 via-emerald-500 to-teal-500", accent: "text-emerald-300", accentBg: "bg-emerald-500/30" },
  ocean: { gradient: "from-cyan-400 via-blue-500 to-indigo-500", accent: "text-cyan-300", accentBg: "bg-cyan-500/30" },
  sunset: { gradient: "from-orange-400 via-red-500 to-pink-500", accent: "text-orange-300", accentBg: "bg-orange-500/30" },
};

const memoryIcons = ["🌙", "💕", "✨", "🧡", "🌸", "🌟", "💫", "🌺", "🌷", "💖"];
const manifestIcons = ["📜", "💌", "✨", "🌟", "💫", "🌸", "🌺", "🌷", "💖", "🧡"];

export default function NFCRedirect() {
  const { key } = useParams<{ key: string }>();
  
  // Core states
  const [nfcId, setNfcId] = useState<string | null>(null);
  const [nfcUserId, setNfcUserId] = useState<string | null>(null);
  const [data, setData] = useState<CoupleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Content states
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [manifest, setManifest] = useState<ManifestItem[]>([]);
  
  // Auth states
  const [isOwner, setIsOwner] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Modal states
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GalleryItem | null>(null);
  
  // Form states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState("");
  const [photoDate, setPhotoDate] = useState("");
  const [memoryTitle, setMemoryTitle] = useState("");
  const [memoryContent, setMemoryContent] = useState("");
  const [memoryDate, setMemoryDate] = useState("");
  const [manifestTitle, setManifestTitle] = useState("");
  const [manifestContent, setManifestContent] = useState("");
  const [manifestDate, setManifestDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Timer state
  const [timeElapsed, setTimeElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [heartBeat, setHeartBeat] = useState(false);
  
  // Navigation
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isDemo = !key || key === "demo";

  // Check auth and ownership
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && nfcUserId && user.id === nfcUserId) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && nfcUserId && session.user.id === nfcUserId) {
        setIsOwner(true);
      } else {
        setIsOwner(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [nfcUserId]);

  // Fetch NFC data
  useEffect(() => {
    const fetchNFCData = async () => {
      if (isDemo) {
        setData(demoData);
        setLoading(false);
        return;
      }

      try {
        const { data: nfcData, error: nfcError } = await supabase
          .from("nfcs")
          .select("*")
          .eq("unique_key", key)
          .eq("type", "redirect")
          .single();

        if (nfcError) {
          if (nfcError.code === "PGRST116") {
            setError("Bu sayfa bulunamadı");
          } else {
            throw nfcError;
          }
          setLoading(false);
          return;
        }

        if (!nfcData.is_active) {
          setError("Bu sayfa şu anda aktif değil");
          setLoading(false);
          return;
        }

        // Subscription check
        if (nfcData.subscription_end_date) {
          const endDate = new Date(nfcData.subscription_end_date);
          if (endDate < new Date()) {
            await supabase.from("nfcs").update({
              is_active: false,
              subscription_status: "expired",
              updated_at: new Date().toISOString(),
            }).eq("id", nfcData.id);
            setError("Bu sayfanın abonelik süresi dolmuştur.");
            setLoading(false);
            return;
          }
        }

        // NFC scan kaydı oluştur (trigger otomatik olarak scan_count'u artıracak)
        await supabase.from("nfc_scans").insert({
          nfc_id: nfcData.id,
          user_agent: navigator.userAgent,
          scanned_at: new Date().toISOString(),
        });

        setNfcId(nfcData.id);
        setNfcUserId(nfcData.user_id);
        setData(nfcData.data as CoupleData);
        
        await fetchContent(nfcData.id);
      } catch (err) {
        console.error("NFC veri çekme hatası:", err);
        setError("Bir hata oluştu");
      } finally {
        setLoading(false);
      }
    };

    fetchNFCData();
  }, [key, isDemo]);

  const fetchContent = async (id: string) => {
    try {
      const [galleryRes, memoriesRes, manifestRes] = await Promise.all([
        supabase.from("nfc_gallery").select("*").eq("nfc_id", id).order("created_at", { ascending: false }),
        supabase.from("nfc_memories").select("*").eq("nfc_id", id).order("date", { ascending: false }),
        supabase.from("nfc_manifest").select("*").eq("nfc_id", id).order("date", { ascending: false }),
      ]);
      
      if (galleryRes.data) setGallery(galleryRes.data);
      if (memoriesRes.data) setMemories(memoriesRes.data);
      if (manifestRes.data) setManifest(manifestRes.data);
    } catch (err) {
      console.error("İçerik yükleme hatası:", err);
    }
  };

  // Timer
  useEffect(() => {
    if (!data?.relationshipStartDate) return;
    const startDate = parseDateString(data.relationshipStartDate);
    if (!startDate) return;
    
    const updateTime = () => {
      const now = new Date();
      let diff = now.getTime() - startDate.getTime();
      if (diff < 0) diff = 0;
      
      setTimeElapsed({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [data?.relationshipStartDate]);

  // Heartbeat
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartBeat(true);
      setTimeout(() => setHeartBeat(false), 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) throw error;
      
      setShowLoginModal(false);
      toast.success("Giriş başarılı!");
    } catch (err: any) {
      toast.error(err.message || "Giriş başarısız");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsOwner(false);
    toast.success("Çıkış yapıldı");
  };

  // Add handlers
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoFile || !nfcId) return;
    
    setSubmitting(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${nfcId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("nfc-gallery").upload(fileName, photoFile);
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage.from("nfc-gallery").getPublicUrl(fileName);
      
      const { error: insertError } = await supabase.from("nfc_gallery").insert({
        nfc_id: nfcId,
        image_url: urlData.publicUrl,
        caption: photoCaption || null,
        date: photoDate || null,
      });
      
      if (insertError) throw insertError;
      
      toast.success("Fotoğraf eklendi!");
      setShowPhotoModal(false);
      setPhotoFile(null);
      setPhotoCaption("");
      setPhotoDate("");
      fetchContent(nfcId);
    } catch (err: any) {
      toast.error(err.message || "Fotoğraf eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfcId) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from("nfc_memories").insert({
        nfc_id: nfcId,
        title: memoryTitle,
        content: memoryContent,
        date: memoryDate,
        icon: memoryIcons[Math.floor(Math.random() * memoryIcons.length)],
      });
      
      if (error) throw error;
      
      toast.success("Anı eklendi!");
      setShowMemoryModal(false);
      setMemoryTitle("");
      setMemoryContent("");
      setMemoryDate("");
      fetchContent(nfcId);
    } catch (err: any) {
      toast.error(err.message || "Anı eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfcId) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase.from("nfc_manifest").insert({
        nfc_id: nfcId,
        title: manifestTitle,
        content: manifestContent,
        date: manifestDate,
        icon: manifestIcons[Math.floor(Math.random() * manifestIcons.length)],
      });
      
      if (error) throw error;
      
      toast.success("Manifest eklendi!");
      setShowManifestModal(false);
      setManifestTitle("");
      setManifestContent("");
      setManifestDate("");
      fetchContent(nfcId);
    } catch (err: any) {
      toast.error(err.message || "Manifest eklenemedi");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete handlers
  const handleDeletePhoto = async (id: string, imageUrl: string) => {
    if (!confirm("Bu fotoğrafı silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from("nfc_gallery").delete().eq("id", id);
      const path = imageUrl.split("/nfc-gallery/")[1];
      if (path) await supabase.storage.from("nfc-gallery").remove([path]);
      setGallery(gallery.filter(g => g.id !== id));
      toast.success("Fotoğraf silindi");
    } catch (err) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!confirm("Bu anıyı silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from("nfc_memories").delete().eq("id", id);
      setMemories(memories.filter(m => m.id !== id));
      toast.success("Anı silindi");
    } catch (err) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const handleDeleteManifest = async (id: string) => {
    if (!confirm("Bu manifesti silmek istediğinize emin misiniz?")) return;
    try {
      await supabase.from("nfc_manifest").delete().eq("id", id);
      setManifest(manifest.filter(m => m.id !== id));
      toast.success("Manifest silindi");
    } catch (err) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseDateString(dateString);
    if (!date) return dateString;
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold text-white mb-2">{error || "Sayfa Bulunamadı"}</h1>
          <p className="text-gray-400">Bu sayfa mevcut değil veya erişilemez durumda.</p>
        </div>
      </div>
    );
  }

  const theme = themeStyles[data.theme] || themeStyles.romantic;

  return (
    <div className="min-h-screen relative text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900" />
      <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/20 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`${theme.accent} text-lg`}>♥</span>
            <span className="font-medium tracking-widest text-sm uppercase opacity-90">
              {data.partnerName1.charAt(0)} & {data.partnerName2.charAt(0)}
            </span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {["Ana Sayfa", "Galeri", "Anılar", "Manifest"].map((item, i) => (
              <a key={i} href={`#${["home", "gallery", "memories", "manifest"][i]}`}
                className="text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all px-4 py-2 rounded-full">
                {item}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-3">
            {isOwner ? (
              <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all">
                <LogOut className="w-4 h-4" /> Çıkış
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 text-sm text-white/70 hover:text-white px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all">
                <LogIn className="w-4 h-4" /> Giriş
              </button>
            )}
            <button className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden bg-black/30 backdrop-blur-md">
              <div className="p-4 space-y-1">
                {["Ana Sayfa", "Galeri", "Anılar", "Manifest"].map((item, i) => (
                  <a key={i} href={`#${["home", "gallery", "memories", "manifest"][i]}`} onClick={() => setMobileMenuOpen(false)}
                    className="block py-3 px-4 text-white/70 hover:text-white hover:bg-white/10 rounded-xl text-center transition-all">
                    {item}
                  </a>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section id="home" className="min-h-[85vh] flex flex-col items-center justify-center px-6 py-20">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
            <span className={`${theme.accent}`}>✦</span>
            <span className="text-white/60 text-xs tracking-[0.4em] uppercase font-light">Yıldızlarda Yazılı</span>
            <span className={`${theme.accent}`}>✦</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-center mb-6 tracking-tight"
            style={{ fontFamily: "'Cinzel', serif", fontWeight: 600, textShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            {data.partnerName1.toUpperCase()} <span className={`bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>&</span> {data.partnerName2.toUpperCase()}
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
            className="text-white/60 text-center max-w-lg text-base md:text-lg mb-10 font-light">
            {data.subtitle || "Birlikte olduğumuz her an bir ömür gibi…"}
          </motion.p>

          {/* Counter Card */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white/[0.08] backdrop-blur-2xl rounded-[28px] border border-white/10 p-6 sm:p-8 md:p-10 shadow-2xl w-auto max-w-[95vw]">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-8">
              {/* Gün - Genişleyebilir */}
              <div className="bg-black/25 rounded-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center border border-white/5 min-w-[80px] sm:min-w-[100px]">
                <div 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 font-semibold leading-tight whitespace-nowrap" 
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {timeElapsed.days}
                </div>
                <div className="text-white/50 text-[10px] md:text-xs tracking-[0.2em] uppercase">GÜN</div>
              </div>
              {/* Saat, Dakika, Saniye - Sabit boyut */}
              {[
                { value: String(timeElapsed.hours).padStart(2, "0"), label: "SAAT" },
                { value: String(timeElapsed.minutes).padStart(2, "0"), label: "DAKİKA" },
                { value: String(timeElapsed.seconds).padStart(2, "0"), label: "SANİYE" },
              ].map((item, i) => (
                <div key={i} className="bg-black/25 rounded-2xl px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center border border-white/5 min-w-[70px] sm:min-w-[90px]">
                  <div 
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 font-semibold leading-tight" 
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {item.value}
                  </div>
                  <div className="text-white/50 text-[10px] md:text-xs tracking-[0.2em] uppercase">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button className={`w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/20 ${heartBeat ? "scale-125" : "scale-100"}`}>
                <Heart className={`w-7 h-7 ${theme.accent} ${heartBeat ? "fill-current" : ""}`} />
              </button>
            </div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mt-8 text-white/40 text-sm tracking-wide">
            {formatDate(data.relationshipStartDate)}'ten beri
          </motion.p>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}>Galerimiz</h2>
              <p className="text-white/50 text-sm md:text-base font-light">Nice güzel anıların birikmesi dileğiyle…</p>
            </div>
            
            {isOwner && (
              <div className="text-center mb-10">
                <button onClick={() => setShowPhotoModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Fotoğraf Ekle
                </button>
              </div>
            )}
            
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {gallery.map((photo) => (
                  <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="relative group rounded-3xl overflow-hidden border border-white/10 bg-white/5 cursor-pointer aspect-[3/4] shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
                    onClick={() => { setLightboxImage(photo); setShowLightbox(true); }}>
                    <img src={photo.image_url} alt={photo.caption || ""} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    {(photo.caption || photo.date) && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {photo.date && <p className={`text-xs ${theme.accent} mb-1`}>{formatDate(photo.date)}</p>}
                        {photo.caption && <p className="text-sm text-white/90">{photo.caption}</p>}
                      </div>
                    )}
                    {isOwner && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id, photo.image_url); }}
                        className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:bg-red-500/40 border border-white/10">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/30 py-20 text-lg">Henüz fotoğraf eklenmemiş</p>
            )}
          </div>
        </section>

        {/* Heart Divider */}
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Heart className={`w-5 h-5 ${theme.accent}`} />
          </div>
        </div>

        {/* Memories Section */}
        <section id="memories" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}>Anılarımız</h2>
              <p className="text-white/50 text-sm md:text-base font-light">Yıldızlara sığmayan yolculuğumuzdan küçük notlar.</p>
            </div>
            
            {isOwner && (
              <div className="text-center mb-10">
                <button onClick={() => setShowMemoryModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Anı Ekle
                </button>
              </div>
            )}
            
            {memories.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {memories.map((memory, idx) => (
                  <motion.article key={memory.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    className="relative bg-white/[0.06] backdrop-blur-xl rounded-3xl p-7 border border-white/10 hover:bg-white/[0.08] transition-all group">
                    <div className={`w-12 h-12 rounded-2xl ${theme.accentBg} border border-white/10 flex items-center justify-center mb-5 text-2xl`}>
                      {memory.icon || "💕"}
                    </div>
                    <p className={`text-xs ${theme.accent} mb-3 tracking-wide`}>{formatDate(memory.date)}</p>
                    <h3 className="text-xl font-semibold mb-3 uppercase tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>{memory.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed font-light">{memory.content}</p>
                    {isOwner && (
                      <button onClick={() => handleDeleteMemory(memory.id)}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.article>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/30 py-20 text-lg">Henüz anı eklenmemiş</p>
            )}
          </div>
        </section>

        {/* Heart Divider */}
        <div className="flex justify-center py-8">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Heart className={`w-5 h-5 ${theme.accent}`} />
          </div>
        </div>

        {/* Manifest Section */}
        <section id="manifest" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl mb-4" style={{ fontFamily: "'Cinzel', serif", fontWeight: 600 }}>Manifest</h2>
              <p className="text-white/50 text-sm md:text-base font-light">Yolculuğumuzun manifestosu.</p>
            </div>
            
            {isOwner && (
              <div className="text-center mb-10">
                <button onClick={() => setShowManifestModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl text-sm transition-all hover:-translate-y-0.5">
                  <Plus className="w-4 h-4" /> Manifest Ekle
                </button>
              </div>
            )}
            
            {manifest.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-5">
                {manifest.map((item, idx) => (
                  <motion.article key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                    className="relative bg-white/[0.06] backdrop-blur-xl rounded-3xl p-7 border border-white/10 hover:bg-white/[0.08] transition-all group">
                    <div className={`w-12 h-12 rounded-2xl ${theme.accentBg} border border-white/10 flex items-center justify-center mb-5 text-2xl`}>
                      {item.icon || "📜"}
                    </div>
                    <p className={`text-xs ${theme.accent} mb-3 tracking-wide`}>{formatDate(item.date)}</p>
                    <h3 className="text-xl font-semibold mb-3 uppercase tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed font-light">{item.content}</p>
                    {isOwner && (
                      <button onClick={() => handleDeleteManifest(item.id)}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </motion.article>
                ))}
              </div>
            ) : (
              <p className="text-center text-white/30 py-20 text-lg">Henüz manifest eklenmemiş</p>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 text-center border-t border-white/5">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Heart className={`w-6 h-6 ${theme.accent}`} />
            </div>
          </div>
          <p className="text-white/20 text-xs tracking-wider">Powered by <span className="font-semibold">Esdodesign</span></p>
        </footer>
      </main>

      {/* Modals */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Cinzel', serif" }}>Giriş Yap</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-5 mt-4">
            <div>
              <Label className="text-white/60 text-sm">E-posta</Label>
              <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 focus:border-white/30 text-white" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Şifre</Label>
              <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 focus:border-white/30 text-white" />
            </div>
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/20" disabled={loginLoading}>
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Giriş Yap
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Cinzel', serif" }}>Fotoğraf Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPhoto} className="space-y-5 mt-4">
            <div>
              <Label className="text-white/60 text-sm">Fotoğraf *</Label>
              <Input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} required
                className="mt-2 bg-white/5 border-white/10 text-white file:bg-white/10 file:border-0 file:text-white file:mr-4" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Açıklama</Label>
              <Input value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} placeholder="Opsiyonel"
                className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Tarih</Label>
              <Input type="date" value={photoDate} onChange={(e) => setPhotoDate(e.target.value)}
                className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/20" disabled={submitting || !photoFile}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Yükle
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showMemoryModal} onOpenChange={setShowMemoryModal}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Cinzel', serif" }}>Anı Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddMemory} className="space-y-5 mt-4">
            <div>
              <Label className="text-white/60 text-sm">Başlık *</Label>
              <Input value={memoryTitle} onChange={(e) => setMemoryTitle(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">İçerik *</Label>
              <Textarea value={memoryContent} onChange={(e) => setMemoryContent(e.target.value)} required rows={4}
                className="mt-2 bg-white/5 border-white/10 text-white resize-none" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Tarih *</Label>
              <Input type="date" value={memoryDate} onChange={(e) => setMemoryDate(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/20" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showManifestModal} onOpenChange={setShowManifestModal}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl" style={{ fontFamily: "'Cinzel', serif" }}>Manifest Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddManifest} className="space-y-5 mt-4">
            <div>
              <Label className="text-white/60 text-sm">Başlık *</Label>
              <Input value={manifestTitle} onChange={(e) => setManifestTitle(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">İçerik *</Label>
              <Textarea value={manifestContent} onChange={(e) => setManifestContent(e.target.value)} required rows={4}
                className="mt-2 bg-white/5 border-white/10 text-white resize-none" />
            </div>
            <div>
              <Label className="text-white/60 text-sm">Tarih *</Label>
              <Input type="date" value={manifestDate} onChange={(e) => setManifestDate(e.target.value)} required
                className="mt-2 bg-white/5 border-white/10 text-white" />
            </div>
            <Button type="submit" className="w-full bg-white/10 hover:bg-white/20 border border-white/20" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Kaydet
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <AnimatePresence>
        {showLightbox && lightboxImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLightbox(false)}>
            <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 transition-all"
              onClick={() => setShowLightbox(false)}>
              <X className="w-6 h-6" />
            </button>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImage.image_url} alt="" className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" />
            {lightboxImage.caption && (
              <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-white/80 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
                {lightboxImage.caption}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
