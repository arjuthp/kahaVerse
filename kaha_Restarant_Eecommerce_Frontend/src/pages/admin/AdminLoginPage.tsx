import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import './AdminLoginPage.css';

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ contactNumber: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedContact = localStorage.getItem('kaha_admin_remembered_contact');
    const savedPassword = localStorage.getItem('kaha_admin_remembered_password');
    const savedRemember = localStorage.getItem('kaha_admin_remember_me') === 'true';
    if (savedRemember) {
      if (savedContact) setForm(f => ({ ...f, contactNumber: savedContact }));
      if (savedPassword) setForm(f => ({ ...f, password: savedPassword }));
      setRememberMe(true);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('kaha_admin_remembered_contact', form.contactNumber);
        localStorage.setItem('kaha_admin_remembered_password', form.password);
        localStorage.setItem('kaha_admin_remember_me', 'true');
      } else {
        localStorage.removeItem('kaha_admin_remembered_contact');
        localStorage.removeItem('kaha_admin_remembered_password');
        localStorage.setItem('kaha_admin_remember_me', 'false');
      }
      const { accessToken, refreshToken, user } = await authApi.adminLogin(form.contactNumber, form.password);
      localStorage.setItem('kaha_refresh_token', refreshToken);
      login(accessToken, user);
      toast.success('Admin Verified Successfully');
      navigate('/admin');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid admin credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* ── Left branding panel ── */}
      <div className="admin-login__brand">
        <div className="admin-login__brand-logo">KAHA</div>
        <div className="admin-login__brand-sub">Business Portal</div>

        <div className="admin-login__brand-tagline">
          Manage your<br />
          restaurant <span>smarter</span>.
        </div>
        <p className="admin-login__brand-desc">
          Full control over your menu, orders, categories,
          and customer experience — all in one place.
        </p>

        <div className="admin-login__features">
          <div className="admin-login__feature">
            <div className="admin-login__feature-dot" />
            Real-time order management
          </div>
          <div className="admin-login__feature">
            <div className="admin-login__feature-dot" />
            Menu & category control
          </div>
          <div className="admin-login__feature">
            <div className="admin-login__feature-dot" />
            Addon customization
          </div>
          <div className="admin-login__feature">
            <div className="admin-login__feature-dot" />
            User & analytics overview
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="admin-login__form-panel">
        <div className="admin-login__card">
          {/* Icon + title */}
          <div className="admin-login__card-header">
            <div className="admin-login__card-icon">
              <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h1 className="admin-login__card-title">Admin Sign In</h1>
            <p className="admin-login__card-subtitle">Restricted access — authorised personnel only</p>
          </div>

          {/* Credentials hint */}
          <div className="admin-login__hint">
            <strong>Demo Credentials:</strong><br />
            Contact: <code>9813870231</code><br />
            Password: <code>ishwor19944</code>
            <button
              type="button"
              onClick={() => setForm({ contactNumber: '9813870231', password: 'ishwor19944' })}
              style={{ marginTop: '10px', width: '100%', padding: '6px', fontSize: '12px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
            >
              ⚡ Auto-Fill Demo Admin Credentials
            </button>
          </div>

          {/* Form */}
          <form className="admin-login__form" onSubmit={handleLoginSubmit}>
            <div className="admin-login__field">
              <label>Admin Contact Number</label>
              <input
                type="text"
                className="admin-login__input"
                placeholder="e.g. 9813870231"
                value={form.contactNumber}
                onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                required
              />
            </div>

            <div className="admin-login__field">
              <label>Password</label>
              <div className="admin-login__input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="admin-login__input"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  className="admin-login__show-btn"
                  onClick={() => setShowPass(s => !s)}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="admin-remember-wrap" style={{ display: 'flex', alignItems: 'center', margin: '15px 0', gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#c0392b', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                Remember my admin session
              </label>
            </div>

            <button
              type="submit"
              className="admin-login__submit"
              disabled={loading}
            >
              {loading
                ? <div className="admin-login__spinner" />
                : 'Log In as Admin'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
