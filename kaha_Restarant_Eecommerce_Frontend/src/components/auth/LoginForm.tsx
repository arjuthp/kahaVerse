import React, { useState } from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { Button } from '../common/Button';
import '../../styles/components/auth/LoginForm.css';

interface LoginFormProps {
  onSubmit: (identifier: string, password: string) => Promise<void>;
  error?: string;
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
  tone?: 'restaurant' | 'customer';
  identifierType?: 'phone' | 'email';
}

interface FormErrors {
  contactNumber?: string;
  password?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  error,
  isLoading = false,
  title = 'Restaurant Login',
  subtitle = 'Sign in to your account',
  tone = 'restaurant',
  identifierType = 'phone',
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!identifier.trim()) {
      errors.contactNumber = identifierType === 'email' ? 'Email is required' : 'Contact number is required';
    } else if (identifierType === 'email') {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
      if (!ok) errors.contactNumber = 'Please enter a valid email';
    } else if (!/^\d{10}$/.test(identifier.replace(/\D/g, ''))) {
      errors.contactNumber = 'Contact number must be 10 digits';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
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
      await onSubmit(identifier, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Preparing login..." />;
  }

  return (
    <form className={`login-form ${tone === 'customer' ? 'login-form--customer' : ''}`} onSubmit={handleSubmit}>
      <div className="login-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {error && (
        <div className="form-error-alert">
          <span className="error-icon">✕</span>
          <p>{error}</p>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="contactNumber">{identifierType === 'email' ? 'Email' : 'Contact Number'}</label>
        <input
          id="contactNumber"
          type={identifierType === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={identifierType === 'email' ? 'you@example.com' : 'Enter your 10-digit contact number'}
          className={`form-control ${
            formErrors.contactNumber ? 'form-control-error' : ''
          }`}
          disabled={isSubmitting}
        />
        {formErrors.contactNumber && (
          <span className="form-error-text">{formErrors.contactNumber}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={`form-control ${
            formErrors.password ? 'form-control-error' : ''
          }`}
          disabled={isSubmitting}
        />
        {formErrors.password && (
          <span className="form-error-text">{formErrors.password}</span>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="large"
        fullWidth
        isLoading={isSubmitting}
      >
        Sign In
      </Button>

      <div className="login-footer">
        <a href="/forgot-password" className="forgot-password">
          Forgot password?
        </a>
        <span className="divider">•</span>
        <a href="/register" className="signup-link">
          Create account
        </a>
      </div>
    </form>
  );
};

export default LoginForm;
