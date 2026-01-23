import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  MessageSquare,
  Mail,
  Save,
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Instagram,
  Globe,
  MapPin,
  Image,
  Upload,
  Trash2,
  Plus,
} from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { sendSms, formatPhoneNumber } from "@/lib/sms";
import { sendTestEmail } from "@/lib/email";
import { toast } from "sonner";

interface SmsSettings {
  provider: "netgsm" | "iletimerkezi";
  api_key: string;
  api_secret: string;
  sender_id: string;
  is_enabled: boolean;
}

interface EmailSettings {
  api_key: string;
  from_email: string;
  from_name: string;
  is_enabled: boolean;
}

interface SocialSettings {
  address: string;
  instagram_url: string;
  email_address: string;
}

interface ShowcaseImage {
  id: string;
  url: string;
  link?: string;
}

const defaultSmsSettings: SmsSettings = {
  provider: "netgsm",
  api_key: "",
  api_secret: "",
  sender_id: "ESDODESIGN",
  is_enabled: false,
};

const defaultEmailSettings: EmailSettings = {
  api_key: "",
  from_email: "noreply@esdodesign.com",
  from_name: "Esdodesign",
  is_enabled: false,
};

const defaultSocialSettings: SocialSettings = {
  address: "",
  instagram_url: "",
  email_address: "",
};

