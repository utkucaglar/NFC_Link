import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User, Mail, Phone, MapPin, CreditCard, Bell, Shield, LogOut, Plus, Edit, Trash2, Loader2, Star, ChevronDown } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, ShippingAddress } from "@/lib/supabase";
import { cn } from "@/lib/utils";
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

const countryCodes = [
  { code: "+90", country: "Türkiye", isoCode: "TR" },
  { code: "+1", country: "ABD/Kanada", isoCode: "US" },
  { code: "+44", country: "İngiltere", isoCode: "GB" },
  { code: "+49", country: "Almanya", isoCode: "DE" },
  { code: "+33", country: "Fransa", isoCode: "FR" },
  { code: "+39", country: "İtalya", isoCode: "IT" },
  { code: "+34", country: "İspanya", isoCode: "ES" },
  { code: "+31", country: "Hollanda", isoCode: "NL" },
  { code: "+32", country: "Belçika", isoCode: "BE" },
  { code: "+41", country: "İsviçre", isoCode: "CH" },
  { code: "+43", country: "Avusturya", isoCode: "AT" },
  { code: "+46", country: "İsveç", isoCode: "SE" },
  { code: "+47", country: "Norveç", isoCode: "NO" },
  { code: "+45", country: "Danimarka", isoCode: "DK" },
  { code: "+358", country: "Finlandiya", isoCode: "FI" },
  { code: "+7", country: "Rusya", isoCode: "RU" },
  { code: "+86", country: "Çin", isoCode: "CN" },
  { code: "+81", country: "Japonya", isoCode: "JP" },
  { code: "+82", country: "Güney Kore", isoCode: "KR" },
  { code: "+91", country: "Hindistan", isoCode: "IN" },
  { code: "+971", country: "BAE", isoCode: "AE" },
  { code: "+966", country: "Suudi Arabistan", isoCode: "SA" },
  { code: "+20", country: "Mısır", isoCode: "EG" },
  { code: "+27", country: "Güney Afrika", isoCode: "ZA" },
  { code: "+61", country: "Avustralya", isoCode: "AU" },
  { code: "+64", country: "Yeni Zelanda", isoCode: "NZ" },
  { code: "+55", country: "Brezilya", isoCode: "BR" },
  { code: "+52", country: "Meksika", isoCode: "MX" },
  { code: "+54", country: "Arjantin", isoCode: "AR" },
].sort((a, b) => {
  // Türkiye'yi en üste al
  if (a.code === "+90") return -1;
  if (b.code === "+90") return 1;
  // Diğerlerini alfabetik sırala
  return a.country.localeCompare(b.country);
});

// Bayrak resmi URL'sini oluştur
const getFlagUrl = (isoCode: string) => {
  return `https://flagcdn.com/w20/${isoCode.toLowerCase()}.png`;
};

