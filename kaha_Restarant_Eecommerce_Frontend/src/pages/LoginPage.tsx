import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/LoginPage.css';

interface LoginFormData {
  contactNumber: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  role: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<LoginFormData>({
    contactNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(''); // Clear error on input change
  };

  const validateForm = (): boolean => {
    if (!formData.contactNumber.trim()) {
      setError('Contact number is required');
      return false;
    }
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.contactNumber.length < 10) {
      setError('Invalid contact number format');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post<LoginResponse>(
        'https://api.kaha.com.np/main/api/v3/auth/login',
        {
          contactNumber: formData.contactNumber,
          password: formData.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { accessToken, role } = response.data;

      // Store token and user info in localStorage
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('userRole', role);
      localStorage.setItem('contactNumber', formData.contactNumber);

      // Redirect based on role
      if (role === 'admin' || role === 'staff') {
        navigate('/dashboard');
      } else {
        navigate('/menu');
      }
    } catch (err: any) {
      console.error('Login error:', err);

      if (err.response?.status === 401) {
        setError('Invalid contact number or password');
      } else if (err.response?.status === 429) {
        setError('Too many login attempts. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h1>🍽️ KAHA Restaurant</h1>
          <p>Order delicious food online</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="contactNumber">📱 Contact Number</label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Enter your contact number"
              disabled={loading}
              className={error ? 'input-error' : ''}
            />
            <small className="help-text">Example: 9813870231</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">🔒 Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
                className={error ? 'input-error' : ''}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="toggle-password"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        {/* Test Credentials Info */}
        <div className="test-credentials">
          <details>
            <summary>🧪 Test Credentials (Demo Only)</summary>
            <div className="credentials-table">
              <p>
                <strong>Contact:</strong> 9813870231
              </p>
              <p>
                <strong>Password:</strong> ishwor19944
              </p>
            </div>
          </details>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <p>
            Trouble logging in?{' '}
            <a href="#support">Contact Support</a>
          </p>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="login-background">
        <div className="decoration-circle decoration-1"></div>
        <div className="decoration-circle decoration-2"></div>
        <div className="decoration-circle decoration-3"></div>
      </div>
    </div>
  );
};

export default LoginPage;
