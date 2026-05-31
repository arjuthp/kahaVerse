import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/CheckoutPage.css';

interface Address {
  street: string;
  province: string;
  district: string;
  municipality: string;
  wardNo: string;
  notes: string;
}

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');

  const {
    cartItems = [],
    subtotal = 0,
    tax = 0,
    deliveryFee = 0,
    discount = 0,
    total = 0,
  } = location.state || {};

  const [currentStep, setCurrentStep] = useState<'address' | 'payment' | 'confirmation'>(
    'address'
  );
  const [paymentMethod, setPaymentMethod] = useState<'khalti' | 'esewa' | 'cod'>('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');

  const [address, setAddress] = useState<Address>({
    street: '',
    province: '3',
    district: '28',
    municipality: '54',
    wardNo: '1',
    notes: '',
  });

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const validateAddress = (): boolean => {
    if (!address.street.trim()) {
      setError('Please enter your street address');
      return false;
    }
    if (!address.wardNo.trim()) {
      setError('Please enter your ward number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:3000/api/orders', // Local backend endpoint
        {
          businessId: '7476ee15-1407-41fa-9a49-89e0caaf945d',
          userId: localStorage.getItem('userId'),
          items: cartItems.map((item: any) => ({
            menuItemId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress: address,
          paymentMethod,
          deliveryType: 'delivery',
          notes: address.notes,
          totalAmount: total,
          subtotal,
          tax,
          deliveryFee,
          discount,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setOrderId(response.data.id || 'ORD-' + Date.now());
      setCurrentStep('confirmation');
      
      // Clear cart
      localStorage.removeItem('cart');
    } catch (err: any) {
      console.error('Order error:', err);
      setError(
        err.response?.data?.message ||
        'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="checkout-error">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate('/menu')}>Back to Menu</button>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {/* Header */}
      <header className="checkout-header">
        <h1>🛒 Checkout</h1>
      </header>

      {/* Steps Indicator */}
      <div className="steps-indicator">
        <div className={`step ${currentStep === 'address' ? 'active' : 'completed'}`}>
          <span>1</span>
          <label>Address</label>
        </div>
        <div className={`step ${currentStep === 'payment' ? 'active' : currentStep === 'confirmation' ? 'completed' : ''}`}>
          <span>2</span>
          <label>Payment</label>
        </div>
        <div className={`step ${currentStep === 'confirmation' ? 'active' : ''}`}>
          <span>3</span>
          <label>Confirmation</label>
        </div>
      </div>

      <div className="checkout-content">
        {/* Main Content */}
        <main className="checkout-main">
          {/* Address Step */}
          {currentStep === 'address' && (
            <div className="checkout-section">
              <h2>📍 Delivery Address</h2>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  placeholder="Enter your street address"
                  value={address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className={error.includes('street') ? 'error' : ''}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Province *</label>
                  <select
                    value={address.province}
                    onChange={(e) => handleAddressChange('province', e.target.value)}
                  >
                    <option value="1">Province 1</option>
                    <option value="2">Province 2</option>
                    <option value="3">Province 3 (Bagmati)</option>
                    <option value="4">Province 4</option>
                    <option value="5">Province 5</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>District *</label>
                  <input
                    type="text"
                    placeholder="District code"
                    value={address.district}
                    onChange={(e) => handleAddressChange('district', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Municipality *</label>
                  <input
                    type="text"
                    placeholder="Municipality code"
                    value={address.municipality}
                    onChange={(e) => handleAddressChange('municipality', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Ward No. *</label>
                  <input
                    type="text"
                    placeholder="Ward number"
                    value={address.wardNo}
                    onChange={(e) => handleAddressChange('wardNo', e.target.value)}
                    className={error.includes('ward') ? 'error' : ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Special Instructions (Optional)</label>
                <textarea
                  placeholder="e.g., Ring doorbell twice, leave at gate"
                  value={address.notes}
                  onChange={(e) => handleAddressChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                className="continue-btn"
                onClick={() => setCurrentStep('payment')}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="checkout-section">
              <h2>💳 Payment Method</h2>

              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'khalti' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="khalti"
                    checked={paymentMethod === 'khalti'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'khalti')}
                  />
                  <div className="payment-icon">📱</div>
                  <div className="payment-info">
                    <strong>Khalti</strong>
                    <small>Nepal's most popular digital wallet</small>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'esewa' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="esewa"
                    checked={paymentMethod === 'esewa'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'esewa')}
                  />
                  <div className="payment-icon">💰</div>
                  <div className="payment-info">
                    <strong>eSewa</strong>
                    <small>Quick and secure payment</small>
                  </div>
                </label>

                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                  />
                  <div className="payment-icon">💵</div>
                  <div className="payment-info">
                    <strong>Cash on Delivery</strong>
                    <small>Pay when your order arrives</small>
                  </div>
                </label>
              </div>

              {paymentMethod !== 'cod' && (
                <div className="payment-info-box">
                  ℹ️ You will be redirected to {paymentMethod.toUpperCase()} for payment
                </div>
              )}

              <div className="button-group">
                <button
                  className="back-btn"
                  onClick={() => setCurrentStep('address')}
                >
                  ← Back
                </button>
                <button
                  className="place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {currentStep === 'confirmation' && (
            <div className="checkout-section confirmation">
              <div className="confirmation-icon">✅</div>
              <h2>Order Placed Successfully!</h2>
              <p className="order-id">Order ID: <strong>{orderId}</strong></p>

              <div className="confirmation-details">
                <div className="detail-item">
                  <span>📍 Delivery Address</span>
                  <p>
                    {address.street}, Ward {address.wardNo}
                    <br />
                    Municipality {address.municipality}, District {address.district}
                  </p>
                </div>

                <div className="detail-item">
                  <span>💳 Payment Method</span>
                  <p>{paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}</p>
                </div>

                <div className="detail-item">
                  <span>⏱️ Estimated Delivery</span>
                  <p>30-45 minutes</p>
                </div>
              </div>

              <div className="button-group">
                <button
                  className="track-btn"
                  onClick={() => navigate(`/track/${orderId}`)}
                >
                  Track Order
                </button>
                <button
                  className="home-btn"
                  onClick={() => navigate('/menu')}
                >
                  Back to Menu
                </button>
              </div>
            </div>
          )}
        </main>

        {/* Summary Sidebar */}
        <aside className="checkout-summary">
          <h3>Order Summary</h3>

          <div className="summary-items">
            {cartItems.map((item: any) => (
              <div key={item.id} className="summary-item">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="total-row">
              <span>Tax (9%)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Delivery</span>
              <span className={deliveryFee === 0 ? 'free' : ''}>
                {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
              </span>
            </div>
            {discount > 0 && (
              <div className="total-row discount">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
            <div className="total-row final-total">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="support-info">
            <strong>Need help?</strong>
            <p>Call: 9868348282</p>
            <p>Email: support@kaha.com</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
