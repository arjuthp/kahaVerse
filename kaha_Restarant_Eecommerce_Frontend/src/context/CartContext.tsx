import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cartApi } from '../api/cart.api';
import type { Cart, AddToCartDto } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  fetchCart: (businessId?: string) => Promise<void>;
  addItem: (payload: AddToCartDto) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  updateItem: (cartItemId: string, quantity: number, specialInstructions?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async (businessId?: string) => {
    try {
      setLoading(true);
      const data = await cartApi.getCart(businessId);
      setCart(data);
    } catch (err) {
      // Cart may not exist yet
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr?.response?.status === 404) {
        setCart(null);
      } else {
        console.error('Failed to fetch cart:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (payload: AddToCartDto) => {
    try {
      setLoading(true);
      const fullPayload = {
        ...payload,
        userId: 'temp-user-id', // Required by ValidationPipe, backend overrides it
        menuVariantId: payload.menuVariantId || payload.menuId
      };
      // Backend returns { message } not updated cart — re-fetch for accurate itemCount
      await cartApi.addItem(fullPayload as AddToCartDto);
      await fetchCart();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = (axiosErr?.response?.data?.message as string) || 'Failed to add item';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeItem = useCallback(async (cartItemId: string) => {
    try {
      setLoading(true);
      await cartApi.removeItem(cartItemId);
      await fetchCart();
      toast.success('Item removed');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = (axiosErr?.response?.data?.message as string) || 'Failed to remove item';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const updateItem = useCallback(async (cartItemId: string, quantity: number, specialInstructions?: string) => {
    try {
      setLoading(true);
      await cartApi.updateItem(cartItemId, { quantity, specialInstructions });
      await fetchCart();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = (axiosErr?.response?.data?.message as string) || 'Failed to update item';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      setLoading(true);
      await cartApi.clearCart();
      await fetchCart();
      toast.success('Cart cleared');
    } catch (err) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const message = (axiosErr?.response?.data?.message as string) || 'Failed to clear cart';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  // Calculate item count
  const itemCount = cart?.cartItems?.reduce((acc, item) => acc + item.quantity, 0) ?? 0;

  // Calculate cart total — use Number() because API returns prices as strings ("450.00")
  const cartTotal = cart?.cartItems?.reduce((total, item) => {
    const itemPrice = Number(item.menuVariant?.price ?? item.menu.price ?? 0);
    const addonsTotal = item.addOns?.reduce(
      (sum, addon) => sum + Number(addon.addon.price ?? 0) * addon.quantity,
      0,
    ) || 0;
    return total + (itemPrice * item.quantity) + addonsTotal;
  }, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        loading, 
        fetchCart, 
        addItem, 
        removeItem, 
        updateItem, 
        clearCart, 
        itemCount,
        cartTotal 
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

