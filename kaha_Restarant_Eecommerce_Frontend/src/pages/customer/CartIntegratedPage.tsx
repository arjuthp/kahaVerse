import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartSummary, Toast } from '@/components';
import { useCart } from '@/context/CartContext';
import './CartPage.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const CartIntegratedPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateItem, removeItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `${toasts.length}-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    try {
      setLoading(true);
      if (quantity === 0) {
        await removeItem(itemId);
        showToast('Item removed from cart', 'success');
      } else {
        await updateItem(itemId, quantity);
      }
    } catch (err) {
      let errorMessage = 'Failed to update cart';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (itemId: string, quantity: number) => {
    return handleQuantityChange(itemId, quantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    return handleQuantityChange(itemId, 0);
  };

  const handleCheckout = () => {
    if (!cart?.cartItems || cart.cartItems.length === 0) {
      showToast('Cart is empty', 'warning');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <p>Review your items before checkout</p>
      </div>

      <CartSummary
        cart={cart || null}
        onUpdateItem={handleUpdateItem}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        onContinueShopping={() => navigate('/menu')}
        isLoading={loading}
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

export default CartIntegratedPage;
