import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, CreditCard, Bell, Shield, LogOut } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Profile() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
    }
  }, [profile]);
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [nfcScanNotifications, setNfcScanNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

  const handleSaveProfile = () => {
    // TODO: Save to backend
    toast.success("Profil bilgileriniz kaydedildi");
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }
    // TODO: Change password via backend
    toast.success("Şifreniz değiştirildi");
    setIsChangePasswordOpen(false);
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCancelSubscription = () => {
    if (confirm("Aboneliğinizi iptal etmek istediğinizden emin misiniz?")) {
      // TODO: Cancel subscription
      toast.success("Abonelik iptal edildi");
    }
  };
  return (
    <Layout>
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">
              <span className="text-gradient">Profilim</span>
            </h1>
            <p className="text-muted-foreground">
              Hesap bilgilerinizi ve tercihlerinizi yönetin
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Profile Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 gradient-primary rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-primary-foreground" />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold">Ahmet Yılmaz</h2>
                  <p className="text-muted-foreground">ahmet@example.com</p>
                  <p className="text-sm text-accent mt-1">Premium Üye</p>
                </div>
                <div className="sm:ml-auto">
                  <Button variant="outline">Fotoğraf Değiştir</Button>
                </div>
              </div>
            </motion.div>

            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Kişisel Bilgiler
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input 
                    id="fullName" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input 
                    id="address" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="hero" onClick={handleSaveProfile}>Kaydet</Button>
              </div>
            </motion.div>

            {/* Subscription */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Abonelik & Ödeme
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-xl mb-6">
                <div>
                  <p className="font-medium">Premium Plan</p>
                  <p className="text-sm text-muted-foreground">3 aktif NFC • Aylık ₺87</p>
                </div>
                <Badge className="bg-accent/10 text-accent border-accent/20 self-start sm:self-auto">
                  Aktif
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Sonraki Ödeme</p>
                    <p className="text-sm text-muted-foreground">15 Mart 2024</p>
                  </div>
                  <span className="font-semibold">₺87</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Ödeme Yöntemi</p>
                    <p className="text-sm text-muted-foreground">•••• •••• •••• 4242</p>
                  </div>
                  <Button variant="outline" size="sm">Değiştir</Button>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline">Fatura Geçmişi</Button>
                <Button variant="ghost" className="text-destructive" onClick={handleCancelSubscription}>İptal Et</Button>
              </div>
            </motion.div>

            {/* Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Bildirimler
              </h3>

              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">E-posta Bildirimleri</p>
                      <p className="text-sm text-muted-foreground">Sipariş ve abonelik güncellemeleri</p>
                    </div>
                    <Switch 
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">NFC Tarama Bildirimleri</p>
                      <p className="text-sm text-muted-foreground">Birisi NFC'nizi tarattığında bildirim alın</p>
                    </div>
                    <Switch 
                      checked={nfcScanNotifications}
                      onCheckedChange={setNfcScanNotifications}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Pazarlama E-postaları</p>
                      <p className="text-sm text-muted-foreground">Yeni ürünler ve özel teklifler</p>
                    </div>
                    <Switch 
                      checked={marketingEmails}
                      onCheckedChange={setMarketingEmails}
                    />
                  </div>
              </div>
            </motion.div>

            {/* Security & Logout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsChangePasswordOpen(true)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Şifre Değiştir
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış Yap
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Şifre Değiştir</DialogTitle>
            <DialogDescription>
              Güvenliğiniz için şifrenizi düzenli olarak güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input 
                id="currentPassword"
                type="password"
                value={passwordData.current}
                onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input 
                id="newPassword"
                type="password"
                value={passwordData.new}
                onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
              <Input 
                id="confirmPassword"
                type="password"
                value={passwordData.confirm}
                onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
              İptal
            </Button>
            <Button variant="hero" onClick={handleChangePassword}>
              Şifreyi Değiştir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </section>
    </Layout>
  );
}
