import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  Loader2, 
  MessageSquare,
  Clock,
  Instagram,
  Linkedin,
  Twitter,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  User,
  XCircle
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { sendNewTicketNotificationToAdmins } from "@/lib/email";

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "customer" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
}

const categories = [
  { value: "general", label: "Genel Bilgi" },
  { value: "order", label: "Sipariş Hakkında" },
  { value: "technical", label: "Teknik Destek" },
  { value: "billing", label: "Ödeme/Fatura" },
  { value: "other", label: "Diğer" },
];

// Client tarafında durum mapping - sadece 3 durum gösterilir
const getClientStatus = (status: string): string => {
  switch (status) {
    case "open":
      return "open";
    case "in_progress":
    case "waiting_customer":
      return "in_progress"; // Her ikisi de client tarafında "işlemde" olarak gösterilir
    case "resolved":
    case "closed":
      return "resolved"; // Her ikisi de client tarafında "çözüldü" olarak gösterilir
    default:
      return status;
  }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Açık", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  in_progress: { label: "İşlemde", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  resolved: { label: "Çözüldü", color: "bg-green-500/10 text-green-500 border-green-500/30" },
};

type View = "list" | "new" | "chat";

export default function Contact() {
  const { user, profile, isAuthenticated } = useAuth();
  const [view, setView] = useState<View>("list");
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New ticket form
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Chat
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchTickets();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTickets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        // Tablo yoksa boş liste göster
        if (error.code === "42P01" || error.message?.includes("does not exist")) {
          setTickets([]);
          return;
        }
        throw error;
      }
      setTickets(data || []);
    } catch (err: any) {
      console.error("Ticketlar yüklenemedi:", err);
      // Tablo yoksa sessizce boş liste göster
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        setTickets([]);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Mesajlar yüklenemedi:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setView("chat");
    
    // Ticket'ın güncel durumunu al (admin tarafından kapatılmış olabilir)
    try {
      const { data: currentTicket, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("id", ticket.id)
        .single();
      
      if (!error && currentTicket) {
        setSelectedTicket(currentTicket);
      }
    } catch (err) {
      console.error("Ticket durumu güncellenemedi:", err);
    }
    
    fetchMessages(ticket.id);
  };

  const validateNewTicket = () => {
    const errors: Record<string, string> = {};
    if (!newSubject.trim()) errors.subject = "Konu gereklidir";
    if (!newCategory) errors.category = "Kategori seçiniz";
    if (!newMessage.trim()) errors.message = "Mesaj gereklidir";
    else if (newMessage.trim().length < 10) errors.message = "Mesaj en az 10 karakter olmalıdır";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateTicket = async () => {
    if (!validateNewTicket() || !user) return;

    setLoading(true);
    try {
      // Ticket oluştur
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: newSubject.trim(),
          category: newCategory,
        })
        .select()
        .single();

      if (ticketError) {
        console.error("Ticket oluşturma hatası:", ticketError);
        // Daha detaylı hata mesajı göster
        const errorMessage = ticketError.message || "Destek talebi oluşturulamadı";
        if (ticketError.code === "23505") {
          toast.error("Bu talep zaten mevcut. Lütfen tekrar deneyin.");
        } else if (ticketError.code === "42501") {
          toast.error("Yetki hatası: Destek talebi oluşturma yetkiniz yok.");
        } else {
          toast.error(`Destek talebi oluşturulamadı: ${errorMessage}`);
        }
        throw ticketError;
      }

      // İlk mesajı ekle
      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticketData.id,
          sender_id: user.id,
          sender_type: "customer",
          message: newMessage.trim(),
        });

      if (messageError) {
        console.error("Mesaj ekleme hatası:", messageError);
        // Ticket oluştu ama mesaj eklenemedi - ticket'ı sil
        await supabase.from("support_tickets").delete().eq("id", ticketData.id);
        toast.error("Mesaj eklenemedi. Lütfen tekrar deneyin.");
        throw messageError;
      }

      // Admin'lere email bildirimi gönder
      try {
        const customerName = profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || "Müşteri";
        const customerEmail = profile?.email || user?.email || "";
        
        console.log("🔔 Admin bildirimi gönderiliyor...", {
          ticketNumber: ticketData.ticket_number,
          customerName,
          customerEmail,
        });
        
        const emailResult = await sendNewTicketNotificationToAdmins(
          ticketData.ticket_number,
          newSubject.trim(),
          newCategory,
          customerName,
          customerEmail,
          newMessage.trim()
        );
        
        if (emailResult.success) {
          console.log("✅ Admin bildirimi başarılı:", emailResult);
        } else {
          console.error("❌ Admin bildirimi başarısız:", emailResult);
          // Kullanıcıya hata gösterme, sadece logla
        }
      } catch (emailError: any) {
        console.error("❌ Admin bildirimi exception:", emailError);
        console.error("Error details:", emailError?.message, emailError?.stack);
        // Email hatası olsa bile ticket oluşturuldu, kullanıcıya hata gösterme
      }

      toast.success("Destek talebiniz oluşturuldu!");
      setNewSubject("");
      setNewCategory("");
      setNewMessage("");
      setFormErrors({});
      fetchTickets();
      openTicket(ticketData);
    } catch (err: any) {
      // Hata zaten yukarıda yakalandı ve gösterildi
      console.error("Ticket oluşturulamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user) return;

    // Kapalı ticket kontrolü
    if (selectedTicket.status === "closed" || selectedTicket.status === "resolved") {
      toast.error("Bu talep kapatıldı. Yeni mesaj gönderilemez.");
      return;
    }

    setSending(true);
    try {
      // Ticket'ın güncel durumunu kontrol et
      const { data: currentTicket, error: ticketError } = await supabase
        .from("support_tickets")
        .select("status")
        .eq("id", selectedTicket.id)
        .single();

      if (ticketError) throw ticketError;

      // Eğer ticket kapatıldıysa mesaj gönderme
      if (currentTicket?.status === "closed" || currentTicket?.status === "resolved") {
        setSelectedTicket({ ...selectedTicket, status: currentTicket.status });
        toast.error("Bu talep kapatıldı. Yeni mesaj gönderilemez.");
        return;
      }

      const { error } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          sender_type: "customer",
          message: replyMessage.trim(),
        });

      if (error) throw error;

      // Eğer ticket durumu "in_progress" ise -> "waiting_customer" yap
      if (currentTicket?.status === "in_progress") {
        const { error: updateError } = await supabase
          .from("support_tickets")
          .update({ status: "waiting_customer" })
          .eq("id", selectedTicket.id);
        
        if (updateError) {
          console.error("Durum güncellenemedi:", updateError);
        } else {
          // Local state'i güncelle
          setSelectedTicket({ ...selectedTicket, status: "waiting_customer" });
        }
      }

      setReplyMessage("");
      fetchMessages(selectedTicket.id);
      fetchTickets(); // Updated_at güncellenecek
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
      toast.error("Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const goBack = () => {
    setView("list");
    setSelectedTicket(null);
    setMessages([]);
  };

  // Giriş yapmamış kullanıcılar için
  if (!isAuthenticated()) {
    return (
      <Layout>
        <section className="py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold mb-4">
                <span className="text-gradient">Destek</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Sorularınız için destek ekibimizle iletişime geçin.
              </p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1 space-y-6"
              >
                <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
                  <h2 className="text-xl font-semibold mb-6">İletişim Bilgileri</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">E-posta</p>
                        <a href="mailto:destek@esdodesign.com" className="text-muted-foreground hover:text-primary transition-colors">
                          destek@esdodesign.com
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Telefon</p>
                        <a href="tel:+905551234567" className="text-muted-foreground hover:text-primary transition-colors">
                          +90 555 123 45 67
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium mb-1">Çalışma Saatleri</p>
                        <p className="text-muted-foreground">Pazartesi - Cuma: 09:00 - 18:00</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
                  <h3 className="font-semibold mb-4">Sosyal Medya</h3>
                  <div className="flex gap-3">
                    <a href="https://instagram.com/esdodesign" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://twitter.com/esdodesign" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a href="https://linkedin.com/company/esdodesign" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Login Prompt */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-2"
              >
                <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-card text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Destek Talebi Oluştur</h2>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Destek talebi oluşturmak ve mevcut taleplerinizi görüntülemek için giriş yapmanız gerekmektedir.
                  </p>
                  <Link to="/login">
                    <Button variant="hero" size="lg">
                      Giriş Yap
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  <span className="text-gradient">Destek</span>
                </h1>
                <p className="text-muted-foreground">
                  Yardıma mı ihtiyacınız var? Destek ekibimiz size yardımcı olmak için hazır.
                </p>
              </div>
              {view === "list" && (
                <Button onClick={() => setView("new")} variant="hero">
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Talep
                </Button>
              )}
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sidebar - Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
                <h2 className="text-lg font-semibold mb-4">İletişim Bilgileri</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">E-posta</p>
                      <a href="mailto:destek@esdodesign.com" className="text-sm font-medium hover:text-primary">
                        destek@esdodesign.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <a href="tel:+905551234567" className="text-sm font-medium hover:text-primary">
                        +90 555 123 45 67
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Çalışma Saatleri</p>
                      <p className="text-sm font-medium">Pzt-Cum: 09:00-18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-card">
                <h3 className="font-semibold mb-4">Talepleriniz</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-primary">{tickets.length}</p>
                    <p className="text-xs text-muted-foreground">Toplam</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <p className="text-2xl font-bold text-amber-500">
                      {tickets.filter(t => t.status === "open").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Açık</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <AnimatePresence mode="wait">
                {/* Ticket List */}
                {view === "list" && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden"
                  >
                    <div className="p-6 border-b border-border">
                      <h2 className="text-xl font-semibold">Destek Taleplerim</h2>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-12 px-6">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">Henüz destek talebiniz yok</p>
                        <Button onClick={() => setView("new")}>
                          <Plus className="w-4 h-4 mr-2" />
                          İlk Talebinizi Oluşturun
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {tickets.map((ticket) => {
                          const isClosed = ticket.status === "closed" || ticket.status === "resolved";
                          return (
                            <div
                              key={ticket.id}
                              onClick={() => openTicket(ticket)}
                              className={cn(
                                "p-4 cursor-pointer transition-colors",
                                isClosed 
                                  ? "bg-muted/20 hover:bg-muted/30 opacity-75" 
                                  : "hover:bg-muted/30"
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      {ticket.ticket_number}
                                    </span>
                                    <Badge variant="outline" className={statusConfig[getClientStatus(ticket.status)]?.color}>
                                      {statusConfig[getClientStatus(ticket.status)]?.label}
                                    </Badge>
                                    {isClosed && (
                                      <XCircle className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                  <h3 className={cn(
                                    "font-medium truncate",
                                    isClosed && "text-muted-foreground"
                                  )}>{ticket.subject}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {categories.find(c => c.value === ticket.category)?.label} • {" "}
                                    {new Date(ticket.updated_at).toLocaleDateString("tr-TR")}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* New Ticket Form */}
                {view === "new" && (
                  <motion.div
                    key="new"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-card rounded-2xl p-6 border border-border/50 shadow-card"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <Button variant="ghost" size="icon" onClick={() => setView("list")}>
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-semibold">Yeni Destek Talebi</h2>
                        <p className="text-sm text-muted-foreground">Sorununuzu detaylı açıklayın</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="subject">Konu *</Label>
                          <Input
                            id="subject"
                            value={newSubject}
                            onChange={(e) => setNewSubject(e.target.value)}
                            placeholder="Sorununuzu kısaca özetleyin"
                            className={formErrors.subject ? "border-destructive" : ""}
                          />
                          {formErrors.subject && (
                            <p className="text-xs text-destructive">{formErrors.subject}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Kategori *</Label>
                          <select
                            id="category"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className={cn(
                              "w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring",
                              formErrors.category ? "border-destructive" : "border-input"
                            )}
                          >
                            <option value="">Kategori Seçin</option>
                            {categories.map((cat) => (
                              <option key={cat.value} value={cat.value}>
                                {cat.label}
                              </option>
                            ))}
                          </select>
                          {formErrors.category && (
                            <p className="text-xs text-destructive">{formErrors.category}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mesajınız *</Label>
                        <textarea
                          id="message"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Sorununuzu detaylı bir şekilde açıklayın..."
                          rows={6}
                          className={cn(
                            "w-full px-4 py-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none",
                            formErrors.message ? "border-destructive" : "border-input"
                          )}
                        />
                        {formErrors.message && (
                          <p className="text-xs text-destructive">{formErrors.message}</p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setView("list")}>
                          İptal
                        </Button>
                        <Button onClick={handleCreateTicket} disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Oluşturuluyor...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Talep Oluştur
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Chat View */}
                {view === "chat" && selectedTicket && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-card rounded-2xl border border-border/50 shadow-card overflow-hidden flex flex-col"
                    style={{ height: "600px" }}
                  >
                    {/* Chat Header */}
                    <div className={cn(
                      "p-4 border-b border-border flex items-center gap-4",
                      (selectedTicket.status === "closed" || selectedTicket.status === "resolved") && "bg-muted/30"
                    )}>
                      <Button variant="ghost" size="icon" onClick={goBack}>
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={cn(
                            "font-semibold truncate",
                            (selectedTicket.status === "closed" || selectedTicket.status === "resolved") && "text-muted-foreground"
                          )}>
                            {selectedTicket.subject}
                          </h3>
                          <Badge variant="outline" className={statusConfig[getClientStatus(selectedTicket.status)]?.color}>
                            {statusConfig[getClientStatus(selectedTicket.status)]?.label}
                          </Badge>
                          {(selectedTicket.status === "closed" || selectedTicket.status === "resolved") && (
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedTicket.ticket_number} • {categories.find(c => c.value === selectedTicket.category)?.label}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      ) : (
                        <>
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                msg.sender_type === "customer" ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-2xl p-4",
                                  msg.sender_type === "customer"
                                    ? "bg-primary text-primary-foreground rounded-br-md"
                                    : "bg-muted rounded-bl-md"
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {msg.sender_type === "admin" && (
                                    <span className="text-xs font-medium text-primary">Destek Ekibi</span>
                                  )}
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className={cn(
                                  "text-xs mt-2",
                                  msg.sender_type === "customer" ? "text-primary-foreground/70" : "text-muted-foreground"
                                )}>
                                  {new Date(msg.created_at).toLocaleString("tr-TR")}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </>
                      )}
                    </div>

                    {/* Reply Input */}
                    {selectedTicket.status !== "closed" && selectedTicket.status !== "resolved" && (
                      <div className="p-4 border-t border-border">
                        <div className="flex gap-3">
                          <Input
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendReply();
                              }
                            }}
                          />
                          <Button onClick={handleSendReply} disabled={sending || !replyMessage.trim()}>
                            {sending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Closed ticket notice */}
                    {(selectedTicket.status === "closed" || selectedTicket.status === "resolved") && (
                      <div className="p-4 border-t border-border bg-muted/50">
                        <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {selectedTicket.status === "resolved" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium mb-1">
                              Bu talep çözüldü
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Bu talebe artık yeni mesaj gönderilemez. Yeni bir sorun için{" "}
                              <button 
                                onClick={() => {
                                  setView("new");
                                  setSelectedTicket(null);
                                }} 
                                className="text-primary hover:underline font-medium"
                              >
                                yeni talep oluşturun
                              </button>
                              .
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
