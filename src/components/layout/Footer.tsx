import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SocialSettings {
  address: string;
  instagram_url: string;
  email_address: string;
}

export function Footer() {
  const [socialSettings, setSocialSettings] = useState<SocialSettings>({
    address: "",
    instagram_url: "",
    email_address: "",
  });

  useEffect(() => {
    const fetchSocialSettings = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "social_settings")
          .single();

        if (data) {
          setSocialSettings(JSON.parse(data.value));
        }
      } catch (err) {
        console.error("Sosyal medya ayarları yüklenemedi:", err);
      }
    };

    fetchSocialSettings();
  }, []);

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
                <img 
                  src="/esdodesign_logo.png" 
                  alt="Esdodesign Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-gradient">Esdodesign</span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-md">
              NFC teknolojisi ile dijital varlığınızı tek dokunuşla paylaşın. 
              Kartvizitler, evcil hayvan kimlikleri ve özel yönlendirmeler için 
              akıllı çözümler sunuyoruz.
            </p>
            {socialSettings.address && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>{socialSettings.address}</span>
              </div>
            )}
            <div className="flex gap-4 mt-4">
              {socialSettings.instagram_url && (
                <a 
                  href={socialSettings.instagram_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
              {socialSettings.email_address && (
                <a 
                  href={`mailto:${socialSettings.email_address}`} 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Hızlı Linkler</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Ürünler
                </Link>
              </li>
              <li>
                <Link to="/my-nfc" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  NFC'lerim
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Siparişlerim
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Hesabım
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Yasal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  İade Politikası
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Destek
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2026 Esdodesign. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
