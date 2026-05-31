import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/OrderTrackingPage.css';

interface OrderStatus {
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  timestamp: string;
  message: string;
}

interface Delivery {
  estimatedTime: string;
  address: string;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface TrackingData {
  id: string;
  status: OrderStatus['status'];
  statusHistory: OrderStatus[];
  delivery: Delivery;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  notes?: string;
}

const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const token = localStorage.getItem('authToken');

  // Mock tracking data
  const mockTrackingData: TrackingData = {
    id: orderId || 'ORD-002',
    status: 'out_for_delivery',
    statusHistory: [
      {
        status: 'pending',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        message: 'Order received',
      },
      {
        status: 'confirmed',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        message: 'Order confirmed by restaurant',
      },
      {
        status: 'preparing',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        message: 'Food is being prepared',
      },
      {
        status: 'out_for_delivery',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        message: 'Order is on the way',
      },
    ],
    delivery: {
      estimatedTime: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      address: 'Thamel, Ward 1, Kathmandu, Nepal',
      driverName: 'Ramesh Kumar',
      driverPhone: '9841234567',
      vehicleNumber: 'KA-1-BA-1234',
      currentLocation: {
        latitude: 27.7172,
        longitude: 85.3240,
      },
    },
    items: [
      { name: 'Chicken Momo', quantity: 1, price: 150 },
      { name: 'Buff Momos', quantity: 1, price: 180 },
    ],
    total: 326.7,
    notes: 'No onion in momos',
  };

