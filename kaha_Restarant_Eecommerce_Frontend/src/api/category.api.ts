import axios from './axios';

const API_BASE = import.meta.env.VITE_KAHA_MAIN_V3_URL || 'http://localhost:3001/api/v3';

export interface Category {
  id?: string;
  name: string;
  description?: string;
  businessId?: string;
  image?: string;
  isActive?: boolean;
}

const getStoredBusinessId = (): string => {
  try {
    const userStr = localStorage.getItem('kaha_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.businessId) return user.businessId;
      if (user.kahaId) return user.kahaId;
    }
  } catch (e) {
    console.error('Error parsing kaha_user', e);
  }
  return localStorage.getItem('businessId') || '00000000-0000-4000-a000-000000000100';
};

export const getCategories = async (params?: { businessId?: string }) => {
  try {
    const businessId = params?.businessId || getStoredBusinessId();
    const token = localStorage.getItem('kaha_token');
    const response = await axios.get(`${API_BASE}/category/business/${businessId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const getCategoryById = async (categoryId: string) => {
  try {
    const token = localStorage.getItem('kaha_token');
    const response = await axios.get(`${API_BASE}/category/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching category:', error);
    throw error;
  }
};

export const createCategory = async (category: Category) => {
  try {
    const businessId = getStoredBusinessId();
    const token = localStorage.getItem('kaha_token');
    const response = await axios.post(
      `${API_BASE}/category`,
      { ...category, businessId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

export const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
  try {
    const token = localStorage.getItem('kaha_token');
    const response = await axios.put(
      `${API_BASE}/category/${categoryId}`,
      updates,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

export const deleteCategory = async (categoryId: string) => {
  try {
    const token = localStorage.getItem('kaha_token');
    const response = await axios.delete(`${API_BASE}/category/${categoryId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};
