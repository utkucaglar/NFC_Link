import { useState, useEffect, useRef } from "react";
import { User, Phone, Mail, Briefcase, Building, Linkedin, Instagram, Globe, FileText, Palette, ChevronDown, Loader2, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
  onEmailValidationChange?: (isValidated: boolean, isValid: boolean) => void;
  onErrorClear?: (field: string) => void;
  onErrorSet?: (field: string, message: string) => void;
}

const themes = [
  { id: "default", name: "Klasik", colors: "from-violet-500 to-purple-600" },
  { id: "modern", name: "Modern", colors: "from-blue-500 to-cyan-500" },
  { id: "minimal", name: "Minimal", colors: "from-gray-700 to-gray-900" },
  { id: "gradient", name: "Gradient", colors: "from-pink-500 via-purple-500 to-indigo-500" },
];

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
export const parsePhone = (phone: string) => {
  if (!phone) return { countryCode: "+90", phoneNumber: "" };
  
  // Remove all spaces first
  const cleanPhone = phone.replace(/\s/g, "");
  console.log("parsePhone - input:", phone, "cleaned:", cleanPhone);
  
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
    console.log("parsePhone - countryCode:", countryCode, "afterCountryCode:", afterCountryCode, "phoneNumber:", phoneNumber, "length:", phoneNumber.length);
    return { countryCode, phoneNumber };
  }
  
  // Legacy format with spaces: "+90 123 456 78 90"
  const legacyMatch = phone.match(/^(\+\d+)\s*(.+)$/);
  if (legacyMatch) {
    const phoneNum = legacyMatch[2].replace(/\s/g, "");
    console.log("parsePhone - legacy match:", legacyMatch[1], phoneNum);
    return { countryCode: legacyMatch[1], phoneNumber: phoneNum };
  }
  
  // If no country code found, assume it's just the number (default to Turkey)
  const phoneNum = cleanPhone.replace(/^\+/, "");
  console.log("parsePhone - no match, default:", phoneNum);
  return { countryCode: "+90", phoneNumber: phoneNum };
};

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

