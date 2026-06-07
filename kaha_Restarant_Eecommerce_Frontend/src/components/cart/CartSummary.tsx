import React from 'react';
import { Cart } from '../../types';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { CartItemRow } from './CartItemRow';
import '../../styles/components/cart/CartSummary.css';

interface CartSummaryProps {
  cart: Cart | null;
  onUpdateItem: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onCheckout: () => void;
  onContinueShopping: () => void;
  isLoading?: boolean;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  cart,
  onUpdateItem,
  onRemoveItem,
  onCheckout,
  onContinueShopping,
  isLoading = false,
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Loading cart..." />;
  }

  if (!cart || cart.cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to get started</p>
        <Button
          variant="primary"
          size="large"
          onClick={onContinueShopping}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  // Calculate totals
  const subtotal = cart.cartItems.reduce(
    (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
  const deliveryCharge = 50; // Fixed delivery charge
  const total = subtotal + tax + deliveryCharge;

  return (
    <div className="cart-container">
      <div className="cart-items-section">
        <h2>Shopping Cart ({cart.cartItems.length} items)</h2>
        <div className="cart-items-list">
          {cart.cartItems.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateItem}
              onRemove={onRemoveItem}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      <div className="cart-summary-section">
        <div className="summary-card">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Tax (10%)</span>
            <span>Rs. {tax.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Delivery Charge</span>
            <span>Rs. {deliveryCharge}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span>Total Amount</span>
            <span>Rs. {total.toFixed(2)}</span>
          </div>

          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={onCheckout}
            className="checkout-btn"
          >
            Proceed to Checkout
          </Button>

          <Button
            variant="outline"
            size="large"
            fullWidth
            onClick={onContinueShopping}
            className="continue-btn"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
