import { useState, useEffect, useRef } from "react";
import { PawPrint, User, Phone, MapPin, Heart, Hash, Palette, Upload, X, Image, ChevronDown } from "lucide-react";
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
  onErrorClear?: (field: string) => void;
  onErrorSet?: (field: string, message: string) => void;
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
  console.log("parsePhone (PetId) - input:", phone, "cleaned:", cleanPhone);
  
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
    console.log("parsePhone (PetId) - countryCode:", countryCode, "afterCountryCode:", afterCountryCode, "phoneNumber:", phoneNumber, "length:", phoneNumber.length);
    return { countryCode, phoneNumber };
  }
  
  // Legacy format with spaces: "+90 123 456 78 90"
  const legacyMatch = phone.match(/^(\+\d+)\s*(.+)$/);
  if (legacyMatch) {
    const phoneNum = legacyMatch[2].replace(/\s/g, "");
    console.log("parsePhone (PetId) - legacy match:", legacyMatch[1], phoneNum);
    return { countryCode: legacyMatch[1], phoneNumber: phoneNum };
  }
  
  // If no country code found, assume it's just the number (default to Turkey)
  const phoneNum = cleanPhone.replace(/^\+/, "");
  console.log("parsePhone (PetId) - no match, default:", phoneNum);
  return { countryCode: "+90", phoneNumber: phoneNum };
};

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

export function PetIdForm({ data, onChange, errors = {}, onErrorClear, onErrorSet }: PetIdFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(data.petImage || null);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const { countryCode: initialCountryCode, phoneNumber: initialPhoneNumber } = parsePhone(data.ownerPhone);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const isUserTypingPhoneRef = useRef(false);
  const lastPhoneValueRef = useRef(data.ownerPhone);

  // Update local state when data.ownerPhone changes externally (not from user typing)
  useEffect(() => {
    // Only sync if the change came from outside (not from user typing)
    if (!isUserTypingPhoneRef.current && data.ownerPhone !== lastPhoneValueRef.current) {
      const parsed = parsePhone(data.ownerPhone);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      lastPhoneValueRef.current = data.ownerPhone;
    }
  }, [data.ownerPhone]);

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

  const handleChange = (field: keyof PetIdData, value: string) => {
    onChange({ ...data, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field] && onErrorClear) {
      onErrorClear(field);
    }
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
    handleChange("ownerPhone", fullPhone);
    
    // Eğer telefon numarası 10 haneli olduysa hatayı temizle
    if (limitedDigits.length === 10 && errors.ownerPhone && onErrorClear) {
      onErrorClear("ownerPhone");
    }
    
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
    handleChange("ownerPhone", fullPhone);
  };

  const handlePhoneNumberFocus = () => {
    setPhoneTouched(true);
  };

  const handlePhoneNumberBlur = () => {
    // Eğer input'a bir kez tıklandıysa (touched) ve telefon numarası boşsa veya eksikse hata göster
    if (phoneTouched) {
      // phoneNumber state'i zaten sadece rakamları içeriyor (country code olmadan), direkt uzunluk kontrolü yap
      if (!phoneNumber || phoneNumber.length !== 10) {
        if (onErrorSet) {
          onErrorSet("ownerPhone", "Lütfen telefon numarasını tam giriniz");
        }
      } else if (errors.ownerPhone && onErrorClear) {
        // If phone number is complete, clear any existing errors
        onErrorClear("ownerPhone");
      }
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === countryCode) || countryCodes[0];

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

  const handleOwnerNameBlur = () => {
    if (data.ownerName) {
      const titleCasedName = toTitleCase(data.ownerName);
      if (titleCasedName !== data.ownerName) {
        handleChange("ownerName", titleCasedName);
      }
    }
  };

  const handlePetNameBlur = () => {
    if (data.petName) {
      const titleCasedName = toTitleCase(data.petName);
      if (titleCasedName !== data.petName) {
        handleChange("petName", titleCasedName);
      }
    }
  };

  const handleMicrochipChange = (value: string) => {
    // Sadece rakamları kabul et
    const digitsOnly = value.replace(/\D/g, "");
    // Maksimum 15 hane
    const limitedDigits = digitsOnly.slice(0, 15);
    handleChange("microchipNumber", limitedDigits);
    
    // Eğer 15 haneli olduysa hatayı temizle
    if (limitedDigits.length === 15 && errors.microchipNumber && onErrorClear) {
      onErrorClear("microchipNumber");
    }
  };

  const handleMicrochipBlur = () => {
    // Eğer input boşsa hata verme
    if (!data.microchipNumber || data.microchipNumber.trim().length === 0) {
      if (errors.microchipNumber && onErrorClear) {
        onErrorClear("microchipNumber");
      }
      return;
    }
    
    // Eğer 0-14 hane arasındaysa hata göster
    const digitsOnly = data.microchipNumber.replace(/\D/g, "");
    if (digitsOnly.length > 0 && digitsOnly.length < 15) {
      if (onErrorSet) {
        onErrorSet("microchipNumber", "Mikroçip numarası 15 haneli olmalıdır");
      }
    } else if (digitsOnly.length === 15) {
      // 15 hane ise hatayı temizle
      if (errors.microchipNumber && onErrorClear) {
        onErrorClear("microchipNumber");
      }
    }
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
              onBlur={handlePetNameBlur}
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
                onBlur={handleOwnerNameBlur}
                className={cn("pl-10", errors.ownerName && "border-destructive")}
              />
            </div>
            {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-phone">Sahibi Telefon Numarası *</Label>
            <div className="relative country-selector-container">
              {/* Hidden select for form submission */}
              <select
                value={countryCode}
                onChange={(e) => handleCountryCodeChange(e.target.value)}
                className="sr-only"
                aria-hidden="true"
                tabIndex={-1}
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
                errors.ownerPhone && "border-destructive"
              )}>
                {/* Country Code Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 h-10 border-r border-input",
                      "hover:bg-muted/50 transition-colors",
                      "focus:outline-none"
                    )}
                  >
                    <img 
                      src={getFlagUrl(selectedCountry.isoCode)}
                      alt={selectedCountry.country}
                      className="w-5 h-4 object-cover rounded-sm"
                      onError={(e) => {
                        // Fallback: eğer resim yüklenemezse boş göster
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm font-medium">{selectedCountry.code}</span>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform",
                      isCountryDropdownOpen && "rotate-180"
                    )} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {isCountryDropdownOpen && (
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
                                // Fallback: eğer resim yüklenemezse boş göster
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
                    id="owner-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="123 456 78 90"
                    value={formatPhoneNumber(phoneNumber)}
                    onChange={(e) => handlePhoneNumberChange(e.target.value)}
                    onFocus={handlePhoneNumberFocus}
                    onBlur={handlePhoneNumberBlur}
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
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    maxLength={14} // "123 456 78 90" = 14 chars
                  />
                </div>
              </div>
            </div>
            {errors.ownerPhone && <p className="text-xs text-destructive">{errors.ownerPhone}</p>}
            {!errors.ownerPhone && phoneNumber && phoneNumber.length < 10 && (
              <p className="text-xs text-muted-foreground">
                
              </p>
            )}
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
              type="text"
              inputMode="numeric"
              placeholder="982000123456789"
              value={data.microchipNumber}
              onChange={(e) => handleMicrochipChange(e.target.value)}
              onBlur={handleMicrochipBlur}
              maxLength={15}
              className={cn("pl-10", errors.microchipNumber && "border-destructive")}
            />
          </div>
          {errors.microchipNumber && <p className="text-xs text-destructive">{errors.microchipNumber}</p>}
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
