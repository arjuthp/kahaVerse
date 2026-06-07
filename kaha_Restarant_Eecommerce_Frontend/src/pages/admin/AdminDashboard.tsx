import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi } from '../../api/order.api';
import { menuApi, categoryApi } from '../../api/menu.api';
import { addonGroupApi, addonApi } from '../../api/addon.api';
import { loyaltyApi } from '../../api/loyalty.api';
import { useAuth } from '../../context/AuthContext';
import type { Order, Menu, Category, AddonGroup, Addon } from '../../types';
import { OrderStatusEnum, AddonSelectionTypeEnum } from '../../types';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

type AdminTab = 'overview' | 'orders' | 'menu' | 'categories' | 'users' | 'addons' | 'customers' | 'loyalty_settings';

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

  // Loyalty / Customer Insights state
  const [customerInsights, setCustomerInsights] = useState<any[]>([]);
  const [loyaltySummary, setLoyaltySummary] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [insightSearch, setInsightSearch] = useState('');
  const [insightFilter, setInsightFilter] = useState<'all' | 'returning' | 'vip' | 'new'>('all');
  
  // Loyalty Configuration Settings state
  const [loyaltyConfig, setLoyaltyConfig] = useState({
    pointsPerNpr: 0.1,
    pointsToNprRate: 0.5,
    minRedeemPoints: 100,
    voucherExpiryDays: 30
  });
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // Orders Tab filters & pagination state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderServiceFilter, setOrderServiceFilter] = useState<string>('all');
  const [orderDateFilter, setOrderDateFilter] = useState<string>('all');
  const [orderSort, setOrderSort] = useState<string>('newest');
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '', isActive: true });
  
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
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderServiceFilter, orderDateFilter, orderSort]);

  useEffect(() => {
    if (!BUSINESS_ID) return;
    fetchAllData();
    fetchCustomerInsights();
    fetchLoyaltyConfig();
  }, [BUSINESS_ID]);

  const fetchLoyaltyConfig = async () => {
    try {
      const data = await loyaltyApi.getLoyaltyConfig();
      if (data) {
        setLoyaltyConfig({
          pointsPerNpr: Number(data.pointsPerNpr || 0.1),
          pointsToNprRate: Number(data.pointsToNprRate || 0.5),
          minRedeemPoints: Number(data.minRedeemPoints || 100),
          voucherExpiryDays: Number(data.voucherExpiryDays || 30)
        });
      }
    } catch (err) {
      console.error('Loyalty config fetch error:', err);
    }
  };

  const handleSaveLoyaltyConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    try {
      await loyaltyApi.updateLoyaltyConfig(loyaltyConfig);
      toast.success('Loyalty configurations updated successfully!');
      fetchLoyaltyConfig();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save loyalty settings');
    } finally {
      setIsConfigSaving(false);
    }
  };

  const fetchCustomerInsights = async () => {
    setLoyaltyLoading(true);
    try {
      const [insights, summary] = await Promise.all([
        loyaltyApi.getCustomerInsights().catch(() => []),
        loyaltyApi.getBusinessSummary().catch(() => null),
      ]);
      setCustomerInsights(Array.isArray(insights) ? insights : []);
      setLoyaltySummary(summary);
    } catch (err) {
      console.error('Loyalty fetch error:', err);
    } finally {
      setLoyaltyLoading(false);
    }
  };

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

      // Load real registered users from local DB
      try {
        const usersData = await import('@/api/axios').then(m =>
          m.default.get('/admin/users').then(r => r.data)
        );
        setUsersList(Array.isArray(usersData) ? usersData : []);
      } catch {
        // fallback: keep empty or use localStorage cache
        const localUsers = JSON.parse(localStorage.getItem('kaha_local_users') || '[]');
        setUsersList(localUsers.map((lu: any) => ({
          id: lu.id,
          name: lu.name,
          email: lu.email,
          role: lu.role || 'customer',
          phone: lu.phone || '—',
        })));
      }
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
      setNewCategory({ name: '', description: '', icon: '', isActive: true });
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCategoryStatus = async (id: string, currentStatus: boolean) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    try {
      setLoading(true);
      await categoryApi.update(id, {
        name: category.name,
        description: category.description,
        position: category.position,
        isActive: !currentStatus,
        businessId: BUSINESS_ID,
      });
      toast.success('Category status updated!');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update category status');
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
      const updatedOrder = await orderApi.updateStatus(orderId, { status });
      toast.success(`Order marked as ${status.replace('_', ' ')}`);

      // Surgically replace only this order in state — don't reload all orders.
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, ...updatedOrder } : o))
      );

      // If the order detail modal is open for this order, refresh it too.
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, ...updatedOrder } : prev));
      }
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

  const getOrderStatus = (o: Order): OrderStatusEnum => {
    if (!o.orderStatus?.length) return OrderStatusEnum.PENDING;
    const sorted = [...o.orderStatus].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // Normalise to lowercase so it always matches the enum (DB stores lowercase)
    return (sorted[sorted.length - 1].status as string).toLowerCase() as OrderStatusEnum;
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

  // Filter and sort orders for Orders Tab
  const filteredOrders = (() => {
    let list = [...orders];

    // 1. Search filter
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      list = list.filter(o => 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        o.id.toLowerCase().includes(q) ||
        (o.userInfo?.name && o.userInfo.name.toLowerCase().includes(q)) ||
        (o.userInfo?.contact && o.userInfo.contact.toLowerCase().includes(q)) ||
        (o.remarks && o.remarks.toLowerCase().includes(q))
      );
    }

    // 2. Status filter
    if (orderStatusFilter !== 'all') {
      list = list.filter(o => getOrderStatus(o) === orderStatusFilter);
    }

    // 3. Service type filter
    if (orderServiceFilter !== 'all') {
      list = list.filter(o => o.serviceType === orderServiceFilter);
    }

    // 4. Date filter
    if (orderDateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      list = list.filter(o => {
        if (!o.createdAt) return false;
        const oDate = new Date(o.createdAt);
        
        if (orderDateFilter === 'today') {
          return oDate >= startOfDay;
        } else if (orderDateFilter === 'yesterday') {
          const yesterdayStart = new Date(startOfDay);
          yesterdayStart.setDate(yesterdayStart.getDate() - 1);
          return oDate >= yesterdayStart && oDate < startOfDay;
        } else if (orderDateFilter === 'week') {
          const weekStart = new Date(startOfDay);
          weekStart.setDate(weekStart.getDate() - 7);
          return oDate >= weekStart;
        } else if (orderDateFilter === 'month') {
          const monthStart = new Date(startOfDay);
          monthStart.setMonth(monthStart.getMonth() - 1);
          return oDate >= monthStart;
        }
        return true;
      });
    }

    // 5. Sort list
    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      const totalA = a.totalAmount || 0;
      const totalB = b.totalAmount || 0;

      if (orderSort === 'newest') return dateB - dateA;
      if (orderSort === 'oldest') return dateA - dateB;
      if (orderSort === 'total_desc') return totalB - totalA;
      if (orderSort === 'total_asc') return totalA - totalB;
      return dateB - dateA;
    });

    return list;
  })();

  // Paginate filtered orders
  const paginatedOrders = (() => {
    const startIndex = (orderPage - 1) * orderLimit;
    return filteredOrders.slice(startIndex, startIndex + orderLimit);
  })();

  const totalOrderPages = Math.ceil(filteredOrders.length / orderLimit) || 1;

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
            <svg className="admin-sidebar__icon admin-sidebar__icon--overview" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            Overview & Analytics
          </button>
          <button className={`admin-sidebar__link ${tab === 'orders' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('orders')}>
            <svg className="admin-sidebar__icon admin-sidebar__icon--orders" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Orders {pendingOrders > 0 && <span className="badge badge-warning" style={{ marginLeft: 'auto', background: '#FF5A5F', color: 'white', borderRadius: '8px' }}>{pendingOrders}</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'menu' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('menu')}>
            <svg className="admin-sidebar__icon admin-sidebar__icon--menu" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v14M12 22v-3M12 19h7v-3c0-3.3-2.7-6-6-6h-2c-3.3 0-6 2.7-6 6v3h7z"/></svg>
            Menu Management
          </button>
          <button className={`admin-sidebar__link ${tab === 'categories' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('categories')}>
            <svg className="admin-sidebar__icon admin-sidebar__icon--categories" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            Categories Control
          </button>
          <button className={`admin-sidebar__link ${tab === 'users' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('users')}>
            <svg className="admin-sidebar__icon admin-sidebar__icon--users" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users Overview
          </button>
          <button className={`admin-sidebar__link ${tab === 'addons' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('addons')}>
            <svg className="admin-sidebar__icon admin-sidebar__icon--addons" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            Addon Customization
          </button>
          <button className={`admin-sidebar__link ${tab === 'customers' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('customers'); fetchCustomerInsights(); }}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Customer Insights
          </button>
          <button className={`admin-sidebar__link ${tab === 'loyalty_settings' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('loyalty_settings'); fetchLoyaltyConfig(); }}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Loyalty Settings
          </button>
        </nav>
        
        <div className="admin-sidebar__bottom">
          <div className="admin-sidebar__user-card">
            <div className="admin-sidebar__user-avatar">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="admin-sidebar__user-name">{user?.name || 'Administrator'}</div>
              <div className="admin-sidebar__user-role">Super Admin</div>
            </div>
            <button 
              onClick={() => { logout(); navigate('/'); }} 
              className="admin-sidebar__logout-btn"
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

        <div className="admin-main-header">
          <div>
            <h1>
              {tab === 'overview' && 'Overview & Analytics'}
              {tab === 'orders' && 'Orders Management'}
              {tab === 'menu' && 'Menu Operations'}
              {tab === 'categories' && 'Categories Control'}
              {tab === 'users' && 'Active Accounts'}
              {tab === 'addons' && 'Addon Groups & Choices'}
              {tab === 'customers' && '🏆 Customer Insights & Loyalty'}
              {tab === 'loyalty_settings' && '⚙️ Loyalty Rules & Custom Criteria'}
            </h1>
            <p style={{ color: '#929397' }}>Manage and monitor your restaurant's business statistics.</p>
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
                    border: `1.5px solid ${hideEmptyGroups ? '#5FC756' : '#EFEFF0'}`,
                    background: hideEmptyGroups ? '#EDFAEB' : '#FFFFFF',
                    color: hideEmptyGroups ? '#1B4332' : '#929397',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {hideEmptyGroups ? '● With Choices Only' : '○ Show All Groups'}
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
            <div className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">💰</div>
                <div>
                  <div className="admin-stat-label">Gross Revenue</div>
                  <div className="admin-stat-value">NPR {totalRevenue.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#FDA014', marginTop: '4px', fontWeight: '700' }}>100% Organic Volume</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📦</div>
                <div>
                  <div className="admin-stat-label">Total Orders</div>
                  <div className="admin-stat-value">{orders.length}</div>
                  <div style={{ fontSize: '12px', color: '#E14535', marginTop: '4px', fontWeight: '700' }}>{pendingOrders} awaiting validation</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">🥗</div>
                <div>
                  <div className="admin-stat-label">Average Order Value</div>
                  <div className="admin-stat-value">NPR {averageOrderValue.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#5FC756', marginTop: '4px', fontWeight: '700' }}>Per cart checkout</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">🍔</div>
                <div>
                  <div className="admin-stat-label">Active Products</div>
                  <div className="admin-stat-value">{menus.length}</div>
                  <div style={{ fontSize: '12px', color: '#FDA014', marginTop: '4px', fontWeight: '700' }}>{menus.filter(m => m.isSignature).length} signature dishes</div>
                </div>
              </div>
            </div>

            {/* Graphical Analytics Panel */}
            <div className="admin-panel-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ marginBottom: '24px', color: '#272831', fontWeight: '800', fontSize: '18px' }}>Order Pipeline Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', textAlign: 'center' }}>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (pendingOrders/orders.length)*100 : 0}%`, background: '#FED415', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831' }}>{pendingOrders}</strong>
                  <span style={{ fontSize: '12px', color: '#929397' }}>Pending</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (preparingOrders/orders.length)*100 : 0}%`, background: '#FDA014', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831' }}>{preparingOrders}</strong>
                  <span style={{ fontSize: '12px', color: '#929397' }}>Preparing</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (readyOrders/orders.length)*100 : 0}%`, background: '#5FC756', opacity: 0.6, borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831' }}>{readyOrders}</strong>
                  <span style={{ fontSize: '12px', color: '#929397' }}>Ready</span>
                </div>
                <div>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: '8px' }}>
                    <div style={{ width: '32px', height: `${orders.length ? (deliveredOrders/orders.length)*100 : 0}%`, background: '#5FC756', borderRadius: '4px 4px 0 0', minHeight: '6px' }}></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831' }}>{deliveredOrders}</strong>
                  <span style={{ fontSize: '12px', color: '#929397' }}>Delivered</span>
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
              <h3 style={{}}>Recent Incoming Orders</h3>
              <button className="btn btn-ghost" style={{ fontSize: '13px' }} onClick={() => setTab('orders')}>View All Orders ➔</button>
            </div>
            <div className="admin-table-container">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
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
                            Open Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#929397' }}>No recent orders fetched</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== ORDERS MANAGEMENT TAB ==================== */}
        {tab === 'orders' && (
          <div>
            {/* Filter controls row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
              marginBottom: '20px',
              background: '#FFFFFF',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #EFEFF0'
            }}>
              {/* Search input */}
              <div style={{ gridColumn: 'span 2', minWidth: '240px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search by ID, name, contact, remarks..."
                  className="input"
                  style={{ width: '100%', paddingLeft: '32px', fontSize: '13px', height: '42px' }}
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#929397', fontSize: '14px' }}>🔍</span>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  className="input"
                  style={{ width: '100%', fontSize: '13px', height: '42px', padding: '0 8px' }}
                  value={orderDateFilter}
                  onChange={e => setOrderDateFilter(e.target.value)}
                >
                  <option value="all">📅 All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  className="input"
                  style={{ width: '100%', fontSize: '13px', height: '42px', padding: '0 8px' }}
                  value={orderStatusFilter}
                  onChange={e => setOrderStatusFilter(e.target.value)}
                >
                  <option value="all">⚡ All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped/Ready</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Service Type Filter */}
              <div>
                <select
                  className="input"
                  style={{ width: '100%', fontSize: '13px', height: '42px', padding: '0 8px' }}
                  value={orderServiceFilter}
                  onChange={e => setOrderServiceFilter(e.target.value)}
                >
                  <option value="all">🍽️ All Services</option>
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <select
                  className="input"
                  style={{ width: '100%', fontSize: '13px', height: '42px', padding: '0 8px' }}
                  value={orderSort}
                  onChange={e => setOrderSort(e.target.value)}
                >
                  <option value="newest">⬆️ Newest First</option>
                  <option value="oldest">⬇️ Oldest First</option>
                  <option value="total_desc">💰 Billing: High to Low</option>
                  <option value="total_asc">💰 Billing: Low to High</option>
                </select>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
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
                  {paginatedOrders.map(o => {
                    const status = getOrderStatus(o);
                    return (
                      <tr key={o.id} style={{ borderBottom: '1px solid #EFEFF0' }}>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>#{o.orderNumber || o.id.slice(-6).toUpperCase()}</td>
                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#272831' }}>{o.userInfo?.name || 'Kaha Customer'}</div>
                          {o.userInfo?.contact && <div style={{ fontSize: '11px', color: '#929397' }}>{o.userInfo.contact}</div>}
                          {o.remarks && <div style={{ fontSize: '11px', color: '#E14535', fontStyle: 'italic', marginTop: '2px' }}>📝 {o.remarks}</div>}
                        </td>
                        <td>NPR {o.totalAmount?.toFixed(2)}</td>
                        <td>{o.paymentMethod || 'CASH'}</td>
                        <td>
                          <span style={{ fontSize: '13px', background: '#EFEFF0', color: '#272831', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
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
                            Inspect
                          </button>
                          {status !== OrderStatusEnum.DELIVERED && status !== OrderStatusEnum.CANCELLED && (
                            <select 
                              className="admin-status-dropdown"
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
                  {paginatedOrders.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#929397' }}>
                        No orders matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredOrders.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                background: '#FFFFFF',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #EFEFF0'
              }}>
                <div style={{ fontSize: '13px', color: '#929397', fontWeight: '500' }}>
                  Showing <strong>{Math.min(filteredOrders.length, (orderPage - 1) * orderLimit + 1)}</strong> to{' '}
                  <strong>{Math.min(filteredOrders.length, orderPage * orderLimit)}</strong> of{' '}
                  <strong>{filteredOrders.length}</strong> orders
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Page limit selector */}
                  <select
                    className="input"
                    style={{ width: '90px', height: '32px', fontSize: '12px', padding: '0 4px', borderRadius: '6px', cursor: 'pointer' }}
                    value={orderLimit}
                    onChange={e => {
                      setOrderLimit(Number(e.target.value));
                      setOrderPage(1);
                    }}
                  >
                    <option value={5}>5 / page</option>
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', minWidth: '70px' }}
                    disabled={orderPage === 1}
                    onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                  >
                    ◀ Prev
                  </button>
                  
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#272831', padding: '0 8px' }}>
                    Page {orderPage} of {totalOrderPages}
                  </span>

                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', minWidth: '70px' }}
                    disabled={orderPage >= totalOrderPages}
                    onClick={() => setOrderPage(p => Math.min(totalOrderPages, p + 1))}
                  >
                    Next ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== MENU CRUD TAB ==================== */}
        {tab === 'menu' && (
          <div>
            <div className="admin-menu-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Add New Item Button Card */}
              <div className="admin-add-card" onClick={handleOpenAddMenu} style={{ height: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed #EFEFF0', borderRadius: '16px', cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.2s, background 0.2s' }}>
                <span style={{ fontSize: '48px', marginBottom: '16px', color: '#5FC756' }}>+</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1B4332' }}>Add Menu Item</h3>
                <p style={{ color: '#929397', textAlign: 'center', padding: '0 20px', marginTop: '8px', fontSize: '13px' }}>Introduce a delicious new dish to your restaurant.</p>
              </div>

              {menus.map(m => {
                const displayPrice = m.variants && m.variants.length > 0
                  ? Math.min(...m.variants.map(v => Number(v.price)))
                  : Number(m.price ?? 0);
                const discountedPrice = m.discountedPrice ? Number(m.discountedPrice) : null;
                const imgSrc = m.images?.[0] || m.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

                return (
                  <div key={m.id} className="admin-item-card">
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <img src={imgSrc} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="admin-card-badge">
                        {m.category?.name || 'Dish'}
                      </span>
                    </div>

                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#272831' }}>{m.name}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontWeight: '800', color: '#5FC756', fontSize: '15px' }}>NPR {displayPrice.toFixed(2)}</span>
                          {discountedPrice && <span style={{ textDecoration: 'line-through', fontSize: '11px', color: '#929397' }}>NPR {discountedPrice.toFixed(2)}</span>}
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: '#929397', margin: '0 0 16px', flex: 1 }}>{m.description || 'No description provided.'}</p>

                      <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #EFEFF0', paddingTop: '16px' }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '6px 12px', fontSize: '13px', flex: 1 }}
                          onClick={() => toggleSignature(m.id, !m.isSignature)}
                        >
                          {m.isSignature ? 'Starred' : 'Highlight'}
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '13px' }}
                          onClick={() => handleOpenEditMenu(m)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '13px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px' }}
                          onClick={() => handleDeleteMenu(m.id)}
                        >
                          Delete
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
            <div className="admin-table-container">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '16px' }}>Category Name</th>
                    <th>Description</th>
                    <th>Position Index</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #EFEFF0' }}>
                      <td style={{ padding: '16px', fontWeight: 'bold' }}>{c.name}</td>
                      <td>{c.description || 'No description listed'}</td>
                      <td>{c.position || 0}</td>
                      <td>
                        <button
                          onClick={() => handleToggleCategoryStatus(c.id, c.isActive ?? true)}
                          className={`admin-status-btn admin-status-btn--${c.isActive ? 'active' : 'inactive'}`}
                        >
                          {c.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => handleDeleteCategory(c.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#929397' }}>No categories defined yet. Create one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== USERS TAB ==================== */}
        {tab === 'users' && (
          <div className="admin-table-container">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #EFEFF0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#272831' }}>
                {usersList.length} Registered Customer{usersList.length !== 1 ? 's' : ''}
              </span>
            </div>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '16px' }}>Full Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>System Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersList.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#929397' }}>
                      No customers found.
                    </td>
                  </tr>
                )}
                {usersList.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #EFEFF0' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{u.name}</td>
                    <td>{u.email || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span style={{
                        background: u.role === 'business_super_admin' ? '#EDFAEB' : '#F0F4FF',
                        color: u.role === 'business_super_admin' ? '#1B4332' : '#3B4BDB',
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.isActive === false
                        ? <span style={{ color: '#E14535', fontWeight: 700 }}>✗ Inactive</span>
                        : <span style={{ color: '#5FC756', fontWeight: 700 }}>✓ Active</span>
                      }
                    </td>
                    <td style={{ color: '#929397', fontSize: '13px' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}


        {/* ==================== ADDON CUSTOMIZATION TAB ==================== */}
        {tab === 'addons' && (
          <div className="admin-panel-card" style={{ overflow: 'hidden' }}>
            {/* Legend */}
            <div className="addon-legend">
              <span><strong>Single Choice</strong> = customer picks exactly 1 (e.g. Portion Size)</span>
              <span>•</span>
              <span><strong>Multi Choice</strong> = customer picks multiple (e.g. Extra Addons)</span>
              <span>•</span>
              <span>Click a group row below to show/edit its choices</span>
            </div>

            {deduplicatedAddonGroups
              .filter(group => !hideEmptyGroups || (group.addons && group.addons.length > 0))
              .map((group) => {
                const isExpanded = expandedGroupId === group.id;
                const addonCount = group.addons?.length || 0;
                return (
                  <div key={group.id}>
                    {/* --- GROUP ROW --- */}
                    <div
                      className={`addon-group-row ${isExpanded ? 'addon-group-row--expanded' : ''}`}
                      onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                    >
                      {/* Chevron */}
                      <span className="addon-group-chevron">▶</span>

                      {/* Group Title */}
                      <span className="addon-group-name">{group.name}</span>

                      {/* Alignment wrapper for Badges & Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Badges */}
                        <div className="addon-badges">
                          <span className={`addon-badge ${group.selectionType === 'single' ? 'addon-badge--single' : 'addon-badge--multi'}`}>
                            {group.selectionType === 'single' ? '● Single Choice' : '☑ Multi Choice'}
                          </span>
                          {group.isRequired && (
                            <span className="addon-badge addon-badge--required">Required</span>
                          )}
                          {(group.minSelect !== undefined || group.maxSelect) && (
                            <span className="addon-badge addon-badge--count" style={{ letterSpacing: 'normal' }}>
                              {group.minSelect || 0}–{group.maxSelect || '∞'} picks
                            </span>
                          )}
                          <span className={`addon-badge ${addonCount > 0 ? 'addon-badge--count-active' : 'addon-badge--count'}`}>
                            {addonCount} choice{addonCount !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Group Actions */}
                        <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleOpenEditAddonGroup(group)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 12px', fontSize: '13px' }}
                            onClick={() => handleDeleteAddonGroup(group.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* --- EXPANDED ADDONS PANEL --- */}
                    {isExpanded && (
                      <div className="addon-choices-panel">
                        <div className="addon-choices-list">
                          {addonCount > 0 ? (
                            group.addons?.map((addon: Addon) => (
                              <div key={addon.id} className="addon-choice-item">
                                <div className="addon-choice-info">
                                  <span className="addon-choice-name">{addon.name}</span>
                                  <span className="addon-choice-price">NPR {Number(addon.price || 0).toFixed(0)}</span>
                                </div>
                                <div className="addon-choice-actions">
                                  <button
                                    className="btn btn-ghost"
                                    onClick={() => handleOpenEditAddon(group.id, addon)}
                                  >
                                    Edit Option
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDeleteAddon(group.id, addon.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: '14px', color: '#929397', margin: '0 0 12px', fontWeight: '500' }}>No options defined in this group yet.</p>
                          )}
                        </div>

                        {/* Add new option button */}
                        <button
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                          onClick={() => handleOpenAddAddon(group.id)}
                        >
                          + Add Choice Option
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            {deduplicatedAddonGroups.filter(g => !hideEmptyGroups || (g.addons && g.addons.length > 0)).length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 24px', color: '#929397', fontWeight: '500', fontSize: '14px' }}>
                No addon groups found. Click <strong>+ Add Addon Group</strong> in the header to get started!
              </div>
            )}
          </div>
        )}

        {/* ==================== CUSTOMER INSIGHTS TAB ==================== */}
        {tab === 'customers' && (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {[
                { icon: '👥', label: 'Total Customers', value: loyaltySummary?.totalCustomers ?? customerInsights.length, sub: 'registered with loyalty', color: '#5FC756' },
                { icon: '🔄', label: 'Returning Customers', value: loyaltySummary?.returningCustomers ?? customerInsights.filter(c => c.isReturning).length, sub: `${loyaltySummary?.retentionRate ?? 0}% retention`, color: '#FDA014' },
                { icon: '🌱', label: 'New Customers', value: loyaltySummary?.newCustomers ?? customerInsights.filter(c => !c.isReturning).length, sub: 'first-time visitors', color: '#5FC756' },
                { icon: '⭐', label: 'Points Issued', value: loyaltySummary?.totalPointsIssued?.toLocaleString() ?? '—', sub: 'lifetime earned', color: '#FDA014' },
                { icon: '🎟️', label: 'Vouchers Issued', value: loyaltySummary?.totalVouchersIssued ?? '—', sub: 'from redemptions', color: '#E14535' },
              ].map((card, i) => (
                <div key={i} className="admin-stat-card" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{card.icon}</div>
                  <div style={{ fontSize: '11px', color: '#929397', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>{card.label}</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#272831' }}>{card.value}</div>
                  <div style={{ fontSize: '11px', color: card.color, fontWeight: '700', marginTop: '4px' }}>{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Tier Legend */}
            <div className="admin-panel-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: '#272831' }}>Loyalty Tiers:</span>
              {[
                { tier: 'New 🌱', desc: '1 order', bg: '#F0FFF4', color: '#1B4332' },
                { tier: 'Bronze 🥉', desc: '2–4 orders', bg: '#FFF8E7', color: '#7C4A00' },
                { tier: 'Silver 🥈', desc: '5–9 or NPR 2k+', bg: '#F0F4FF', color: '#1A237E' },
                { tier: 'Gold ⭐', desc: '10–19 or NPR 5k+', bg: '#FFFDE7', color: '#6D4C00' },
                { tier: 'VIP 👑', desc: '20+ or NPR 10k+', bg: '#FCE4EC', color: '#880E4F' },
              ].map((t, i) => (
                <div key={i} style={{ background: t.bg, color: t.color, padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                  {t.tier} <span style={{ fontWeight: '400', opacity: 0.8 }}>— {t.desc}</span>
                </div>
              ))}
            </div>

            {/* Search + Filter row */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍  Search by user ID or name..."
                className="input"
                style={{ flex: 1, minWidth: '200px', padding: '10px 16px', maxWidth: '360px' }}
                value={insightSearch}
                onChange={e => setInsightSearch(e.target.value)}
              />
              {(['all', 'returning', 'vip', 'new'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInsightFilter(f)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: `1.5px solid ${insightFilter === f ? '#5FC756' : '#EFEFF0'}`,
                    background: insightFilter === f ? '#EDFAEB' : '#fff',
                    color: insightFilter === f ? '#1B4332' : '#929397',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textTransform: 'capitalize',
                  }}
                >
                  {f === 'all' ? 'All Customers' : f === 'returning' ? '🔄 Returning' : f === 'vip' ? '👑 VIP' : '🌱 New'}
                </button>
              ))}
              <button className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: '13px' }} onClick={fetchCustomerInsights}>
                ↻ Refresh
              </button>
            </div>

            {/* Customer Table */}
            <div className="admin-table-container">
              {loyaltyLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#929397' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px' }} />
                  Loading customer insights...
                </div>
              ) : (
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '16px' }}>Customer</th>
                      <th>Tier</th>
                      <th>Total Orders</th>
                      <th>Total Spent</th>
                      <th>Points Balance</th>
                      <th>Lifetime Earned</th>
                      <th>Status</th>
                      <th>Last Activity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInsights
                      .filter(c => {
                        const matchSearch = !insightSearch || 
                          c.userId?.toLowerCase().includes(insightSearch.toLowerCase()) || 
                          c.customerName?.toLowerCase().includes(insightSearch.toLowerCase());
                        const matchFilter =
                          insightFilter === 'all' ? true :
                          insightFilter === 'returning' ? c.isReturning :
                          insightFilter === 'vip' ? (c.tier || '').includes('VIP') || (c.tier || '').includes('Gold') :
                          !c.isReturning;
                        return matchSearch && matchFilter;
                      })
                      .map((c, idx) => (
                        <tr key={c.userId || idx} style={{ borderBottom: '1px solid #EFEFF0', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #5FC756, #1B4332)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '15px', flexShrink: 0 }}>
                                {(c.customerName || c.userId || '?').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '700', fontSize: '14px', color: '#272831' }}>{c.customerName || `Customer #${(c.userId || '').slice(-6)}`}</div>
                                <div style={{ fontSize: '11px', color: '#929397' }}>
                                  {c.customerPhone ? `${c.customerPhone} • ` : ''}ID: ...{(c.userId || '').slice(-8)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '700',
                              background: (c.tier || '').includes('VIP') ? '#FCE4EC' : (c.tier || '').includes('Gold') ? '#FFFDE7' : (c.tier || '').includes('Silver') ? '#F0F4FF' : (c.tier || '').includes('Bronze') ? '#FFF8E7' : '#F0FFF4',
                              color: (c.tier || '').includes('VIP') ? '#880E4F' : (c.tier || '').includes('Gold') ? '#6D4C00' : (c.tier || '').includes('Silver') ? '#1A237E' : (c.tier || '').includes('Bronze') ? '#7C4A00' : '#1B4332',
                            }}>
                              {c.tier || 'New 🌱'}
                            </span>
                          </td>
                          <td style={{ fontWeight: '800', fontSize: '18px', color: '#272831' }}>{c.totalOrders || 0}</td>
                          <td style={{ fontWeight: '700', color: '#5FC756' }}>NPR {Number(c.totalSpent || 0).toFixed(0)}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: '#EFEFF0', borderRadius: '3px', minWidth: '60px' }}>
                                <div style={{ height: '100%', background: '#FDA014', borderRadius: '3px', width: `${Math.min(100, ((c.totalPoints || 0) / 500) * 100)}%` }} />
                              </div>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: '#FDA014', whiteSpace: 'nowrap' }}>{c.totalPoints || 0} pts</span>
                            </div>
                          </td>
                          <td style={{ color: '#929397', fontSize: '13px' }}>{c.lifetimePointsEarned || 0} pts</td>
                          <td>
                            <span style={{
                              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700',
                              background: c.isReturning ? '#EDFAEB' : '#FFF8E7',
                              color: c.isReturning ? '#1B4332' : '#7C4A00',
                            }}>
                              {c.isReturning ? '🔄 Returning' : '🌱 New'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: '#929397' }}>
                            {c.lastActivity ? new Date(c.lastActivity).toLocaleDateString() : '—'}
                          </td>
                          <td style={{ padding: '16px' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '6px 14px', fontSize: '12px' }}
                              onClick={() => setSelectedCustomer(c)}
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                    {customerInsights.length === 0 && !loyaltyLoading && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#929397' }}>
                          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏆</div>
                          <div style={{ fontWeight: '700', marginBottom: '4px' }}>No customer loyalty data yet</div>
                          <div style={{ fontSize: '13px' }}>Points are automatically awarded when customers complete orders.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Customer Profile Modal */}
            {selectedCustomer && (
              <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                <div className="modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Customer Profile</h2>
                    <button className="modal-close" onClick={() => setSelectedCustomer(null)}>×</button>
                  </div>
                  <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px', gap: '16px' }}>
                    {/* Avatar + ID */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #5FC756, #1B4332)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '900', fontSize: '22px' }}>
                        {(selectedCustomer.customerName || selectedCustomer.userId || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '800', fontSize: '18px', color: '#272831' }}>
                          {selectedCustomer.customerName || `Customer #${selectedCustomer.userId?.slice(-6)}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#929397' }}>
                          {selectedCustomer.customerPhone ? `Phone: ${selectedCustomer.customerPhone} • ` : ''}ID: {selectedCustomer.userId}
                        </div>
                        {selectedCustomer.customerEmail && (
                          <div style={{ fontSize: '12px', color: '#929397', marginTop: '2px' }}>
                            Email: {selectedCustomer.customerEmail}
                          </div>
                        )}
                        <span style={{
                          display: 'inline-block', marginTop: '6px',
                          padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                          background: (selectedCustomer.tier || '').includes('VIP') ? '#FCE4EC' : '#EDFAEB',
                          color: (selectedCustomer.tier || '').includes('VIP') ? '#880E4F' : '#1B4332',
                        }}>{selectedCustomer.tier || 'New 🌱'}</span>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {[
                        { label: 'Total Orders', value: selectedCustomer.totalOrders || 0, icon: '📦', color: '#272831' },
                        { label: 'Total Spent', value: `NPR ${Number(selectedCustomer.totalSpent || 0).toFixed(0)}`, icon: '💰', color: '#5FC756' },
                        { label: 'Points Balance', value: `${selectedCustomer.totalPoints || 0} pts`, icon: '⭐', color: '#FDA014' },
                        { label: 'Lifetime Earned', value: `${selectedCustomer.lifetimePointsEarned || 0} pts`, icon: '🏆', color: '#E14535' },
                        { label: 'Points Redeemed', value: `${selectedCustomer.lifetimePointsRedeemed || 0} pts`, icon: '🎟️', color: '#929397' },
                        { label: 'Status', value: selectedCustomer.isReturning ? 'Returning ✅' : 'New Customer', icon: '🔄', color: selectedCustomer.isReturning ? '#1B4332' : '#FDA014' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: '#FAFAFA', borderRadius: '12px', padding: '14px 16px' }}>
                          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                          <div style={{ fontSize: '11px', color: '#929397', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                          <div style={{ fontWeight: '800', fontSize: '16px', color: s.color, marginTop: '2px' }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Points Progress to next tier */}
                    <div style={{ background: '#F0FFF4', borderRadius: '12px', padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: '#1B4332' }}>Loyalty Progress</span>
                        <span style={{ fontSize: '12px', color: '#5FC756', fontWeight: '700' }}>{selectedCustomer.totalPoints || 0} / 500 pts for next voucher</span>
                      </div>
                      <div style={{ height: '8px', background: '#C8E6C9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(90deg, #5FC756, #1B4332)', borderRadius: '4px', width: `${Math.min(100, ((selectedCustomer.totalPoints || 0) / 500) * 100)}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ fontSize: '11px', color: '#929397', marginTop: '6px' }}>Every NPR 10 spent = 1 point. 100 points = NPR 50 voucher.</div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={() => setSelectedCustomer(null)}>Close</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== LOYALTY SETTINGS TAB ==================== */}
        {tab === 'loyalty_settings' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 10px' }}>
            <form onSubmit={handleSaveLoyaltyConfig}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
                alignItems: 'start'
              }}>
                
                {/* LEFT COLUMN: Input Configuration Fields */}
                <div className="admin-stat-card" style={{
                  padding: '24px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #EFEFF0',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #EFEFF0', paddingBottom: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⚙️</span>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#272831' }}>Configure Loyalty Points Rules</h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#929397' }}>Customize customer earning ratios, redemption policies, and voucher rules.</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Point Earn Rate */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span>Points Earning Ratio (per NPR)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          max="10"
                          className="input" 
                          required 
                          style={{ height: '40px', fontSize: '13px', paddingRight: '90px' }}
                          value={loyaltyConfig.pointsPerNpr}
                          onChange={e => setLoyaltyConfig(c => ({ ...c, pointsPerNpr: Number(e.target.value) }))}
                          placeholder="e.g. 0.1"
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#5FC756', fontWeight: '800', fontSize: '11px' }}>
                          {loyaltyConfig.pointsPerNpr} pts/NPR
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Multiplier to grant points. E.g., <strong>0.1</strong> yields 1 point per 10 NPR spent; <strong>0.05</strong> yields 1 point per 20 NPR spent.
                      </p>
                    </div>

                    {/* Points Value Rate */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <span>Point Redemption Value (in NPR)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="number" 
                          step="0.01"
                          min="0"
                          max="100"
                          className="input" 
                          required 
                          style={{ height: '40px', fontSize: '13px', paddingRight: '90px' }}
                          value={loyaltyConfig.pointsToNprRate}
                          onChange={e => setLoyaltyConfig(c => ({ ...c, pointsToNprRate: Number(e.target.value) }))}
                          placeholder="e.g. 0.5"
                        />
                        <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#FDA014', fontWeight: '800', fontSize: '11px' }}>
                          {loyaltyConfig.pointsToNprRate} NPR/pt
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Monetary value of one point. E.g., <strong>0.5</strong> means 100 points = NPR 50 discount voucher.
                      </p>
                    </div>

                    {/* Min Redemption Threshold */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Minimum Redemption Threshold
                      </label>
                      <input 
                        type="number" 
                        step="1"
                        min="1"
                        className="input" 
                        required 
                        style={{ height: '40px', fontSize: '13px' }}
                        value={loyaltyConfig.minRedeemPoints}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, minRedeemPoints: Number(e.target.value) }))}
                        placeholder="e.g. 100"
                      />
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        The minimum points balance required before a customer can request or redeem a voucher.
                      </p>
                    </div>

                    {/* Voucher Expiry Days */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Voucher Expiry Duration (Days)
                      </label>
                      <input 
                        type="number" 
                        step="1"
                        min="1"
                        className="input" 
                        required 
                        style={{ height: '40px', fontSize: '13px' }}
                        value={loyaltyConfig.voucherExpiryDays}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, voucherExpiryDays: Number(e.target.value) }))}
                        placeholder="e.g. 30"
                      />
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        The validity period of a generated loyalty voucher before it automatically expires.
                      </p>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Live Simulation & Save Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Simulation Card */}
                  <div className="admin-stat-card" style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: '#F4F7FD',
                    border: '1px solid #D3E2F9',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.01)'
                  }}>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#3A86C8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <span>💡</span> Live System Simulator
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #E1EAF7', paddingBottom: '6px' }}>
                        <span style={{ color: '#55617A', fontWeight: '500' }}>Sample Spend</span>
                        <strong style={{ color: '#272831' }}>NPR 1,000.00</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #E1EAF7', paddingBottom: '6px' }}>
                        <span style={{ color: '#55617A', fontWeight: '500' }}>Points Accrued</span>
                        <strong style={{ color: '#5FC756' }}>+{Math.floor(1000 * loyaltyConfig.pointsPerNpr)} pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #E1EAF7', paddingBottom: '6px' }}>
                        <span style={{ color: '#55617A', fontWeight: '500' }}>Min. Redemptions</span>
                        <strong style={{ color: '#272831' }}>{loyaltyConfig.minRedeemPoints} pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #E1EAF7', paddingBottom: '6px' }}>
                        <span style={{ color: '#55617A', fontWeight: '500' }}>Voucher Value</span>
                        <strong style={{ color: '#FDA014' }}>NPR {(loyaltyConfig.minRedeemPoints * loyaltyConfig.pointsToNprRate).toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #E1EAF7', paddingBottom: '6px' }}>
                        <span style={{ color: '#55617A', fontWeight: '500' }}>Voucher Expiry</span>
                        <strong style={{ color: '#272831' }}>{loyaltyConfig.voucherExpiryDays} Days</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '2px' }}>
                        <span style={{ color: '#3A86C8', fontWeight: '800' }}>Cashback Yield</span>
                        <strong style={{ color: '#3A86C8', fontWeight: '800' }}>
                          {(loyaltyConfig.pointsPerNpr * loyaltyConfig.pointsToNprRate * 100).toFixed(2)}%
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions Card */}
                  <div className="admin-stat-card" style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: '#ffffff',
                    border: '1px solid #EFEFF0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isConfigSaving}
                      style={{ background: '#5FC756', border: 'none', width: '100%', height: '40px', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {isConfigSaving ? 'Saving Config...' : 'Apply & Save Config'}
                    </button>
                    
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      disabled={isConfigSaving}
                      onClick={fetchLoyaltyConfig}
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                    >
                      Reset Changes
                    </button>
                  </div>
                </div>

              </div>
            </form>
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

                {/* ── Image Picker ── */}
                <div className="input-group">
                  <label className="input-label">Item Image</label>

                  {/* Live preview */}
                  {menuForm.image && (
                    <div style={{ position: 'relative', marginBottom: '10px', borderRadius: '12px', overflow: 'hidden', height: '160px', border: '2px solid #5FC756' }}>
                      <img
                        src={menuForm.image}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setMenuForm(mf => ({ ...mf, image: '' }))}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: '#E14535', color: '#fff', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >×</button>
                    </div>
                  )}

                  {/* URL input */}
                  <input
                    type="text"
                    className="input"
                    placeholder="Paste image URL or pick a suggestion below..."
                    value={menuForm.image}
                    onChange={e => setMenuForm(mf => ({ ...mf, image: e.target.value }))}
                  />

                  {/* Quick photo suggestions */}
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#929397', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '10px 0 6px' }}>Quick Suggestions</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { label: 'Rice Bowl', url: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?w=400&q=80' },
                      { label: 'Burger',    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
                      { label: 'Pizza',     url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
                      { label: 'Salad',     url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
                      { label: 'Noodles',   url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80' },
                      { label: 'Curry',     url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
                      { label: 'Sandwich',  url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80' },
                      { label: 'Dessert',   url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
                    ].map(s => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setMenuForm(mf => ({ ...mf, image: s.url }))}
                        style={{
                          padding: 0,
                          border: menuForm.image === s.url ? '2.5px solid #5FC756' : '2px solid #EFEFF0',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          background: 'none',
                          position: 'relative',
                        }}
                      >
                        <img src={s.url} alt={s.label} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                        <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(39,40,49,0.65)', color: '#fff', fontSize: '9px', fontWeight: '800', textAlign: 'center', padding: '3px 0', letterSpacing: '0.04em' }}>{s.label}</span>
                      </button>
                    ))}
                  </div>
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

                <div className="input-group" style={{ marginTop: '16px', borderTop: '1px solid #EFEFF0', paddingTop: '16px' }}>
                  <label className="input-label" style={{ fontWeight: '800' }}>Link Addon Groups</label>
                  <p style={{ fontSize: '12px', color: '#929397', marginTop: '-4px', marginBottom: '8px' }}>Select which customizable options apply to this menu item.</p>
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
                  <span>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Customer:</strong>
                  <span>{selectedOrder.userInfo?.name || 'Kaha Customer'} {selectedOrder.userInfo?.contact ? `(${selectedOrder.userInfo.contact})` : ''}</span>
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
                  <span>NPR {(selectedOrder.taxAmount || 0).toFixed(2)}</span>
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
              <button className="btn btn-primary" onClick={() => window.print()}>Print Receipt</button>
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
