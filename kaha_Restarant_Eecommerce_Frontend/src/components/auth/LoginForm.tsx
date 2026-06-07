import React, { useState, useEffect } from 'react';
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
  const [rememberMe, setRememberMe] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedIdentifier = localStorage.getItem('kaha_remembered_identifier');
    const savedPassword = localStorage.getItem('kaha_remembered_password');
    const savedRemember = localStorage.getItem('kaha_remember_me') === 'true';
    if (savedRemember) {
      if (savedIdentifier) setIdentifier(savedIdentifier);
      if (savedPassword) setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

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
      if (rememberMe) {
        localStorage.setItem('kaha_remembered_identifier', identifier);
        localStorage.setItem('kaha_remembered_password', password);
        localStorage.setItem('kaha_remember_me', 'true');
      } else {
        localStorage.removeItem('kaha_remembered_identifier');
        localStorage.removeItem('kaha_remembered_password');
        localStorage.setItem('kaha_remember_me', 'false');
      }
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

      <div className="form-remember-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0 20px 0' }}>
        <label className="remember-me" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#555' }}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
          />
          Remember me
        </label>
      </div>

      <div className="quick-fill-helper" style={{ margin: '15px 0', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px dashed #ccc' }}>
        <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#666', textAlign: 'center' }}>⚡ Quick Fill Test Accounts</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => {
              setIdentifier('9811111122');
              setPassword('password123');
            }}
            style={{ padding: '6px 10px', fontSize: '11px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >
            👤 Customer (9811111122)
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentifier('admin@kahaeats.com');
              setPassword('admin123');
            }}
            style={{ padding: '6px 10px', fontSize: '11px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
          >
            🛡️ Admin (admin@kahaeats.com)
          </button>
        </div>
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
