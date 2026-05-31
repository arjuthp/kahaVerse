import React, { useState } from 'react';
import { Cart, PaymentMethodEnum } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/checkout/CheckoutForm.css';

interface CheckoutFormProps {
  cart: Cart;
  onSubmit: (data: CheckoutData) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
}

export interface CheckoutData {
  deliveryAddress: string;
  deliveryNotes: string;
  paymentMethod: PaymentMethodEnum;
}

interface FormErrors {
  deliveryAddress?: string;
  paymentMethod?: string;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  cart,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CheckoutData>({
    deliveryAddress: '',
    deliveryNotes: '',
    paymentMethod: PaymentMethodEnum.CASH,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required';
    } else if (formData.deliveryAddress.length < 10) {
      errors.deliveryAddress = 'Address must be at least 10 characters';
    }

    if (!formData.paymentMethod) {
      errors.paymentMethod = 'Payment method is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = cart.cartItems.reduce(
    (sum, item) => sum + item.unitPriceSnapshot * item.quantity,
    0
  );
  const tax = Math.round(subtotal * 0.1 * 100) / 100;
  const deliveryCharge = 50;
  const total = subtotal + tax + deliveryCharge;

  return (
    <div className="checkout-container">
      <div className="checkout-form-section">
        <button className="back-button" onClick={onBack}>
          ← Back to Cart
        </button>

        <form className="checkout-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>Delivery Information</h2>

            <div className="form-group">
              <label htmlFor="deliveryAddress">Delivery Address *</label>
              <textarea
                id="deliveryAddress"
                value={formData.deliveryAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryAddress: e.target.value,
                  })
                }
                placeholder="Enter your full delivery address"
                className={`form-control ${
                  formErrors.deliveryAddress ? 'form-control-error' : ''
                }`}
                rows={4}
                disabled={isSubmitting}
              />
              {formErrors.deliveryAddress && (
                <span className="form-error-text">
                  {formErrors.deliveryAddress}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="deliveryNotes">Special Instructions (Optional)</label>
              <textarea
                id="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    deliveryNotes: e.target.value,
                  })
                }
                placeholder="E.g., Ring the doorbell, Leave at the door"
                className="form-control"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          </section>

          <section className="form-section">
            <h2>Payment Method</h2>

            <div className="payment-options">
              {Object.values(PaymentMethodEnum).map((method) => (
                <label key={method} className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method}
                    checked={formData.paymentMethod === method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentMethod: e.target.value as PaymentMethodEnum,
                      })
                    }
                    disabled={isSubmitting}
                  />
                  <span className="payment-label">{method}</span>
                </label>
              ))}
            </div>

            {formErrors.paymentMethod && (
              <span className="form-error-text">{formErrors.paymentMethod}</span>
            )}
          </section>

          <div className="form-actions">
            <Button
              type="button"
              variant="outline"
              size="large"
              onClick={onBack}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isSubmitting}
            >
              Place Order
            </Button>
          </div>
        </form>
      </div>

      <div className="checkout-summary-section">
        <div className="summary-card">
          <h3>Order Summary</h3>

          <div className="summary-items">
            {cart.cartItems.map((item) => (
              <div key={item.id} className="summary-item">
                <span className="item-name">{item.menu?.name}</span>
                <span className="item-qty">x{item.quantity}</span>
                <span className="item-price">
                  Rs. {(item.unitPriceSnapshot * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

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

          <div className="security-notice">
            <p>🔒 Your payment information is secure and encrypted</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
