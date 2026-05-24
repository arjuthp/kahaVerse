import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import type { Order } from '../../types';
import './OrderDetailPage.css';

const statusColors: Record<string, string> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PREPARING: 'primary',
  READY: 'success',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      const data = await orderApi.getOrderById(id);
      setOrder(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="order-detail-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}><div className="spinner spinner-lg"></div></div>;
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="empty-state">
            <h3>Order Not Found</h3>
            <p>{error}</p>
            <button className="btn btn-primary mt-md" onClick={() => navigate('/orders')}>
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const sortedStatuses = [...(order.orderStatus || [])].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const currentStatus = sortedStatuses.length ? sortedStatuses[sortedStatuses.length - 1].status : 'PENDING';

  return (
    <div className="order-detail-page">
      <div className="container">
        
        <button className="order-detail-back" onClick={() => navigate('/orders')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Orders
        </button>

        <div className="order-detail-grid">
          
          <div className="order-detail-main">
            
            <div className="order-detail-header-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div className="order-detail-num">Order #{order.orderNumber || order.id.slice(-8).toUpperCase()}</div>
                  <div className="order-detail-date">{date}</div>
                </div>
                <span className={`status-badge status-badge--${currentStatus}`}>{currentStatus.replace('_', ' ')}</span>
              </div>
              
              <div className="order-detail-meta">
                <span className="badge badge-primary">{order.serviceType.replace('_', ' ')} {order.tableNumber && `- Table ${order.tableNumber}`}</span>
                <span className="badge badge-primary">Payment: {order.paymentMethod}</span>
              </div>

              {order.remarks && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--surface-container)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--secondary)', marginBottom: '4px' }}>Remarks</div>
                  <div style={{ fontSize: '14px', color: 'var(--on-surface)' }}>"{order.remarks}"</div>
                </div>
              )}
            </div>

            {sortedStatuses.length > 0 && (
              <div className="order-status-timeline">
                <h3>Order Tracking</h3>
                <div className="order-timeline-list">
                  {sortedStatuses.map((status, index) => {
                    const isActive = index === sortedStatuses.length - 1;
                    return (
                      <div key={status.id} className="order-timeline-item">
                        <div className={`order-timeline-dot ${isActive ? 'order-timeline-dot--active' : ''}`}>
                          {isActive ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> : ''}
                        </div>
                        <div className="order-timeline-content">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div className="order-timeline-status">{status.status.replace('_', ' ')}</div>
                            <div className="order-timeline-time">{new Date(status.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          {status.remarks && <p className="order-timeline-remark">{status.remarks}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="order-detail-items-card">
              <h3>Order Items</h3>
              <div>
                {order.orderItems?.map(item => (
                  <div key={item.id} className="order-detail-item">
                    <div className="order-detail-item-left">
                      <div className="order-detail-item-qty">{item.quantity}</div>
                      <div>
                        <h4 className="order-detail-item-name">{item.menuNameSnapshot}</h4>
                        {item.variantNameSnapshot && <div className="order-detail-item-variant">Size: {item.variantNameSnapshot}</div>}
                        {item.addons?.length > 0 && (
                          <div className="order-detail-item-addons">
                            + {item.addons.map(a => `${a.quantity}x ${a.addonNameSnapshot}`).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="order-detail-item-price">
                      NPR {item.lineTotal?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <aside className="order-detail-summary">
            <div className="order-detail-summary-head">
              <h3>Order Summary</h3>
            </div>
            <div className="order-detail-summary-body">
              <div className="order-detail-summary-row">
                <span>Subtotal</span><span>NPR {order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="order-detail-summary-row">
                <span>Tax (13%)</span><span>NPR {order.taxAmount?.toFixed(2)}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="order-detail-summary-row">
                  <span>Delivery Fee</span><span>NPR {order.deliveryFee?.toFixed(2)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="order-detail-summary-row">
                  <span>Service Charge</span><span>NPR {order.serviceCharge?.toFixed(2)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="order-detail-summary-row" style={{ color: 'var(--status-delivered)' }}>
                  <span>Discount</span><span>-NPR {order.discountAmount?.toFixed(2)}</span>
                </div>
              )}
              {order.tipAmount > 0 && (
                <div className="order-detail-summary-row">
                  <span>Tip</span><span>NPR {order.tipAmount?.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="order-detail-summary-total">
              <span className="order-detail-summary-total-label">Total</span>
              <span className="order-detail-summary-total-value">NPR {order.totalAmount?.toFixed(2)}</span>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
