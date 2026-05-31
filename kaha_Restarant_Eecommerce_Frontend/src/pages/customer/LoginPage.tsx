import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authApi.login(form.contactNumber, form.password);
      localStorage.setItem('kaha_refresh_token', refreshToken);
      login(accessToken, user);
      toast.success(`Welcome back, ${user.name || 'Customer'}!`);
      navigate('/');
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || 'Invalid contact number or password';
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
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-gray)'
                  }}
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
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
