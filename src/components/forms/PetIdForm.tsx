import { useState, useRef } from "react";
import { PawPrint, User, Phone, MapPin, Heart, Hash, Palette, Upload, X, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PetIdData {
  petName: string;
  petImage: string;
  petMessage: string;
  ownerName: string;
  ownerPhone: string;
  address: string;
  healthNotes: string;
  microchipNumber: string;
  theme: string;
}

interface PetIdFormProps {
  data: PetIdData;
  onChange: (data: PetIdData) => void;
  errors?: Record<string, string>;
}

const themes = [
  { id: "default", name: "Turuncu", colors: "from-orange-400 to-pink-500" },
  { id: "warm", name: "Sıcak", colors: "from-amber-400 to-orange-500" },
  { id: "cool", name: "Mavi", colors: "from-blue-400 to-cyan-500" },
  { id: "nature", name: "Doğa", colors: "from-green-400 to-emerald-500" },
];

export const defaultPetIdData: PetIdData = {
  petName: "",
  petImage: "",
  petMessage: "Kayıp değilim, sadece maceraperestim!",
  ownerName: "",
  ownerPhone: "",
  address: "",
  healthNotes: "",
  microchipNumber: "",
  theme: "default",
};

export function PetIdForm({ data, onChange, errors = {} }: PetIdFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(data.petImage || null);

  const handleChange = (field: keyof PetIdData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        handleChange("petImage", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    handleChange("petImage", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Evcil Hayvan Kimliği Bilgileri</h3>
        <p className="text-sm text-muted-foreground">
          Evcil hayvanınızın NFC etiketinde görünecek bilgileri doldurun
        </p>
      </div>

      {/* Evcil Hayvan Bilgileri */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Evcil Hayvan Bilgileri
        </h4>
        
        {/* Pet Image Upload */}
        <div className="space-y-2">
          <Label>Evcil Hayvan Fotoğrafı</Label>
          <div className="flex items-start gap-4">
            <div 
              className={cn(
                "w-32 h-32 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30 transition-colors",
                imagePreview ? "border-primary" : "border-border hover:border-primary/50"
              )}
            >
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Pet preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <PawPrint className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Fotoğraf yok</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Fotoğraf Yükle
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeImage}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Kaldır
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                JPG, PNG veya GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-name">Evcil Hayvan Adı *</Label>
          <div className="relative">
            <PawPrint className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pet-name"
              placeholder="Pamuk"
              value={data.petName}
              onChange={(e) => handleChange("petName", e.target.value)}
              className={cn("pl-10", errors.petName && "border-destructive")}
            />
          </div>
          {errors.petName && <p className="text-xs text-destructive">{errors.petName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pet-message">Özel Mesaj</Label>
          <div className="relative">
            <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="pet-message"
              placeholder="Kayıp değilim, sadece maceraperestim!"
              value={data.petMessage}
              onChange={(e) => handleChange("petMessage", e.target.value)}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Bu mesaj profil sayfasında görünecek</p>
        </div>
      </div>

      {/* Sahip Bilgileri */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Sahip Bilgileri
        </h4>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="owner-name">Sahibi İsim Soyisim *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="owner-name"
                placeholder="Ayşe Demir"
                value={data.ownerName}
                onChange={(e) => handleChange("ownerName", e.target.value)}
                className={cn("pl-10", errors.ownerName && "border-destructive")}
              />
            </div>
            {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-phone">Sahibi Telefon Numarası *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="owner-phone"
                type="tel"
                placeholder="+90 555 987 6543"
                value={data.ownerPhone}
                onChange={(e) => handleChange("ownerPhone", e.target.value)}
                className={cn("pl-10", errors.ownerPhone && "border-destructive")}
              />
            </div>
            {errors.ownerPhone && <p className="text-xs text-destructive">{errors.ownerPhone}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner-address">Ev Adresi</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="owner-address"
              placeholder="Beşiktaş, İstanbul"
              value={data.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full pl-10 pr-4 py-2 min-h-[80px] rounded-md border bg-background text-sm border-input focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>
      </div>

      {/* Sağlık Bilgileri */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Sağlık Bilgileri
        </h4>
        
        <div className="space-y-2">
          <Label htmlFor="health-notes">Sağlık Notları</Label>
          <div className="relative">
            <Heart className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              id="health-notes"
              placeholder="Düzenli aşıları tam. Kuru mama dışında yiyecek vermeyin."
              value={data.healthNotes}
              onChange={(e) => handleChange("healthNotes", e.target.value)}
              className="w-full pl-10 pr-4 py-2 min-h-[80px] rounded-md border bg-background text-sm border-input focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              maxLength={300}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{data.healthNotes.length}/300</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="microchip">Mikroçip Numarası</Label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="microchip"
              placeholder="982000123456789"
              value={data.microchipNumber}
              onChange={(e) => handleChange("microchipNumber", e.target.value)}
              className="pl-10"
            />
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
