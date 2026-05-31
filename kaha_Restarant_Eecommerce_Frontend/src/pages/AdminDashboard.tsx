import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AdminDashboard.css';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
  preparationTime: number;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'khalti' | 'esewa' | 'cod';
  deliveryAddress: string;
  createdAt: string;
}

interface Analytics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
  topItems: MenuItem[];
}

interface Tab {
  id: 'analytics' | 'orders' | 'menu' | 'settings';
  label: string;
  icon: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');

  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'menu' | 'settings'>('analytics');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Menu editing state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: 'appetizers',
    preparationTime: 15,
    available: true,
  });

  // Filters
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: Tab[] = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'orders', label: 'Orders', icon: '📦' },
    { id: 'menu', label: 'Menu', icon: '🍽️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Mock data
  const mockOrders: Order[] = [
    {
      id: 'ORD-001',
      userId: 'user-1',
      customerName: 'Ramesh Kumar',
      items: [
        { name: 'Chicken Momo', quantity: 2, price: 150 },
        { name: 'Buff Biryani', quantity: 1, price: 300 },
      ],
      total: 450,
      status: 'delivered',
      paymentMethod: 'khalti',
      deliveryAddress: 'Thamel, Kathmandu',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-002',
      userId: 'user-2',
      customerName: 'Priya Sharma',
      items: [{ name: 'Fried Rice', quantity: 1, price: 200 }],
      total: 218,
      status: 'out_for_delivery',
      paymentMethod: 'esewa',
      deliveryAddress: 'Patan, Lalitpur',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-003',
      userId: 'user-3',
      customerName: 'Suresh Paudel',
      items: [
        { name: 'Chowmein', quantity: 2, price: 120 },
        { name: 'Soft Drink', quantity: 2, price: 60 },
      ],
      total: 328.8,
      status: 'preparing',
      paymentMethod: 'cod',
      deliveryAddress: 'Bhaktapur, Nepal',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'ORD-004',
      userId: 'user-4',
      customerName: 'Anita Thapa',
      items: [{ name: 'Momos', quantity: 1, price: 200 }],
      total: 218,
      status: 'pending',
      paymentMethod: 'khalti',
      deliveryAddress: 'Thapathali, Kathmandu',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ];

  const mockMenuItems: MenuItem[] = [
    {
      id: 'menu-1',
      name: 'Chicken Momo',
      description: 'Steamed dumplings with chicken filling',
      price: 150,
      category: 'appetizers',
      available: true,
      preparationTime: 15,
    },
    {
      id: 'menu-2',
      name: 'Buff Biryani',
      description: 'Fragrant rice with buffalo meat',
      price: 300,
      category: 'mains',
      available: true,
      preparationTime: 25,
    },
    {
      id: 'menu-3',
      name: 'Fried Rice',
      description: 'Mixed vegetables fried rice',
      price: 200,
      category: 'mains',
      available: true,
      preparationTime: 15,
    },
    {
      id: 'menu-4',
      name: 'Chowmein',
      description: 'Stir-fried noodles with vegetables',
      price: 120,
      category: 'mains',
      available: true,
      preparationTime: 12,
    },
    {
      id: 'menu-5',
      name: 'Chocolate Cake',
      description: 'Rich chocolate cake slice',
      price: 150,
      category: 'desserts',
      available: true,
      preparationTime: 5,
    },
    {
      id: 'menu-6',
      name: 'Soft Drink',
      description: 'Cold beverage',
      price: 60,
      category: 'beverages',
      available: true,
      preparationTime: 1,
    },
  ];

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // In production, these would be API calls
        // const ordersRes = await axios.get('http://localhost:3000/api/orders', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });
        // const menuRes = await axios.get('http://localhost:3000/api/menu', {
        //   headers: { Authorization: `Bearer ${token}` }
        // });

        setOrders(mockOrders);
        setMenuItems(mockMenuItems);

        // Calculate analytics
        const totalOrders = mockOrders.length;
        const totalRevenue = mockOrders.reduce((sum, o) => sum + o.total, 0);
        const todayOrders = mockOrders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).length;
        const todayRevenue = mockOrders
          .filter((o) => {
            const orderDate = new Date(o.createdAt);
            const today = new Date();
            return orderDate.toDateString() === today.toDateString();
          })
          .reduce((sum, o) => sum + o.total, 0);

        setAnalytics({
          totalOrders,
          totalRevenue,
          averageOrderValue: Math.round(totalRevenue / totalOrders),
          todayOrders,
          todayRevenue,
          topItems: mockMenuItems.slice(0, 3),
        });
      } catch (err: any) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token && userRole === 'admin') {
      loadData();
    } else if (!token || userRole !== 'admin') {
      navigate('/login');
    }
  }, [token, userRole, navigate]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [orders, orderFilter, searchQuery]);

  // Handle order status update
  const handleOrderStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  // Handle menu form
  const handleAddMenuItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'appetizers',
      preparationTime: 15,
      available: true,
    });
    setShowMenuForm(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowMenuForm(true);
  };

  const handleSaveMenuItem = () => {
    if (!formData.name || !formData.price) {
      setError('Please fill all required fields');
      return;
    }

    if (editingItem) {
      setMenuItems(menuItems.map((item) => (item.id === editingItem.id ? { ...item, ...formData } as MenuItem : item)));
    } else {
      setMenuItems([
        ...menuItems,
        {
          id: `menu-${Date.now()}`,
          name: formData.name || '',
          description: formData.description || '',
          price: formData.price || 0,
          category: formData.category || 'appetizers',
          preparationTime: formData.preparationTime || 15,
          available: formData.available !== false,
        } as any,
      ]);
    }

    setShowMenuForm(false);
    setEditingItem(null);
  };

  const handleDeleteMenuItem = (id: string) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
  };

  const handleToggleAvailability = (id: string) => {
    setMenuItems(menuItems.map((item) => (item.id === id ? { ...item, available: !item.available } : item)));
  };

  if (!token || userRole !== 'admin') {
    return (
      <div className="admin-unauthorized">
        <h2>⛔ Unauthorized Access</h2>
        <p>Only admin users can access the dashboard</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <h1>🏪 Restaurant Admin Dashboard</h1>
        <button className="logout-btn" onClick={() => {
          localStorage.clear();
          navigate('/login');
        }}>
          Logout
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {error && <div className="error-banner">{error}</div>}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <section className="tab-content">
            <h2>📊 Business Analytics</h2>

            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-header">Total Orders</div>
                <div className="kpi-value">{analytics.totalOrders}</div>
                <div className="kpi-change">All time</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">Total Revenue</div>
                <div className="kpi-value">₹{analytics.totalRevenue.toFixed(0)}</div>
                <div className="kpi-change">All time</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-header">Avg Order Value</div>
                <div className="kpi-value">₹{analytics.averageOrderValue}</div>
                <div className="kpi-change">Per order</div>
              </div>

              <div className="kpi-card today">
                <div className="kpi-header">Today Orders</div>
                <div className="kpi-value">{analytics.todayOrders}</div>
                <div className="kpi-change">Today revenue: ₹{analytics.todayRevenue.toFixed(0)}</div>
              </div>
            </div>

            {/* Top Items */}
            <div className="analytics-section">
              <h3>🏆 Top Menu Items</h3>
              <div className="top-items-grid">
                {analytics.topItems.map((item, index) => (
                  <div key={item.id} className="top-item-card">
                    <div className="rank">{index + 1}</div>
                    <div className="item-info">
                      <h4>{item.name}</h4>
                      <p className="description">{item.description}</p>
                      <p className="price">₹{item.price}</p>
                      <p className="time">⏱️ {item.preparationTime} min</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Status Distribution */}
            <div className="analytics-section">
              <h3>📈 Order Status Overview</h3>
              <div className="status-overview">
                {['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => {
                  const count = orders.filter((o) => o.status === status).length;
                  return (
                    <div key={status} className={`status-stat status-${status}`}>
                      <strong>{count}</strong>
                      <p>{status.replace(/_/g, ' ').toUpperCase()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <section className="tab-content">
            <div className="orders-header">
              <h2>📦 Orders Management</h2>
              <div className="orders-filters">
                <input
                  type="text"
                  placeholder="Search by order ID or customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value as any)} className="filter-select">
                  <option value="all">All Orders</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {filteredOrders.length > 0 ? (
              <div className="orders-table">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="order-row">
                    <div className="order-id-col">{order.id}</div>
                    <div className="customer-col">{order.customerName}</div>
                    <div className="items-col">
                      <div className="items-preview">
                        {order.items.map((item, i) => (
                          <span key={i} className="item-badge">
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="total-col">₹{order.total.toFixed(2)}</div>
                    <div className="status-col">
                      <select
                        value={order.status}
                        onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value as Order['status'])}
                        className={`status-select status-${order.status}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="payment-col">
                      <span className={`payment-badge ${order.paymentMethod}`}>{order.paymentMethod.toUpperCase()}</span>
                    </div>
                    <div className="time-col">
                      <small>{new Date(order.createdAt).toLocaleTimeString()}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No orders found</p>
              </div>
            )}
          </section>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <section className="tab-content">
            <div className="menu-header">
              <h2>🍽️ Menu Management</h2>
              <button className="add-btn" onClick={handleAddMenuItem}>
                ➕ Add New Item
              </button>
            </div>

            {showMenuForm && (
              <div className="menu-form-modal">
                <div className="form-overlay" onClick={() => setShowMenuForm(false)}></div>
                <div className="form-container">
                  <h3>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>

                  <div className="form-group">
                    <label>Item Name *</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Chicken Momo"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Item description..."
                      rows={3}
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Price (NPR) *</label>
                      <input
                        type="number"
                        value={formData.price || 0}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        min="0"
                        step="10"
                      />
                    </div>

                    <div className="form-group">
                      <label>Category</label>
                      <select value={formData.category || 'appetizers'} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                        <option value="appetizers">Appetizers</option>
                        <option value="mains">Mains</option>
                        <option value="desserts">Desserts</option>
                        <option value="beverages">Beverages</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Prep Time (min)</label>
                      <input
                        type="number"
                        value={formData.preparationTime || 15}
                        onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) })}
                        min="1"
                        max="120"
                      />
                    </div>
                  </div>

                  <div className="form-group checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.available !== false}
                        onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
                      />
                      <span>Available</span>
                    </label>
                  </div>

                  <div className="form-actions">
                    <button className="save-btn" onClick={handleSaveMenuItem}>
                      💾 Save
                    </button>
                    <button className="cancel-btn" onClick={() => setShowMenuForm(false)}>
                      ✕ Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="menu-grid">
              {menuItems.map((item) => (
                <div key={item.id} className={`menu-card ${item.available ? '' : 'unavailable'}`}>
                  <div className="menu-image-placeholder">🍖</div>
                  <div className="menu-info">
                    <h4>{item.name}</h4>
                    <p className="description">{item.description}</p>
                    <div className="menu-meta">
                      <span className="category">{item.category}</span>
                      <span className="prep-time">⏱️ {item.preparationTime}min</span>
                    </div>
                    <p className="price">₹{item.price}</p>
                  </div>
                  <div className="menu-actions">
                    <button
                      className={`availability-btn ${item.available ? 'active' : ''}`}
                      onClick={() => handleToggleAvailability(item.id)}
                      title={item.available ? 'Click to mark unavailable' : 'Click to mark available'}
                    >
                      {item.available ? '✓ Available' : '✗ Unavailable'}
                    </button>
                    <button className="edit-btn" onClick={() => handleEditMenuItem(item)}>
                      ✏️ Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteMenuItem(item.id)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <section className="tab-content">
            <h2>⚙️ Business Settings</h2>

            <div className="settings-form">
              <div className="setting-section">
                <h3>Restaurant Information</h3>
                <div className="form-group">
                  <label>Restaurant Name</label>
                  <input type="text" defaultValue="IshworHostel" className="input-field" />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input type="text" defaultValue="9868348282" className="input-field" />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" defaultValue="replyishwor@gmail.com" className="input-field" />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea defaultValue="Thamel, Ward 1, Kathmandu, Nepal" rows={3} className="input-field"></textarea>
                </div>
              </div>

              <div className="setting-section">
                <h3>Delivery Settings</h3>
                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Enable Delivery</span>
                  </label>
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Enable Pickup</span>
                  </label>
                </div>

                <div className="form-group">
                  <label>Delivery Charge (NPR)</label>
                  <input type="number" defaultValue="100" min="0" step="10" className="input-field" />
                </div>

                <div className="form-group">
                  <label>Minimum Order Value (NPR)</label>
                  <input type="number" defaultValue="200" min="0" step="50" className="input-field" />
                </div>
              </div>

              <div className="setting-section">
                <h3>Operating Hours</h3>
                <div className="hours-grid">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <div key={day} className="hour-input-group">
                      <label>{day}</label>
                      <div className="time-inputs">
                        <input type="time" defaultValue="09:00" />
                        <span>-</span>
                        <input type="time" defaultValue="21:00" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-actions">
                <button className="save-settings-btn">💾 Save Settings</button>
                <button className="reset-btn">🔄 Reset</button>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
