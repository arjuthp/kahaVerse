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
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">🍴</div>
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
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-gray)'
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
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
