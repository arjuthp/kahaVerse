import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import type { Order } from '../../types';
import { OrderStatusEnum } from '../../types';
import './OrdersPage.css';

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'primary',
  READY: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderApi.getUserOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="orders-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>You haven't placed any orders. Browse our menu to get started.</p>
            <Link to="/menu" className="btn btn-primary btn-lg mt-md">
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>Track, manage, and review your past orders.</p>
        </div>

        <div className="orders-list">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
          ))}
        </div>
      </div>
    </div>
  );
};

interface OrderCardProps {
  order: Order;
  onClick: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const currentStatus = order.orderStatus?.length ? order.orderStatus[order.orderStatus.length - 1].status : 'PENDING';
  const colorKey = statusColors[currentStatus] || 'primary';
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="order-card" onClick={onClick}>
      <div className="order-card__header">
        <div className="order-card__number">Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</div>
        <div className="order-card__date">{date}</div>
      </div>
      
      <div className="order-card__body">
        <div className="order-card__items">
          {order.orderItems?.slice(0, 3).map((item, idx) => (
            <span key={idx} className="order-card__item-tag">
              {item.quantity}x {item.menuNameSnapshot}
            </span>
          ))}
          {(order.orderItems?.length || 0) > 3 && (
            <span className="order-card__item-tag">
              +{(order.orderItems?.length || 0) - 3} more
            </span>
          )}
        </div>

        <div className="order-card__meta">
          <div className="order-card__total">NPR {order.totalAmount?.toFixed(2)}</div>
          <div className="order-card__arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>

      <div className="order-card__footer">
        <span className={`status-badge status-badge--${currentStatus}`}>{currentStatus.replace('_', ' ')}</span>
        <span style={{ margin: '0 8px', color: 'var(--outline-variant)' }}>|</span>
        <span>{order.serviceType.replace('_', ' ')}</span>
        {currentStatus === OrderStatusEnum.DELIVERED && (
          <span style={{ marginLeft: 'auto', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Leave Review
          </span>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
