import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyNFC from "./pages/MyNFC";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import RenewSubscription from "./pages/RenewSubscription";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import NFCBusinessCard from "./pages/nfc/BusinessCard";
import NFCPetId from "./pages/nfc/PetId";
import NFCRedirect from "./pages/nfc/Redirect";
import NotFound from "./pages/NotFound";
import Contact from "./pages/Contact";
// Legal Pages
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import RefundPolicy from "./pages/legal/RefundPolicy";
import PreInformationForm from "./pages/legal/PreInformationForm";
import DistanceSalesAgreement from "./pages/legal/DistanceSalesAgreement";
// Admin Pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminOrders from "./pages/admin/Orders";
import AdminProducts from "./pages/admin/Products";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminReviews from "./pages/admin/Reviews";
import AdminSupport from "./pages/admin/Support";
import AdminSettings from "./pages/admin/Settings";

const App = () => (
  <AuthProvider>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<Contact />} />
            {/* Legal Pages */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/pre-information-form" element={<PreInformationForm />} />
            <Route path="/distance-sales-agreement" element={<DistanceSalesAgreement />} />
            {/* Protected Routes - Temporarily without ProtectedRoute wrapper */}
            <Route path="/my-nfc" element={<MyNFC />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/renew-subscription/:nfcId" element={<RenewSubscription />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><AdminSupport /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
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
