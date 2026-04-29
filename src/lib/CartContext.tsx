import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { toast } from 'sonner';

export interface CartItem {
  product: Product;
  variantId?: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, variantId?: string, quantity?: number) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('wellspring_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('wellspring_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, variantId?: string, quantity: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variantId === variantId);
      if (existing) {
        toast.success(`Increased ${product.name} quantity in cart!`);
        return prev.map(item => 
          (item.product.id === product.id && item.variantId === variantId)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success(`${product.name} added to cart!`);
      return [...prev, { product, variantId, quantity }];
    });
  };

  const removeFromCart = (productId: string, variantId?: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === productId && item.variantId === variantId)));
    toast.success('Item removed from cart');
  };

  const updateQuantity = (productId: string, variantId: string | undefined, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId, variantId);
    setCartItems(prev => prev.map(item => 
      (item.product.id === productId && item.variantId === variantId) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  
  const cartTotal = cartItems.reduce((acc, item) => {
    let price = Number(item.product.price) || 0;
    if (item.variantId && item.product.variants) {
      const variant = item.product.variants.find(v => v.id === item.variantId);
      if (variant) {
        price = variant.discountPrice || variant.price;
      }
    }
    return acc + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
