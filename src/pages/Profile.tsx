import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, CreditCard, Bell, Shield, LogOut, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ShippingAddress } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Subscription {
  id: string;
  plan_type: string;
  status: string;
  amount: number;
  next_billing_date: string | null;
  auto_renew: boolean;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paid_at: string | null;
}

export default function Profile() {
  const { user, profile, loading, signOut, updateProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Profile data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Backup for cancel
  const [originalProfile, setOriginalProfile] = useState({ firstName: "", lastName: "", phone: "" });

  // Shipping addresses
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Subscriptions & Payments
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Dialogs
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });

  // Address form
  const [addressForm, setAddressForm] = useState({
    title: "Ev",
    first_name: "",
    last_name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    district: "",
    postal_code: "",
    country: "Türkiye",
    notes: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Load profile data
  useEffect(() => {
    if (profile) {
      const first = profile.first_name || "";
      const last = profile.last_name || "";
      const phoneNum = profile.phone || "";
      
      setFirstName(first);
      setLastName(last);
      setEmail(profile.email || "");
      setPhone(phoneNum);
      
      // Backup original values
      setOriginalProfile({ firstName: first, lastName: last, phone: phoneNum });
    }
  }, [profile]);

  // Fetch shipping addresses
  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchSubscription();
      fetchPayments();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    setLoadingAddresses(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/shipping_addresses?user_id=eq.${user.id}&select=*&order=is_default.desc,created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAddresses(data || []);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchSubscription = async () => {
    if (!user) return;
    
    setLoadingSubscription(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${user.id}&status=eq.active&select=*&limit=1`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data && data.length > 0 ? data[0] : null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/payments?user_id=eq.${user.id}&select=id,amount,status,paid_at&order=created_at.desc&limit=5`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayments(data || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleSaveProfile = async () => {
    console.log('handleSaveProfile called', { user: !!user, profile: !!profile, firstName, lastName });
    
    if (!user || !profile) {
      console.error('Missing user or profile', { user: !!user, profile: !!profile });
      toast.error("Kullanıcı bilgisi bulunamadı");
      return;
    }

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      console.warn('Validation failed', { firstName, lastName });
      toast.error("İsim ve soyisim boş olamaz");
      return;
    }

    if (savingProfile) {
      console.warn('Already saving, ignoring duplicate call');
      return;
    }

    setSavingProfile(true);
    console.log('Starting profile update...');

    try {
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      };
      
      console.log('Updating profile with data:', updateData);
      
      await updateProfile(updateData);
      
      console.log('Profile update successful');
      
      // Update backup with new values
      setOriginalProfile({ 
        firstName: firstName.trim(), 
        lastName: lastName.trim(), 
        phone: phone.trim() 
      });
      setIsEditingProfile(false);
      
      // toast.success is already shown in updateProfile
    } catch (error: any) {
      console.error('Save profile error:', error);
      // Error message is already shown in updateProfile
      // But we keep the form in edit mode so user can retry
    } finally {
      setSavingProfile(false);
      console.log('Profile save completed');
    }
  };

  const handleCancelEdit = () => {
    // Restore original values
    setFirstName(originalProfile.firstName);
    setLastName(originalProfile.lastName);
    setPhone(originalProfile.phone);
    setIsEditingProfile(false);
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    if (passwordData.new.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    try {
      await updatePassword(passwordData.current, passwordData.new);
      setIsChangePasswordOpen(false);
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (error) {
      // Error already handled in updatePassword
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const addressData = {
        ...addressForm,
        user_id: user.id,
        is_default: addresses.length === 0, // İlk adres ise default olsun
      };

      const url = editingAddress
        ? `${supabaseUrl}/rest/v1/shipping_addresses?id=eq.${editingAddress.id}`
        : `${supabaseUrl}/rest/v1/shipping_addresses`;

      const method = editingAddress ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        toast.success(editingAddress ? "Adres güncellendi" : "Adres eklendi");
        setIsAddAddressOpen(false);
        setEditingAddress(null);
        resetAddressForm();
        fetchAddresses();
      } else {
        throw new Error('Adres kaydedilemedi');
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error.message || "Adres kaydedilemedi");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Bu adresi silmek istediğinizden emin misiniz?")) return;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/rest/v1/shipping_addresses?id=eq.${addressId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success("Adres silindi");
        fetchAddresses();
      } else {
        throw new Error('Adres silinemedi');
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error("Adres silinemedi");
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      title: "Ev",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: profile?.phone || "",
      address_line1: "",
      address_line2: "",
      city: "",
      district: "",
      postal_code: "",
      country: "Türkiye",
      notes: "",
    });
  };

  const handleEditAddress = (address: ShippingAddress) => {
    setEditingAddress(address);
    setAddressForm({
      title: address.title,
      first_name: address.first_name,
      last_name: address.last_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || "",
      city: address.city,
      district: address.district || "",
      postal_code: address.postal_code,
      country: address.country,
      notes: address.notes || "",
    });
    setIsAddAddressOpen(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [nfcScanNotifications, setNfcScanNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

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
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Kişisel Bilgiler
                </h3>
                {!isEditingProfile && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Düzenle
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">İsim</Label>
                  <Input 
                    id="firstName" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={isEditingProfile ? "İsim" : ""}
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyisim</Label>
                  <Input 
                    id="lastName" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={isEditingProfile ? "Soyisim" : ""}
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email || ""}
                    disabled
                    className="bg-muted/50 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">E-posta adresi değiştirilemez</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={phone || ""}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? "bg-muted/50 cursor-not-allowed" : ""}
                  />
                </div>
              </div>

              {isEditingProfile && (
                <div className="mt-6 flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                  >
                    İptal
                  </Button>
                  <Button 
                    variant="hero" 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      "Kaydet"
                    )}
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Shipping Addresses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Adreslerim
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    resetAddressForm();
                    setEditingAddress(null);
                    setIsAddAddressOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Adres
                </Button>
              </div>

              {loadingAddresses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz adres eklenmemiş</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="p-4 border border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold">{address.title}</span>
                            {address.is_default && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                                Varsayılan
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground mb-1">
                            {address.first_name} {address.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{address.phone}</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            {address.address_line1}
                            {address.address_line2 && `, ${address.address_line2}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {address.district && `${address.district}, `}
                            {address.city} {address.postal_code}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Subscription */}
            {subscription && (
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
                    <p className="text-sm text-muted-foreground">
                      Aylık ₺{subscription.amount}
                    </p>
                  </div>
                  <Badge className="bg-accent/10 text-accent border-accent/20">
                    {subscription.status === 'active' ? 'Aktif' : subscription.status}
                  </Badge>
                </div>

                {subscription.next_billing_date && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Sonraki Ödeme</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(subscription.next_billing_date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className="font-semibold">₺{subscription.amount}</span>
                    </div>
                    <Separator />
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button variant="outline">Fatura Geçmişi</Button>
                  <Button variant="ghost" className="text-destructive">
                    İptal Et
                  </Button>
                </div>
              </motion.div>
            )}

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

        {/* Add/Edit Address Dialog */}
        <Dialog open={isAddAddressOpen} onOpenChange={(open) => {
          setIsAddAddressOpen(open);
          if (!open) {
            setEditingAddress(null);
            resetAddressForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAddress ? "Adresi Düzenle" : "Yeni Adres Ekle"}</DialogTitle>
              <DialogDescription>
                Teslimat adresinizi ekleyin veya güncelleyin.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressTitle">Başlık</Label>
                  <Input 
                    id="addressTitle"
                    value={addressForm.title}
                    onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                    placeholder="Ev, İş, vb."
                  />
                </div>
                <div className="space-y-2"></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressFirstName">İsim</Label>
                  <Input 
                    id="addressFirstName"
                    value={addressForm.first_name}
                    onChange={(e) => setAddressForm({ ...addressForm, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLastName">Soyisim</Label>
                  <Input 
                    id="addressLastName"
                    value={addressForm.last_name}
                    onChange={(e) => setAddressForm({ ...addressForm, last_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressPhone">Telefon</Label>
                <Input 
                  id="addressPhone"
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Adres *</Label>
                <textarea
                  id="addressLine1"
                  value={addressForm.address_line1}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                  className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm"
                  placeholder="Mahalle, Sokak, Bina No"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Adres Detayı (Opsiyonel)</Label>
                <Input 
                  id="addressLine2"
                  value={addressForm.address_line2}
                  onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                  placeholder="Apartman adı, Daire no, Kat"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="addressCity">İl *</Label>
                  <Input 
                    id="addressCity"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="İstanbul"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressDistrict">İlçe</Label>
                  <Input 
                    id="addressDistrict"
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    placeholder="Kadıköy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressPostalCode">Posta Kodu *</Label>
                  <Input 
                    id="addressPostalCode"
                    value={addressForm.postal_code}
                    onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                    placeholder="34000"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressNotes">Kurye Notu (Opsiyonel)</Label>
                <Input 
                  id="addressNotes"
                  value={addressForm.notes}
                  onChange={(e) => setAddressForm({ ...addressForm, notes: e.target.value })}
                  placeholder="Teslimat için özel notunuz..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddAddressOpen(false);
                setEditingAddress(null);
                resetAddressForm();
              }}>
                İptal
              </Button>
              <Button variant="hero" onClick={handleSaveAddress}>
                {editingAddress ? "Güncelle" : "Kaydet"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </Layout>
  );
}
