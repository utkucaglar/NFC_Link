import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2 } from "lucide-react";

interface RedirectData {
  targetUrl: string;
  showSplash: boolean;
  splashDuration: number;
  title?: string;
}

const sampleData: RedirectData = {
  targetUrl: "https://github.com/ahmetyilmaz",
  showSplash: true,
  splashDuration: 3,
  title: "Portfolio'ma Yönlendiriliyorsunuz"
};

export default function NFCRedirect() {
  const data = sampleData;
  const [countdown, setCountdown] = useState(data.splashDuration);

  useEffect(() => {
    if (!data.showSplash) {
      window.location.href = data.targetUrl;
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = data.targetUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  if (!data.showSplash) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-card rounded-3xl shadow-2xl p-8">
          {/* Animated Circle */}
          <div className="relative w-32 h-32 mx-auto mb-8">
            <svg className="w-32 h-32 -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-muted"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="58"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDasharray: "364", strokeDashoffset: "364" }}
                animate={{ strokeDashoffset: 364 - (364 * (data.splashDuration - countdown)) / data.splashDuration }}
                transition={{ duration: 1, ease: "linear" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" />
                  <stop offset="100%" stopColor="hsl(262, 83%, 70%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gradient">{countdown}</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">{data.title || "Yönlendiriliyor..."}</h1>
          
          <p className="text-muted-foreground mb-6">
            {countdown} saniye içinde otomatik olarak yönlendirileceksiniz
          </p>

          <a
            href={data.targetUrl}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Hemen git
          </a>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Powered by <span className="text-gradient font-semibold">NFCLink</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
