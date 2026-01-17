import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/");
      } else {
        await signUp(email, password, fullName);
        setShowVerification(true);
        setPassword("");
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
            <span className="text-2xl font-bold text-gradient">NFCLink</span>
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
                onClick={() => {
                  // TODO: Resend verification email
                  console.log("Resend verification email");
                }}
              >
                Tekrar Gönder
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowVerification(false);
                  setIsLogin(true);
                  setEmail("");
                  setFullName("");
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
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">N</span>
          </div>
          <span className="text-2xl font-bold text-gradient">NFCLink</span>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Ad Soyad"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="ornek@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
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
            </div>

            {isLogin && (
              <div className="flex items-center justify-end">
                <button
                  type="button"
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
    </div>
  );
}
