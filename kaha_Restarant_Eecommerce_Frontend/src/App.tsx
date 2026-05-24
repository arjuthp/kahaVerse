import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';

// Lazy-loaded pages
const HomePage        = lazy(() => import('./pages/customer/HomePage'));
const MenuPage        = lazy(() => import('./pages/customer/MenuPage'));
const CartPage        = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage    = lazy(() => import('./pages/customer/CheckoutPage'));
const OrdersPage      = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const LoginPage       = lazy(() => import('./pages/customer/LoginPage'));
const RegisterPage    = lazy(() => import('./pages/customer/RegisterPage'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminLoginPage  = lazy(() => import('./pages/admin/AdminLoginPage'));

const PageLoader = () => (
  <div className="loading-page">
    <div className="spinner loading-large" />
  </div>
);

// Protected route wrapper
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const CustomerLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

const AppRoutes = () => {
  const { isAdmin } = useAuth();
  
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Admin Portal - No Navbar */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

        {/* Customer Portal - With Navbar */}
        <Route element={<CustomerLayout />}>
          {/* Public */}
          <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <HomePage />} />
          <Route path="/menu/:businessId" element={<MenuPage />} />
          <Route path="/menu"       element={<MenuPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />

          {/* Protected — Customer */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              style: {
                background: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
              },
              iconTheme: { primary: '#ffffff', secondary: 'var(--primary)' },
            },
            error: {
              style: {
                background: '#7f1d1d',
                color: '#ffffff',
                border: 'none',
              },
              iconTheme: { primary: '#ffffff', secondary: '#7f1d1d' },
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
