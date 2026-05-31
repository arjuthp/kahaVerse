import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Layouts
import CustomerLayout from './components/layout/CustomerLayout';

// Public / Auth Pages
import HomePage from './pages/customer/HomePage';
import LoginPage from './pages/customer/LoginPage';
import RegisterPage from './pages/customer/RegisterPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';

// Customer Pages (require auth + role=customer)
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import CheckoutPage from './pages/customer/CheckoutPage';
import OrdersPage from './pages/customer/OrdersPage';
import OrderDetailPage from './pages/customer/OrderDetailPage';

// Admin Pages (require auth + role=admin)
import AdminDashboard from './pages/admin/AdminDashboard';

// ─── Protected Route ──────────────────────────────────────────────────────────
interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: 'admin' | 'customer';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, requiredRole }) => {
  const token = localStorage.getItem('kaha_token');
  const userStr = localStorage.getItem('kaha_user');

  if (!token || !userStr) {
    // Not logged in → send to appropriate login
    return <Navigate to={requiredRole === 'admin' ? '/admin-login' : '/login'} replace />;
  }

  if (requiredRole) {
    try {
      const user = JSON.parse(userStr);
      const role: string = user?.role || '';

      const adminRoles = ['admin', 'business_super_admin', 'super_admin', 'ADMIN', 'BUSINESS_SUPER_ADMIN', 'SUPER_ADMIN'];
      const customerRoles = ['customer', 'CUSTOMER', 'user', 'USER'];

      if (requiredRole === 'admin' && !adminRoles.includes(role)) {
        return <Navigate to="/admin-login" replace />;
      }
      if (requiredRole === 'customer' && !customerRoles.includes(role)) {
        // Admin who visits customer page is fine — allow it (they test the store)
        if (!adminRoles.includes(role)) {
          return <Navigate to="/login" replace />;
        }
      }
    } catch {
      return <Navigate to="/login" replace />;
    }
  }

  return element;
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            background: 'var(--surface-container-high, #1e1e1e)',
            color: 'var(--on-surface, #fff)',
            fontSize: '14px',
          },
        }}
      />

      <Routes>
        {/* ── PUBLIC (no navbar needed) ────────────────────────── */}
        <Route path="/login"       element={<LoginPage />} />
        <Route path="/register"    element={<RegisterPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />

        {/* ── CUSTOMER LAYOUT (Navbar wraps all these) ─────────── */}
        <Route element={<CustomerLayout />}>
          {/* Home is public */}
          <Route path="/" element={<HomePage />} />

          {/* Menu: accessible to everyone logged in (customer + admin preview) */}
          <Route
            path="/menu"
            element={<ProtectedRoute element={<MenuPage />} />}
          />
          <Route
            path="/menu/:businessId"
            element={<ProtectedRoute element={<MenuPage />} />}
          />

          {/* Strictly customer routes */}
          <Route
            path="/cart"
            element={<ProtectedRoute element={<CartPage />} requiredRole="customer" />}
          />
          <Route
            path="/checkout"
            element={<ProtectedRoute element={<CheckoutPage />} requiredRole="customer" />}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute element={<OrdersPage />} requiredRole="customer" />}
          />
          <Route
            path="/orders/:orderId"
            element={<ProtectedRoute element={<OrderDetailPage />} requiredRole="customer" />}
          />
        </Route>

        {/* ── ADMIN (no customer navbar) ───────────────────────── */}
        <Route
          path="/admin"
          element={<ProtectedRoute element={<AdminDashboard />} requiredRole="admin" />}
        />
        {/* legacy /dashboard alias */}
        <Route
          path="/dashboard"
          element={<Navigate to="/admin" replace />}
        />

        {/* ── FALLBACK ─────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
