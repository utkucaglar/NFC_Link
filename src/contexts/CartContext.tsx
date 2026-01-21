import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: number;
  productId?: number; // Database product ID
  name: string;
  price: number;
  image: string;
  quantity: number;
  customization?: Record<string, any>;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  updateCustomization: (id: number, customization: Record<string, any>) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      // Aynı ürün ve aynı özelleştirme varsa miktarı artır
      const existingIndex = prev.findIndex(
        (cartItem) =>
          cartItem.id === item.id &&
          JSON.stringify(cartItem.customization) === JSON.stringify(item.customization)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += 1;
        toast.success(`${item.name} sepete eklendi`);
        return updated;
      }

      // Yeni ürün ekle
      toast.success(`${item.name} sepete eklendi`);
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: number) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        toast.success(`${item.name} sepetten çıkarıldı`);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number) => {
    if (quantity < 1) return;
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const updateCustomization = useCallback((id: number, customization: Record<string, any>) => {
    setCartItems((prev) =>
      prev.map((item) => 
        item.id === id 
          ? { ...item, customization: { ...item.customization, ...customization } }
          : item
      )
    );
    toast.success("Kişiselleştirme güncellendi");
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    toast.success("Sepet temizlendi");
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCustomization,
        clearCart,
        cartItemCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
