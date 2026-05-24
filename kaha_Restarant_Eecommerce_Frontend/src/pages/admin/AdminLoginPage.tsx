import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import toast from 'react-hot-toast';
import '../customer/AuthPages.css';

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { accessToken, refreshToken, user } = await authApi.adminLogin(form.email, form.password);
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
    <div className="auth-page" style={{ background: 'var(--surface-lowest)' }}>
      <div className="auth-container">
        <div className="auth-card" style={{ border: '1px solid var(--outline-variant)' }}>
          <div className="auth-header">
            <div className="auth-logo" style={{ background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)' }}>⚙️</div>
            <h1>Business Portal</h1>
            <p>Manage your restaurant, menus, and orders.</p>
          </div>

          <div style={{ background: 'var(--surface-high)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '24px', border: '1px dashed var(--outline)' }}>
            <strong>🔑 Admin Credentials:</strong><br/>
            Email: <code>admin@kahaeats.com</code><br/>
            Password: <code>admin123</code>
          </div>

          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label className="input-label">Admin Email</label>
              <input
                type="email"
                className="input"
                placeholder="admin@example.com"
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

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading} style={{ background: 'var(--inverse-surface)', color: 'var(--inverse-on-surface)' }}>
              {loading ? <div className="spinner" /> : 'Log In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
