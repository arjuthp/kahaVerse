import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import type { Order } from '../../types';
import { OrderStatusEnum } from '../../types';
import './OrdersPage.css';

const statusColors: Record<string, string> = {
  pending: 'warning',
  processing: 'primary',
  shipped: 'info',
  delivered: 'success',
  cancelled: 'error',
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
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

  const getOrderStatus = (order: Order): string => {
    if (order.orderStatus && order.orderStatus.length > 0) {
      return order.orderStatus[order.orderStatus.length - 1].status.toLowerCase();
    }
    return 'pending';
  };

  const activeOrders = orders.filter(order =>
    ['pending', 'processing'].includes(getOrderStatus(order))
  );

  const historyOrders = orders.filter(order =>
    ['delivered', 'cancelled', 'shipped'].includes(getOrderStatus(order))
  );

  if (loading) {
    return (
      <div className="orders-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <div className="spinner spinner-lg"></div>
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

        {/* Tab Buttons */}
        <div className="orders-tabs">
          <button
            className={`orders-tab-btn ${activeTab === 'active' ? 'orders-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active Orders
            {activeOrders.length > 0 && (
              <span className="orders-tab-badge">{activeOrders.length}</span>
            )}
          </button>
          <button
            className={`orders-tab-btn ${activeTab === 'history' ? 'orders-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Order History
          </button>
        </div>

        {/* Tab Content */}
        <div className="orders-list">
          {activeTab === 'active' ? (
            activeOrders.length === 0 ? (
              <div className="orders-empty">
                <h2>No active orders</h2>
                <p>No active orders right now. Browse our menu to place an order.</p>
                <Link to="/menu" className="btn btn-primary btn-md mt-md">
                  Browse Menu
                </Link>
              </div>
            ) : (
              activeOrders.map(order => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))
            )
          ) : (
            historyOrders.length === 0 ? (
              <div className="orders-empty">
                <h2>No past orders</h2>
                <p>No past orders found. Browse our menu to get started.</p>
                <Link to="/menu" className="btn btn-primary btn-md mt-md">
                  Browse Menu
                </Link>
              </div>
            ) : (
              historyOrders.map(order => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))
            )
          )}
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
  const currentStatus = order.orderStatus?.length ? order.orderStatus[order.orderStatus.length - 1].status : 'pending';
  const colorKey = statusColors[currentStatus.toLowerCase()] || 'primary';
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
        <span className={`status-badge status-badge--${colorKey}`}>{currentStatus.replace('_', ' ')}</span>
        <span style={{ margin: '0 8px', color: 'var(--outline-variant)' }}>|</span>
        <span>{order.serviceType.replace('_', ' ')}</span>
        {currentStatus.toLowerCase() === OrderStatusEnum.DELIVERED && (
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
