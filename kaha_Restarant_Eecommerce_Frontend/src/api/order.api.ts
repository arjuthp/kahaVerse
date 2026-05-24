import api from './axios';
import type { Order, CreateOrderDto, CreateOrderFromCartDto, OrderStatusEnum, CreateRatingDto, MenuRating } from '../types';

// Normalizer to map backend shape to frontend interface
function normalizeOrder(order: any): Order {
  if (!order) return order;
  return {
    ...order,
    // Map orderItemsInfo → orderItems
    orderItems: (order.orderItemsInfo || order.orderItems || []).map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      menuNameSnapshot: item.menuNameSnapshot || item.menuName || item.menu?.name || 'Item',
      variantNameSnapshot: item.variantNameSnapshot || item.variantName || undefined,
      unitPriceSnapshot: item.unitPriceSnapshot || item.price || 0,
      lineTotal: item.lineTotal || 0,
      menu: item.menu,
      menuVariant: item.menuVariant,
      addons: (item.addonsInfo || item.addons || []).map((a: any) => ({
        id: a.id,
        quantity: a.quantity,
        addonNameSnapshot: a.addonNameSnapshot || a.name || '',
        priceSnapshot: a.priceSnapshot || a.price || 0,
        addon: a.addon,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })),
    orderStatus: order.orderStatus || [],
  };
}

// ===== ORDER API =====

export const orderApi = {
  // Create order manually (with order items)
  createOrder: async (payload: CreateOrderDto): Promise<Order> => {
    const { data } = await api.post('/order', payload);
    return normalizeOrder(data);
  },

  // Create order from cart (checkout)
  createOrderFromCart: async (payload: CreateOrderFromCartDto): Promise<{ message: string; order?: Order }> => {
    const { data } = await api.post('/order/from-cart', payload);
    return {
      message: data.message,
      order: data.order ? normalizeOrder(data.order) : undefined,
    };
  },

  // Get user's orders
  getUserOrders: async (params?: {
    status?: OrderStatusEnum;
    serviceType?: string;
    page?: number;
    limit?: number;
  }): Promise<Order[]> => {
    const { data } = await api.get('/order/user', { params });
    const list = Array.isArray(data) ? data : data.data || [];
    return list.map(normalizeOrder);
  },

  // Get single order by ID
  getOrderById: async (id: string): Promise<Order> => {
    const { data } = await api.get(`/order/${id}`);
    return normalizeOrder(data);
  },

  // Get business orders (for admin)
  getBusinessOrders: async (
    businessId: string,
    params?: { status?: OrderStatusEnum; page?: number; limit?: number },
  ): Promise<Order[]> => {
    const { data } = await api.get(`/order/business-man-vs/${businessId}`, { params });
    const list = Array.isArray(data) ? data : data.data || [];
    return list.map(normalizeOrder);
  },

  // Update order status
  updateStatus: async (
    orderId: string,
    payload: { status: OrderStatusEnum | string; remarks?: string },
  ): Promise<Order> => {
    const { data } = await api.post(`/order/${orderId}/change-status`, payload);
    return normalizeOrder(data);
  },
};

// ===== RATING API =====

export const ratingApi = {
  // Create a rating
  createRating: async (payload: CreateRatingDto): Promise<MenuRating> => {
    const { data } = await api.post('/menu-ratings', payload);
    return data;
  },

  // Get ratings for a menu item
  getMenuRatings: async (menuId: string): Promise<MenuRating[]> => {
    const { data } = await api.get(`/menu-ratings/menu/${menuId}`);
    return Array.isArray(data) ? data : data.data || [];
  },

  // Get ratings for a business
  getBusinessRatings: async (businessId: string): Promise<MenuRating[]> => {
    const { data } = await api.get(`/menu-ratings/business/${businessId}`);
    return Array.isArray(data) ? data : data.data || [];
  },

  // Get my business ratings (for business admin)
  getMyBusinessRatings: async (): Promise<MenuRating[]> => {
    const { data } = await api.get('/menu-ratings/my-business');
    return Array.isArray(data) ? data : data.data || [];
  },

  // Get single rating
  getRatingById: async (id: string): Promise<MenuRating> => {
    const { data } = await api.get(`/menu-ratings/${id}`);
    return data;
  },

  // Update rating
  updateRating: async (payload: { id: string; rating: number; comments?: string }): Promise<MenuRating> => {
    const { data } = await api.patch('/menu-ratings', payload);
    return data;
  },

  // Delete rating
  deleteRating: async (id: string): Promise<void> => {
    await api.delete(`/menu-ratings/${id}`);
  },

  // Toggle rating visibility (business admin)
  toggleVisibility: async (id: string, isVisible: boolean): Promise<MenuRating> => {
    const { data } = await api.patch(`/menu-ratings/${id}/visibility`, { isVisible });
    return data;
  },
};
