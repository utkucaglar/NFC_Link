import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Start countdown when verification screen is shown
  useEffect(() => {
    if (showVerification) {
      setResendCountdown(60); // 60 saniye (Supabase güvenlik sınırı)
    }
  }, [showVerification]);

  // Supabase hata mesajlarını Türkçeye çevir
  const translateError = (message: string): string => {
    const translations: { [key: string]: string } = {
      "For security purposes, you can only request this after": "Güvenlik nedeniyle, bu işlemi ancak",
      "seconds": "saniye sonra yapabilirsiniz",
      "Invalid login credentials": "Geçersiz e-posta veya şifre",
      "Email not confirmed": "E-posta adresi henüz doğrulanmamış",
      "User already registered": "Bu e-posta adresi zaten kayıtlı",
      "Password should be at least 6 characters": "Şifre en az 6 karakter olmalıdır",
      "Unable to validate email address: invalid format": "Geçersiz e-posta formatı",
      "Email rate limit exceeded": "Çok fazla istek gönderildi. Lütfen bekleyin.",
      "Signup requires a valid password": "Geçerli bir şifre giriniz",
    };

    // Tam eşleşme kontrolü
    if (translations[message]) {
      return translations[message];
    }

    // Kısmi eşleşme kontrolü (örn: "For security purposes, you can only request this after 26 seconds")
    for (const [eng, tr] of Object.entries(translations)) {
      if (message.toLowerCase().includes(eng.toLowerCase())) {
        // Sayıyı çıkar ve Türkçe mesaj oluştur
        const match = message.match(/(\d+)/);
        if (match && eng.includes("security purposes")) {
          return `Güvenlik nedeniyle, bu işlemi ancak ${match[1]} saniye sonra yapabilirsiniz`;
        }
        return tr;
      }
    }

    return message;
  };

  const handleResendEmail = async () => {
    if (resendCountdown > 0 || resendLoading) return;
    
    setResendLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      // Supabase'in resend fonksiyonu email confirmation disabled olduğu için çalışmayabilir
      // Alternatif: Resend ile direkt email gönder
      // Ama confirmation token'ını alamayız, bu yüzden kullanıcıyı tekrar kayıt etmek gerekir
      
      // Şimdilik: Supabase'in resend fonksiyonunu kullan
      // Email confirmation disabled ise bu çalışmayabilir
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        }
      });

      if (error) throw error;

      toast.success("Doğrulama e-postası tekrar gönderildi!");
      setResendCountdown(60); // 60 saniye beklet
    } catch (error: any) {
      console.error('Resend error:', error);
      const turkishMessage = translateError(error.message || "E-posta gönderilemedi. Lütfen tekrar deneyin.");
      toast.error(turkishMessage);
      
      // Eğer rate limit hatası varsa, kalan süreyi parse et ve countdown'u ayarla
      const match = error.message?.match(/(\d+)\s*seconds?/i);
      if (match) {
        setResendCountdown(parseInt(match[1]));
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail || !forgotPasswordEmail.includes('@')) {
      toast.error("Geçerli bir e-posta adresi girin");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      await resetPassword(forgotPasswordEmail);
      setShowForgotPassword(false);
      setForgotPasswordEmail("");
    } catch (error) {
      // Error is already handled in auth context
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!isLogin) {
      if (!firstName.trim()) {
        newErrors.firstName = "İsim gereklidir";
      }
      if (!lastName.trim()) {
        newErrors.lastName = "Soyisim gereklidir";
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Şifreler eşleşmiyor";
      }
      if (password.length < 6) {
        newErrors.password = "Şifre en az 6 karakter olmalıdır";
      }
    }
    
    if (!email.includes('@')) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        // Redirect parametresine göre yönlendir
        navigate(redirectTo);
      } else {
        await signUp(email, password, firstName, lastName);
        setShowVerification(true);
        setPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      // Error is already handled in auth context
    } finally {
      setLoading(false);
    }
  };

  // Email verification screen
  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">N</span>
            </div>
            <span className="text-2xl font-bold text-gradient">Esdodesign</span>
          </Link>

          <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold mb-3">E-postanızı Doğrulayın</h1>
            
            <p className="text-muted-foreground mb-2">
              Hesabınız başarıyla oluşturuldu!
            </p>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                {email}
              </p>
              <p className="text-sm text-muted-foreground">
                Yukarıdaki adrese bir doğrulama e-postası gönderdik. Lütfen e-postanızı kontrol edin ve hesabınızı aktifleştirmek için bağlantıya tıklayın.
              </p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <p>✓ Gelen kutunuzu kontrol edin</p>
              <p>✓ Spam/Junk klasörünü kontrol edin</p>
              <p>✓ Doğrulama linkine tıklayın</p>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-4">
                E-posta almadınız mı?
              </p>
              <Button
                variant="outline"
                className="w-full mb-3"
                onClick={handleResendEmail}
                disabled={resendCountdown > 0 || resendLoading}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : resendCountdown > 0 ? (
                  <>Tekrar Gönder ({resendCountdown}s)</>
                ) : (
                  <>Tekrar Gönder</>
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowVerification(false);
                  setIsLogin(true);
                  setEmail("");
                  setFirstName("");
                  setLastName("");
                  setConfirmPassword("");
                  setResendCountdown(0);
                }}
              >
                Giriş Sayfasına Dön
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
            <img 
              src="/esdodesign_logo.png" 
              alt="Esdodesign Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-gradient">Esdodesign</span>
        </Link>

        {/* Form Card */}
        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? "Hoş Geldiniz" : "Hesap Oluştur"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? "Hesabınıza giriş yapın"
                : "Yeni hesap oluşturun"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">İsim</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="İsim"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setErrors({...errors, firstName: ''});
                        }}
                        className={`pl-10 ${errors.firstName ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Soyisim</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Soyisim"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setErrors({...errors, lastName: ''});
                        }}
                        className={`pl-10 ${errors.lastName ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors({...errors, email: ''});
                  }}
                  className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors({...errors, password: ''});
                  }}
                  className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre Doğrulama</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors({...errors, confirmPassword: ''});
                    }}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Şifremi Unuttum
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading
                ? "Yükleniyor..."
                : isLogin
                ? "Giriş Yap"
                : "Hesap Oluştur"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Hesabınız yok mu?" : "Zaten hesabınız var mı?"}{" "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPassword("");
                  setConfirmPassword("");
                  setErrors({});
                }}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Kayıt Ol" : "Giriş Yap"}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Misafir olarak devam et →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Şifremi Unuttum</DialogTitle>
            <DialogDescription>
              E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleForgotPassword();
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotPasswordEmail("");
              }}
              disabled={forgotPasswordLoading}
            >
              İptal
            </Button>
            <Button
              onClick={handleForgotPassword}
              disabled={forgotPasswordLoading || !forgotPasswordEmail}
            >
              {forgotPasswordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Gönder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
