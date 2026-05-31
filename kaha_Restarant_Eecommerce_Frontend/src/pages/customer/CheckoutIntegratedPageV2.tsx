import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutForm, Toast } from '@/components';
import type { CheckoutData } from '@/components/checkout/CheckoutForm';
import { orderApi } from '@/api/order.api';
import { useCart } from '@/context/CartContext';
import { ServiceTypeEnum } from '@/types';
import './CheckoutPage.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const CheckoutIntegratedPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `checkout-${toasts.length}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  const handleCheckoutSubmit = async (formData: CheckoutData) => {
    try {
      setLoading(true);
      setError('');

      if (!cart?.cartItems || cart.cartItems.length === 0) {
        setError('Cart is empty');
        showToast('Cart is empty', 'error');
        return;
      }

      const remarksString = `Delivery Address: ${formData.deliveryAddress}. Notes: ${formData.deliveryNotes || 'None'}`;

      const orderData = {
        cartItemIds: cart.cartItems.map(item => item.id),
        businessId: cart.businessId || import.meta.env.VITE_BUSINESS_ID || '00000000-0000-4000-a000-000000000100',
        serviceType: ServiceTypeEnum.DELIVERY,
        paymentMethod: formData.paymentMethod,
        remarks: remarksString,
        deliveryFee: 50,
        serviceCharge: 0,
        tipAmount: 0,
        discountAmount: 0
      };

      const response = await orderApi.createOrderFromCart(orderData);

      // Clear cart after successful order
      await clearCart();

      showToast('Order placed successfully!', 'success');

      // Navigate to order confirmation
      setTimeout(() => {
        if (response.order?.id) {
          navigate(`/order/${response.order.id}`);
        } else {
          navigate('/orders');
        }
      }, 1500);
    } catch (err) {
      let errorMessage = 'Failed to place order';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosErr.response?.data?.message || 'Failed to place order';
      }
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/cart');
  };

  if (!cart?.cartItems || cart.cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Please add items to your cart before checkout</p>
          <button onClick={() => navigate('/menu')} className="btn btn-primary">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p>Complete your order</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <CheckoutForm
        cart={cart}
        onSubmit={handleCheckoutSubmit}
        onBack={handleBack}
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

export default CheckoutIntegratedPage;
