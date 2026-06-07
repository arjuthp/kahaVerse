import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', contactNumber: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authApi.register({
        name: form.name,
        email: form.email,
        phone: form.contactNumber,
        password: form.password,
      });
      localStorage.setItem('kaha_refresh_token', refreshToken);
      login(accessToken, user);
      toast.success(`Welcome to KAHA Eats, ${user.name}!`);
      navigate('/menu');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Registration failed. Please try again.';
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
          Join the <span>Culinary</span> Movement
        </h2>
        
        <p className="auth-brand__desc">
          Sign up to unlock seamless food ordering, live status updates, and earn loyalty benefits on all gourmet items.
        </p>

        <div className="auth-brand__features">
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Fast checkout with saved home & office addresses
          </div>
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Special chef loyalty rewards & member discount coins
          </div>
          <div className="auth-brand__feature">
            <div className="auth-brand__feature-dot" />
            Save your favorite dishes & customize your orders
          </div>
        </div>

        <Link to="/menu" className="auth-brand__back-link">
          ← Back to Menu
        </Link>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card" style={{ maxWidth: '440px' }}>
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join thousands of food lovers and enjoy faster checkout.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="John Doe"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="input-group">
                <label className="input-label">Contact Number</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="98XXXXXXXX"
                  value={form.contactNumber}
                  onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
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

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <div className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?
            <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
