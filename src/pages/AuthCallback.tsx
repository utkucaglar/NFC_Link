import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('E-posta doğrulanıyor...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for errors in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || error);
          return;
        }

        // Wait for Supabase to process the URL automatically
        // The SDK will handle tokens in the URL when detectSessionInUrl is true
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setStatus('error');
          setMessage(sessionError.message || 'Doğrulama başarısız');
          return;
        }

        if (session) {
          setStatus('success');
          setMessage('E-postanız doğrulandı! Yönlendiriliyorsunuz...');
          toast.success('E-postanız başarıyla doğrulandı!');
          
          // Clear URL hash for security
          window.history.replaceState(null, '', window.location.pathname);
          
          setTimeout(() => navigate('/'), 1500);
        } else {
          // No session yet, might still be processing
          // Listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setStatus('success');
              setMessage('E-postanız doğrulandı! Yönlendiriliyorsunuz...');
              toast.success('E-postanız başarıyla doğrulandı!');
              window.history.replaceState(null, '', window.location.pathname);
              setTimeout(() => navigate('/'), 1500);
              subscription.unsubscribe();
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (status === 'loading') {
              setStatus('error');
              setMessage('Doğrulama zaman aşımına uğradı. Lütfen tekrar deneyin.');
            }
          }, 10000);
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Bir hata oluştu');
      }
    };

    handleCallback();
  }, [navigate, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-2xl border border-border/50 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Doğrulanıyor</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-green-600">Başarılı!</h1>
              <p className="text-muted-foreground">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-3 text-destructive">Hata</h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline font-medium"
              >
                Giriş sayfasına dön
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
