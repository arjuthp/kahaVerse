import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ contactNumber: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedContact = localStorage.getItem('kaha_remembered_contact');
    const savedPassword = localStorage.getItem('kaha_remembered_password');
    const savedRemember = localStorage.getItem('kaha_remember_me') === 'true';
    if (savedRemember) {
      if (savedContact) setForm(f => ({ ...f, contactNumber: savedContact }));
      if (savedPassword) setForm(f => ({ ...f, password: savedPassword }));
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('kaha_remembered_contact', form.contactNumber);
        localStorage.setItem('kaha_remembered_password', form.password);
        localStorage.setItem('kaha_remember_me', 'true');
      } else {
        localStorage.removeItem('kaha_remembered_contact');
        localStorage.removeItem('kaha_remembered_password');
        localStorage.setItem('kaha_remember_me', 'false');
      }
      const { accessToken, refreshToken, user } = await authApi.login(form.contactNumber, form.password);
      localStorage.setItem('kaha_refresh_token', refreshToken);
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name || 'Customer'}!`);
      navigate('/menu');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Invalid contact number or password';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left Branding Panel ── */}
      <div className="auth-brand-panel">
        <Link to="/menu" className="auth-brand__logo">
          KAHA<span>Eats</span>
        </Link>
        
        <h2 className="auth-brand__tagline">
          Savor the <span>Extraordinary</span>
        </h2>
        
        <p className="auth-brand__desc">
          Order handcrafted meals from local artisans, delivered straight to your door or prepared fresh for dine-in.
        </p>

        <div className="auth-brand__features">
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Real-time order tracking & status updates
          </div>
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Signature gourmet recipes & options
          </div>
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Dine-in, delivery, & express takeaway
          </div>
        </div>

        <Link to="/menu" className="auth-brand__back-link">
          ← Back to Menu
        </Link>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Welcome Back</h1>
            <p>Log in to access your saved addresses and order history.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Contact Number or Email</label>
              <input
                type="text"
                className="input"
                placeholder="98XXXXXXXX or you@example.com"
                value={form.contactNumber}
                onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#929397',
                    fontWeight: '800', fontSize: '13px'
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="remember-wrap" style={{ display: 'flex', alignItems: 'center', margin: '15px 0', gap: '8px' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#c0392b', cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#666', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            <div className="quick-fill-helper" style={{ margin: '15px 0', padding: '10px', background: '#f8f9fa', borderRadius: '6px', border: '1px dashed #ccc' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 600, color: '#666', textAlign: 'center' }}>⚡ Quick Fill Test Accounts</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setForm({ contactNumber: '9811111122', password: 'password123' })}
                  style={{ padding: '6px 10px', fontSize: '11px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, color: '#333' }}
                >
                  👤 Customer (9811111122)
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ contactNumber: 'admin@kahaeats.com', password: 'admin123' })}
                  style={{ padding: '6px 10px', fontSize: '11px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, color: '#333' }}
                >
                  🛡️ Admin (admin@kahaeats.com)
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?
            <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
