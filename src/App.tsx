import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import MyNFC from "./pages/MyNFC";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import NFCBusinessCard from "./pages/nfc/BusinessCard";
import NFCPetId from "./pages/nfc/PetId";
import NFCRedirect from "./pages/nfc/Redirect";
import NotFound from "./pages/NotFound";

const App = () => (
  <AuthProvider>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            {/* Protected Routes - Temporarily without ProtectedRoute wrapper */}
            <Route path="/my-nfc" element={<MyNFC />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            {/* NFC Public Pages */}
            <Route path="/nfc/business/:key" element={<NFCBusinessCard />} />
            <Route path="/nfc/pet/:key" element={<NFCPetId />} />
            <Route path="/nfc/redirect/:key" element={<NFCRedirect />} />
            {/* Demo routes */}
            <Route path="/nfc/demo/business" element={<NFCBusinessCard />} />
            <Route path="/nfc/demo/pet" element={<NFCPetId />} />
            <Route path="/nfc/demo/redirect" element={<NFCRedirect />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </AuthProvider>
);

export default App;
