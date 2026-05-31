import React, { useState, useEffect, useCallback } from 'react';
import { MenuCard, MenuDetailModal, LoadingSpinner, Toast } from '@/components';
import { menuApi } from '@/api/menu.api';
import { addonApi } from '@/api/addon.api';
import { useCart } from '@/context/CartContext';
import type { Menu, Addon, MenuAddon, AddToCartDto } from '@/types';
import './MenuPage.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const MenuIntegratedPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [addOns, setAddOns] = useState<MenuAddon[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const { addItem } = useCart();

  // Public menu browsing should not depend on authenticated user context.
  const businessId = import.meta.env.VITE_BUSINESS_ID || '7476ee15-1407-41fa-9a49-89e0caaf945d';

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `${toasts.length}-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menusRes, addOnsRes] = await Promise.all([
          menuApi.getMenus({ businessId }),
          addonApi.getAddOns({ businessId }),
        ]);

        setMenus(menusRes.data || []);
        setAddOns(addOnsRes.data || []);
      } catch (err) {
        let errorMessage = 'Failed to load menu';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  const handleViewDetails = (menuId: string) => {
    const menu = menus.find(m => m.id === menuId);
    if (menu) {
      setSelectedMenu(menu);
    }
  };

  const handleAddToCart = async (item: AddToCartDto) => {
    try {
      await addItem(item);
      showToast('Item added to cart!', 'success');
      setSelectedMenu(null);
    } catch (err) {
      let errorMessage = 'Failed to add item to cart';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading menu items..." />;

  return (
    <div className="menu-page">
      <div className="menu-header">
        <h1>Our Menu</h1>
        <p>Explore our delicious offerings</p>
      </div>

      {menus.length === 0 ? (
        <div className="empty-menu">
          <p>No menu items available</p>
        </div>
      ) : (
        <div className="menu-grid">
          {menus.map(menu => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onViewDetails={handleViewDetails}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}

      {selectedMenu && (
        <MenuDetailModal
          isOpen={selectedMenu !== null}
          menu={selectedMenu}
          addOns={addOns}
          onClose={() => setSelectedMenu(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default MenuIntegratedPage;
