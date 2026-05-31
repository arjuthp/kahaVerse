import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import type { CartItem } from '../../types';
import './CartPage.css';

const CartPage: React.FC = () => {
  const { cart, loading, fetchCart, removeItem, updateItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart?.cartItems) {
      setSelectedItemIds(cart.cartItems.map(item => item.id));
    }
  }, [cart]);

  const toggleSelectItem = (itemId: string) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty__icon">🔒</div>
            <h2>Please log in</h2>
            <p>You need to be logged in to view your cart.</p>
            <button className="cart-checkout-btn" onClick={() => navigate('/login')} style={{ maxWidth: '300px' }}>
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  if (!cart || cart.cartItems?.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet. Browse our menu to find something delicious.</p>
            <button
              className="cart-checkout-btn"
              onClick={() => navigate('/menu')}
              style={{ maxWidth: '300px' }}
            >
              Browse Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const grandTotal = cart.cartItems
    .filter(item => selectedItemIds.includes(item.id))
    .reduce((sum, item) => {
      const base = item.unitPriceSnapshot * item.quantity;
      const addons = item.addOns?.reduce((a, addon) => a + (Number(addon.addon?.price) || 0) * (addon.quantity || 1), 0) ?? 0;
      return sum + base + addons;
    }, 0);

  return (
    <div className="cart-page">
      <div className="container">
        
        <div className="cart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>Your Cart</h1>
            <p>Review your items before checkout.</p>
          </div>
          <button className="btn btn-ghost text-error" onClick={clearCart}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Clear Cart
          </button>
        </div>

        <div className="cart-grid">
          {/* Cart Items */}
          <div className="cart-items-list">
            {cart.cartItems.map(item => (
              <CartItemRow
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                onToggleSelect={() => toggleSelectItem(item.id)}
                onRemove={() => removeItem(item.id)}
                onUpdate={(qty) => updateItem(item.id, qty)}
              />
            ))}
          </div>

          {/* Order Summary */}
          <div className="cart-summary">
            <div className="cart-summary-card">
              <h3 className="cart-summary-title">Order Summary</h3>
              
              <div className="cart-summary-rows">
                {cart.cartItems
                  .filter(item => selectedItemIds.includes(item.id))
                  .map(item => {
                    const addonsTotal = item.addOns?.reduce((a, addon) => a + (Number(addon.addon?.price) || 0) * (addon.quantity || 1), 0) ?? 0;
                    const lineTotal = (item.unitPriceSnapshot * item.quantity) + addonsTotal;
                    return (
                      <div key={item.id} className="cart-summary-row">
                        <span>{item.quantity}x {item.menu?.name ?? 'Item'}</span>
                        <span>NPR {lineTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                {selectedItemIds.length === 0 && (
                  <div className="cart-summary-row" style={{ color: 'var(--slate-gray)', fontSize: '13px' }}>
                    No items selected for checkout
                  </div>
                )}
              </div>

              <div className="cart-summary-divider" />

              <div className="cart-summary-total">
                <span className="cart-summary-total-label">Total Amount</span>
                <span className="cart-summary-total-amount">NPR {grandTotal.toFixed(2)}</span>
              </div>

              <button 
                className="cart-checkout-btn" 
                onClick={() => navigate('/checkout', { state: { selectedItemIds } })}
                disabled={selectedItemIds.length === 0}
                style={{ opacity: selectedItemIds.length === 0 ? 0.6 : 1, cursor: selectedItemIds.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Proceed to Checkout
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>

              <p className="cart-terms">
                Taxes & delivery fees calculated at checkout.
              </p>
            </div>
            
            <div className="cart-upsell">
              <div className="cart-upsell-icon">💡</div>
              <p className="cart-upsell-text">
                <strong>Pro tip:</strong> Add a refreshing drink to your order to complete your meal.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

interface CartItemRowProps {
  item: CartItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
  onUpdate: (qty: number) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, isSelected, onToggleSelect, onRemove, onUpdate }) => {
  const addonsTotal = item.addOns?.reduce((a, addon) => a + (Number(addon.addon?.price) || 0) * (addon.quantity || 1), 0) ?? 0;
  const lineTotal = (item.unitPriceSnapshot * item.quantity) + addonsTotal;

  return (
    <div className={`cart-item ${isSelected ? 'cart-item--selected' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="cart-item__select" style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      </div>
      <div className="cart-item__img-wrap" style={{ flexShrink: 0 }}>
        <img
          src={item.menu?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
          alt={item.menu?.name}
          className="cart-item__img"
        />
      </div>
      
      <div className="cart-item__body" style={{ flexGrow: 1 }}>
        <div className="cart-item__top">
          <div className="cart-item__row">
            <h4 className="cart-item__name">{item.menu?.name ?? 'Menu Item'}</h4>
            <span className="cart-item__remove" onClick={onRemove}>Remove</span>
          </div>
          {item.menuVariant && (
            <p className="cart-item__meta">Size: {item.menuVariant.name}</p>
          )}
          {item.addOns?.length > 0 && (
            <p className="cart-item__meta" style={{ color: 'var(--secondary)' }}>
              Add-ons: {item.addOns.map(a => a.addon?.name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <div className="cart-item__actions">
          <div className="cart-item__qty">
            <button className="cart-item__qty-btn" onClick={() => onUpdate(item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
            <span className="cart-item__qty-count">{item.quantity}</span>
            <button className="cart-item__qty-btn" onClick={() => onUpdate(item.quantity + 1)}>+</button>
          </div>
          <span className="price">NPR {lineTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
