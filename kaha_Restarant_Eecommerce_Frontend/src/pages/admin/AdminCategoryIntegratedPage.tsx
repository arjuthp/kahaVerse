import React, { useState, useEffect, useCallback } from 'react';
import { CategoryForm, Modal, ConfirmDialog, LoadingSpinner, Toast } from '@/components';
import { categoryApi } from '@/api/menu.api';
import type { Category } from '@/types';
import '../admin/AdminDashboard.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const AdminCategoryIntegratedPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const user = JSON.parse(localStorage.getItem('kaha_user') || '{}');
  const businessId = user.kahaId || '7476ee15-1407-41fa-9a49-89e0caaf945d';

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `admin-cat-${toasts.length}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await categoryApi.getCategories({ businessId });
        setCategories(response.data || []);
      } catch (err) {
        let errorMessage = 'Failed to load categories';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [businessId]);

  const handleSubmit = async (formData: unknown) => {
    try {
      if (selectedCategory) {
        const response = await categoryApi.updateCategory(selectedCategory.id, formData);
        setCategories(categories.map(c => c.id === selectedCategory.id ? response.data : c));
        showToast('Category updated successfully', 'success');
      } else {
        const response = await categoryApi.createCategory(formData);
        setCategories([...categories, response.data]);
        showToast('Category created successfully', 'success');
      }
      setShowForm(false);
      setSelectedCategory(undefined);
    } catch (err) {
      let errorMessage = 'Failed to save category';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categoryApi.deleteCategory(categoryToDelete.id);
      setCategories(categories.filter(c => c.id !== categoryToDelete.id));
      showToast('Category deleted successfully', 'success');
      setShowConfirm(false);
      setCategoryToDelete(null);
    } catch (err) {
      let errorMessage = 'Failed to delete category';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading categories..." />;

  return (
    <div className="admin-category-page">
      <div className="admin-header">
        <h1>Category Management</h1>
        <button 
          className="btn btn-primary"
          onClick={() => { setSelectedCategory(undefined); setShowForm(true); }}
        >
          Add New Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state">
          <p>No categories yet. Create your first category!</p>
        </div>
      ) : (
        <div className="category-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>{category.position}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => { setSelectedCategory(category); setShowForm(true); }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => { setCategoryToDelete(category); setShowConfirm(true); }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={() => { setShowForm(false); setSelectedCategory(undefined); }}
          title={selectedCategory ? 'Edit Category' : 'Create Category'}
        >
          <CategoryForm
            category={selectedCategory}
            onSubmit={handleSubmit}
            onCancel={() => { setShowForm(false); setSelectedCategory(undefined); }}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Category"
        message="This action cannot be undone. Are you sure you want to delete this category?"
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

export default AdminCategoryIntegratedPage;