  // Load tracking data
  useEffect(() => {
    const loadTrackingData = async () => {
      setLoading(true);
      try {
        // In production, this would be an API call
        // const response = await axios.get(
        //   `http://localhost:3000/api/orders/${orderId}/track`,
        //   {
        //     headers: {
        //       Authorization: `Bearer ${token}`,
        //     },
        //   }
        // );
        // setTrackingData(response.data);

        // Using mock data for now
        setTrackingData(mockTrackingData);
      } catch (err: any) {
        setError('Failed to load tracking information');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadTrackingData();
    }
  }, [token, orderId]);

  // Auto-refresh tracking data
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // In production, this would refresh from the API
      // For now, just update timestamps to simulate live updates
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: OrderStatus['status']): string => {
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

  const getStatusColor = (status: OrderStatus['status']): string => {
    switch (status) {
      case 'pending':
        return '#ffc107';
      case 'confirmed':
        return '#17a2b8';
      case 'preparing':
        return '#6f42c1';
      case 'out_for_delivery':
        return '#667eea';
      case 'delivered':
        return '#28a745';
      case 'cancelled':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstimatedDeliveryText = (): string => {
    if (!trackingData?.delivery.estimatedTime) return '';
    const now = new Date();
    const estimatedTime = new Date(trackingData.delivery.estimatedTime);
    const diffMinutes = Math.floor((estimatedTime.getTime() - now.getTime()) / 1000 / 60);

    if (diffMinutes < 0) return 'Arriving now';
    if (diffMinutes === 0) return 'Less than 1 minute';
    if (diffMinutes === 1) return '1 minute away';
    return `${diffMinutes} minutes away`;
  };

  if (!token) {
    return (
      <div className="tracking-error">
        <p>Please login first</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="tracking-container">
        <div className="tracking-loading">
          <div className="spinner"></div>
          <p>Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="tracking-container">
        <div className="tracking-error-box">
          <h2>⚠️ {error}</h2>
          <button onClick={() => navigate('/orders')}>Back to Orders</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      {/* Header */}
      <header className="tracking-header">
        <button className="back-btn" onClick={() => navigate('/orders')}>
          ← Back to Orders
        </button>
        <h1>📍 Track Your Order</h1>
      </header>

      <div className="tracking-content">
        {/* Main Tracking Info */}
        <main className="tracking-main">
          {/* Order ID & Status */}
          <div className="tracking-status-card">
            <div className="order-id">
              <strong>{trackingData.id}</strong>
              <span className="status-badge" style={{ backgroundColor: getStatusColor(trackingData.status) }}>
                {getStatusIcon(trackingData.status)} {trackingData.status.replace(/_/g, ' ').toUpperCase()}
              </span>
            </div>
            <div className="estimated-delivery">
              <p>{getEstimatedDeliveryText()}</p>
              <small>{new Date(trackingData.delivery.estimatedTime).toLocaleString()}</small>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="tracking-map">
            <div className="map-placeholder">
              <div className="map-pin">📍</div>
              <p>Live Map</p>
              <small>
                {trackingData.delivery.currentLocation
                  ? `${trackingData.delivery.currentLocation.latitude.toFixed(4)}, ${trackingData.delivery.currentLocation.longitude.toFixed(4)}`
                  : 'Location not available'}
              </small>
            </div>
          </div>

          {/* Driver Info */}
          {trackingData.status === 'out_for_delivery' && trackingData.delivery.driverName && (
            <div className="driver-info">
              <h3>🚚 Delivery Partner</h3>
              <div className="driver-card">
                <div className="driver-avatar">👤</div>
                <div className="driver-details">
                  <strong>{trackingData.delivery.driverName}</strong>
                  <p>{trackingData.delivery.vehicleNumber}</p>
                </div>
                <a href={`tel:${trackingData.delivery.driverPhone}`} className="call-btn">
                  📞 Call
                </a>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="tracking-timeline">
            <h3>Order Timeline</h3>
            <div className="timeline">
              {trackingData.statusHistory.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker" style={{ backgroundColor: getStatusColor(item.status) }}>
                    <span>{getStatusIcon(item.status)}</span>
                  </div>
                  <div className="timeline-content">
                    <h4>{item.status.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p>{item.message}</p>
                    <small>{formatTime(item.timestamp)}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="delivery-section">
            <h3>📍 Delivery Address</h3>
            <div className="address-card">
              <p>{trackingData.delivery.address}</p>
              {trackingData.notes && (
                <div className="delivery-notes">
                  <strong>Notes:</strong>
                  <p>{trackingData.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="order-items-section">
            <h3>📦 Order Items</h3>
            <div className="items-table">
              {trackingData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <span className="item-name">
                    {item.name} <span className="qty">x{item.quantity}</span>
                  </span>
                  <span className="item-price">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="item-row total">
                <span>Total</span>
                <span>₹{trackingData.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar - Live Updates & Support */}
        <aside className="tracking-sidebar">
          {/* Auto Refresh */}
          <div className="auto-refresh">
            <label className="toggle">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <span>Live Updates</span>
            </label>
            <small>{autoRefresh ? '🔄 Refreshing...' : '⏸️ Paused'}</small>
          </div>

          {/* Support */}
          <div className="support-card">
            <h3>📞 Need Help?</h3>
            <div className="support-item">
              <strong>Restaurant</strong>
              <p>9868348282</p>
              <a href="tel:9868348282" className="support-link">
                Call
              </a>
            </div>
            <div className="support-item">
              <strong>Delivery Support</strong>
              <p>1800-123-4567</p>
              <a href="tel:1800-123-4567" className="support-link">
                Call
              </a>
            </div>
            <button className="report-btn">Report Issue</button>
          </div>

          {/* Delivery Status Info */}
          <div className="status-info">
            <h3>ℹ️ Status Info</h3>
            <div className="info-item">
              <strong>Current Status</strong>
              <p>{trackingData.status.replace(/_/g, ' ').toUpperCase()}</p>
            </div>
            <div className="info-item">
              <strong>Estimated Arrival</strong>
              <p>{getEstimatedDeliveryText()}</p>
            </div>
            {trackingData.status === 'delivered' && (
              <div className="info-item success">
                <strong>✅ Order Delivered</strong>
                <p>Thank you for your order!</p>
              </div>
            )}
          </div>

          {/* Rating & Feedback */}
          {trackingData.status === 'delivered' && (
            <div className="rating-card">
              <h3>Rate Your Order</h3>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} className="star">
                    ⭐
                  </button>
                ))}
              </div>
              <textarea placeholder="Tell us about your experience..." className="feedback-input"></textarea>
              <button className="submit-feedback">Submit Feedback</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