export default function AdminSettings() {
  const [smsSettings, setSmsSettings] = useState<SmsSettings>(defaultSmsSettings);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(defaultEmailSettings);
  const [socialSettings, setSocialSettings] = useState<SocialSettings>(defaultSocialSettings);
  const [showcaseImages, setShowcaseImages] = useState<ShowcaseImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);
  const [savingShowcase, setSavingShowcase] = useState(false);
  const [uploadingShowcase, setUploadingShowcase] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Test mesajı - Esdodesign");
  const [testEmail, setTestEmail] = useState("");
  const [testing, setTesting] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // SMS ayarları
      const { data: smsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "sms_settings")
        .single();

      if (smsData) {
        setSmsSettings(JSON.parse(smsData.value));
      }

      // Email ayarları
      const { data: emailData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "email_settings")
        .single();

      if (emailData) {
        setEmailSettings(JSON.parse(emailData.value));
      }

      // Sosyal medya ayarları
      const { data: socialData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "social_settings")
        .single();

      if (socialData) {
        setSocialSettings(JSON.parse(socialData.value));
      }

      // Vitrin görselleri
      const { data: showcaseData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "showcase_images")
        .single();

      if (showcaseData) {
        setShowcaseImages(JSON.parse(showcaseData.value));
      }
    } catch (err) {
      console.error("Ayarlar yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "sms_settings",
          value: JSON.stringify(smsSettings),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("SMS ayarları kaydedildi");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setSavingEmail(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "email_settings",
          value: JSON.stringify(emailSettings),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Email ayarları kaydedildi");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSaveSocial = async () => {
    setSavingSocial(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "social_settings",
          value: JSON.stringify(socialSettings),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Sosyal medya ayarları kaydedildi");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      setSavingSocial(false);
    }
  };

  const handleSaveShowcase = async () => {
    setSavingShowcase(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({
          key: "showcase_images",
          value: JSON.stringify(showcaseImages),
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

      if (error) throw error;
      toast.success("Vitrin görselleri kaydedildi");
    } catch (err) {
      console.error("Kaydetme hatası:", err);
      toast.error("Ayarlar kaydedilemedi");
    } finally {
      setSavingShowcase(false);
    }
  };

  const handleShowcaseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu 5MB'dan küçük olmalıdır");
      return;
    }

    // Dosya türü kontrolü
    if (!file.type.startsWith("image/")) {
      toast.error("Sadece resim dosyaları yüklenebilir");
      return;
    }

    setUploadingShowcase(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `showcase_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const newImage: ShowcaseImage = {
        id: Date.now().toString(),
        url: urlData.publicUrl,
        link: "",
      };

      setShowcaseImages([...showcaseImages, newImage]);
      toast.success("Görsel yüklendi");
    } catch (err) {
      console.error("Yükleme hatası:", err);
      toast.error("Görsel yüklenemedi");
    } finally {
      setUploadingShowcase(false);
      // Input'u sıfırla
      e.target.value = "";
    }
  };

  const handleRemoveShowcaseImage = (id: string) => {
    setShowcaseImages(showcaseImages.filter((img) => img.id !== id));
  };

  const handleShowcaseLinkChange = (id: string, link: string) => {
    setShowcaseImages(
      showcaseImages.map((img) =>
        img.id === id ? { ...img, link } : img
      )
    );
  };

  const handleTestEmail = async () => {
    if (!testEmail.trim()) {
      toast.error("Test email adresi girin");
      return;
    }

    setTestingEmail(true);
    try {
      const result = await sendTestEmail(testEmail);
      if (result.success) {
        toast.success("Test emaili gönderildi!");
      } else {
        toast.error(`Email gönderilemedi: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Hata: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      toast.error("Test telefon numarası girin");
      return;
    }

    setTesting(true);
    try {
      const result = await sendSms(testPhone, testMessage);
      if (result.success) {
        toast.success("Test SMS'i gönderildi!");
      } else {
        toast.error(`SMS gönderilemedi: ${result.error}`);
      }
    } catch (err: any) {
      toast.error(`Hata: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Ayarlar</span>
          </h1>
          <p className="text-muted-foreground">
            Site ve SMS ayarlarını yönetin
          </p>
        </motion.div>

        {/* Social Media Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Sosyal Medya Ayarları</h2>
              <p className="text-sm text-muted-foreground">
                Footer'daki sosyal medya bağlantıları
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Address */}
            <div>
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Adres Bilgisi
              </Label>
              <Input
                id="address"
                value={socialSettings.address}
                onChange={(e) =>
                  setSocialSettings({ ...socialSettings, address: e.target.value })
                }
                placeholder="İstanbul, Türkiye"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Footer'da görünecek adres bilgisi
              </p>
            </div>

            {/* Instagram URL */}
            <div>
              <Label htmlFor="instagram_url" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram Linki
              </Label>
              <Input
                id="instagram_url"
                value={socialSettings.instagram_url}
                onChange={(e) =>
                  setSocialSettings({ ...socialSettings, instagram_url: e.target.value })
                }
                placeholder="https://instagram.com/esdodesign"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Instagram profil sayfanızın tam URL'si
              </p>
            </div>

            {/* Email Address */}
            <div>
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                İletişim Email Adresi
              </Label>
              <Input
                id="contact_email"
                type="email"
                value={socialSettings.email_address}
                onChange={(e) =>
                  setSocialSettings({ ...socialSettings, email_address: e.target.value })
                }
                placeholder="info@esdodesign.com"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Footer'daki mail ikonu bu adrese yönlendirecek
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveSocial} disabled={savingSocial} className="w-full">
              {savingSocial ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sosyal Medya Ayarlarını Kaydet
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Showcase Images Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Vitrin Görselleri</h2>
              <p className="text-sm text-muted-foreground">
                Ana sayfadaki slider görselleri
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Size Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                📐 Önerilen Görsel Boyutları
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>Boyut:</strong> 800 x 800 piksel (kare)</li>
                <li>• <strong>Format:</strong> JPG, PNG veya WebP</li>
                <li>• <strong>Maksimum dosya boyutu:</strong> 5MB</li>
                <li>• <strong>En-boy oranı:</strong> 1:1 (kare görsel)</li>
              </ul>
            </div>

            {/* Current Images */}
            {showcaseImages.length > 0 && (
              <div className="space-y-4">
                <Label>Mevcut Görseller ({showcaseImages.length})</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {showcaseImages.map((img, index) => (
                    <div key={img.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted/30">
                        <img
                          src={img.url}
                          alt={`Vitrin ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                      <button
                        onClick={() => handleRemoveShowcaseImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-destructive text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Input
                        placeholder="Link (opsiyonel)"
                        value={img.link || ""}
                        onChange={(e) => handleShowcaseLinkChange(img.id, e.target.value)}
                        className="mt-2 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div>
              <Label className="block mb-2">Yeni Görsel Ekle</Label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingShowcase ? (
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Görsel yüklemek için tıklayın
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        800x800 piksel önerilir
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleShowcaseImageUpload}
                  disabled={uploadingShowcase}
                />
              </label>
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveShowcase} disabled={savingShowcase || showcaseImages.length === 0} className="w-full">
              {savingShowcase ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Vitrin Görsellerini Kaydet
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* SMS Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">SMS Ayarları</h2>
              <p className="text-sm text-muted-foreground">
                Sipariş ve destek bildirimleri için SMS servisi
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <Label className="font-medium">SMS Servisi</Label>
                <p className="text-sm text-muted-foreground">
                  SMS bildirimlerini etkinleştir
                </p>
              </div>
              <Switch
                checked={smsSettings.is_enabled}
                onCheckedChange={(checked) =>
                  setSmsSettings({ ...smsSettings, is_enabled: checked })
                }
              />
            </div>

            {/* Provider Selection */}
            <div>
              <Label className="mb-2 block">SMS Sağlayıcısı</Label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSmsSettings({ ...smsSettings, provider: "netgsm" })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    smsSettings.provider === "netgsm"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">Netgsm</p>
                  <p className="text-xs text-muted-foreground">Türkiye'de yaygın</p>
                </button>
                <button
                  onClick={() => setSmsSettings({ ...smsSettings, provider: "iletimerkezi" })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    smsSettings.provider === "iletimerkezi"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <p className="font-semibold">İletimerkezi</p>
                  <p className="text-xs text-muted-foreground">Kolay entegrasyon</p>
                </button>
              </div>
            </div>

            {/* API Credentials */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="api_key">API Key / Kullanıcı Kodu</Label>
                <div className="relative mt-1">
                  <Input
                    id="api_key"
                    type={showApiKey ? "text" : "password"}
                    value={smsSettings.api_key}
                    onChange={(e) =>
                      setSmsSettings({ ...smsSettings, api_key: e.target.value })
                    }
                    placeholder="API anahtarınız"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="api_secret">API Secret / Şifre</Label>
                <div className="relative mt-1">
                  <Input
                    id="api_secret"
                    type={showApiSecret ? "text" : "password"}
                    value={smsSettings.api_secret}
                    onChange={(e) =>
                      setSmsSettings({ ...smsSettings, api_secret: e.target.value })
                    }
                    placeholder="API şifreniz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiSecret(!showApiSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Sender ID */}
            <div>
              <Label htmlFor="sender_id">Gönderici Adı (Sender ID)</Label>
              <Input
                id="sender_id"
                value={smsSettings.sender_id}
                onChange={(e) =>
                  setSmsSettings({ ...smsSettings, sender_id: e.target.value.toUpperCase() })
                }
                placeholder="ESDODESIGN"
                className="mt-1 uppercase"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maksimum 11 karakter. SMS'lerde görünecek gönderici adı.
              </p>
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Ayarları Kaydet
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Test SMS Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Test SMS</h2>
              <p className="text-sm text-muted-foreground">
                SMS ayarlarını test edin
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test_phone">Telefon Numarası</Label>
              <Input
                id="test_phone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="test_message">Test Mesajı</Label>
              <Input
                id="test_message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Test mesajı"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleTestSms}
              disabled={testing || !smsSettings.is_enabled}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Test SMS Gönder
                </>
              )}
            </Button>

            {!smsSettings.is_enabled && (
              <p className="text-sm text-muted-foreground text-center">
                Test göndermek için SMS servisini etkinleştirin
              </p>
            )}
          </div>
        </motion.div>

        {/* Email Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email Ayarları</h2>
              <p className="text-sm text-muted-foreground">
                Sipariş ve destek bildirimleri için Resend API
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <Label className="font-medium">Email Servisi</Label>
                <p className="text-sm text-muted-foreground">
                  Email bildirimlerini etkinleştir
                </p>
              </div>
              <Switch
                checked={emailSettings.is_enabled}
                onCheckedChange={(checked) =>
                  setEmailSettings({ ...emailSettings, is_enabled: checked })
                }
              />
            </div>

            {/* API Key */}
            <div>
              <Label htmlFor="email_api_key">Resend API Key</Label>
              <div className="relative mt-1">
                <Input
                  id="email_api_key"
                  type={showEmailApiKey ? "text" : "password"}
                  value={emailSettings.api_key}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, api_key: e.target.value })
                  }
                  placeholder="re_xxxxxxxxxx"
                />
                <button
                  type="button"
                  onClick={() => setShowEmailApiKey(!showEmailApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showEmailApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Resend.com
                </a>'dan API key alabilirsiniz
              </p>
            </div>

            {/* From Settings */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="from_name">Gönderici Adı</Label>
                <Input
                  id="from_name"
                  value={emailSettings.from_name}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, from_name: e.target.value })
                  }
                  placeholder="Esdodesign"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="from_email">Gönderici Email</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={emailSettings.from_email}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, from_email: e.target.value })
                  }
                  placeholder="noreply@esdodesign.com"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={handleSaveEmail} disabled={savingEmail} className="w-full">
              {savingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Email Ayarlarını Kaydet
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Test Email Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 shadow-card border border-border/50"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Test Email</h2>
              <p className="text-sm text-muted-foreground">
                Email ayarlarını test edin
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="test_email">Email Adresi</Label>
              <Input
                id="test_email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleTestEmail}
              disabled={testingEmail || !emailSettings.is_enabled}
              variant="outline"
              className="w-full"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Test Email Gönder
                </>
              )}
            </Button>

            {!emailSettings.is_enabled && (
              <p className="text-sm text-muted-foreground text-center">
                Test göndermek için Email servisini etkinleştirin
              </p>
            )}
            {emailSettings.is_enabled && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm">
                <p className="text-blue-500 font-medium mb-1">⚠️ Resend Free Tier Notu:</p>
                <p className="text-muted-foreground">
                  Domain doğrulaması olmadan sadece <strong>Resend hesabınıza kayıtlı email adresine</strong> gönderebilirsiniz. 
                  Production için domain doğrulaması yapmanız gerekir.
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Usage Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-muted/30 rounded-2xl p-6 border border-border/50"
        >
          <h3 className="font-semibold mb-4">Bildirim Kullanım Alanları</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> SMS Bildirimleri
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Sipariş onayı</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Kargo bildirimi</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Destek yanıtı</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Bildirimleri
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>Sipariş detaylı email</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>Kargo takip emaili</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span>Destek sohbeti</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
