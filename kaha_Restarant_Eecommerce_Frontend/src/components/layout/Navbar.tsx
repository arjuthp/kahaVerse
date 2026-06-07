import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout, isAdmin, user } = useAuth();
  const { itemCount, fetchCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('search') || '';
  });

  // Sync search state with URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get('search') || '');
  }, [location.search]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    const targetPath = '/menu';
    if (location.pathname !== targetPath) {
      navigate(`${targetPath}?search=${encodeURIComponent(val)}`);
    } else {
      navigate(`?search=${encodeURIComponent(val)}`, { replace: true });
    }
  };

  const badgeBounce = false; // Resolved static boolean

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
  }, [isAuthenticated]);

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => { setDropdownOpen(false); logout(); navigate('/'); };
  const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || '';

  const isActive = (path: string) => location.pathname.includes(path);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="container navbar__inner">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">KAHA</span>
        </Link>

        {/* Desktop Nav */}
        <div className="navbar__links">
          {isAdmin ? (
            <Link to="/admin" className={`navbar__link ${isActive('/admin') ? 'navbar__link--active' : ''}`}>Admin Dashboard</Link>
          ) : (
            <>
              <Link to="/menu" className={`navbar__link ${isActive('/menu') ? 'navbar__link--active' : ''}`}>Menu</Link>
              {isAuthenticated && (
                <>
                  <Link to="/orders" className={`navbar__link ${isActive('/orders') ? 'navbar__link--active' : ''}`}>My Orders</Link>
                  <Link to="/loyalty" className={`navbar__link ${isActive('/loyalty') ? 'navbar__link--active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🏆 Rewards
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="navbar__actions">
          {/* Search */}
          <div className="navbar__search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="navbar__search-input"
              placeholder="Search menu..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>

          {isAuthenticated ? (
            <>
              {/* Cart - only for non-admin customers */}
              {!isAdmin && (
                <Link to="/cart" className="navbar__cart-btn" aria-label={`Cart (${itemCount} items)`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {itemCount > 0 && (
                    <span className={`navbar__cart-badge ${badgeBounce ? 'navbar__cart-badge--bounce' : ''}`}>
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Dropdown — click to toggle, outside click to close */}
              <div className="navbar__user" ref={dropdownRef}>
                <button
                  className="navbar__user-avatar"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  aria-label="User menu"
                >
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </button>
                {dropdownOpen && (
                  <div className="navbar__user-dropdown navbar__user-dropdown--open">
                    <div className="navbar__user-name">{user?.name}</div>
                    <div className="navbar__user-role">{user?.role}</div>
                    <hr className="divider" style={{ margin: '8px 0' }} />

                    {isAdmin ? (
                      <Link to="/admin" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                        ⚙️ Admin Dashboard
                      </Link>
                    ) : (
                      <Link to="/loyalty" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                        🏆 My Rewards
                      </Link>
                    )}
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="navbar__auth">
              <Link to="/login" className="btn btn-secondary btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button className="navbar__mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="navbar__mobile">
          {isAdmin ? (
            <Link to="/admin" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Admin Dashboard</Link>
          ) : (
            <>
              <Link to="/menu" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Menu</Link>
              {isAuthenticated && (
                <>
                  <Link to="/cart" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>
                    Cart {itemCount > 0 && `(${itemCount})`}
                  </Link>
                  <Link to="/orders" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>My Orders</Link>
                  <Link to="/loyalty" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>🏆 Rewards</Link>
                </>
              )}
            </>
          )}

          <hr className="divider" />
          {isAuthenticated ? (
            <button className="navbar__mobile-link" style={{ color: 'var(--status-cancelled)' }} onClick={handleLogout}>Log Out</button>
          ) : (
            <>
              <Link to="/login" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Log In</Link>
              <Link to="/register" className="navbar__mobile-link" style={{ color: 'var(--accent)' }} onClick={() => setMobileOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
