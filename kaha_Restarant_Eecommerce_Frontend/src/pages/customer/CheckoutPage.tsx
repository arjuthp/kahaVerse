import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import { useCart } from '../../context/CartContext';
import { ServiceTypeEnum, PaymentMethodEnum } from '../../types';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const CheckoutPage: React.FC = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [serviceType, setServiceType] = useState<ServiceTypeEnum>(ServiceTypeEnum.DINE_IN);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodEnum>(PaymentMethodEnum.CASH);
  const [tableNumber, setTableNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  // Prefer businessId from the cart (most reliable), fall back to env
  const BUSINESS_ID = (cart as any)?.businessId || import.meta.env.VITE_BUSINESS_ID || '';

  const selectedItemIds = (location.state as any)?.selectedItemIds as string[] | undefined;

  const activeItems = cart?.cartItems?.filter(item => 
    !selectedItemIds || selectedItemIds.includes(item.id)
  ) || [];

  const subtotal = activeItems.reduce((sum, item) => {
    const base = item.unitPriceSnapshot * item.quantity;
    const addons = item.addOns?.reduce((a, addon) => a + (Number(addon.addon?.price) || 0) * (addon.quantity || 1), 0) ?? 0;
    return sum + base + addons;
  }, 0);

  const taxAmount = subtotal * 0.13;
  const deliveryFee = serviceType === ServiceTypeEnum.DELIVERY ? 50 : 0;
  const serviceCharge = 10;
  const discountAmount = 0;
  const grandTotal = subtotal + taxAmount + deliveryFee + serviceCharge - discountAmount + tipAmount;

  const handlePlaceOrder = async () => {
    if (!cart?.id || !activeItems.length) { toast.error('Your checkout selection is empty'); return; }
    setLoading(true);
    try {
      const res = await orderApi.createOrderFromCart({
        cartItemIds: activeItems.map(item => item.id),
        businessId: BUSINESS_ID,
        serviceType,
        tableNumber: serviceType === ServiceTypeEnum.DINE_IN ? tableNumber : undefined,
        paymentMethod,
        remarks: remarks.trim() ? remarks : undefined,
        deliveryFee,
        serviceCharge,
        tipAmount,
        discountAmount
      });
      if (res.order?.id) {
        setOrderId(res.order.id);
        setPlaced(true);
        await fetchCart();
      } else {
        toast.error('Order placed, but could not retrieve ID.');
        setPlaced(true);
        await fetchCart();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'rgba(39,174,96,0.12)', color: 'var(--status-delivered)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2>Order Placed Successfully!</h2>
            <p>Your order is confirmed and is being prepared.</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button className="btn btn-primary" onClick={() => navigate(`/orders/${orderId}`)}>Track Order</button>
              <button className="btn btn-secondary" onClick={() => navigate('/orders')}>All Orders</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const serviceOptions = [
    { value: ServiceTypeEnum.DINE_IN, label: 'Dine In', icon: '🍽️', desc: 'Eat at the restaurant' },
    { value: ServiceTypeEnum.TAKEAWAY, label: 'Takeaway', icon: '🛍️', desc: 'Pick up your order' },
    { value: ServiceTypeEnum.DELIVERY, label: 'Delivery', icon: '🚚', desc: 'Delivered to your door' },
  ];

  const paymentOptions = [
    { value: PaymentMethodEnum.CASH, label: 'Cash', sub: 'Pay in person' },
    { value: PaymentMethodEnum.CARD, label: 'Card', sub: 'Credit/Debit Card' },
    { value: PaymentMethodEnum.ONLINE, label: 'Online', sub: 'eSewa/Khalti' },
    { value: PaymentMethodEnum.COD, label: 'Cash on Delivery', sub: 'Pay when it arrives' },
  ];

  return (
    <div className="checkout-page">
      <div className="container">
        
        <button className="btn btn-ghost" onClick={() => navigate('/cart')} style={{ marginBottom: '24px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Cart
        </button>

        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', marginBottom: '32px' }}>Secure Checkout</h1>

        <div className="checkout-grid">
          {/* Left Form Area */}
          <div className="checkout-form">
            
            <section className="checkout-section">
              <div className="checkout-section-head">
                <div className="checkout-step-num">1</div>
                <h2>Service Type</h2>
              </div>
              
              <div className="service-type-grid">
                {serviceOptions.map(opt => (
                  <label key={opt.value} className="service-type-card">
                    <input 
                      type="radio" 
                      name="serviceType" 
                      checked={serviceType === opt.value} 
                      onChange={() => setServiceType(opt.value)} 
                    />
                    <div className="service-type-card__inner">
                      <div className="service-type-card__icon">{opt.icon}</div>
                      <div className="service-type-card__label">{opt.label}</div>
                    </div>
                  </label>
                ))}
              </div>

              {serviceType === ServiceTypeEnum.DINE_IN && (
                <div className="checkout-context-fields">
                  <label className="input-label">Table Number *</label>
                  <input
                    className="input"
                    placeholder="e.g., Table 5"
                    value={tableNumber}
                    onChange={e => setTableNumber(e.target.value)}
                  />
                </div>
              )}
            </section>

            <section className="checkout-section">
              <div className="checkout-section-head">
                <div className="checkout-step-num">2</div>
                <h2>Order Details</h2>
              </div>
              <div className="input-group">
                <label className="input-label">Remarks / Special Notes</label>
                <textarea
                  className="input"
                  placeholder="e.g., Extra spicy, ring doorbell twice..."
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label className="input-label">Add a Tip (NPR)</label>
                <div className="tip-row">
                  {[0, 50, 100, 200].map(amt => (
                    <button 
                      key={amt} 
                      className={`tip-btn ${tipAmount === amt ? 'tip-btn--active' : ''}`}
                      onClick={() => setTipAmount(amt)}
                    >
                      {amt === 0 ? 'No Tip' : `NPR ${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="checkout-section">
              <div className="checkout-section-head">
                <div className="checkout-step-num">3</div>
                <h2>Payment Method</h2>
              </div>
              <div className="payment-method-list">
                {paymentOptions.map(opt => (
                  <label key={opt.value} className="payment-method-item" style={{ borderColor: paymentMethod === opt.value ? 'var(--primary)' : '', background: paymentMethod === opt.value ? 'rgba(177,36,1,0.04)' : '' }}>
                    <input 
                      type="radio" 
                      name="paymentMethod" 
                      checked={paymentMethod === opt.value} 
                      onChange={() => setPaymentMethod(opt.value)} 
                    />
                    <div className="payment-method-info">
                      <div className="payment-method-name">{opt.label}</div>
                      <div className="payment-method-sub">{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

          </div>

          {/* Right Summary */}
          <aside className="checkout-summary">
            <div className="checkout-summary-head">
              <h3>Order Summary</h3>
              <p>{activeItems.length} ITEMS</p>
            </div>
            
            <div className="checkout-items-list">
              {activeItems.map(item => {
                const itemAddonsTotal = item.addOns?.reduce((a, addon) => a + (Number(addon.addon?.price) || 0) * (addon.quantity || 1), 0) ?? 0;
                const linePrice = (item.unitPriceSnapshot * item.quantity) + itemAddonsTotal;
                return (
                  <div key={item.id} className="checkout-item">
                    <div className="checkout-item-img">
                      <img src={item.menu?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80'} alt="" />
                    </div>
                    <div className="checkout-item-info">
                      <h4 className="checkout-item-name">{item.menu?.name}</h4>
                      <div className="checkout-item-qty">Qty: {item.quantity}</div>
                    </div>
                    <div className="checkout-item-price">
                      NPR {linePrice.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="checkout-breakdown">
              <div className="checkout-breakdown-row">
                <span>Subtotal</span><span>NPR {subtotal.toFixed(2)}</span>
              </div>
              <div className="checkout-breakdown-row">
                <span>Tax (13%)</span><span>NPR {taxAmount.toFixed(2)}</span>
              </div>
              {deliveryFee > 0 && (
                <div className="checkout-breakdown-row">
                  <span>Delivery Fee</span><span>NPR {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="checkout-breakdown-row">
                <span>Service Charge</span><span>NPR {serviceCharge.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="checkout-breakdown-row">
                  <span>Tip</span><span>NPR {tipAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="checkout-total">
              <div className="checkout-total-row">
                <span className="checkout-total-label">Total</span>
                <div style={{ textAlign: 'right' }}>
                  <div className="checkout-total-amount">NPR {grandTotal.toFixed(2)}</div>
                  <div className="checkout-total-tax">Includes taxes & fees</div>
                </div>
              </div>
              
              <button className="checkout-place-btn" onClick={handlePlaceOrder} disabled={loading}>
                {loading ? <div className="spinner" /> : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    Confirm & Place Order
                  </>
                )}
              </button>
              
              <div className="checkout-secure">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Secure, encrypted transaction
              </div>
            </div>
            
          </aside>
        </div>

      </div>
    </div>
  );
};

export default CheckoutPage;
