import { useState, useEffect } from 'react';
import { menuApi } from '../api/menu.api';
import type { Menu } from '../types';

interface UseMenuParams {
  businessId: string;
  categoryId?: string;
  isSignature?: boolean;
  isAvailable?: boolean;
  search?: string;
}

export const useMenu = ({ businessId, categoryId, isSignature, isAvailable, search }: UseMenuParams) => {
  const [menu, setMenu] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await menuApi.getByBusiness(businessId, {
          categoryId,
          isSignature,
          isAvailable,
          search,
        });
        setMenu(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch menu');
        console.error('Failed to fetch menu:', err);
      } finally {
        setLoading(false);
      }
    };

    if (businessId) {
      fetchMenu();
    }
  }, [businessId, categoryId, isSignature, isAvailable, search]);

  return { menu, loading, error };
};

export const useMenuItem = (menuId: string) => {
  const [item, setItem] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await menuApi.getById(menuId);
        setItem(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to fetch menu item');
        console.error('Failed to fetch menu item:', err);
      } finally {
        setLoading(false);
      }
    };

    if (menuId) {
      fetchItem();
    }
  }, [menuId]);

  return { item, loading, error };
};
