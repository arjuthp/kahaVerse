import React from 'react';
import { Order, OrderStatusEnum } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/order/OrderDetails.css';

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
  onCancel?: () => Promise<void>;
  onStatusUpdate?: (newStatus: OrderStatusEnum) => Promise<void>;
  isAdmin?: boolean;
  isLoading?: boolean;
}

const STATUS_TIMELINE: OrderStatusEnum[] = [
  OrderStatusEnum.PENDING,
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.SHIPPED,
  OrderStatusEnum.DELIVERED,
];

const STATUS_LABELS: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.PENDING]: 'Pending',
  [OrderStatusEnum.PROCESSING]: 'Processing',
  [OrderStatusEnum.SHIPPED]: 'Shipped',
  [OrderStatusEnum.DELIVERED]: 'Delivered',
  [OrderStatusEnum.CANCELLED]: 'Cancelled',
};

export const OrderDetails: React.FC<OrderDetailsProps> = ({
  order,
  onBack,
  onCancel,
  onStatusUpdate,
  isAdmin = false,
  isLoading = false,
}) => {
  const formattedDate = new Date(order.createdAt || '').toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );

  // Get the latest status from orderStatus history
  const currentStatus = order.orderStatus?.[order.orderStatus.length - 1]?.status || OrderStatusEnum.PENDING;
  const currentStatusIndex = STATUS_TIMELINE.indexOf(currentStatus);

  const canCancel = currentStatus === OrderStatusEnum.PENDING;

  return (
    <div className="order-details-container">
      <button className="back-button" onClick={onBack}>
        ← Back to Orders
      </button>

      <div className="order-details">
        {/* Header */}
        <div className="order-details-header">
          <div>
            <h1>Order #{order.id.slice(-8).toUpperCase()}</h1>
            <p className="order-date">{formattedDate}</p>
          </div>
          <div className="order-status-badge">
            {STATUS_LABELS[currentStatus]}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="status-timeline">
          <h3>Order Status</h3>
          <div className="timeline">
            {STATUS_TIMELINE.map((status, idx) => (
              <div
                key={status}
                className={`timeline-step ${
                  currentStatusIndex >= idx ? 'completed' : ''
                } ${currentStatus === status ? 'current' : ''}`}
              >
                <div className="timeline-dot"></div>
                <div className="timeline-label">{STATUS_LABELS[status]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-details-grid">
          {/* Order Items */}
          <div className="order-items-section">
            <h3>Order Items</h3>
            <div className="items-list">
              {order.orderItems.map((item: any) => (
                <div key={item.id} className="order-item">
                  <div className="item-info">
                    <h4>{item.menuNameSnapshot}</h4>
                    {item.variantNameSnapshot && (
                      <p className="variant-info">{item.variantNameSnapshot}</p>
                    )}
                    {item.addonsTotal > 0 && (
                      <p className="addons-info">
                        Addons: Rs. {item.addonsTotal.toFixed(2)}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <p className="special-notes">{item.specialInstructions}</p>
                    )}
                  </div>
                  <div className="item-pricing">
                    <p className="quantity">x{item.quantity}</p>
                    <p className="unit-price">Rs. {item.unitPriceSnapshot}</p>
                    <p className="line-total">Rs. {item.lineTotal.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pricing-summary">
            <h3>Billing Details</h3>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>
                  Rs.{' '}
                  {(order.subtotal || 0).toFixed(2)}
                </span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>Rs. {(order.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Charge</span>
                <span>Rs. {(order.deliveryFee || 0).toFixed(2)}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total Amount</span>
                <span>Rs. {(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="delivery-info">
            <h3>Delivery Information</h3>
            <div className="info-field">
              <label>Address</label>
              <p>{order.remarks || 'N/A'}</p>
            </div>
            {order.remarks && (
              <div className="info-field">
                <label>Special Instructions</label>
                <p>{order.remarks}</p>
              </div>
            )}
            {order.updatedAt && (
              <div className="info-field">
                <label>Last Updated</label>
                <p>
                  {new Date(order.updatedAt).toLocaleDateString(
                    'en-US',
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="payment-info">
            <h3>Payment</h3>
            <div className="info-field">
              <label>Method</label>
              <p>{order.paymentMethod}</p>
            </div>
            <div className="info-field">
              <label>Status</label>
              <p className={`payment-status payment-${order.paymentStatus}`}>
                {order.paymentStatus}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="order-actions">
          {isAdmin && onStatusUpdate && currentStatus !== OrderStatusEnum.DELIVERED && currentStatus !== OrderStatusEnum.CANCELLED && (
            <div className="admin-actions">
              <select
                className="status-select"
                value={currentStatus}
                onChange={(e) =>
                  onStatusUpdate(e.target.value as OrderStatusEnum)
                }
                disabled={isLoading}
              >
                {STATUS_TIMELINE.filter(
                  (s) =>
                    STATUS_TIMELINE.indexOf(s) >=
                    STATUS_TIMELINE.indexOf(currentStatus)
                ).map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <Button
                variant="primary"
                onClick={() => onStatusUpdate(currentStatus)}
                isLoading={isLoading}
              >
                Update Status
              </Button>
            </div>
          )}

          {!isAdmin && canCancel && onCancel && (
            <Button
              variant="danger"
              onClick={onCancel}
              isLoading={isLoading}
            >
              Cancel Order
            </Button>
          )}

          {!isAdmin && (
            <Button variant="outline" onClick={onBack}>
              Back to Orders
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
