import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

export interface RedirectData {
  partnerName1: string;
  partnerName2: string;
  relationshipStartDate: string;
  backgroundImage: string;
  subtitle: string;
  theme: string;
}

export const defaultRedirectData: RedirectData = {
  partnerName1: "",
  partnerName2: "",
  relationshipStartDate: "",
  backgroundImage: "",
  subtitle: "Birlikte olduğumuz her an bir ömür gibi…",
  theme: "romantic",
};

const themes = [
  { id: "romantic", name: "Romantik", colors: "from-pink-500 to-rose-600" },
  { id: "elegant", name: "Zarif", colors: "from-amber-400 to-orange-500" },
  { id: "modern", name: "Modern", colors: "from-violet-500 to-purple-600" },
  { id: "nature", name: "Doğa", colors: "from-green-400 to-emerald-600" },
  { id: "ocean", name: "Okyanus", colors: "from-cyan-400 to-blue-600" },
  { id: "sunset", name: "Gün Batımı", colors: "from-orange-400 to-red-500" },
];

// Redirect sayfasındaki temalarla uyumlu önizleme stilleri
const themeStyles: Record<string, { gradient: string; accent: string; accentBg: string }> = {
  romantic: {
    gradient: "from-pink-500 via-rose-500 to-red-500",
    accent: "text-amber-300",
    accentBg: "bg-rose-500/30",
  },
  elegant: {
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    accent: "text-amber-200",
    accentBg: "bg-amber-500/30",
  },
  modern: {
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    accent: "text-violet-200",
    accentBg: "bg-violet-500/30",
  },
  nature: {
    gradient: "from-green-400 via-emerald-500 to-teal-500",
    accent: "text-emerald-200",
    accentBg: "bg-emerald-500/30",
  },
  ocean: {
    gradient: "from-cyan-400 via-blue-500 to-indigo-500",
    accent: "text-cyan-200",
    accentBg: "bg-cyan-500/30",
  },
  sunset: {
    gradient: "from-orange-400 via-red-500 to-pink-500",
    accent: "text-orange-200",
    accentBg: "bg-orange-500/30",
  },
};

interface RedirectFormProps {
  data: RedirectData;
  onChange: (data: RedirectData) => void;
  errors?: Record<string, string>;
  onErrorClear?: (field: string) => void;
}

