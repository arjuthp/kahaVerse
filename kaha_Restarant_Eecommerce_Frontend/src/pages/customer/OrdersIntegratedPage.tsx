import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrderCard, LoadingSpinner, Toast, ConfirmDialog } from '@/components';
import { orderApi } from '@/api/order.api';
import type { Order } from '@/types';
import './OrdersPage.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const OrdersIntegratedPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);

  const user = JSON.parse(localStorage.getItem('kaha_user') || '{}');

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `orders-${toasts.length}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [toasts.length, removeToast]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await orderApi.getOrders({ customerId: user.id });
        setOrders(response.data || []);
      } catch (err) {
        let errorMessage = 'Failed to load orders';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        showToast(errorMessage, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user.id, showToast]);

  const handleViewDetails = (order: Order) => {
    navigate(`/order/${order.id}`);
  };

  const handleCancelRequest = async (order: Order) => {
    setOrderToCancel(order.id);
    setShowConfirm(true);
  };

  const handleCancelConfirm = async () => {
    if (!orderToCancel) return;

    try {
      await orderApi.updateOrderStatus(orderToCancel, 'CANCELLED');
      setOrders(orders.map(o =>
        o.id === orderToCancel ? { ...o, status: 'CANCELLED' } : o
      ));
      showToast('Order cancelled successfully', 'success');
      setShowConfirm(false);
      setOrderToCancel(null);
    } catch (err) {
      let errorMessage = 'Failed to cancel order';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading your orders..." />;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p>Track your deliveries</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <p>You have no orders yet</p>
          <button onClick={() => navigate('/menu')} className="btn btn-primary">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
              onCancel={handleCancelRequest}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        confirmText="Yes, Cancel"
        cancelText="Keep Order"
        isDangerous={true}
        onConfirm={handleCancelConfirm}
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

export default OrdersIntegratedPage;
