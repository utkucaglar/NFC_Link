import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading');
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    const checkSession = async () => {
      try {
        // Check URL hash for recovery type and tokens
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        console.log('ResetPassword - Hash params:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });
        
        // If we have tokens in the hash, Supabase needs to process them first
        if (accessToken || refreshToken) {
          // Listen for auth state change to catch PASSWORD_RECOVERY event
          const { data: { sub } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log('ResetPassword - Auth event:', event, 'Has session:', !!newSession);
            
            if (event === 'PASSWORD_RECOVERY' && newSession) {
              setStatus('ready');
              setTimeout(() => {
                window.history.replaceState(null, '', window.location.pathname);
              }, 100);
              if (sub) sub.unsubscribe();
              return;
            }
            
            // Also check if we got a session (might be SIGNED_IN event)
            if (newSession && type === 'recovery') {
              setStatus('ready');
              setTimeout(() => {
                window.history.replaceState(null, '', window.location.pathname);
              }, 100);
              if (sub) sub.unsubscribe();
            }
          });
          subscription = sub;

          // Also check current session after a brief moment
          timeoutId = setTimeout(async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            console.log('ResetPassword - Session check:', { hasSession: !!session, error: sessionError });
            
            if (sessionError) {
              console.error('Session error:', sessionError);
              setStatus('error');
              setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
              if (sub) sub.unsubscribe();
              return;
            }

            if (session) {
              // If we have a session and type is recovery, we're good
              if (type === 'recovery') {
                setStatus('ready');
                setTimeout(() => {
                  window.history.replaceState(null, '', window.location.pathname);
                }, 100);
              } else {
                // Session exists but type is not recovery, might still be valid
                setStatus('ready');
                setTimeout(() => {
                  window.history.replaceState(null, '', window.location.pathname);
                }, 100);
              }
            } else {
              // No session yet, wait a bit more
              setTimeout(() => {
                if (sub) sub.unsubscribe();
                setStatus('error');
                setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
              }, 3000);
            }
          }, 1000);
        } else {
          // No tokens in hash, check existing session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setStatus('error');
            setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
            return;
          }

          if (session) {
            // If we have a session, it might be from a previous recovery attempt
            setStatus('ready');
          } else {
            // No session, listen for recovery event
            const { data: { sub } } = supabase.auth.onAuthStateChange((event, newSession) => {
              if (event === 'PASSWORD_RECOVERY' && newSession) {
                setStatus('ready');
                if (sub) sub.unsubscribe();
              }
            });
            subscription = sub;

            // Timeout after 5 seconds
            timeoutId = setTimeout(() => {
              if (sub) sub.unsubscribe();
              setStatus('error');
              setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen yeni bir şifre sıfırlama talebi oluşturun.');
            }, 5000);
          }
        }
      } catch (err: any) {
        console.error('Reset password check error:', err);
        setStatus('error');
        setError(err.message || 'Bir hata oluştu');
      }
    };

    checkSession();

    // Cleanup
    return () => {
      if (subscription) subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const validateForm = () => {
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      setStatus('success');
      toast.success("Şifreniz başarıyla güncellendi!");
      
      // Clear URL hash for security
      window.history.replaceState(null, '', window.location.pathname);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || "Şifre güncellenemedi. Lütfen tekrar deneyin.");
      toast.error(err.message || "Şifre güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Doğrulanıyor</h1>
            <p className="text-muted-foreground">Şifre sıfırlama bağlantısı kontrol ediliyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-destructive">Hata</h1>
            <p className="text-muted-foreground mb-6">{error || 'Geçersiz veya süresi dolmuş bağlantı'}</p>
            <Button onClick={() => navigate("/login")} variant="outline" className="w-full">
              Giriş sayfasına dön
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
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
            <h1 className="text-2xl font-bold mb-3 text-green-600">Başarılı!</h1>
            <p className="text-muted-foreground mb-6">Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...</p>
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
          <span className="text-2xl font-bold text-gradient">Esdodesign</span>
        </Link>

        {/* Form Card */}
        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Yeni Şifre Belirle</h1>
            <p className="text-muted-foreground">
              Yeni şifrenizi girin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Yeni Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
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
                    setError("");
                  }}
                  className="pl-10 pr-10"
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
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Güncelleniyor...
                </>
              ) : (
                "Şifreyi Güncelle"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Giriş sayfasına dön →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
