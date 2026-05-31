import React from 'react';
import { CartItem } from '../../types';
import '../../styles/components/cart/CartItemRow.css';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemove: (itemId: string) => Promise<void>;
  isLoading?: boolean;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
  isLoading = false,
}) => {
  const itemTotal = item.unitPriceSnapshot * item.quantity;

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) {
      await onRemove(item.id);
      return;
    }
    await onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className="cart-item-row">
      <div className="cart-item-info">
        <h4 className="cart-item-name">{item.menu?.name}</h4>
        <p className="cart-item-price">Rs. {item.unitPriceSnapshot}</p>
        {item.addOns && item.addOns.length > 0 && (
          <div className="cart-item-addons">
            <small>
              Addons: {item.addOns.map(a => a.addon?.name).join(', ')}
            </small>
          </div>
        )}
        {item.specialInstructions && (
          <div className="cart-item-notes">
            <small>Notes: {item.specialInstructions}</small>
          </div>
        )}
      </div>

      <div className="cart-item-quantity">
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isLoading}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="qty-display">{item.quantity}</span>
        <button
          className="qty-btn"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isLoading}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="cart-item-total">
        <p className="total-amount">Rs. {itemTotal}</p>
      </div>

      <button
        className="cart-item-remove"
        onClick={() => onRemove(item.id)}
        disabled={isLoading}
        aria-label="Remove item"
      >
        🗑️
      </button>
    </div>
  );
};

export default CartItemRow;
