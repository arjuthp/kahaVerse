import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderDetails, LoadingSpinner, Toast } from '@/components';
import { orderApi } from '@/api/order.api';
import type { Order } from '@/types';
import { OrderStatusEnum } from '@/types';
import './OrderDetailPage.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const OrderDetailIntegratedPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const user = JSON.parse(localStorage.getItem('kaha_user') || '{}');
  const isAdmin = user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'super_admin' || user.role?.toLowerCase() === 'business_admin';

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `order-detail-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      const response = await orderApi.getOrderDetails(orderId);
      setOrder(response.data);
    } catch (err) {
      let errorMessage = 'Failed to load order details';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [orderId, showToast]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async (newStatus: OrderStatusEnum) => {
    if (!orderId) return;
    try {
      setActionLoading(true);
      await orderApi.updateOrderStatus(orderId, newStatus);
      // Re-fetch to get the updated order with new status history
      await fetchOrder();
      showToast('Order status updated', 'success');
    } catch (err) {
      let errorMessage = 'Failed to update order status';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    try {
      setActionLoading(true);
      await orderApi.updateOrderStatus(orderId, 'CANCELLED');
      await fetchOrder();
      showToast('Order cancelled', 'success');
    } catch (err) {
      let errorMessage = 'Failed to cancel order';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen message="Loading order details..." />;

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="error-message">
          <h2>Order not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <h1>Order Details</h1>
      </div>

      <OrderDetails
        order={order}
        onBack={() => navigate('/orders')}
        isAdmin={isAdmin}
        onStatusUpdate={isAdmin ? handleStatusUpdate : undefined}
        onCancel={!isAdmin ? handleCancelOrder : undefined}
        isLoading={actionLoading}
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

export default OrderDetailIntegratedPage;
