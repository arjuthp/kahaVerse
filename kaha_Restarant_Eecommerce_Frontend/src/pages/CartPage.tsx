import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/CartPage.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      setCartItems(items);
      // Select all items by default
      setSelectedItems(new Set(items.map((item: CartItem) => item.id)));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate totals based on selected items
  const selectedItemsList = cartItems.filter((item) => selectedItems.has(item.id));
  const subtotal = selectedItemsList.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.09; // 9% tax
  const deliveryFee = subtotal > 500 ? 0 : 100; // Free delivery on orders > 500
  const discountAmount = discount;
  const total = subtotal + tax + deliveryFee - discountAmount;

  const handleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cartItems.map((item) => item.id)));
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeItem = (itemId: string) => {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
    const newSelected = new Set(selectedItems);
    newSelected.delete(itemId);
    setSelectedItems(newSelected);
  };

  const applyCoupon = () => {
    // Mock coupon codes
    const coupons: { [key: string]: number } = {
      SAVE10: subtotal * 0.1,
      SAVE20: subtotal * 0.2,
      WELCOME50: 50,
    };

    if (coupons[promoCode.toUpperCase()]) {
      setDiscount(coupons[promoCode.toUpperCase()]);
      setAppliedPromo(promoCode.toUpperCase());
      setPromoCode('');
    } else {
      alert('Invalid coupon code');
    }
  };

  const removeCoupon = () => {
    setDiscount(0);
    setAppliedPromo('');
  };

  const handleCheckout = () => {
    if (selectedItemsList.length === 0) {
      alert('Please select at least one item to proceed');
      return;
    }
    navigate('/checkout', {
      state: {
        cartItems: selectedItemsList,
        subtotal,
        tax,
        deliveryFee,
        discount: discountAmount,
        total,
      },
    });
  };

  return (
    <div className="cart-container">
      <header className="cart-header">
        <button className="back-btn" onClick={() => navigate('/menu')}>
          ← Back to Menu
        </button>
        <h1>🛒 Shopping Cart</h1>
      </header>

      <div className="cart-content">
        {/* Cart Items */}
        <main className="cart-main">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-illustration">🛒</div>
              <h2>Your cart is empty</h2>
              <p>Add some delicious items to get started!</p>
              <button
                className="continue-shopping"
                onClick={() => navigate('/menu')}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {/* Select All Option */}
              <div className="select-all-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === cartItems.length && cartItems.length > 0}
                    onChange={handleSelectAll}
                  />
                  <span>Select All Items ({cartItems.length})</span>
                </label>
              </div>

              {cartItems.map((item) => (
                <div key={item.id} className={`cart-item ${selectedItems.has(item.id) ? 'selected' : ''}`}>
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                    />
                  </div>

                  <div className="item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <div className="placeholder">🍲</div>
                    )}
                  </div>

                  <div className="item-details">
                    <h3>{item.name}</h3>
                    <p className="item-price">₹{item.price} per item</p>
                  </div>

                  <div className="quantity-control">
                    <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                      −
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(item.id, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      min="1"
                    />
                    <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                      +
                    </button>
                  </div>

                  <div className="item-total">
                    <span>₹{item.price * item.quantity}</span>
                  </div>

                  <button
                    className="remove-btn"
                    onClick={() => removeItem(item.id)}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <aside className="cart-summary">
            <h2>Order Summary</h2>

            {/* Coupon Section */}
            <div className="coupon-section">
              <h3>🎟️ Apply Coupon</h3>
              {appliedPromo ? (
                <div className="coupon-applied">
                  <span>
                    ✓ {appliedPromo} applied
                    <br />
                    <small>Discount: ₹{discountAmount}</small>
                  </span>
                  <button onClick={removeCoupon} className="remove-coupon">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="coupon-input">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                  />
                  <button onClick={applyCoupon}>Apply</button>
                </div>
              )}
              <small className="coupon-hint">
                💡 Try: SAVE10, SAVE20, or WELCOME50
              </small>
            </div>

            {/* Price Breakdown */}
            <div className="price-breakdown">
              <div className="breakdown-row">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="breakdown-row">
                <span>Tax (9%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="breakdown-row">
                <span>Delivery Fee</span>
                <span className={deliveryFee === 0 ? 'free' : ''}>
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="breakdown-row discount">
                  <span>Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              <div className="breakdown-row total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="delivery-info">
              <div className="info-item">
                <span>⏱️ Estimated Time</span>
                <span>30-45 minutes</span>
              </div>
              <div className="info-item">
                <span>📍 Delivery Area</span>
                <span>Kathmandu Valley</span>
              </div>
            </div>

            {/* Checkout Button */}
            <button className="checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>

            <p className="secure-note">🔒 Secure payment processed</p>
          </aside>
        )}
      </div>
    </div>
  );
};

export default CartPage;
