import { ReactNode } from "react";
import * as React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  // Show loading only for a maximum of 3 seconds
  const [showLoading, setShowLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 3000);

    if (!loading) {
      setShowLoading(false);
    }

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && showLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Erişim Reddedildi</h1>
          <p className="text-muted-foreground mb-6">
            Bu sayfaya erişmek için admin yetkisine sahip olmanız gerekiyor.
          </p>
          <Navigate to="/" replace />
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
