import { useState } from "react";
import { User, Phone, Mail, Briefcase, Building, Linkedin, Instagram, Globe, FileText, Palette } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface BusinessCardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  bio: string;
  linkedin: string;
  instagram: string;
  website: string;
  theme: string;
}

interface BusinessCardFormProps {
  data: BusinessCardData;
  onChange: (data: BusinessCardData) => void;
  errors?: Record<string, string>;
}

const themes = [
  { id: "default", name: "Klasik", colors: "from-violet-500 to-purple-600" },
  { id: "modern", name: "Modern", colors: "from-blue-500 to-cyan-500" },
  { id: "minimal", name: "Minimal", colors: "from-gray-700 to-gray-900" },
  { id: "gradient", name: "Gradient", colors: "from-pink-500 via-purple-500 to-indigo-500" },
];

export const defaultBusinessCardData: BusinessCardData = {
  name: "",
  title: "",
  company: "",
  phone: "",
  email: "",
  bio: "",
  linkedin: "",
  instagram: "",
  website: "",
  theme: "default",
};

export function BusinessCardForm({ data, onChange, errors = {} }: BusinessCardFormProps) {
  const handleChange = (field: keyof BusinessCardData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Dijital Kartvizit Bilgileri</h3>
        <p className="text-sm text-muted-foreground">
          NFC kartınızda görünecek bilgileri doldurun
        </p>
      </div>

      {/* Kişisel Bilgiler */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Kişisel Bilgiler
        </h4>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bc-name">İsim Soyisim *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-name"
                placeholder="Ahmet Yılmaz"
                value={data.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={cn("pl-10", errors.name && "border-destructive")}
              />
            </div>
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-title">Meslek Ünvanı *</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-title"
                placeholder="Senior Software Engineer"
                value={data.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className={cn("pl-10", errors.title && "border-destructive")}
              />
            </div>
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bc-company">Şirket İsmi</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="bc-company"
              placeholder="Tech Startup A.Ş."
              value={data.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* İletişim Bilgileri */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          İletişim Bilgileri
        </h4>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bc-phone">Telefon Numarası *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-phone"
                type="tel"
                placeholder="+90 555 123 4567"
                value={data.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={cn("pl-10", errors.phone && "border-destructive")}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-email">E-posta *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-email"
                type="email"
                placeholder="ahmet@sirket.com"
                value={data.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={cn("pl-10", errors.email && "border-destructive")}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>
      </div>

      {/* Açıklama */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Hakkında
        </h4>
        
        <div className="space-y-2">
          <Label htmlFor="bc-bio">Tecrübeler ve İş Açıklaması</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="bc-bio"
              placeholder="10+ yıllık yazılım geliştirme deneyimi. React, Node.js ve cloud teknolojileri konusunda uzman."
              value={data.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="w-full pl-10 pr-4 py-2 min-h-[100px] rounded-md border bg-background text-sm border-input focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              maxLength={500}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{data.bio.length}/500</p>
        </div>
      </div>

      {/* Sosyal Medya */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Sosyal Medya & Web
        </h4>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bc-linkedin">LinkedIn</Label>
            <div className="relative">
              <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-linkedin"
                placeholder="linkedin.com/in/ahmetyilmaz"
                value={data.linkedin}
                onChange={(e) => handleChange("linkedin", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-instagram">Instagram</Label>
            <div className="relative">
              <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-instagram"
                placeholder="@ahmet.dev"
                value={data.instagram}
                onChange={(e) => handleChange("instagram", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-website">Website</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="bc-website"
                placeholder="https://ahmetyilmaz.dev"
                value={data.website}
                onChange={(e) => handleChange("website", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tema Seçimi */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Tema Seçimi
        </h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleChange("theme", theme.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all",
                data.theme === theme.id
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-full h-12 rounded-lg bg-gradient-to-r mb-2",
                theme.colors
              )} />
              <span className="text-sm font-medium">{theme.name}</span>
              {data.theme === theme.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
