import React from 'react';
import { Order, OrderStatusEnum } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/order/OrderCard.css';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onCancel?: (order: Order) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.PENDING]: 'status-pending',
  [OrderStatusEnum.PROCESSING]: 'status-confirmed',
  [OrderStatusEnum.SHIPPED]: 'status-preparing',
  [OrderStatusEnum.DELIVERED]: 'status-delivered',
  [OrderStatusEnum.CANCELLED]: 'status-cancelled',
};

const STATUS_LABELS: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.PENDING]: 'Pending',
  [OrderStatusEnum.PROCESSING]: 'Processing',
  [OrderStatusEnum.SHIPPED]: 'Shipped',
  [OrderStatusEnum.DELIVERED]: 'Delivered',
  [OrderStatusEnum.CANCELLED]: 'Cancelled',
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onViewDetails,
  onCancel,
  isLoading = false,
}) => {
  // Get the latest status from orderStatus history
  const currentStatus = order.orderStatus?.[order.orderStatus.length - 1]?.status || OrderStatusEnum.PENDING;
  
  const canCancel = currentStatus === OrderStatusEnum.PENDING;

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCancel && window.confirm('Are you sure you want to cancel this order?')) {
      await onCancel(order);
    }
  };

  const formattedDate = new Date(order.createdAt || '').toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
  );

  return (
    <div className="order-card">
      <div className="order-card-header">
        <div className="order-info">
          <h3 className="order-id">Order #{order.id.slice(-8).toUpperCase()}</h3>
          <p className="order-date">{formattedDate}</p>
        </div>
        <div className={`order-status ${STATUS_COLORS[currentStatus]}`}>
          {STATUS_LABELS[currentStatus]}
        </div>
      </div>

      <div className="order-card-body">
        <div className="order-items">
          <p className="items-count">
            {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
          </p>
          <div className="items-preview">
            {order.orderItems.slice(0, 2).map((item, idx) => (
              <span key={idx} className="item-preview">
                {item.menuNameSnapshot}
              </span>
            ))}
            {order.orderItems.length > 2 && (
              <span className="items-more">+{order.orderItems.length - 2} more</span>
            )}
          </div>
        </div>

        <div className="order-amount">
          <p className="amount-label">Amount</p>
          <p className="amount-value">Rs. {order.totalAmount?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="order-card-footer">
        <Button
          variant="outline"
          size="small"
          onClick={() => onViewDetails(order)}
        >
          View Details
        </Button>
        {canCancel && onCancel && (
          <Button
            variant="danger"
            size="small"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel Order
          </Button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;