export function BusinessCardForm({ data, onChange, errors = {}, onEmailValidationChange, onErrorClear, onErrorSet }: BusinessCardFormProps) {
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState<string | null>(null);
  const [emailValidated, setEmailValidated] = useState(false); // Track if email was successfully validated
  const validationInProgressRef = useRef(false);
  const currentEmailRef = useRef<string>("");
  const emailValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [linkErrors, setLinkErrors] = useState<{ linkedin?: string; instagram?: string; website?: string }>({});

  const { countryCode: initialCountryCode, phoneNumber: initialPhoneNumber } = parsePhone(data.phone);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const isUserTypingPhoneRef = useRef(false);
  const lastPhoneValueRef = useRef(data.phone);

  // Update local state when data.phone changes externally (not from user typing)
  useEffect(() => {
    // Only sync if the change came from outside (not from user typing)
    if (!isUserTypingPhoneRef.current && data.phone !== lastPhoneValueRef.current) {
      const parsed = parsePhone(data.phone);
      setCountryCode(parsed.countryCode);
      setPhoneNumber(parsed.phoneNumber);
      lastPhoneValueRef.current = data.phone;
    }
  }, [data.phone]);

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

  // Cleanup email validation timeout on unmount
  useEffect(() => {
    return () => {
      if (emailValidationTimeoutRef.current) {
        clearTimeout(emailValidationTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (field: keyof BusinessCardData, value: string) => {
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
    handleChange("phone", fullPhone);
    
    // Eğer telefon numarası 10 haneli olduysa hatayı temizle
    if (limitedDigits.length === 10 && errors.phone && onErrorClear) {
      onErrorClear("phone");
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
    handleChange("phone", fullPhone);
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
          onErrorSet("phone", "Lütfen telefon numarasını tam giriniz");
        }
      } else if (errors.phone && onErrorClear) {
        // If phone number is complete, clear any existing errors
        onErrorClear("phone");
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

  const handleNameBlur = () => {
    if (data.name) {
      const titleCasedName = toTitleCase(data.name);
      if (titleCasedName !== data.name) {
        handleChange("name", titleCasedName);
      }
    }
  };

  const handleTitleBlur = () => {
    if (data.title) {
      const titleCasedTitle = toTitleCase(data.title);
      if (titleCasedTitle !== data.title) {
        handleChange("title", titleCasedTitle);
      }
    }
  };

  const validateEmailMX = async (email: string) => {
    // Mark that validation is starting for this email
    const emailToValidate = email.trim();
    currentEmailRef.current = emailToValidate;
    validationInProgressRef.current = true;

    // Clear previous errors
    setEmailValidationError(null);
    setValidatingEmail(false);

    // Empty email - no validation needed
    if (!emailToValidate) {
      validationInProgressRef.current = false;
      return;
    }

    // Basic format check first (synchronous)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      // Check if this validation is still relevant
      if (currentEmailRef.current === emailToValidate && validationInProgressRef.current) {
        setEmailValidationError("Geçersiz email formatı");
        setEmailValidated(false);
        // Notify parent component
        onEmailValidationChange?.(true, false);
      }
      validationInProgressRef.current = false;
      return;
    }

    // Format is valid, now check MX records (async)
    if (currentEmailRef.current === emailToValidate && validationInProgressRef.current) {
      setValidatingEmail(true);
    }

    try {
      const { data: result, error } = await supabase.functions.invoke("validate-email-mx", {
        body: { email: emailToValidate },
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      // Check if this validation is still relevant (user might have typed something else)
      if (currentEmailRef.current !== emailToValidate || !validationInProgressRef.current) {
        return; // User has changed the email, ignore this result
      }

      if (error) {
        console.error("Email validation error:", error);
        setEmailValidationError("Email doğrulama sırasında bir hata oluştu");
        return;
      }

      if (result && !result.valid) {
        setEmailValidationError(result.error || "Bu email adresi geçerli görünmüyor");
        setEmailValidated(false);
        // Notify parent component
        onEmailValidationChange?.(true, false);
      } else if (result && result.valid) {
        setEmailValidationError(null);
        setEmailValidated(true); // Mark as validated only when validation succeeds
        // Notify parent component
        onEmailValidationChange?.(true, true);
      }
    } catch (err: any) {
      // Check if this validation is still relevant
      if (currentEmailRef.current !== emailToValidate || !validationInProgressRef.current) {
        return; // User has changed the email, ignore this error
      }
      console.error("Email validation error:", err);
      setEmailValidationError("Email doğrulama sırasında bir hata oluştu");
      setEmailValidated(false);
      // Notify parent component
      onEmailValidationChange?.(true, false);
    } finally {
      // Only update state if this validation is still relevant
      if (currentEmailRef.current === emailToValidate && validationInProgressRef.current) {
        setValidatingEmail(false);
        validationInProgressRef.current = false;
      }
    }
  };

  const handleEmailFocus = () => {
    setEmailTouched(true);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Only validate when user actually leaves the input (blur event)
    const emailValue = data.email?.trim() || "";
    
    if (emailValue) {
      // User has entered something, validate it
      validateEmailMX(emailValue);
    } else {
      // Empty email
      if (emailTouched) {
        // Eğer input'a bir kez tıklandıysa ve boşsa hata göster
        if (onErrorSet) {
          onErrorSet("email", "E-posta kısmı doldurulmalıdır");
        }
      }
      // Clear validation state
      setEmailValidationError(null);
      setValidatingEmail(false);
      setEmailValidated(false);
      validationInProgressRef.current = false;
      // Notify parent component
      onEmailValidationChange?.(false, false);
    }
  };

  // Validate link format - only allow real LinkedIn/Instagram profiles
  const validateLink = (url: string, type: 'linkedin' | 'instagram' | 'website'): { valid: boolean; error?: string; formattedUrl?: string } => {
    if (!url || !url.trim()) {
      return { valid: false, error: "Link boş olamaz" };
    }

    let formattedUrl = url.trim();

    // Add protocol if missing
    if (!formattedUrl.match(/^https?:\/\//i)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      const urlObj = new URL(formattedUrl);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Type-specific strict validation
      if (type === 'linkedin') {
        // LinkedIn must be exactly linkedin.com or www.linkedin.com
        if (hostname !== 'linkedin.com' && hostname !== 'www.linkedin.com') {
          return { 
            valid: false, 
            error: "Sadece LinkedIn profil linkleri kabul edilir" 
          };
        }
        // LinkedIn profile path should start with /in/ or /company/
        const pathname = urlObj.pathname.toLowerCase();
        if (!pathname.startsWith('/in/') && !pathname.startsWith('/company/')) {
          return { 
            valid: false, 
            error: "Geçerli bir LinkedIn profil linki girin (örn: linkedin.com/in/username veya linkedin.com/company/companyname)" 
          };
        }
      } else if (type === 'instagram') {
        // Instagram must be exactly instagram.com or www.instagram.com
        if (hostname !== 'instagram.com' && hostname !== 'www.instagram.com') {
          return { 
            valid: false, 
            error: "Sadece Instagram profil linkleri kabul edilir" 
          };
        }
        // Instagram profile path should be /username (not empty)
        const pathname = urlObj.pathname.toLowerCase();
        const pathParts = pathname.split('/').filter(p => p);
        if (pathParts.length === 0 || pathname === '/') {
          return { 
            valid: false, 
            error: "Geçerli bir Instagram profil linki girin (örn: instagram.com/username)" 
          };
        }
      }

      return { valid: true, formattedUrl };
    } catch (error) {
      return { valid: false, error: "Geçersiz link formatı. Lütfen doğru bir URL girin" };
    }
  };

  // Handle link blur - validate when user leaves the input
  const handleLinkBlur = (value: string, type: 'linkedin' | 'instagram' | 'website') => {
    if (!value || !value.trim()) {
      // Clear error if empty
      setLinkErrors(prev => ({ ...prev, [type]: undefined }));
      return;
    }

    const validation = validateLink(value, type);
    if (!validation.valid) {
      setLinkErrors(prev => ({ ...prev, [type]: validation.error }));
    } else {
      setLinkErrors(prev => ({ ...prev, [type]: undefined }));
    }
  };

  // Format and open link in new tab
  const formatAndOpenLink = (url: string, type: 'linkedin' | 'instagram' | 'website') => {
    const validation = validateLink(url, type);
    
    if (!validation.valid) {
      toast.error(validation.error || "Geçersiz link");
      return;
    }

    // Open in new tab
    window.open(validation.formattedUrl, '_blank', 'noopener,noreferrer');
    toast.success("Link yeni sekmede açıldı");
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
                onBlur={handleNameBlur}
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
                onBlur={handleTitleBlur}
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
                errors.phone && "border-destructive"
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
                    id="bc-phone"
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
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            {!errors.phone && phoneNumber && phoneNumber.length < 10 && (
              <p className="text-xs text-muted-foreground">
                
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-email">E-posta *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                id="bc-email"
                type="text"
                inputMode="email"
                placeholder="ahmet@sirket.com"
                value={data.email}
                onChange={(e) => {
                  const newValue = e.target.value;
                  
                  // Cancel any ongoing validation and timeout
                  if (emailValidationTimeoutRef.current) {
                    clearTimeout(emailValidationTimeoutRef.current);
                    emailValidationTimeoutRef.current = null;
                  }
                  currentEmailRef.current = newValue.trim();
                  validationInProgressRef.current = false;
                  
                  // Update the email value
                  handleChange("email", newValue);
                  
                  // Eğer email yazılıyorsa ve boş değilse hatayı temizle
                  if (newValue.trim() && errors.email && onErrorClear) {
                    onErrorClear("email");
                  }
                  
                  // Clear validation states initially
                  setEmailValidationError(null);
                  setValidatingEmail(false);
                  setEmailValidated(false);
                  onEmailValidationChange?.(false, false);
                  
                  // Anlık kontrol: @ ve sonrasında . varsa email formatını kontrol et
                  const trimmedValue = newValue.trim();
                  if (trimmedValue) {
                    const atIndex = trimmedValue.indexOf('@');
                    if (atIndex > 0 && atIndex < trimmedValue.length - 1) {
                      const afterAt = trimmedValue.substring(atIndex + 1);
                      const dotIndex = afterAt.indexOf('.');
                      
                      // @ sonrasında . varsa format kontrolü yap
                      if (dotIndex > 0 && dotIndex < afterAt.length - 1) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (emailRegex.test(trimmedValue)) {
                          // Format geçerli, debounce ile MX doğrulamasını başlat
                          emailValidationTimeoutRef.current = setTimeout(() => {
                            validateEmailMX(trimmedValue);
                          }, 500); // 500ms debounce
                        } else {
                          // Format geçersiz
                          setEmailValidationError("Geçersiz email formatı");
                          onEmailValidationChange?.(true, false);
                        }
                      }
                    }
                  }
                }}
                onFocus={handleEmailFocus}
                onBlur={handleEmailBlur}
                autoComplete="email"
                className={cn(
                  "pl-10 pr-10",
                  errors.email && "border-destructive",
                  emailValidationError && "border-destructive",
                  emailValidated && !validatingEmail && "border-green-500"
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validatingEmail && (
                  <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                )}
                {!validatingEmail && emailValidated && !emailValidationError && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {!validatingEmail && emailValidationError && (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            {emailValidationError && !errors.email && (
              <p className="text-xs text-destructive">{emailValidationError}</p>
            )}
            {emailValidated && !validatingEmail && !emailValidationError && (
              <p className="text-xs text-green-600">Email adresi doğrulandı</p>
            )}
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bc-linkedin"
                  placeholder="linkedin.com/in/ahmetyilmaz"
                  value={data.linkedin}
                  onChange={(e) => {
                    handleChange("linkedin", e.target.value);
                    // Clear error when user types
                    if (linkErrors.linkedin) {
                      setLinkErrors(prev => ({ ...prev, linkedin: undefined }));
                    }
                  }}
                  onBlur={() => handleLinkBlur(data.linkedin, 'linkedin')}
                  className={cn("pl-10", linkErrors.linkedin && "border-destructive")}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => formatAndOpenLink(data.linkedin, 'linkedin')}
                className="shrink-0 gap-2"
                title="Linki kontrol et ve yeni sekmede aç"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs">Kontrol Et</span>
              </Button>
            </div>
            {linkErrors.linkedin && (
              <p className="text-xs text-destructive">{linkErrors.linkedin}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-instagram">Instagram</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bc-instagram"
                  placeholder="instagram.com/ahmet.dev"
                  value={data.instagram}
                  onChange={(e) => {
                    handleChange("instagram", e.target.value);
                    // Clear error when user types
                    if (linkErrors.instagram) {
                      setLinkErrors(prev => ({ ...prev, instagram: undefined }));
                    }
                  }}
                  onBlur={() => handleLinkBlur(data.instagram, 'instagram')}
                  className={cn("pl-10", linkErrors.instagram && "border-destructive")}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => formatAndOpenLink(data.instagram, 'instagram')}
                className="shrink-0 gap-2"
                title="Linki kontrol et ve yeni sekmede aç"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs">Kontrol Et</span>
              </Button>
            </div>
            {linkErrors.instagram && (
              <p className="text-xs text-destructive">{linkErrors.instagram}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bc-website">Website</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="bc-website"
                  placeholder="ahmetyilmaz.dev"
                  value={data.website}
                  onChange={(e) => {
                    handleChange("website", e.target.value);
                    // Clear error when user types
                    if (linkErrors.website) {
                      setLinkErrors(prev => ({ ...prev, website: undefined }));
                    }
                  }}
                  onBlur={() => handleLinkBlur(data.website, 'website')}
                  className={cn("pl-10", linkErrors.website && "border-destructive")}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => formatAndOpenLink(data.website, 'website')}
                className="shrink-0 gap-2"
                title="Linki kontrol et ve yeni sekmede aç"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="text-xs">Kontrol Et</span>
              </Button>
            </div>
            {linkErrors.website && (
              <p className="text-xs text-destructive">{linkErrors.website}</p>
            )}
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
