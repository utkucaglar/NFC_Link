import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Linkedin, Instagram, Globe, MapPin, User } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

// This would come from the database in real implementation
const sampleData: BusinessCardData = {
  name: "Ahmet Yılmaz",
  title: "Senior Software Engineer",
  company: "Tech Startup A.Ş.",
  phone: "+90 555 123 4567",
  email: "ahmet@techstartup.com",
  whatsapp: "+905551234567",
  linkedin: "ahmetyilmaz",
  instagram: "ahmet.dev",
  website: "https://ahmetyilmaz.dev",
  bio: "10+ yıllık yazılım geliştirme deneyimi. React, Node.js ve cloud teknolojileri konusunda uzman."
};

export default function NFCBusinessCard() {
  const data = sampleData;

  const socialLinks = [
    { icon: Phone, label: "Ara", href: `tel:${data.phone}`, color: "bg-accent" },
    { icon: Mail, label: "E-posta", href: `mailto:${data.email}`, color: "bg-primary" },
    { icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/${data.whatsapp}`, color: "bg-green-500" },
  ];

  const otherLinks = [
    { icon: Linkedin, label: "LinkedIn", href: `https://linkedin.com/in/${data.linkedin}` },
    { icon: Instagram, label: "Instagram", href: `https://instagram.com/${data.instagram}` },
    { icon: Globe, label: "Website", href: data.website },
  ];

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
          <div className="gradient-primary p-8 text-center relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-20" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-28 h-28 mx-auto bg-card rounded-full flex items-center justify-center shadow-xl mb-4 relative z-10"
            >
              <User className="w-14 h-14 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold text-primary-foreground">{data.name}</h1>
            <p className="text-primary-foreground/80 mt-1">{data.title}</p>
            <p className="text-primary-foreground/60 text-sm">{data.company}</p>
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
          <div className="p-6 space-y-3">
            {otherLinks.map((link, index) => (
              link.href && (
                <motion.a
                  key={link.label}
                  href={link.href}
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
              )
            ))}
          </div>

          {/* Save Contact */}
          <div className="p-6 pt-0">
            <Button variant="hero" className="w-full" size="lg">
              Kişilere Kaydet
            </Button>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 text-center">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-gradient font-semibold">NFCLink</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
