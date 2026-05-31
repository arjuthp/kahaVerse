import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import { menuApi, categoryApi } from '../../api/menu.api';
import { addonGroupApi, addonApi } from '../../api/addon.api';
import { useAuth } from '../../context/AuthContext';
import type { Order, Menu, Category, AddonGroup, Addon } from '../../types';
import { OrderStatusEnum, AddonSelectionTypeEnum } from '../../types';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

type AdminTab = 'overview' | 'orders' | 'menu' | 'categories' | 'users' | 'addons';

const STATUS_FLOW: OrderStatusEnum[] = [
  OrderStatusEnum.PROCESSING,
  OrderStatusEnum.SHIPPED,
  OrderStatusEnum.DELIVERED,
  OrderStatusEnum.CANCELLED,
];

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || user?.businessId || 'biz-mock-001';

  // State
  const [tab, setTab] = useState<AdminTab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '🍲', isActive: true });
  
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: 0,
    discountedPrice: 0,
    categoryId: '',
    image: '',
    isAvailable: true,
    isSignature: false,
    addonGroups: [] as string[]
  });

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Addon Groups & Addons CRUD States
  const [isAddonGroupModalOpen, setIsAddonGroupModalOpen] = useState(false);
  const [editingAddonGroup, setEditingAddonGroup] = useState<AddonGroup | null>(null);
  const [addonGroupForm, setAddonGroupForm] = useState({
    name: '',
    isRequired: false,
    minSelect: 0,
    maxSelect: 0,
    selectionType: AddonSelectionTypeEnum.MULTI as AddonSelectionTypeEnum,
  });

  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [activeGroupIdForAddon, setActiveGroupIdForAddon] = useState<string>('');
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonForm, setAddonForm] = useState({
    name: '',
    price: 0,
    description: '',
    isActive: true,
  });

  const [hideEmptyGroups, setHideEmptyGroups] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!BUSINESS_ID) return;
    fetchAllData();
  }, [BUSINESS_ID]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersData, menuData, catData, addonGroupsData] = await Promise.all([
        orderApi.getBusinessOrders(BUSINESS_ID),
        menuApi.getByBusiness(BUSINESS_ID),
        categoryApi.getByBusiness(BUSINESS_ID),
        addonGroupApi.getGroups(BUSINESS_ID).catch(() => []),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMenus(Array.isArray(menuData) ? menuData : (menuData as any).data ?? []);
      setCategories(Array.isArray(catData) ? catData : []);
      setAddonGroups(Array.isArray(addonGroupsData) ? addonGroupsData : []);

      // Load registered users (mock + local)
      const localUsers = JSON.parse(localStorage.getItem('kaha_local_users') || '[]');
      const seedUsers = [
        { id: 'user-mock-001', name: 'Customer User', email: 'user@test.com', role: 'customer', phone: '9841234567' },
        { id: 'admin-mock-001', name: 'Business Super Admin', email: 'admin@kahaeats.com', role: 'business_super_admin', phone: '9847654321' }
      ];
      
      const combined = [...seedUsers];
      localUsers.forEach((lu: any) => {
        if (!combined.some(u => u.email === lu.email)) {
          combined.push({
            id: lu.id,
            name: lu.name,
            email: lu.email,
            role: lu.role || 'customer',
            phone: lu.phone || '—'
          });
        }
      });
      setUsersList(combined);
    } catch (err) {
      console.error('Admin Dashboard Fetch Error:', err);
      toast.error('Failed to load portal data');
    } finally {
      setLoading(false);
    }
  };

  // Category CRUD Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      setLoading(true);
      await categoryApi.create({
        name: newCategory.name,
        description: newCategory.description,
        icon: newCategory.icon,
        isActive: newCategory.isActive,
        businessId: BUSINESS_ID,
        position: categories.length + 1
      });
      toast.success('Category created successfully!');
      setIsCategoryModalOpen(false);
      setNewCategory({ name: '', description: '', icon: '🍲', isActive: true });
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      setLoading(true);
      await categoryApi.delete(id);
      toast.success('Category deleted successfully');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  // Menu CRUD Handlers
  const handleOpenAddMenu = () => {
    setEditingMenu(null);
    setMenuForm({
      name: '',
      description: '',
      price: 0,
      discountedPrice: 0,
      categoryId: categories[0]?.id || '',
      image: '',
      isAvailable: true,
      isSignature: false,
      addonGroups: []
    });
    setIsMenuModalOpen(true);
  };

  const handleOpenEditMenu = (item: Menu) => {
    setEditingMenu(item);
    setMenuForm({
      name: item.name,
      description: item.description || '',
      price: Number(item.price || 0),
      discountedPrice: Number(item.discountedPrice || 0),
      categoryId: item.categoryId || item.category?.id || categories[0]?.id || '',
      image: item.images?.[0] || item.image || '',
      isAvailable: item.isAvailable,
      isSignature: item.isSignature || false,
      addonGroups: item.addonGroups?.map(g => g.id) || []
    });
    setIsMenuModalOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: menuForm.name,
        description: menuForm.description,
        price: Number(menuForm.price),
        discountedPrice: Number(menuForm.discountedPrice) || undefined,
        categoryId: menuForm.categoryId,
        images: menuForm.image ? [menuForm.image] : [],
        isAvailable: menuForm.isAvailable,
        isSignature: menuForm.isSignature,
        businessId: BUSINESS_ID
      };

      let savedMenu: Menu;
      if (editingMenu) {
        savedMenu = await menuApi.update(editingMenu.id, payload);
        toast.success('Menu item updated!');
      } else {
        savedMenu = await menuApi.create(payload);
        toast.success('New menu item added successfully!');
      }

      // Now sync Addon Groups
      const currentAttachedIds = editingMenu?.addonGroups?.map(g => g.id) || [];
      const selectedIds = menuForm.addonGroups;

      const toAttach = selectedIds.filter(id => !currentAttachedIds.includes(id));
      const toDetach = currentAttachedIds.filter(id => !selectedIds.includes(id));

      const menuId = savedMenu.id || editingMenu?.id;
      if (menuId) {
        for (const groupId of toAttach) {
          await menuApi.attachAddonGroup(menuId, groupId).catch(err => console.error(err));
        }
        for (const groupId of toDetach) {
          await menuApi.detachAddonGroup(menuId, groupId).catch(err => console.error(err));
        }
      }

      setIsMenuModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save menu item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMenu = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      setLoading(true);
      await menuApi.delete(id);
      toast.success('Menu item removed');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete menu item');
    } finally {
      setLoading(false);
    }
  };

  // Addon Groups CRUD handlers
  const handleOpenAddAddonGroup = () => {
    setEditingAddonGroup(null);
    setAddonGroupForm({
      name: '',
      isRequired: false,
      minSelect: 0,
      maxSelect: 0,
      selectionType: AddonSelectionTypeEnum.MULTI,
    });
    setIsAddonGroupModalOpen(true);
  };

  const handleOpenEditAddonGroup = (group: AddonGroup) => {
    setEditingAddonGroup(group);
    setAddonGroupForm({
      name: group.name,
      isRequired: group.isRequired || false,
      minSelect: group.minSelect || 0,
      maxSelect: group.maxSelect || 0,
      selectionType: group.selectionType || AddonSelectionTypeEnum.MULTI,
    });
    setIsAddonGroupModalOpen(true);
  };

  const handleSaveAddonGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonGroupForm.name) return;
    try {
      setLoading(true);
      const payload = {
        name: addonGroupForm.name,
        businessId: BUSINESS_ID,
        isRequired: addonGroupForm.isRequired,
        minSelect: Number(addonGroupForm.minSelect),
        maxSelect: addonGroupForm.maxSelect ? Number(addonGroupForm.maxSelect) : undefined,
        selectionType: addonGroupForm.selectionType,
      };

      if (editingAddonGroup) {
        await addonGroupApi.updateGroup(editingAddonGroup.id, payload);
        toast.success('Addon group updated!');
      } else {
        await addonGroupApi.createGroup(payload);
        toast.success('Addon group created!');
      }
      setIsAddonGroupModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save addon group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddonGroup = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this addon group?')) return;
    try {
      setLoading(true);
      await addonGroupApi.deleteGroup(id);
      toast.success('Addon group deleted!');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete addon group');
    } finally {
      setLoading(false);
    }
  };

  // Addons CRUD handlers
  const handleOpenAddAddon = (groupId: string) => {
    setActiveGroupIdForAddon(groupId);
    setEditingAddon(null);
    setAddonForm({
      name: '',
      price: 0,
      description: '',
      isActive: true,
    });
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (groupId: string, addon: Addon) => {
    setActiveGroupIdForAddon(groupId);
    setEditingAddon(addon);
    setAddonForm({
      name: addon.name,
      price: Number(addon.price || 0),
      description: addon.description || '',
      isActive: addon.isActive ?? true,
    });
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonForm.name) return;
    try {
      setLoading(true);
      const payload = {
        name: addonForm.name,
        price: Number(addonForm.price),
        description: addonForm.description || undefined,
        isActive: addonForm.isActive,
      };

      if (editingAddon) {
        await addonApi.updateAddon(activeGroupIdForAddon, editingAddon.id, payload);
        toast.success('Addon updated!');
      } else {
        await addonApi.addAddon(activeGroupIdForAddon, payload);
        toast.success('Addon added successfully!');
      }
      setIsAddonModalOpen(false);
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save addon');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddon = async (groupId: string, addonId: string) => {
    if (!window.confirm('Are you sure you want to delete this addon?')) return;
    try {
      setLoading(true);
      await addonApi.deleteAddon(groupId, addonId);
      toast.success('Addon deleted!');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete addon');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatusEnum) => {
    try {
      await orderApi.updateStatus(orderId, { status });
      toast.success(`Order marked as ${status.replace('_', ' ')}`);
      if (selectedOrder?.id === orderId) {
        const updated = await orderApi.getOrderById(orderId);
        setSelectedOrder(updated);
      }
      fetchAllData();
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const toggleSignature = async (menuId: string, isSignature: boolean) => {
    try {
      await menuApi.toggleSignature(menuId, isSignature);
      toast.success('Signature status updated');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update signature');
    }
  };

  const getOrderStatus = (o: Order) => {
    if (!o.orderStatus?.length) return 'PENDING';
    return o.orderStatus[o.orderStatus.length - 1].status;
  };

  // Analytics helper fields
  const pendingOrders = orders.filter(o => getOrderStatus(o) === OrderStatusEnum.PENDING).length;
  const preparingOrders = orders.filter(o => getOrderStatus(o) === OrderStatusEnum.PROCESSING).length;
  const readyOrders = orders.filter(o => getOrderStatus(o) === OrderStatusEnum.SHIPPED).length;
  const deliveredOrders = orders.filter(o => getOrderStatus(o) === OrderStatusEnum.DELIVERED).length;
  const cancelledOrders = orders.filter(o => getOrderStatus(o) === OrderStatusEnum.CANCELLED).length;

  const totalRevenue = orders
    .filter(o => getOrderStatus(o) !== OrderStatusEnum.CANCELLED)
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Deduplicate addon groups by name — backend returns one row per menu attachment,
  // so many groups share the same name. Keep the representative with the most addons.
  const deduplicatedAddonGroups = (() => {
    const seen = new Map<string, AddonGroup>();
    for (const group of addonGroups) {
      const existing = seen.get(group.name);
      if (!existing || (group.addons?.length || 0) > (existing.addons?.length || 0)) {
        seen.set(group.name, group);
      }
    }
    return Array.from(seen.values()).sort((a, b) => (b.addons?.length || 0) - (a.addons?.length || 0));
  })();

  return (
    <div className="admin-page">
      
      {/* ====== SIDEBAR ====== */}
      <aside className="admin-sidebar" style={{ display: 'flex' }}>
        <div className="admin-sidebar__heading">
          <div className="admin-sidebar__title">KAHA Resto</div>
          <p className="admin-sidebar__sub">Business Portal v3.0</p>
        </div>
        
        <nav className="admin-sidebar__nav">
          <button className={`admin-sidebar__link ${tab === 'overview' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('overview')}>
            <span className="admin-sidebar__icon">📊</span> Overview & Analytics
          </button>
          <button className={`admin-sidebar__link ${tab === 'orders' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('orders')}>
            <span className="admin-sidebar__icon">🛍️</span> Orders {pendingOrders > 0 && <span className="badge badge-warning" style={{ marginLeft: 'auto', background: 'var(--primary)', color: 'white' }}>{pendingOrders}</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'menu' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('menu')}>
            <span className="admin-sidebar__icon">🍲</span> Menu Management
          </button>
          <button className={`admin-sidebar__link ${tab === 'categories' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('categories')}>
            <span className="admin-sidebar__icon">🗂️</span> Categories CRUD
          </button>
          <button className={`admin-sidebar__link ${tab === 'users' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('users')}>
            <span className="admin-sidebar__icon">👥</span> Users Overview
          </button>
          <button className={`admin-sidebar__link ${tab === 'addons' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('addons')}>
            <span className="admin-sidebar__icon">🍕</span> Addon Customization
          </button>
        </nav>
        
        <div className="admin-sidebar__bottom">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-container-high)', borderRadius: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.name || 'Administrator'}</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Super Admin</div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/'); }} 
              style={{ 
                background: 'var(--error, #e74c3c)', 
                color: 'white', 
                border: 'none', 
                padding: '6px 12px', 
                borderRadius: '6px', 
                cursor: 'pointer', 
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ====== MAIN CONTENT ====== */}
      <main className="admin-main" style={{ flex: 1, padding: '40px' }}>
        {loading && <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 100 }} className="spinner"></div>}

        <div className="admin-main-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px' }}>
              {tab === 'overview' && 'Overview & Analytics'}
              {tab === 'orders' && 'Orders Management'}
              {tab === 'menu' && 'Menu Operations'}
              {tab === 'categories' && 'Categories Control'}
              {tab === 'users' && 'Active Accounts'}
              {tab === 'addons' && 'Addon Groups & Choices'}
            </h1>
            <p style={{ color: 'var(--slate-gray)' }}>Manage and monitor your restaurant's business statistics.</p>
          </div>
          <div>
            {tab === 'menu' && <button className="btn btn-primary" onClick={handleOpenAddMenu}>+ Add Menu Item</button>}
            {tab === 'categories' && <button className="btn btn-primary" onClick={() => setIsCategoryModalOpen(true)}>+ Add Category</button>}
            {tab === 'addons' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn" 
                  onClick={() => setHideEmptyGroups(!hideEmptyGroups)}
                  style={{ 
                    border: '1px solid var(--outline-variant)', 
                    background: hideEmptyGroups ? 'var(--surface-container-high)' : 'transparent',
                    color: 'var(--on-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {hideEmptyGroups ? '👁️ Show All Groups' : '🙈 Hide Empty Groups'}
                </button>
                <button className="btn btn-primary" onClick={handleOpenAddAddonGroup}>+ Add Addon Group</button>
              </div>
            )}
          </div>
        </div>

        {/* ==================== OVERVIEW & ANALYTICS TAB ==================== */}
        {tab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              <div className="admin-stat-card" style={{ background: 'var(--surface-lowest)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '14px', color: 'var(--slate-gray)', marginBottom: '8px' }}>Gross Revenue</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)' }}>NPR {totalRevenue.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: 'green', marginTop: '4px' }}>⚡ 100% Organic Volume</div>
              </div>
              <div className="admin-stat-card" style={{ background: 'var(--surface-lowest)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '14px', color: 'var(--slate-gray)', marginBottom: '8px' }}>Total Orders</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{orders.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-gray)', marginTop: '4px' }}>{pendingOrders} awaiting validation</div>
              </div>
              <div className="admin-stat-card" style={{ background: 'var(--surface-lowest)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '14px', color: 'var(--slate-gray)', marginBottom: '8px' }}>Average Order Value</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)' }}>NPR {averageOrderValue.toFixed(2)}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-gray)', marginTop: '4px' }}>Per cart checkout</div>
              </div>
              <div className="admin-stat-card" style={{ background: 'var(--surface-lowest)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
                <div style={{ fontSize: '14px', color: 'var(--slate-gray)', marginBottom: '8px' }}>Active Products</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--on-surface)' }}>{menus.length}</div>
                <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px' }}>{menus.filter(m => m.isSignature).length} signature dishes</div>
              </div>
            </div>

            {/* Graphical Analytics Panel */}
            <div style={{ background: 'var(--surface-lowest)', padding: '24px', borderRadius: '16px', border: '1px solid var(--outline-variant)', marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '24px', fontFamily: 'Manrope, sans-serif' }}>Order Pipeline Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', textAlign: 'center' }}>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (pendingOrders/orders.length)*100 : 0}%`, background: '#f39c12', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{pendingOrders}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Pending</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (preparingOrders/orders.length)*100 : 0}%`, background: '#3498db', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{preparingOrders}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Preparing</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (readyOrders/orders.length)*100 : 0}%`, background: '#9b59b6', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{readyOrders}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Ready</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (deliveredOrders/orders.length)*100 : 0}%`, background: '#2ecc71', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{deliveredOrders}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Delivered</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (cancelledOrders/orders.length)*100 : 0}%`, background: '#e74c3c', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px' }}>{cancelledOrders}</strong>
                  <span style={{ fontSize: '12px', color: 'var(--slate-gray)' }}>Cancelled</span>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif' }}>Recent Incoming Orders</h3>
              <button className="btn btn-ghost" style={{ fontSize: '13px' }} onClick={() => setTab('orders')}>View All Orders ➔</button>
            </div>
            <div className="admin-table-container" style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-low)', textAlign: 'left' }}>
                    <th style={{ padding: '16px' }}>Order #</th>
                    <th>Subtotal</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => {
                    const status = getOrderStatus(o);
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>#{o.orderNumber || o.id.slice(-6).toUpperCase()}</td>
                        <td>NPR {o.totalAmount?.toFixed(2)}</td>
                        <td>{o.serviceType?.replace('_', ' ')}</td>
                        <td>
                          <span className={`status-badge status-badge--${status.toLowerCase()}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            {status}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setSelectedOrder(o)}>
                            Open Details 🔍
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-gray)' }}>No recent orders fetched</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ORDERS MANAGEMENT TAB ==================== */}
        {tab === 'orders' && (
          <div className="admin-table-container" style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-low)', textAlign: 'left' }}>
                  <th style={{ padding: '16px' }}>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer Info</th>
                  <th>Total Billing</th>
                  <th>Method</th>
                  <th>Service Type</th>
                  <th>Pipeline Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const status = getOrderStatus(o);
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '16px', fontWeight: 'bold' }}>#{o.orderNumber || o.id.slice(-6).toUpperCase()}</td>
                      <td>{new Date(o.createdAt).toLocaleString()}</td>
                      <td>{o.remarks ? `✍️ ${o.remarks}` : 'General Order'}</td>
                      <td>NPR {o.totalAmount?.toFixed(2)}</td>
                      <td>{o.paymentMethod || 'CASH'}</td>
                      <td>
                        <span style={{ fontSize: '13px', background: 'var(--surface-container-high)', padding: '4px 8px', borderRadius: '4px' }}>
                          {o.serviceType}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-badge--${status.toLowerCase()}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                          {status}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '8px', padding: '16px' }}>
                        <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedOrder(o)}>
                          Inspect 👁️
                        </button>
                        {status !== OrderStatusEnum.DELIVERED && status !== OrderStatusEnum.CANCELLED && (
                          <select 
                            className="admin-status-dropdown"
                            style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--outline)' }}
                            value=""
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatusEnum)}
                          >
                            <option value="" disabled>Update Pipeline...</option>
                            {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-gray)' }}>No customer orders found in the database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== MENU CRUD TAB ==================== */}
        {tab === 'menu' && (
          <div>
            <div className="admin-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Add New Item Button Card */}
              <div className="admin-add-card" onClick={handleOpenAddMenu} style={{ height: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed var(--outline)', borderRadius: '16px', cursor: 'pointer' }}>
                <span style={{ fontSize: '48px', marginBottom: '16px' }}>➕</span>
                <h3 style={{ margin: 0, fontSize: '20px' }}>Add Menu Item</h3>
                <p style={{ color: 'var(--slate-gray)', textAlign: 'center', padding: '0 20px', marginTop: '8px' }}>Introduce a delicious new dish to your restaurant database.</p>
              </div>

              {menus.map(m => {
                const displayPrice = m.variants && m.variants.length > 0
                  ? Math.min(...m.variants.map(v => Number(v.price)))
                  : Number(m.price ?? 0);
                const discountedPrice = m.discountedPrice ? Number(m.discountedPrice) : null;
                const imgSrc = m.images?.[0] || m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

                return (
                  <div key={m.id} className="admin-item-card" style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <img src={imgSrc} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary-container)', color: 'var(--on-primary-container)', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                        {m.category?.name || 'Dish'}
                      </span>
                    </div>

                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{m.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>NPR {displayPrice.toFixed(2)}</span>
                          {discountedPrice && <span style={{ textDecoration: 'line-through', fontSize: '11px', color: 'var(--slate-gray)' }}>NPR {discountedPrice.toFixed(2)}</span>}
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--slate-gray)', margin: '0 0 16px', flex: 1 }}>{m.description || 'No description provided.'}</p>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}
                          onClick={() => toggleSignature(m.id, !m.isSignature)}
                        >
                          {m.isSignature ? '⭐ Starred' : '☆ Star'}
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleOpenEditMenu(m)}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '13px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px' }}
                          onClick={() => handleDeleteMenu(m.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== CATEGORIES CRUD TAB ==================== */}
        {tab === 'categories' && (
          <div>
            <div className="admin-table-container" style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-low)', textAlign: 'left' }}>
                    <th style={{ padding: '16px' }}>Icon</th>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Position Index</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                      <td style={{ padding: '16px', fontSize: '28px' }}>{c.icon || '🍲'}</td>
                      <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                      <td>{c.description || 'No description listed'}</td>
                      <td>{c.position || 0}</td>
                      <td>
                        <span className={`badge ${c.isActive ? 'badge-success' : 'badge-error'}`} style={{ background: c.isActive ? 'green' : 'red', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '6px 12px', fontSize: '13px', color: 'red' }} 
                          onClick={() => handleDeleteCategory(c.id)}
                        >
                          Delete 🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--slate-gray)' }}>No categories defined yet. Create one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {tab === 'users' && (
          <div className="admin-table-container" style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-low)', textAlign: 'left' }}>
                  <th style={{ padding: '16px' }}>User ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>System Role</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    <td style={{ padding: '16px', color: 'var(--slate-gray)', fontSize: '13px' }}>{u.id}</td>
                    <td style={{ fontWeight: 'bold' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      <span style={{ 
                        background: u.role === 'business_super_admin' ? 'var(--primary-container)' : 'var(--secondary-container)',
                        color: u.role === 'business_super_admin' ? 'var(--primary)' : 'var(--secondary)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td><span style={{ color: 'green' }}>✓ Verified</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== ADDON CUSTOMIZATION TAB ==================== */}
        {tab === 'addons' && (
          <div style={{ background: 'var(--surface-lowest)', borderRadius: '16px', border: '1px solid var(--outline-variant)', overflow: 'hidden' }}>
            {/* Legend */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--outline-variant)', background: 'var(--surface-low)', display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--slate-gray)' }}>
              <span>ℹ️ <strong>Single Select</strong> = customer picks 1 option (e.g. Size)</span>
              <span>•</span>
              <span><strong>Multi Select</strong> = customer picks multiple (e.g. Toppings)</span>
              <span>•</span>
              <span>Click a row to expand its addon choices</span>
            </div>

            {deduplicatedAddonGroups
              .filter(group => !hideEmptyGroups || (group.addons && group.addons.length > 0))
              .map((group, idx) => {
                const isExpanded = expandedGroupId === group.id;
                const addonCount = group.addons?.length || 0;
                return (
                  <div key={group.id} style={{ borderBottom: '1px solid var(--outline-variant)' }}>
                    {/* --- GROUP ROW --- */}
                    <div
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        background: isExpanded ? 'var(--surface-container-low)' : (idx % 2 === 0 ? 'var(--surface-lowest)' : 'var(--surface-low)'),
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Expand chevron */}
                      <span style={{ fontSize: '12px', color: 'var(--slate-gray)', minWidth: '14px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>

                      {/* Group name */}
                      <span style={{ fontWeight: 600, fontSize: '14px', flex: 1 }}>{group.name}</span>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 'bold',
                          background: group.selectionType === 'single' ? 'var(--primary-container)' : 'var(--secondary-container)',
                          color: group.selectionType === 'single' ? 'var(--primary)' : 'var(--secondary)'
                        }}>
                          {group.selectionType === 'single' ? '● Single' : '☑ Multi'}
                        </span>
                        {group.isRequired && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(200,40,0,0.12)', color: 'var(--primary)', fontWeight: 'bold' }}>Required</span>
                        )}
                        {(group.minSelect !== undefined || group.maxSelect) && (
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
                            {group.minSelect || 0}–{group.maxSelect || '∞'} picks
                          </span>
                        )}
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: addonCount > 0 ? 'rgba(40,167,69,0.12)' : 'var(--surface-container-high)', color: addonCount > 0 ? '#28a745' : 'var(--slate-gray)', fontWeight: 'bold' }}>
                          {addonCount} choice{addonCount !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Action buttons — stop propagation so they don't toggle expand */}
                      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: '12px' }}
                          onClick={() => handleOpenEditAddonGroup(group)}
                          title="Edit group"
                        >✏️</button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: '12px', color: 'red' }}
                          onClick={() => handleDeleteAddonGroup(group.id)}
                          title="Delete group"
                        >🗑️</button>
                      </div>
                    </div>

                    {/* --- EXPANDED ADDON LIST --- */}
                    {isExpanded && (
                      <div style={{ padding: '12px 20px 16px 46px', background: 'var(--surface-container-low)', borderTop: '1px dashed var(--outline-variant)' }}>
                        {addonCount > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                            {group.addons?.map((addon: Addon) => (
                              <div
                                key={addon.id}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: 'var(--surface-lowest)',
                                  border: '1px solid var(--outline-variant)',
                                  borderRadius: '20px',
                                  padding: '4px 10px',
                                  fontSize: '13px',
                                }}
                              >
                                <span style={{ fontWeight: 500 }}>{addon.name}</span>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>NPR {Number(addon.price || 0).toFixed(0)}</span>
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: '1px 4px', fontSize: '11px', minWidth: 'unset' }}
                                  onClick={() => handleOpenEditAddon(group.id, addon)}
                                >✏️</button>
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: '1px 4px', fontSize: '11px', color: 'red', minWidth: 'unset' }}
                                  onClick={() => handleDeleteAddon(group.id, addon.id)}
                                >✕</button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '13px', color: 'var(--slate-gray)', margin: '0 0 10px' }}>No addon choices yet.</p>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleOpenAddAddon(group.id)}
                        >
                          ➕ Add Choice
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {deduplicatedAddonGroups.filter(g => !hideEmptyGroups || (g.addons && g.addons.length > 0)).length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px', color: 'var(--slate-gray)' }}>
                No addon groups found. Click <strong>+ Add Addon Group</strong> to create one.
              </div>
            )}
          </div>
        )}

      </main>

      {/* ==================== CREATE CATEGORY MODAL ==================== */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Add New Category</h2>
              <button className="modal-close" onClick={() => setIsCategoryModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCategory}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Category Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. Nepali Thali, Appetizers"
                    value={newCategory.name}
                    onChange={e => setNewCategory(nc => ({ ...nc, name: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. Authentic local meals"
                    value={newCategory.description}
                    onChange={e => setNewCategory(nc => ({ ...nc, description: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Emoji Icon</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="e.g. 🍲, 🍛, 🥤"
                    value={newCategory.icon}
                    onChange={e => setNewCategory(nc => ({ ...nc, icon: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Category</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MENU ITEM MODAL ==================== */}
      {isMenuModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editingMenu ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => setIsMenuModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveMenu}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Item Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. Thakali Chicken Set"
                    value={menuForm.name}
                    onChange={e => setMenuForm(mf => ({ ...mf, name: e.target.value }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea 
                    className="input" 
                    style={{ height: '80px', padding: '12px' }}
                    placeholder="Describe the ingredients, taste profiles..."
                    value={menuForm.description}
                    onChange={e => setMenuForm(mf => ({ ...mf, description: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Price (NPR)</label>
                    <input 
                      type="number" 
                      className="input" 
                      required 
                      min="0"
                      value={menuForm.price}
                      onChange={e => setMenuForm(mf => ({ ...mf, price: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Discount Price (NPR)</label>
                    <input 
                      type="number" 
                      className="input" 
                      min="0"
                      value={menuForm.discountedPrice}
                      onChange={e => setMenuForm(mf => ({ ...mf, discountedPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select 
                    className="input"
                    style={{ padding: '0 12px' }}
                    value={menuForm.categoryId}
                    onChange={e => setMenuForm(mf => ({ ...mf, categoryId: e.target.value }))}
                    required
                  >
                    <option value="" disabled>Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Image URL</label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="https://images.unsplash.com/... or leave blank"
                    value={menuForm.image}
                    onChange={e => setMenuForm(mf => ({ ...mf, image: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={menuForm.isAvailable}
                      onChange={e => setMenuForm(mf => ({ ...mf, isAvailable: e.target.checked }))}
                    />
                    Available for Order
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={menuForm.isSignature}
                      onChange={e => setMenuForm(mf => ({ ...mf, isSignature: e.target.checked }))}
                    />
                    Mark as Signature
                  </label>
                </div>

                <div className="input-group" style={{ marginTop: '16px', borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                  <label className="input-label" style={{ fontWeight: 'bold' }}>Link Addon Groups</label>
                  <p style={{ fontSize: '12px', color: 'var(--slate-gray)', marginTop: '-4px', marginBottom: '8px' }}>Select which customizable options apply to this menu item.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {deduplicatedAddonGroups.map(group => {
                      const isChecked = menuForm.addonGroups?.includes(group.id);
                      return (
                        <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${isChecked ? 'var(--primary)' : 'var(--outline-variant)'}` }}>
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={e => {
                              const updated = e.target.checked 
                                ? [...(menuForm.addonGroups || []), group.id]
                                : (menuForm.addonGroups || []).filter(id => id !== group.id);
                              setMenuForm(mf => ({ ...mf, addonGroups: updated }));
                            }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: isChecked ? 'bold' : 'normal' }}>{group.name}</span>
                        </label>
                      );
                    })}
                    {deduplicatedAddonGroups.length === 0 && (
                      <p style={{ fontSize: '12px', color: 'var(--slate-gray)', gridColumn: 'span 2' }}>No Addon Groups configured yet. Create one in the Addon tab!</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMenuModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMenu ? 'Save Changes' : 'Create Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ORDER INSPECTOR MODAL ==================== */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>Order Invoice Summary</h2>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>
            <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
              <div style={{ borderBottom: '1px dashed var(--outline-variant)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Invoice No:</strong>
                  <span>#{selectedOrder.orderNumber || selectedOrder.id.slice(-6).toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Created At:</strong>
                  <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Service Mode:</strong>
                  <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedOrder.serviceType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Remarks / Notes:</strong>
                  <span>{selectedOrder.remarks || 'None'}</span>
                </div>
              </div>

              <h4 style={{ marginBottom: '12px', fontWeight: 'bold' }}>Order Items:</h4>
              <div style={{ maxHeight: '180px', overflowY: 'auto', background: 'var(--surface-container-low)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                {selectedOrder.orderItems?.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div>
                      <strong>{item.quantity}x</strong> {item.menuName || item.menu?.name || 'Dish Item'}
                      {item.variantName && <div style={{ fontSize: '11px', color: 'var(--slate-gray)' }}>Size: {item.variantName}</div>}
                      {item.addons?.map((a: any, aidx: number) => (
                        <div key={aidx} style={{ fontSize: '11px', color: 'var(--slate-gray)' }}>+ {a.addonName || a.addon?.name} (NPR {a.price})</div>
                      ))}
                    </div>
                    <strong>NPR {(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
                {!selectedOrder.orderItems?.length && (
                  <div style={{ textAlign: 'center', color: 'var(--slate-gray)', padding: '12px' }}>No items mapped in order list</div>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Tax Amount (13%):</span>
                  <span>NPR {((selectedOrder.totalAmount || 0) * 0.13).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)' }}>
                  <span>Total Amount Due:</span>
                  <span>NPR {selectedOrder.totalAmount?.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: '24px', background: 'var(--surface-container-high)', padding: '16px', borderRadius: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Pipeline Status Transition:</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase' }}>
                    Current: {getOrderStatus(selectedOrder)}
                  </span>
                  <select 
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--outline)', flex: 1 }}
                    value=""
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatusEnum)}
                  >
                    <option value="" disabled>Select status...</option>
                    {STATUS_FLOW.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => window.print()}>Print Receipt 🖨️</button>
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT ADDON GROUP MODAL ==================== */}
      {isAddonGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingAddonGroup ? 'Edit Addon Group' : 'Add Addon Group'}</h2>
              <button className="modal-close" onClick={() => setIsAddonGroupModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAddonGroup}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Group Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. Toppings, Size Selection"
                    value={addonGroupForm.name}
                    onChange={e => setAddonGroupForm(ag => ({ ...ag, name: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Selection Type</label>
                    <select 
                      className="input"
                      style={{ padding: '0 12px' }}
                      value={addonGroupForm.selectionType}
                      onChange={e => setAddonGroupForm(ag => ({ ...ag, selectionType: e.target.value as AddonSelectionTypeEnum }))}
                    >
                      <option value={AddonSelectionTypeEnum.SINGLE}>Single (Radio)</option>
                      <option value={AddonSelectionTypeEnum.MULTI}>Multiple (Checkbox)</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={addonGroupForm.isRequired}
                        onChange={e => setAddonGroupForm(ag => ({ ...ag, isRequired: e.target.checked }))}
                      />
                      Selection Required
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group">
                    <label className="input-label">Min Selection Limit</label>
                    <input 
                      type="number" 
                      className="input" 
                      min="0"
                      value={addonGroupForm.minSelect}
                      onChange={e => setAddonGroupForm(ag => ({ ...ag, minSelect: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Max Selection Limit</label>
                    <input 
                      type="number" 
                      className="input" 
                      min="0"
                      value={addonGroupForm.maxSelect}
                      onChange={e => setAddonGroupForm(ag => ({ ...ag, maxSelect: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddonGroupModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAddonGroup ? 'Save Changes' : 'Create Group'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT ADDON CHOICE MODAL ==================== */}
      {isAddonModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2>{editingAddon ? 'Edit Addon Choice' : 'Add Addon Choice'}</h2>
              <button className="modal-close" onClick={() => setIsAddonModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveAddon}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Addon Option Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    required 
                    placeholder="e.g. Extra Cheese, Mushrooms"
                    value={addonForm.name}
                    onChange={e => setAddonForm(af => ({ ...af, name: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Addon Price (NPR)</label>
                  <input 
                    type="number" 
                    className="input" 
                    required 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addonForm.price}
                    onChange={e => setAddonForm(af => ({ ...af, price: Number(e.target.value) }))}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
                    <input 
                      type="checkbox" 
                      checked={addonForm.isActive}
                      onChange={e => setAddonForm(af => ({ ...af, isActive: e.target.checked }))}
                    />
                    Addon Choice is Active & Selectable
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddonModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingAddon ? 'Save Choice' : 'Add Choice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
