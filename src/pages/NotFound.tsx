import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="text-center max-w-md">
        <h1 className="mb-4 text-6xl font-bold text-gradient">404</h1>
        <p className="mb-2 text-xl font-semibold">Sayfa Bulunamadı</p>
        <p className="mb-6 text-muted-foreground">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <Link to="/">
          <Button variant="hero" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
