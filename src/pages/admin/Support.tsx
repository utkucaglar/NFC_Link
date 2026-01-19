import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  ArrowLeft,
  Filter,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { sendSupportSms } from "@/lib/sms";
import { sendSupportEmail } from "@/lib/email";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SupportTicket {
  id: string;
  user_id: string;
  ticket_number: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
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
  { value: "order", label: "Sipariş" },
  { value: "technical", label: "Teknik" },
  { value: "billing", label: "Ödeme/Fatura" },
  { value: "other", label: "Diğer" },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: "Açık", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: AlertCircle },
  in_progress: { label: "İşlemde", color: "bg-amber-500/10 text-amber-500 border-amber-500/30", icon: RefreshCw },
  waiting_customer: { label: "Yanıt Bekleniyor", color: "bg-purple-500/10 text-purple-500 border-purple-500/30", icon: Clock },
  resolved: { label: "Çözüldü", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: CheckCircle2 },
  closed: { label: "Kapatıldı", color: "bg-gray-500/10 text-gray-500 border-gray-500/30", icon: XCircle },
};

type FilterStatus = "all" | "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export default function AdminSupport() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [showCompleted, setShowCompleted] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingCustomer: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // RPC fonksiyonu ile tüm ticketları getir
      const { data: rpcData, error: rpcError } = await supabase.rpc("get_all_support_tickets");

      if (rpcError) {
        console.error("RPC error:", rpcError);
        // RPC yoksa normal sorgu dene
        if (rpcError.code === "42883" || rpcError.message?.includes("does not exist")) {
          // Fallback: normal sorgu
          let query = supabase
            .from("support_tickets")
            .select(`
              *,
              user_profiles:user_id (first_name, last_name, email)
            `)
            .order("updated_at", { ascending: false });

          if (statusFilter !== "all") {
            query = query.eq("status", statusFilter);
          }

          const { data, error } = await query;
          if (error) throw error;

          setTickets(data || []);
          calculateStats(data || []);
          return;
        }
        throw rpcError;
      }

      // RPC verisini uygun formata dönüştür
      const formattedData = (rpcData || []).map((ticket: any) => ({
        ...ticket,
        user_profiles: {
          first_name: ticket.user_first_name,
          last_name: ticket.user_last_name,
          email: ticket.user_email,
        },
      }));

      // Status filtresi uygula
      let filteredData = formattedData;
      if (statusFilter !== "all") {
        filteredData = formattedData.filter((t: any) => t.status === statusFilter);
      }

      setTickets(filteredData);
      calculateStats(formattedData);
    } catch (err: any) {
      console.error("Ticketlar yüklenemedi:", err);
      if (err?.code === "42P01" || err?.message?.includes("does not exist")) {
        setTickets([]);
        setStats({ total: 0, open: 0, inProgress: 0, waitingCustomer: 0, resolved: 0, closed: 0 });
        return;
      }
      toast.error("Destek talepleri yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allTickets: SupportTicket[]) => {
    setStats({
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === "open").length,
      inProgress: allTickets.filter((t) => t.status === "in_progress").length,
      waitingCustomer: allTickets.filter((t) => t.status === "waiting_customer").length,
      resolved: allTickets.filter((t) => t.status === "resolved").length,
      closed: allTickets.filter((t) => t.status === "closed").length,
    });
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

      // Okunmamış mesajları okundu olarak işaretle
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_type", "customer")
        .eq("is_read", false);
    } catch (err) {
      console.error("Mesajlar yüklenemedi:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket || !user) return;

    setSending(true);
    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: "admin",
        message: replyMessage.trim(),
      });

      if (error) throw error;

      // Eğer ticket durumu "open" ise -> "in_progress" yap
      // Eğer ticket durumu "waiting_customer" ise -> "in_progress" yap
      let newStatus = selectedTicket.status;
      if (selectedTicket.status === "open" || selectedTicket.status === "waiting_customer") {
        newStatus = "in_progress";
        const { error: updateError } = await supabase
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", selectedTicket.id);
        
        if (updateError) {
          console.error("Durum güncellenemedi:", updateError);
        } else {
          // Local state'i güncelle
          setSelectedTicket({ ...selectedTicket, status: "in_progress" });
        }
      }

      // Müşteriye SMS gönder
      if (selectedTicket.user_id) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("phone")
          .eq("id", selectedTicket.user_id)
          .single();
        
        if (profile?.phone) {
          sendSupportSms(profile.phone, selectedTicket.ticket_number, "reply")
            .catch(console.error);
        }

        // Email bildirimi gönder
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("email")
          .eq("id", selectedTicket.user_id)
          .single();
        
        if (userProfile?.email) {
          sendSupportEmail(userProfile.email, selectedTicket.ticket_number, "reply", replyMessage.trim())
            .catch(console.error);
        }
      }

      setReplyMessage("");
      fetchMessages(selectedTicket.id);
      fetchTickets();
      toast.success("Yanıt gönderildi");
    } catch (err) {
      console.error("Mesaj gönderilemedi:", err);
      toast.error("Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicket) return;

    // Eğer kapatma isteniyorsa, onay dialogu göster
    if (status === "closed" && selectedTicket.status !== "closed") {
      setShowCloseDialog(true);
      return;
    }

    await updateTicketStatus(status);
  };

  const updateTicketStatus = async (status: string) => {
    if (!selectedTicket) return;

    try {
      const updateData: any = { status };
      if (status === "closed" || status === "resolved") {
        updateData.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updateData)
        .eq("id", selectedTicket.id);

      if (error) throw error;

      // Çözüldü durumunda SMS gönder
      if (status === "resolved" || status === "closed") {
        if (selectedTicket.user_id) {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("phone")
            .eq("id", selectedTicket.user_id)
            .single();
          
          if (profile?.phone) {
            sendSupportSms(profile.phone, selectedTicket.ticket_number, "resolved")
              .catch(console.error);
          }

          // Email bildirimi gönder
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("email")
            .eq("id", selectedTicket.user_id)
            .single();
          
          if (userProfile?.email) {
            sendSupportEmail(userProfile.email, selectedTicket.ticket_number, "resolved")
              .catch(console.error);
          }
        }
      }

      setSelectedTicket({ ...selectedTicket, status });
      fetchTickets();
      setShowCloseDialog(false);
      toast.success(status === "closed" ? "Talep kapatıldı" : "Durum güncellendi");
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
      toast.error("Durum güncellenemedi");
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    setClosingTicket(true);
    try {
      await updateTicketStatus("closed");
    } finally {
      setClosingTicket(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    // Çözüldü ve kapatıldı talepleri gizleme kontrolü
    if (!showCompleted && (ticket.status === "resolved" || ticket.status === "closed")) {
      return false;
    }

    // Arama filtresi
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ticket.ticket_number.toLowerCase().includes(search) ||
      ticket.subject.toLowerCase().includes(search) ||
      ticket.user_profiles?.first_name?.toLowerCase().includes(search) ||
      ticket.user_profiles?.last_name?.toLowerCase().includes(search) ||
      ticket.user_profiles?.email?.toLowerCase().includes(search)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Destek Talepleri</h1>
          <p className="text-muted-foreground">Müşteri destek taleplerini yönetin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Açık</p>
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
                <RefreshCw className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">İşlemde</p>
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
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.waitingCustomer}</p>
                <p className="text-sm text-muted-foreground">Yanıt Bekleniyor</p>
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
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Çözüldü</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-4 border border-border/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.closed}</p>
                <p className="text-sm text-muted-foreground">Kapatıldı</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6" style={{ minHeight: "600px" }}>
          {/* Ticket List */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border/50 overflow-hidden flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Talep ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "open", "in_progress", "waiting_customer", "resolved", "closed"] as FilterStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="text-xs"
                  >
                    {status === "all" && "Tümü"}
                    {status === "open" && "Açık"}
                    {status === "in_progress" && "İşlemde"}
                    {status === "waiting_customer" && "Yanıt Bekleniyor"}
                    {status === "resolved" && "Çözüldü"}
                    {status === "closed" && "Kapatıldı"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
                <Label htmlFor="show-completed" className="text-sm cursor-pointer">
                  Çözüldü ve Kapatıldı Talepleri Göster
                </Label>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Talep bulunamadı</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredTickets.map((ticket) => {
                    const StatusIcon = statusConfig[ticket.status]?.icon || Clock;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleSelectTicket(ticket)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedTicket?.id === ticket.id
                            ? "bg-primary/5 border-l-2 border-primary"
                            : "hover:bg-muted/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                              ticket.status === "open" ? "bg-red-500/10" : "bg-muted"
                            )}
                          >
                            <StatusIcon
                              className={cn(
                                "w-5 h-5",
                                ticket.status === "open" ? "text-red-500" : "text-muted-foreground"
                              )}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-muted-foreground font-mono">
                                {ticket.ticket_number}
                              </span>
                            </div>
                            <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {ticket.user_profiles?.first_name} {ticket.user_profiles?.last_name} •{" "}
                              {ticket.user_profiles?.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", statusConfig[ticket.status]?.color)}
                              >
                                {statusConfig[ticket.status]?.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(ticket.updated_at).toLocaleDateString("tr-TR")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="lg:col-span-3 bg-card rounded-xl border border-border/50 overflow-hidden flex flex-col">
            {selectedTicket ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{selectedTicket.subject}</h3>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusConfig[selectedTicket.status]?.color)}
                        >
                          {statusConfig[selectedTicket.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedTicket.ticket_number} •{" "}
                        {selectedTicket.user_profiles?.first_name} {selectedTicket.user_profiles?.last_name} •{" "}
                        {categories.find((c) => c.value === selectedTicket.category)?.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={selectedTicket.status === "closed"}
                      >
                        <option value="open">Açık</option>
                        <option value="in_progress">İşlemde</option>
                        <option value="waiting_customer">Yanıt Bekleniyor</option>
                        <option value="resolved">Çözüldü</option>
                        <option value="closed">Kapatıldı</option>
                      </select>
                      {selectedTicket.status !== "closed" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setShowCloseDialog(true)}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Kapat
                        </Button>
                      )}
                    </div>
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
                            msg.sender_type === "admin" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl p-4",
                              msg.sender_type === "admin"
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted rounded-bl-md"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.sender_type === "customer" && (
                                <span className="text-xs font-medium">
                                  {selectedTicket.user_profiles?.first_name}{" "}
                                  {selectedTicket.user_profiles?.last_name}
                                </span>
                              )}
                              {msg.sender_type === "admin" && (
                                <span className="text-xs font-medium text-primary-foreground/80">
                                  Destek Ekibi
                                </span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p
                              className={cn(
                                "text-xs mt-2",
                                msg.sender_type === "admin"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {new Date(msg.created_at).toLocaleString("tr-TR")}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Reply Input - Sadece kapalı olmayan ticket'larda göster */}
                {selectedTicket.status !== "closed" && (
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-3">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Yanıtınızı yazın..."
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

                {/* Kapalı ticket uyarısı */}
                {selectedTicket.status === "closed" && (
                  <div className="p-4 border-t border-border bg-muted/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      <span>Bu talep kapatılmış. Yeni mesaj gönderilemez.</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Talep Seçin</h3>
                  <p className="text-muted-foreground">
                    Sol taraftan bir destek talebi seçerek sohbeti görüntüleyin
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kapatma Onay Dialogu */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talep Kapatma Onayı</DialogTitle>
            <DialogDescription>
              Bu talebi kapatmak istediğinize emin misiniz? Kapatıldıktan sonra bu talebe yeni mesaj eklenemeyecek.
              {selectedTicket && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{selectedTicket.ticket_number}</p>
                  <p className="text-xs text-muted-foreground">{selectedTicket.subject}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={closingTicket}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseTicket}
              disabled={closingTicket}
            >
              {closingTicket ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kapatılıyor...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Evet, Kapat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