// Parse phone number from database
// Supports both formats: "+901234567890" (new) and "+90 123 456 78 90" (old/legacy)
// Returns: { countryCode: "+90", phoneNumber: "5538064115" }
const parsePhone = (phone: string) => {
  if (!phone) return { countryCode: "+90", phoneNumber: "" };
  
  // Remove all spaces first
  const cleanPhone = phone.replace(/\s/g, "");
  
  // Bilinen country code'ları kontrol et (uzun olanlardan başla)
  const countryCodes = [
    "+358", "+971", "+966", // 3 haneli (önce kontrol et)
    "+90", "+44", "+49", "+33", "+39", "+34", "+31", "+32", "+41", "+43", "+46", "+47", "+45", "+86", "+81", "+82", "+91", "+20", "+27", "+61", "+64", "+55", "+52", "+54", // 2 haneli
    "+1", "+7" // 1 haneli (en son kontrol et)
  ];
  
  // Country code'u bul (uzun olanlardan başla)
  let countryCode = "";
  for (const code of countryCodes) {
    if (cleanPhone.startsWith(code)) {
      countryCode = code;
      break;
    }
  }
  
  if (countryCode) {
    // Country code'dan sonraki kısmı al (sadece rakamlar)
    const afterCountryCode = cleanPhone.substring(countryCode.length);
    const phoneNumber = afterCountryCode.replace(/\D/g, "");
    return { countryCode, phoneNumber };
  }
  
  // Legacy format with spaces: "+90 123 456 78 90"
  const legacyMatch = phone.match(/^(\+\d+)\s*(.+)$/);
  if (legacyMatch) {
    const phoneNum = legacyMatch[2].replace(/\s/g, "");
    return { countryCode: legacyMatch[1], phoneNumber: phoneNum };
  }
  
  // If no country code found, assume it's just the number (default to Turkey)
  const phoneNum = cleanPhone.replace(/^\+/, "");
  return { countryCode: "+90", phoneNumber: phoneNum };
};

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
  
  // Phone number state
  const { countryCode: initialCountryCode, phoneNumber: initialPhoneNumber } = parsePhone(phone);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const isUserTypingPhoneRef = useRef(false);
  const lastPhoneValueRef = useRef(phone);
  
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
      
      // Parse phone number for display
      const parsed = parsePhone(phoneNum);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      lastPhoneValueRef.current = phoneNum;
      
      // Backup original values
      setOriginalProfile({ firstName: first, lastName: last, phone: phoneNum });
    }
  }, [profile]);

  // Update local phone state when phone changes externally (not from user typing)
  useEffect(() => {
    // Only sync if the change came from outside (not from user typing)
    if (!isUserTypingPhoneRef.current && phone !== lastPhoneValueRef.current) {
      const parsed = parsePhone(phone);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      lastPhoneValueRef.current = phone;
    }
  }, [phone]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isCountryDropdownOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.country-selector-container')) {
          setIsCountryDropdownOpen(false);
        }
      }
    };

    if (isCountryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCountryDropdownOpen]);

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
      const { data, error } = await supabase
        .from('shipping_addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true) // Sadece aktif adresleri getir
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast.error('Adresler yüklenemedi');
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

    // Phone validation - if phone is provided, it must be valid
    if (phone.trim()) {
      // Phone is stored as countryCode + phoneNumber (e.g., +905538064115)
      // Check if phoneNumber has 10 digits (for Turkish format)
      if (!phoneNumber || phoneNumber.length !== 10) {
        toast.error("Lütfen telefon numarasını tam giriniz");
        return;
      }
    }

    if (savingProfile) {
      console.warn('Already saving, ignoring duplicate call');
      return;
    }

    setSavingProfile(true);
    console.log('Starting profile update...');

    try {
      // Phone is already in format: countryCode + phoneNumber (e.g., +905538064115)
      // No spaces, ready for database
      const cleanedPhone = phone.trim() || null;
      
      const updateData = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: cleanedPhone,
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
    
    // Restore phone number state
    const parsed = parsePhone(originalProfile.phone);
    setCountryCode(parsed.countryCode);
    setPhoneNumber(parsed.phoneNumber);
    lastPhoneValueRef.current = originalProfile.phone;
    
    setIsEditingProfile(false);
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Format as: 123 456 78 90 (3-3-2-2)
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  const handlePhoneNumberChange = (value: string) => {
    // Mark that user is typing to prevent useEffect from overwriting
    isUserTypingPhoneRef.current = true;
    
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Limit to 10 digits for Turkish format
    const limitedDigits = digits.slice(0, 10);
    setPhoneNumber(limitedDigits);
    
    // Update the phone field with country code + number (NO SPACES for database)
    // Database format: +905538064115
    // Display format: +90 123 456 78 90 (handled in UI)
    const fullPhone = countryCode && limitedDigits ? `${countryCode}${limitedDigits}` : "";
    lastPhoneValueRef.current = fullPhone;
    setPhone(fullPhone);
    
    // Reset typing flag after a short delay to allow for continuous typing
    setTimeout(() => {
      isUserTypingPhoneRef.current = false;
    }, 100);
  };

  const handleCountryCodeChange = (newCountryCode: string) => {
    setCountryCode(newCountryCode);
    setIsCountryDropdownOpen(false);
    // Update the phone field with new country code + existing number (NO SPACES)
    // Database format: +905538064115
    const fullPhone = phoneNumber ? `${newCountryCode}${phoneNumber}` : "";
    lastPhoneValueRef.current = fullPhone;
    setPhone(fullPhone);
  };

  const handlePhoneNumberFocus = () => {
    setPhoneTouched(true);
  };

  const handlePhoneNumberBlur = () => {
    // Eğer input'a bir kez tıklandıysa (touched) ve telefon numarası boşsa veya eksikse hata göster
    if (phoneTouched && phoneNumber && phoneNumber.length !== 10) {
      // Phone number is incomplete
      // We don't show error here as phone is optional in profile
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

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

    // Validation
    if (!addressForm.first_name.trim() || !addressForm.last_name.trim()) {
      toast.error("İsim ve soyisim gereklidir");
      return;
    }
    if (!addressForm.phone.trim()) {
      toast.error("Telefon numarası gereklidir");
      return;
    }
    const phoneNumber = addressForm.phone.replace(/\s/g, '');
    if (!/^0[0-9]{10}$/.test(phoneNumber)) {
      toast.error("Telefon numarası 0 ile başlamalı ve 11 haneli olmalıdır (örn: 05XXXXXXXXX)");
      return;
    }
    if (!addressForm.address_line1.trim()) {
      toast.error("Adres gereklidir");
      return;
    }
    if (!addressForm.city.trim()) {
      toast.error("İl gereklidir");
      return;
    }
    if (!addressForm.postal_code.trim()) {
      toast.error("Posta kodu gereklidir");
      return;
    }

    try {
      const addressData = {
        ...addressForm,
        user_id: user.id,
        is_default: addresses.length === 0, // İlk adres ise default olsun
        is_active: true, // Yeni eklenen adresler aktif olmalı
      };

      if (editingAddress) {
        // Update existing address
        // is_active'i güncelleme verisinden çıkarıyoruz (sadece düzenleme için)
        const { is_active, ...updateData } = addressData;
        const { error } = await supabase
          .from('shipping_addresses')
          .update(updateData)
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast.success("Adres güncellendi");
      } else {
        // Insert new address
        const { error } = await supabase
          .from('shipping_addresses')
          .insert(addressData);

        if (error) throw error;
        toast.success("Adres eklendi");
      }

      setIsAddAddressOpen(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error.message || "Adres kaydedilemedi");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!user) return;
    
    // Adresin siparişlerde kullanılıp kullanılmadığını kontrol et
    const addressToDelete = addresses.find(addr => addr.id === addressId);
    const isDefault = addressToDelete?.is_default;
    
    // Siparişlerde kullanılıp kullanılmadığını kontrol et
    const { data: ordersUsingAddress, error: checkError } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('shipping_address_id', addressId)
      .limit(1);

    if (checkError) {
      console.error('Error checking address usage:', checkError);
    }

    const isUsedInOrders = ordersUsingAddress && ordersUsingAddress.length > 0;
    
    const confirmMessage = isUsedInOrders
      ? "Bu adres siparişlerinizde kullanıldığı için silinemez, ancak gizlenebilir. Gizlemek istiyor musunuz?"
      : "Bu adresi silmek istediğinizden emin misiniz?";
    
    if (!confirm(confirmMessage)) return;

    try {
      if (isUsedInOrders) {
        // Siparişlerde kullanılmış adres: Soft delete (gizle, sipariş geçmişi korunur)
        const { error } = await supabase
          .from('shipping_addresses')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', addressId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Soft delete address error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // RLS hatası kontrolü
          if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501') {
            const errorMsg = `RLS hatası alındı. Lütfen Supabase SQL Editor'da önce '23_rollback_shipping_addresses_soft_delete.sql' sonra '23_shipping_addresses_soft_delete_proper.sql' dosyalarını çalıştırın. 
            
Hata: ${error.message || error.code}`;
            toast.error(errorMsg, { duration: 10000 });
            console.error('RLS Policy Error Details:', {
              message: error.message,
              code: error.code,
              details: error.details,
              hint: error.hint,
              fullError: error
            });
          } else {
            toast.error(error.message || "Adres gizlenemedi");
          }
          return;
        }

        toast.success("Adres silindi");
      } else {
        // Siparişlerde kullanılmamış adres: Hard delete (gerçekten sil)
        // Önce varsayılan adres kontrolü yap
        if (isDefault) {
          const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
          if (remainingAddresses.length > 0) {
            await supabase
              .from('shipping_addresses')
              .update({ is_default: true })
              .eq('id', remainingAddresses[0].id)
              .eq('user_id', user.id);
          }
        }

        const { error } = await supabase
          .from('shipping_addresses')
          .delete()
          .eq('id', addressId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Hard delete address error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          
          // RLS hatası kontrolü
          if (error.message?.includes('row-level security') || error.message?.includes('RLS') || error.code === '42501') {
            const errorMsg = `RLS hatası alındı. Lütfen Supabase SQL Editor'da '23_shipping_addresses_soft_delete_proper.sql' dosyasının DELETE politikasını kontrol edin. 
            
Hata: ${error.message || error.code}`;
            toast.error(errorMsg, { duration: 10000 });
          } else {
            toast.error(error.message || "Adres silinemedi");
          }
          return;
        }

        toast.success("Adres silindi");
      }

      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      const errorMessage = error?.message || "Adres silinemedi";
      toast.error(errorMessage);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;

    try {
      // Önce tüm adreslerin is_default değerini false yap
      const { error: updateAllError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (updateAllError) throw updateAllError;

      // Sonra seçilen adresi varsayılan yap
      const { error: updateError } = await supabase
        .from('shipping_addresses')
        .update({ is_default: true })
        .eq('id', addressId);

      if (updateError) throw updateError;
      
      toast.success("Varsayılan adres güncellendi");
      fetchAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast.error("Varsayılan adres ayarlanamadı");
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
                  <div className="relative country-selector-container">
                    {/* Hidden select for form submission */}
                    <select
                      value={countryCode}
                      onChange={(e) => handleCountryCodeChange(e.target.value)}
                      className="sr-only"
                      aria-hidden="true"
                      tabIndex={-1}
                      disabled={!isEditingProfile}
                    >
                      {countryCodes.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.country} {country.code}
                        </option>
                      ))}
                    </select>
                    
                    {/* Combined Input */}
                    <div className={cn(
                      "flex items-center h-10 w-full rounded-md border border-input bg-background",
                      "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                      !isEditingProfile && "bg-muted/50 cursor-not-allowed"
                    )}>
                      {/* Country Code Selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => isEditingProfile && setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                          disabled={!isEditingProfile}
                          className={cn(
                            "flex items-center gap-1.5 px-3 h-10 border-r border-input",
                            "hover:bg-muted/50 transition-colors",
                            "focus:outline-none",
                            !isEditingProfile && "cursor-not-allowed"
                          )}
                        >
                          <img 
                            src={getFlagUrl(selectedCountry.isoCode)}
                            alt={selectedCountry.country}
                            className="w-5 h-4 object-cover rounded-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <span className="text-sm font-medium">{selectedCountry.code}</span>
                          {isEditingProfile && (
                            <ChevronDown className={cn(
                              "w-3 h-3 text-muted-foreground transition-transform",
                              isCountryDropdownOpen && "rotate-180"
                            )} />
                          )}
                        </button>
                        
                        {/* Dropdown Menu */}
                        {isCountryDropdownOpen && isEditingProfile && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setIsCountryDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 z-20 w-[200px] max-h-[300px] overflow-y-auto rounded-md border border-input bg-background shadow-lg">
                              {countryCodes.map((country) => (
                                <button
                                  key={country.code}
                                  type="button"
                                  onClick={() => handleCountryCodeChange(country.code)}
                                  className={cn(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
                                    "hover:bg-muted transition-colors",
                                    country.code === countryCode && "bg-muted font-medium"
                                  )}
                                >
                                  <img 
                                    src={getFlagUrl(country.isoCode)}
                                    alt={country.country}
                                    className="w-5 h-4 object-cover rounded-sm flex-shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <span className="flex-1">{country.code}</span>
                                  <span className="text-xs text-muted-foreground">{country.country}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Phone Number Input */}
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="123 456 78 90"
                          value={formatPhoneNumber(phoneNumber)}
                          onChange={(e) => isEditingProfile && handlePhoneNumberChange(e.target.value)}
                          onFocus={handlePhoneNumberFocus}
                          onBlur={handlePhoneNumberBlur}
                          disabled={!isEditingProfile}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="off"
                          spellCheck={false}
                          data-form-type="other"
                          data-lpignore="true"
                          className={cn(
                            "w-full h-10 pl-10 pr-3 bg-transparent",
                            "text-sm placeholder:text-muted-foreground",
                            "focus:outline-none",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            !phoneNumber && isEditingProfile && "text-transparent"
                          )}
                          maxLength={14} // "123 456 78 90" = 14 chars
                        />
                        {!phoneNumber && isEditingProfile && (
                          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm select-none">
                            123 456 78 90
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isEditingProfile && (
                    <p className="text-xs text-muted-foreground">Ülke kodunu seçin ve 10 haneli telefon numarası giriniz</p>
                  )}
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
                          {!address.is_default && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSetDefaultAddress(address.id)}
                              title="Varsayılan yap"
                            >
                              <Star className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAddress(address)}
                            title="Düzenle"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteAddress(address.id)}
                            title="Sil"
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
                <Label htmlFor="addressPhone">Telefon *</Label>
                <div className="relative">
                  <Input 
                    id="addressPhone"
                    type="tel"
                    placeholder="05XXXXXXXXX"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    maxLength={11}
                    className={!addressForm.phone ? 'text-transparent' : ''}
                  />
                  {!addressForm.phone && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none text-sm select-none">
                      05XXXXXXXXX
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">0 ile başlayan 11 haneli telefon numarası giriniz</p>
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
