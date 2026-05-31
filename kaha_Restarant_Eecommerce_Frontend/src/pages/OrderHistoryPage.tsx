import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OrderHistoryPage.css';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  businessId: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'khalti' | 'esewa' | 'cod';
  deliveryType: 'delivery' | 'pickup';
  createdAt: string;
  estimatedDelivery?: string;
  notes?: string;
}

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';

const OrderHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const token = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');

  // Mock orders data
  const mockOrders: Order[] = [
    {
      id: 'ORD-001',
      businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
      userId: userId || 'user-1',
      items: [
        { id: '1', name: 'Chicken Biryani', quantity: 2, price: 350 },
        { id: '2', name: 'Mango Lassi', quantity: 2, price: 80 },
      ],
      subtotal: 860,
      tax: 77.4,
      deliveryFee: 100,
      discount: 0,
      total: 1037.4,
      status: 'delivered',
      paymentMethod: 'khalti',
      deliveryType: 'delivery',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-002',
      businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
      userId: userId || 'user-1',
      items: [
        { id: '3', name: 'Chicken Momo', quantity: 1, price: 150 },
        { id: '4', name: 'Buff Momos', quantity: 1, price: 180 },
      ],
      subtotal: 330,
      tax: 29.7,
      deliveryFee: 0,
      discount: 33,
      total: 326.7,
      status: 'out_for_delivery',
      paymentMethod: 'cod',
      deliveryType: 'delivery',
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      notes: 'No onion in momos',
    },
    {
      id: 'ORD-003',
      businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
      userId: userId || 'user-1',
      items: [{ id: '5', name: 'Chocolate Cake', quantity: 1, price: 100 }],
      subtotal: 100,
      tax: 9,
      deliveryFee: 100,
      discount: 0,
      total: 209,
      status: 'pending',
      paymentMethod: 'esewa',
      deliveryType: 'delivery',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-004',
      businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
      userId: userId || 'user-1',
      items: [
        { id: '6', name: 'Vegetable Fried Rice', quantity: 1, price: 220 },
      ],
      subtotal: 220,
      tax: 19.8,
      deliveryFee: 100,
      discount: 0,
      total: 339.8,
      status: 'cancelled',
      paymentMethod: 'khalti',
      deliveryType: 'delivery',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  // Load orders
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await axios.get(
        //   `http://localhost:3000/api/orders?userId=${userId}`,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //     },
        //   }
        // );
        // setOrders(response.data);

        // Using mock data for now
        setOrders(mockOrders);
      } catch (err: any) {
        setError('Failed to load orders');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadOrders();
    }
  }, [token]);

  // Filter orders
  useEffect(() => {
    let filtered = orders;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((order) => order.status === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some((item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredOrders(filtered);
  }, [orders, filterStatus, searchQuery]);

  const getStatusBadgeClass = (status: Order['status']): string => {
    switch (status) {
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      case 'out_for_delivery':
        return 'status-out-for-delivery';
      case 'preparing':
        return 'status-preparing';
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: Order['status']): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'confirmed':
        return '✅';
      case 'preparing':
        return '👨‍🍳';
      case 'out_for_delivery':
        return '🚚';
      case 'delivered':
        return '📦';
      case 'cancelled':
        return '❌';
      default:
        return '';
    }
  };

  const getStatusText = (status: Order['status']): string => {
    return status.replace(/_/g, ' ').charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canCancelOrder = (order: Order): boolean => {
    return ['pending', 'confirmed'].includes(order.status);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to cancel this order?')) {
      try {
        // In production, this would be an API call
        // await axios.patch(
        //   `http://localhost:3000/api/orders/${orderId}/cancel`,
        //   {},
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //     },
        //   }
        // );

        // Update local state
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: 'cancelled' } : order
          )
        );
      } catch (err) {
        console.error('Failed to cancel order:', err);
        alert('Failed to cancel order');
      }
    }
  };

  if (!token) {
    return (
      <div className="order-error">
        <p>Please login first</p>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      {/* Header */}
      <header className="order-header">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          ← Back
        </button>
        <h1>📦 Order History</h1>
      </header>

      <div className="order-content">
        {/* Sidebar - Filters */}
        <aside className="order-sidebar">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filters">
            <h3>Filter by Status</h3>
            {['all', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map(
              (status) => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status as FilterStatus)}
                >
                  {getStatusIcon(status as Order['status'])} {status === 'all' ? 'All Orders' : getStatusText(status as Order['status'])}
                </button>
              )
            )}
          </div>

          {/* Stats */}
          <div className="order-stats">
            <h3>Statistics</h3>
            <div className="stat-item">
              <span>Total Orders</span>
              <strong>{orders.length}</strong>
            </div>
            <div className="stat-item">
              <span>Delivered</span>
              <strong>{orders.filter((o) => o.status === 'delivered').length}</strong>
            </div>
            <div className="stat-item">
              <span>In Progress</span>
              <strong>
                {orders.filter((o) =>
                  ['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(o.status)
                ).length}
              </strong>
            </div>
            <div className="stat-item">
              <span>Cancelled</span>
              <strong>{orders.filter((o) => o.status === 'cancelled').length}</strong>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="order-main">
          {loading && <div className="loading">Loading orders...</div>}

          {error && <div className="error-banner">{error}</div>}

          {filteredOrders.length === 0 ? (
            <div className="no-orders">
              <p>😕 No orders found</p>
              <button onClick={() => navigate('/menu')} className="order-btn">
                Start Ordering
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`order-card ${expandedOrder === order.id ? 'expanded' : ''}`}
                >
                  {/* Order Header */}
                  <div
                    className="order-card-header"
                    onClick={() =>
                      setExpandedOrder(expandedOrder === order.id ? null : order.id)
                    }
                  >
                    <div className="order-id-section">
                      <strong>{order.id}</strong>
                      <small>{formatDate(order.createdAt)}</small>
                    </div>

                    <div className="order-items-preview">
                      {order.items.slice(0, 2).map((item) => (
                        <span key={item.id} className="item-name">
                          {item.name}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="more-items">+{order.items.length - 2} more</span>
                      )}
                    </div>

                    <div className="order-info">
                      <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                        {getStatusIcon(order.status)} {getStatusText(order.status)}
                      </span>
                      <span className="order-total">₹{order.total.toFixed(2)}</span>
                    </div>

                    <button className="expand-btn">{expandedOrder === order.id ? '▲' : '▼'}</button>
                  </div>

                  {/* Order Details - Expanded */}
                  {expandedOrder === order.id && (
                    <div className="order-card-details">
                      {/* Items */}
                      <div className="detail-section">
                        <h4>Items</h4>
                        <div className="items-list">
                          {order.items.map((item) => (
                            <div key={item.id} className="item-row">
                              <span className="item-info">
                                <strong>{item.name}</strong>
                                <small>Qty: {item.quantity}</small>
                              </span>
                              <span className="item-price">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="detail-section">
                        <h4>Price Breakdown</h4>
                        <div className="price-breakdown">
                          <div className="breakdown-row">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal}</span>
                          </div>
                          <div className="breakdown-row">
                            <span>Tax (9%)</span>
                            <span>₹{order.tax.toFixed(2)}</span>
                          </div>
                          <div className="breakdown-row">
                            <span>Delivery Fee</span>
                            <span className={order.deliveryFee === 0 ? 'free' : ''}>
                              {order.deliveryFee === 0 ? 'Free' : `₹${order.deliveryFee}`}
                            </span>
                          </div>
                          {order.discount > 0 && (
                            <div className="breakdown-row discount">
                              <span>Discount</span>
                              <span>-₹{order.discount}</span>
                            </div>
                          )}
                          <div className="breakdown-row total">
                            <span>Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="detail-section">
                        <h4>Order Information</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <span>💳 Payment Method</span>
                            <strong>{order.paymentMethod.toUpperCase()}</strong>
                          </div>
                          <div className="info-item">
                            <span>📦 Delivery Type</span>
                            <strong>{order.deliveryType === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</strong>
                          </div>
                          {order.estimatedDelivery && (
                            <div className="info-item">
                              <span>⏱️ Est. Delivery</span>
                              <strong>{formatDate(order.estimatedDelivery)}</strong>
                            </div>
                          )}
                          {order.notes && (
                            <div className="info-item full-width">
                              <span>📝 Notes</span>
                              <p>{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="order-actions">
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button
                            className="track-btn"
                            onClick={() => navigate(`/track/${order.id}`)}
                          >
                            Track Order
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <button className="reorder-btn" onClick={() => navigate('/menu')}>
                            Order Again
                          </button>
                        )}
                        {canCancelOrder(order) && (
                          <button
                            className="cancel-btn"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