export function RedirectForm({ data, onChange, errors = {}, onErrorClear }: RedirectFormProps) {
  const handleChange = (field: keyof RedirectData, value: string) => {
    onChange({ ...data, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field] && onErrorClear) {
      onErrorClear(field);
    }
  };

  const toTitleCase = (str: string): string => {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  const handlePartnerName1Blur = () => {
    if (data.partnerName1) {
      const titleCasedName = toTitleCase(data.partnerName1);
      if (titleCasedName !== data.partnerName1) {
        handleChange("partnerName1", titleCasedName);
      }
    }
  };

  const handlePartnerName2Blur = () => {
    if (data.partnerName2) {
      const titleCasedName = toTitleCase(data.partnerName2);
      if (titleCasedName !== data.partnerName2) {
        handleChange("partnerName2", titleCasedName);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Dosya boyutu 5MB'dan küçük olmalıdır");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("backgroundImage", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedTheme = themeStyles[data.theme] || themeStyles.romantic;

  return (
    <div className="space-y-6">
      {/* Partner Names */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partnerName1">1. Kişi Adı *</Label>
          <Input
            id="partnerName1"
            value={data.partnerName1}
            onChange={(e) => handleChange("partnerName1", e.target.value)}
            onBlur={handlePartnerName1Blur}
            placeholder="Örn: Ali"
            className={errors.partnerName1 ? "border-destructive" : ""}
          />
          {errors.partnerName1 && (
            <p className="text-xs text-destructive">{errors.partnerName1}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="partnerName2">2. Kişi Adı *</Label>
          <Input
            id="partnerName2"
            value={data.partnerName2}
            onChange={(e) => handleChange("partnerName2", e.target.value)}
            onBlur={handlePartnerName2Blur}
            placeholder="Örn: Ayşe"
            className={errors.partnerName2 ? "border-destructive" : ""}
          />
          {errors.partnerName2 && (
            <p className="text-xs text-destructive">{errors.partnerName2}</p>
          )}
        </div>
      </div>

      {/* Relationship Start Date */}
      <div className="space-y-2">
        <Label htmlFor="relationshipStartDate">İlişki Başlangıç Tarihi *</Label>
        <DatePicker
          id="relationshipStartDate"
          value={data.relationshipStartDate}
          onChange={(value) => handleChange("relationshipStartDate", value)}
          placeholder="Tarih seçin"
          className={errors.relationshipStartDate ? "[&>button]:border-destructive" : ""}
        />
        {errors.relationshipStartDate && (
          <p className="text-xs text-destructive">{errors.relationshipStartDate}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Bu tarihten itibaren geçen süre sayfada gösterilecek
        </p>
      </div>

      {/* Subtitle */}
      <div className="space-y-2">
        <Label htmlFor="subtitle">Alt Başlık (Opsiyonel)</Label>
        <Input
          id="subtitle"
          value={data.subtitle}
          onChange={(e) => handleChange("subtitle", e.target.value)}
          placeholder="Birlikte olduğumuz her an bir ömür gibi…"
        />
        <p className="text-xs text-muted-foreground">
          İsimlerinizin altında görünecek romantik mesaj
        </p>
      </div>

      {/* Background Image */}
      <div className="space-y-2">
        <Label htmlFor="backgroundImage">Arka Plan Görseli (Opsiyonel)</Label>
        <Input
          id="backgroundImage"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG veya GIF (Max 5MB). Yüklemezseniz tema rengi kullanılır.
        </p>
        {data.backgroundImage && (
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            <img
              src={data.backgroundImage}
              alt="Önizleme"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => handleChange("backgroundImage", "")}
              className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Theme Selection */}
      <div className="space-y-3">
        <Label>Tema Seçimi</Label>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleChange("theme", theme.id)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all text-center",
                data.theme === theme.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div
                className={cn(
                  "w-full h-8 rounded-lg bg-gradient-to-r mb-2",
                  theme.colors
                )}
              />
              <span className="text-sm font-medium">{theme.name}</span>
              {data.theme === theme.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview Card */}
      <div className="rounded-xl border overflow-hidden">
        <div className="p-4 bg-muted/30">
          <p className="text-xs text-muted-foreground">Önizleme (seçtiğiniz tema):</p>
        </div>

        <div
          className={cn(
            "relative p-6 text-center",
            data.backgroundImage ? "bg-black" : cn("bg-gradient-to-br", selectedTheme.gradient)
          )}
          style={
            data.backgroundImage
              ? {
                  backgroundImage: `url(${data.backgroundImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* overlay */}
          <div
            className={cn(
              "absolute inset-0",
              data.backgroundImage ? "bg-black/55" : "bg-black/25"
            )}
          />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={cn("inline-flex items-center justify-center w-9 h-9 rounded-2xl border border-white/15", selectedTheme.accentBg)}>
                <span className={cn("text-lg", selectedTheme.accent)}>♥</span>
              </span>
              <span className="text-xs text-white/80 tracking-wider uppercase">Dijital Anı Defteri</span>
            </div>

            <p className="text-2xl font-semibold text-white">
              {data.partnerName1 || "İsim 1"}{" "}
              <span className={cn("font-bold", selectedTheme.accent)}>&</span>{" "}
              {data.partnerName2 || "İsim 2"}
            </p>

            <p className="text-sm text-white/85 mt-2">
              {data.subtitle || "Birlikte olduğumuz her an bir ömür gibi…"}
            </p>

            {data.relationshipStartDate && (
              <p className="text-xs text-white/70 mt-4">
                {new Date(data.relationshipStartDate).toLocaleDateString("tr-TR")}'den beri
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
