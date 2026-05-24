import api from './axios';
import type { Cart, AddToCartDto } from '../types';

// Backend returns cartItemsInfo — normalize to cartItems so all frontend consumers work
function normalizeCart(data: any): Cart {
  const items = data.cartItemsInfo || data.cartItems || [];
  // Backend omits top-level businessId — derive from first item's menu or fall back to env
  const derivedBusinessId =
    data.businessId ||
    items[0]?.menu?.businessId ||
    import.meta.env.VITE_BUSINESS_ID ||
    '';
  return {
    id: data.id,
    userId: data.userId,
    businessId: derivedBusinessId,
    cartItems: (data.cartItemsInfo || data.cartItems || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      // backend gives itemTotal + quantity, so derive unit price
      unitPriceSnapshot: item.unitPriceSnapshot ?? (item.quantity > 0 ? item.itemTotal / item.quantity : item.menu?.price ?? 0),
      specialInstructions: item.specialInstructions,
      menu: {
        id: item.menuId || item.id,
        name: item.name || item.menu?.name || 'Item',
        image: item.menu?.image ?? (item.menu?.images?.[0] ?? null),
        price: item.menu?.price ?? 0,
        businessId: data.businessId || '',
        isAvailable: true,
        isSignature: false,
      },
      menuVariant: item.variantName
        ? { id: '', name: item.variantName, price: 0, isAvailable: true }
        : undefined,
      addOns: (item.addOns || []).map((addon: any) => ({
        id: addon.id || '',
        quantity: addon.quantity || 1,
        addon: {
          id: addon.id || '',
          name: addon.name || '',
          price: addon.unitPriceSnapshot ?? addon.price ?? 0,
          isActive: true,
        },
      })),
    })),
  };
}

export const cartApi = {
  // Create a new cart
  createCart: async (): Promise<Cart> => {
    const { data } = await api.post('/cart');
    return normalizeCart(data);
  },

  // Get user's cart
  getCart: async (businessId?: string): Promise<Cart> => {
    const params = businessId ? { businessId } : {};
    const { data } = await api.get('/cart', { params });
    return normalizeCart(data);
  },

  // Add item to cart — backend only returns { message }, not cart
  addItem: async (payload: AddToCartDto): Promise<void> => {
    await api.post('/cart/item', payload);
  },

  // Update cart item quantity
  updateItem: async (
    itemId: string,
    payload: { quantity: number; specialInstructions?: string },
  ): Promise<Cart> => {
    const { data } = await api.patch(`/cart/${itemId}`, payload);
    return normalizeCart(data);
  },

  // Remove item from cart
  removeItem: async (itemId: string): Promise<void> => {
    await api.delete(`/cart/${itemId}`);
  },

  // Clear entire cart (delete all items)
  clearCart: async (cartId: string): Promise<void> => {
    await api.delete(`/cart/${cartId}`);
  },
};
