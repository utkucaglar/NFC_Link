import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Menu, X, Wifi, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

// Müşteri için navigasyon linkleri
const customerNavItems = [
  { name: "Anasayfa", path: "/" },
  { name: "Ürünler", path: "/products" },
  { name: "NFC'lerim", path: "/my-nfc" },
  { name: "Siparişlerim", path: "/orders" },
  { name: "Destek", path: "/contact" },
];

// Admin için navigasyon linkleri (sepet, NFC'lerim, siparişlerim yok)
const adminNavItems = [
  { name: "Anasayfa", path: "/" },
  { name: "Ürünler", path: "/products" },
  { name: "Destek", path: "/contact" },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { cartItemCount } = useCart();
  const { user, profile, signOut, isAuthenticated, isAdmin } = useAuth();
  
  // Admin mi customer mı buna göre nav items seç
  const navItems = isAdmin() ? adminNavItems : customerNavItems;

  const handleLogout = async () => {
    try {
      await signOut();
      setIsOpen(false);
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      setIsOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Wifi className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient">Esdodesign</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Cart Button - Admin için gizle */}
            {!isAdmin() && (
              <Link to="/cart" className="relative">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 gradient-primary rounded-full text-xs text-primary-foreground flex items-center justify-center font-semibold">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Auth Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated() ? (
                <>
                  {profile?.role === 'admin' && (
                    <Link to="/admin">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      {profile?.first_name && profile?.last_name
                        ? `${profile.first_name} ${profile.last_name}`
                        : profile?.full_name || user?.email?.split('@')[0]}
                      {profile?.role === 'admin' && (
                        <span className="ml-1 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                          Admin
                        </span>
                      )}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    title="Çıkış Yap"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="hero" size="sm">
                    Giriş Yap
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.nav
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated() ? (
              <>
                {profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full mt-2 justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  </Link>
                )}
                <Link to="/profile" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" className="w-full mt-2 justify-start">
                    <User className="w-4 h-4 mr-2" />
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile?.full_name || user?.email?.split('@')[0]}
                    {profile?.role === 'admin' && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                        Admin
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <Button variant="hero" className="w-full mt-2">
                  Giriş Yap
                </Button>
              </Link>
            )}
          </div>
        </motion.nav>
      )}
    </motion.header>
  );
}
