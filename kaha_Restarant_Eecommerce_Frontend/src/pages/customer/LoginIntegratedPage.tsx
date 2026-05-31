import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, Toast } from '@/components';
import { authApi } from '@/api/auth.api';
import { useAuth } from '@/context/AuthContext';
import './AuthPages.css';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export const LoginIntegratedPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  const handleLogin = async (contact: string, password: string) => {
    try {
      setLoading(true);
      setError('');

      // Call backend login API (uses contactNumber)
      const response = await authApi.login(contact, password);

      // Store token via AuthContext — correctly sets kaha_token + kaha_user
      login(response.accessToken, response.user);

      showToast('Login successful! Redirecting...', 'success');

      // Redirect based on role
      const userRole = response.user.role?.toLowerCase();
      const redirect = sessionStorage.getItem('post_login_redirect');
      if (redirect) sessionStorage.removeItem('post_login_redirect');
      if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'business_admin' || userRole === 'business_super_admin') {
        setTimeout(() => navigate('/admin'), 1200);
      } else {
        setTimeout(() => navigate(redirect || '/menu'), 1200);
      }
    } catch (err) {
      let errorMessage = 'Login failed';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        errorMessage = axiosErr.response?.data?.message || 'Login failed';
      }
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <h1>KAHA</h1>
          <p>Sign in to order food, track deliveries, and reorder favorites.</p>
          
          <LoginForm
            onSubmit={handleLogin}
            isLoading={loading}
            error={error}
            title="Customer Login"
            subtitle="Continue to your account"
            tone="customer"
            identifierType="phone"
          />

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#888' }}>
            Are you an admin?{' '}
            <a href="/admin/login" style={{ color: 'var(--primary, #c0392b)', fontWeight: 600, textDecoration: 'none' }}>
              Go to Admin Portal →
            </a>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginIntegratedPage;
