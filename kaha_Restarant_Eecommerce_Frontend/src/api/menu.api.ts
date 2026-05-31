import api from './axios';
import type { Category, Menu, MenuVariant, AddonGroup } from '../types';

// ===== CATEGORY API =====

export const categoryApi = {
  getByBusiness: async (businessId: string): Promise<Category[]> => {
    try {
      const { data } = await api.get(`/categories/business/${businessId}`);
      return data;
    } catch {
      // Backend doesn't have categories, mock them
      return [
        { id: 'cat-1', name: 'Nepali', isActive: true, position: 1, businessId },
        { id: 'cat-2', name: 'Fusion', isActive: true, position: 2, businessId },
        { id: 'cat-3', name: 'Western', isActive: true, position: 3, businessId },
        { id: 'cat-4', name: 'Snacks', isActive: true, position: 4, businessId },
        { id: 'cat-5', name: 'Desserts', isActive: true, position: 5, businessId },
        { id: 'cat-6', name: 'Drinks', isActive: true, position: 6, businessId },
      ];
    }
  },

  getById: async (id: string): Promise<Category> => {
    const { data } = await api.get(`/categories/${id}`);
    return data;
  },

  create: async (payload: {
    name: string;
    businessId: string;
    description?: string;
    parentId?: string;
    icon?: string;
    isActive?: boolean;
    position?: number;
  }): Promise<Category> => {
    const { data } = await api.post('/categories', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Category>): Promise<Category> => {
    const { data } = await api.patch(`/categories/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },

  // Wrapper functions for admin page compatibility
  getCategories: async (params: string | { businessId: string }): Promise<{ data: Category[] }> => {
    const businessId = typeof params === 'string' ? params : params.businessId;
    const list = await categoryApi.getByBusiness(businessId);
    return { data: list };
  },

  createCategory: async (payload: any): Promise<{ data: Category }> => {
    const category = await categoryApi.create(payload);
    return { data: category };
  },

  updateCategory: async (id: string, payload: any): Promise<{ data: Category }> => {
    const category = await categoryApi.update(id, payload);
    return { data: category };
  },

  deleteCategory: async (id: string): Promise<void> => {
    return categoryApi.delete(id);
  },
};

const categoryMap: Record<string, string> = {
  'Nepali': 'cat-1',
  'Fusion': 'cat-2',
  'Western': 'cat-3',
  'Snacks': 'cat-4',
  'Desserts': 'cat-5',
  'Drinks': 'cat-6',
};

// ===== MENU API =====

export const menuApi = {
  // Wrapper for getByBusiness to return {data: ...}
  getMenus: async (params: {businessId: string; categoryId?: string; isSignature?: boolean; isAvailable?: boolean; search?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number;}): Promise<{data: Menu[]}> => {
    const menus = await menuApi.getByBusiness(params.businessId, params);
    return {data: menus};
  },

  // Wrapper for create
  createMenu: async (payload: any): Promise<{data: Menu}> => {
    const menu = await menuApi.create(payload);
    return {data: menu};
  },

  // Wrapper for update
  updateMenu: async (id: string, payload: any): Promise<{data: Menu}> => {
    const menu = await menuApi.update(id, payload);
    return {data: menu};
  },

  // Wrapper for delete
  deleteMenu: async (id: string): Promise<void> => {
    return await menuApi.delete(id);
  },

  getByBusiness: async (
    businessId: string,
    params?: {
      categoryId?: string;
      isSignature?: boolean;
      isAvailable?: boolean;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      limit?: number;
    },
  ): Promise<Menu[]> => {
    try {
      const { data } = await api.get(`/menu/business/${businessId}`, { params });
      const items = Array.isArray(data) ? data : data.data || [];
      return items.map((item: any) => {
        const actualCategory = typeof item.category === 'object' ? item.category : null;
        const resolvedCatId = item.categoryId || actualCategory?.id || 'cat-1';
        return {
          ...item,
          id: item._id || item.id,
          isAvailable: item.isAvailable ?? item.is_available ?? true,
          image: item.image_url || item.image || item.images?.[0],
          categoryId: resolvedCatId,
          category: actualCategory || { id: resolvedCatId, name: item.category || 'General', isActive: true, position: 1, businessId }
        };
      });
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      return [];
    }
  },

  getById: async (id: string): Promise<Menu> => {
    const { data } = await api.get(`/menu/${id}`);
    const actualCategory = typeof data.category === 'object' ? data.category : null;
    const resolvedCatId = data.categoryId || actualCategory?.id || 'cat-1';
    return {
      ...data,
      id: data._id || data.id,
      isAvailable: data.isAvailable ?? data.is_available ?? true,
      image: data.image_url || data.image || data.images?.[0],
      categoryId: resolvedCatId,
      category: actualCategory || { id: resolvedCatId, name: data.category || 'General', isActive: true, position: 1, businessId: 'biz-mock-001' }
    };
  },

  create: async (payload: {
    name: string;
    description?: string;
    price: number;
    discountedPrice?: number;
    businessId: string;
    categoryId: string;
    images?: string[];
    details?: Record<string, string>;
    isAvailable?: boolean;
    isSignature?: boolean;
    isBarItem?: boolean;
    allowAddOns?: boolean;
    services?: string[];
  }): Promise<Menu> => {
    const { data } = await api.post('/menu', payload);
    return data;
  },

  update: async (id: string, payload: Partial<Menu>): Promise<Menu> => {
    const { data } = await api.patch(`/menu/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/menu/${id}`);
  },

  toggleSignature: async (id: string, isSignature: boolean): Promise<Menu> => {
    const { data } = await api.patch(`/menu/toggle-signature/${id}`, { isSignature });
    return data;
  },

  // Variant operations
  getVariants: async (menuId: string): Promise<MenuVariant[]> => {
    const { data } = await api.get(`/menu/${menuId}/variants`);
    return data;
  },

  addVariant: async (
    menuId: string,
    payload: { name: string; price: number; isAvailable?: boolean; sortOrder?: number },
  ): Promise<MenuVariant> => {
    const { data } = await api.post(`/menu/${menuId}/variants`, payload);
    return data;
  },

  updateVariant: async (
    menuId: string,
    variantId: string,
    payload: Partial<MenuVariant>,
  ): Promise<MenuVariant> => {
    const { data } = await api.patch(`/menu/${menuId}/variants/${variantId}`, payload);
    return data;
  },

  deleteVariant: async (menuId: string, variantId: string): Promise<void> => {
    await api.delete(`/menu/${menuId}/variants/${variantId}`);
  },

  // Addon group operations
  attachAddonGroup: async (menuId: string, groupId: string): Promise<void> => {
    await api.post(`/menu/${menuId}/addon-groups/${groupId}`);
  },

  detachAddonGroup: async (menuId: string, groupId: string): Promise<void> => {
    await api.delete(`/menu/${menuId}/addon-groups/${groupId}`);
  },
};
