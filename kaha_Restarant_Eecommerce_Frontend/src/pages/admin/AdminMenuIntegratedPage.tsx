import React, { useState, useEffect, useCallback } from 'react';
import { MenuRow, MenuForm, Modal, ConfirmDialog, LoadingSpinner, Toast } from '@/components';
import { menuApi, categoryApi } from '@/api/menu.api';
import { addonApi } from '@/api/addon.api';
import type { Menu, Category, Addon as MenuAddon } from '@/types';
import '../admin/AdminDashboard.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const AdminMenuIntegratedPage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addOns, setAddOns] = useState<MenuAddon[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const user = JSON.parse(localStorage.getItem('kaha_user') || '{}');
  const businessId = user.kahaId || '7476ee15-1407-41fa-9a49-89e0caaf945d';

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `admin-menu-${toasts.length}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menusRes, catsRes, addOnsRes] = await Promise.all([
          menuApi.getMenus({ businessId, includeHidden: true }),
          categoryApi.getCategories({ businessId }),
          addonApi.getAddOns({ businessId }),
        ]);

        setMenus(menusRes.data || []);
        setCategories(catsRes.data || []);
        setAddOns(addOnsRes.data || []);
      } catch (err) {
        let errorMessage = 'Failed to load data';
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

  const handleEdit = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!menuToDelete) return;

    try {
      await menuApi.deleteMenu(menuToDelete.id);
      setMenus(menus.filter(m => m.id !== menuToDelete.id));
      showToast('Menu item deleted successfully', 'success');
      setShowConfirm(false);
      setMenuToDelete(null);
    } catch (err) {
      let errorMessage = 'Failed to delete menu item';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleToggleHidden = async (id: string, isHidden: boolean) => {
    try {
      await menuApi.toggleHidden(id, isHidden);
      setMenus(menus.map(m => m.id === id ? { ...m, isHidden } : m));
      showToast(
        isHidden ? 'Menu item hidden from customers' : 'Menu item is now visible',
        'success'
      );
    } catch {
      showToast('Failed to update visibility', 'error');
    }
  };

  const handleToggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await menuApi.toggleAvailability(id, isAvailable);
      setMenus(menus.map(m => m.id === id ? { ...m, isAvailable } : m));
      showToast(
        isAvailable ? 'Menu item marked as available' : 'Menu item marked as out of stock',
        'success'
      );
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const handleSubmit = async (formData: unknown) => {
    try {
      if (selectedMenu) {
        // Update
        const response = await menuApi.updateMenu(selectedMenu.id, formData);
        setMenus(menus.map(m => m.id === selectedMenu.id ? response.data : m));
        showToast('Menu item updated successfully', 'success');
      } else {
        // Create
        const response = await menuApi.createMenu(formData);
        setMenus([...menus, response.data]);
        showToast('Menu item created successfully', 'success');
      }
      setShowForm(false);
      setSelectedMenu(undefined);
    } catch (err) {
      let errorMessage = 'Failed to save menu item';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };



  if (loading) return <LoadingSpinner fullScreen message="Loading menu items..." />;

  return (
    <div className="admin-menu-page">
      <div className="admin-header">
        <h1>Menu Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => { setSelectedMenu(undefined); setShowForm(true); }}
        >
          Add New Menu Item
        </button>
      </div>

      {menus.length === 0 ? (
        <div className="empty-state">
          <p>No menu items yet. Create your first item!</p>
        </div>
      ) : (
        <div className="menu-table">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Rating</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menus.map(menu => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  onEdit={handleEdit}
                  onDelete={async (id) => {
                    setMenuToDelete(menu);
                    setShowConfirm(true);
                  }}
                  onToggleHidden={handleToggleHidden}
                  onToggleAvailability={handleToggleAvailability}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setSelectedMenu(undefined); }}
          title={selectedMenu ? 'Edit Menu Item' : 'Create Menu Item'}
          size="large"
        >
          <MenuForm
            menu={selectedMenu}
            categories={categories}
            addons={addOns}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setSelectedMenu(undefined); }}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Menu Item"
        message="This action cannot be undone. Are you sure you want to delete this item?"
        isDangerous={true}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
      />

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

export default AdminMenuIntegratedPage;
