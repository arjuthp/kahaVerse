import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderApi, tableApi } from '../../api/order.api';
import { menuApi, categoryApi } from '../../api/menu.api';
import { addonGroupApi, addonApi } from '../../api/addon.api';
import { loyaltyApi } from '../../api/loyalty.api';
import { useAuth } from '../../context/AuthContext';
import type { Order, Menu, Category, AddonGroup, Addon, RestaurantTable } from '../../types';
import { OrderStatusEnum, AddonSelectionTypeEnum, TableSection, TableStatus } from '../../types';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

type AdminTab = 'overview' | 'orders' | 'menu' | 'categories' | 'users' | 'addons' | 'customers' | 'loyalty_settings' | 'tables' | 'vouchers';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('admin_sidebar_collapsed', String(nextState));
  };
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
    voucherExpiryDays: 30,
    accrualMode: 'SPEND' as 'SPEND' | 'VISIT' | 'BOTH',
    pointsPerVisit: 5,
    minSpendForVisit: 0,
    bonusMultiplier: 1.0,
    pointsExpiryDays: null as number | null,
  });
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  // Table Management state
  const [tablesList, setTablesList] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableForm, setTableForm] = useState({
    tableNumber: '',
    capacity: 2,
    section: TableSection.INDOOR,
    notes: '',
    isActive: true,
  });

  // Voucher Hub state
  const [vouchersSubTab, setVouchersSubTab] = useState<'hub' | 'campaigns' | 'award-campaign' | 'award-manual' | 'logs'>('hub');
  const [awardedVouchers, setAwardedVouchers] = useState<any[]>([]);
  const [awardLoading, setAwardLoading] = useState(false);
  const [awardSuccess, setAwardSuccess] = useState<string | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);
  const [awardForm, setAwardForm] = useState({
    userId: '',
    code: '',
    discountType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 0,
    minOrderAmount: 0,
    maxUses: 1,
    maxUsesPerUser: 1,
    expiresAt: '',
  });

  // Campaign state
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignSuccess, setCampaignSuccess] = useState<string | null>(null);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [campaignActionLoading, setCampaignActionLoading] = useState<string | null>(null);
  const [campaignAwardUserId, setCampaignAwardUserId] = useState('');
  const [campaignAwardCampaignId, setCampaignAwardCampaignId] = useState('');
  const [campaignAwardExpiresAt, setCampaignAwardExpiresAt] = useState('');
  const [campaignAwardResult, setCampaignAwardResult] = useState<string | null>(null);
  const [awardType, setAwardType] = useState<'single' | 'mass'>('single');
  const [massCriteria, setMassCriteria] = useState<'all' | 'min_orders' | 'min_spent'>('all');
  const [massMinOrders, setMassMinOrders] = useState<number>(5);
  const [massMinSpent, setMassMinSpent] = useState<number>(1000);

  // Redemption Logs modal state
  const [logsModalCampaign, setLogsModalCampaign] = useState<any | null>(null);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLoading, setLogsLoading] = useState(false);
  const LOGS_LIMIT = 15;
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    discountType: 'PERCENTAGE' as 'FIXED' | 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: '',
    minOrderAmount: '',
    discountClass: 'ORDER_TOTAL',
    applicableServiceTypes: [] as string[],
    requiresFirstOrder: false,
    validDaysOfWeek: [] as number[],
    validTimeStart: '',
    validTimeEnd: '',
    startsAt: '',
    expiresAt: '',
    maxRedemptionsTotal: '',
    maxRedemptionsPerUser: '',
    maxRedemptionsPerUserPerDay: '',
    totalBudgetCap: '',
  });

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
    isHidden: false,
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
    fetchTables();
    fetchAwardedVouchers();
    fetchCampaigns();
  }, [BUSINESS_ID]);

  const fetchCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const data = await loyaltyApi.getCampaigns(BUSINESS_ID);
      setCampaigns(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch campaigns error:', err);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignError(null);
    setCampaignSuccess(null);
    try {
      const payload: any = {
        name: campaignForm.name,
        discountType: campaignForm.discountType,
        discountValue: Number(campaignForm.discountValue),
        discountClass: campaignForm.discountClass,
        requiresFirstOrder: campaignForm.requiresFirstOrder,
        applicableServiceTypes: campaignForm.applicableServiceTypes.length > 0 ? campaignForm.applicableServiceTypes : undefined,
        validDaysOfWeek: campaignForm.validDaysOfWeek.length > 0 ? campaignForm.validDaysOfWeek : undefined,
        validTimeStart: campaignForm.validTimeStart || undefined,
        validTimeEnd: campaignForm.validTimeEnd || undefined,
        startsAt: campaignForm.startsAt || undefined,
        expiresAt: campaignForm.expiresAt || undefined,
        businessId: BUSINESS_ID,
      };
      if (campaignForm.maxDiscountAmount) payload.maxDiscountAmount = Number(campaignForm.maxDiscountAmount);
      if (campaignForm.minOrderAmount) payload.minOrderAmount = Number(campaignForm.minOrderAmount);
      if (campaignForm.maxRedemptionsTotal) payload.maxRedemptionsTotal = Number(campaignForm.maxRedemptionsTotal);
      if (campaignForm.maxRedemptionsPerUser) payload.maxRedemptionsPerUser = Number(campaignForm.maxRedemptionsPerUser);
      if (campaignForm.maxRedemptionsPerUserPerDay) payload.maxRedemptionsPerUserPerDay = Number(campaignForm.maxRedemptionsPerUserPerDay);
      if (campaignForm.totalBudgetCap) payload.totalBudgetCap = Number(campaignForm.totalBudgetCap);
      await loyaltyApi.createCampaign(payload);
      toast.success('Campaign created as DRAFT!');
      setCampaignSuccess('Campaign created in DRAFT status. Click Activate to make it live.');
      setIsCampaignModalOpen(false);
      fetchCampaigns();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to create campaign';
      setCampaignError(msg);
      toast.error(msg);
    }
  };

  const handleCampaignAction = async (id: string, action: 'activate' | 'pause' | 'resume' | 'archive') => {
    if (action === 'archive' && !window.confirm('Archive is irreversible. Continue?')) return;
    setCampaignActionLoading(id + action);
    try {
      const fn = {
        activate: () => loyaltyApi.activateCampaign(id),
        pause: () => loyaltyApi.pauseCampaign(id),
        resume: () => loyaltyApi.resumeCampaign(id),
        archive: () => loyaltyApi.archiveCampaign(id),
      }[action];
      await fn();
      toast.success(`Campaign ${action}d successfully`);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${action} campaign`);
    } finally {
      setCampaignActionLoading(null);
    }
  };

  const handleViewLogs = async (campaign: any, page: number = 1) => {
    setLogsModalCampaign(campaign);
    setLogsPage(page);
    setLogsLoading(true);
    setLogsData([]);
    try {
      const res = await loyaltyApi.getCampaignRedemptions(campaign.id, { page, limit: LOGS_LIMIT });
      setLogsData(res.data ?? []);
      setLogsTotal(res.total ?? 0);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load redemption logs');
      setLogsModalCampaign(null);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCampaignAwardVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampaignAwardResult(null);
    setCampaignError(null);
    try {
      if (awardType === 'single') {
        const res = await loyaltyApi.awardVoucherToCustomer({
          userId: campaignAwardUserId,
          businessId: BUSINESS_ID,
          campaignId: campaignAwardCampaignId,
          expiresAt: campaignAwardExpiresAt || undefined,
        });
        const code = res?.code || res?.data?.code || '(check DB)';
        setCampaignAwardResult(`Voucher code: ${code}`);
        toast.success(`Voucher awarded! Code: ${code}`);
        setCampaignAwardUserId('');
        setCampaignAwardExpiresAt('');
      } else {
        const res = await loyaltyApi.awardVoucherToMassUsers({
          campaignId: campaignAwardCampaignId,
          businessId: BUSINESS_ID,
          criteria: massCriteria,
          minOrders: massCriteria === 'min_orders' ? Number(massMinOrders) : undefined,
          minSpent: massCriteria === 'min_spent' ? Number(massMinSpent) : undefined,
          expiresAt: campaignAwardExpiresAt || undefined,
        });
        const count = res?.awardedCount ?? 0;
        setCampaignAwardResult(`Mass vouchers successfully awarded to ${count} customers!`);
        toast.success(`Mass vouchers awarded to ${count} customers!`);
        setCampaignAwardExpiresAt('');
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to award voucher';
      setCampaignError(errMsg);
      toast.error(errMsg);
    }
  };

  const fetchTables = async () => {
    setTablesLoading(true);
    try {
      const data = await tableApi.getTables();
      setTablesList(data);
    } catch (err) {
      console.error('Fetch tables error:', err);
    } finally {
      setTablesLoading(false);
    }
  };

  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tableApi.updateTable(editingTable.id, tableForm);
        toast.success('Table updated successfully!');
      } else {
        await tableApi.createTable(tableForm);
        toast.success('Table created successfully!');
      }
      setIsTableModalOpen(false);
      setEditingTable(null);
      setTableForm({
        tableNumber: '',
        capacity: 2,
        section: TableSection.INDOOR,
        notes: '',
        isActive: true,
      });
      fetchTables();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save table');
    }
  };

  const handleToggleTableStatus = async (table: any) => {
    try {
      const nextStatus = table.status === TableStatus.AVAILABLE ? TableStatus.OCCUPIED : TableStatus.AVAILABLE;
      await tableApi.updateTable(table.id, { status: nextStatus });
      toast.success(`Table ${table.tableNumber} status updated to ${nextStatus}`);
      fetchTables();
    } catch (err: any) {
      toast.error('Failed to update table status');
    }
  };

  const handleToggleTableActive = async (table: any) => {
    try {
      await tableApi.updateTable(table.id, { isActive: !table.isActive });
      toast.success(`Table ${table.tableNumber} is now ${!table.isActive ? 'active' : 'inactive'}`);
      fetchTables();
    } catch (err: any) {
      toast.error('Failed to update active state');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await tableApi.deleteTable(id);
      toast.success('Table deleted successfully');
      fetchTables();
    } catch (err: any) {
      toast.error('Failed to delete table');
    }
  };

  const fetchAwardedVouchers = async () => {
    try {
      const data = await loyaltyApi.getAdminVouchers();
      setAwardedVouchers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Fetch awarded vouchers error:', err);
    }
  };

  const handleAwardVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setAwardLoading(true);
    setAwardSuccess(null);
    setAwardError(null);
    try {
      const payload = {
        userId: awardForm.userId,
        code: awardForm.code.trim().toUpperCase() || undefined,
        discountType: awardForm.discountType,
        discountValue: Number(awardForm.discountValue),
        maxDiscountAmount: awardForm.maxDiscountAmount ? Number(awardForm.maxDiscountAmount) : undefined,
        minOrderAmount: awardForm.minOrderAmount ? Number(awardForm.minOrderAmount) : undefined,
        maxUses: awardForm.maxUses ? Number(awardForm.maxUses) : undefined,
        maxUsesPerUser: awardForm.maxUsesPerUser ? Number(awardForm.maxUsesPerUser) : undefined,
        expiresAt: awardForm.expiresAt || undefined,
      };

      const res = await loyaltyApi.createAdminVoucher(payload);
      toast.success('Voucher awarded successfully!');
      setAwardSuccess(`Voucher successfully issued! Code: ${res.code || awardForm.code}`);
      setAwardForm({
        userId: '',
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscountAmount: 0,
        minOrderAmount: 0,
        maxUses: 1,
        maxUsesPerUser: 1,
        expiresAt: '',
      });
      fetchAwardedVouchers();
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to award voucher';
      setAwardError(errMsg);
      toast.error(errMsg);
    } finally {
      setAwardLoading(false);
    }
  };

  const fetchLoyaltyConfig = async () => {
    try {
      const data = await loyaltyApi.getLoyaltyConfig();
      if (data) {
        setLoyaltyConfig({
          pointsPerNpr: Number(data.pointsPerNpr !== undefined ? data.pointsPerNpr : 0.1),
          pointsToNprRate: Number(data.pointsToNprRate !== undefined ? data.pointsToNprRate : 0.5),
          minRedeemPoints: Number(data.minRedeemPoints !== undefined ? data.minRedeemPoints : 100),
          voucherExpiryDays: Number(data.voucherExpiryDays !== undefined ? data.voucherExpiryDays : 30),
          accrualMode: data.accrualMode || 'SPEND',
          pointsPerVisit: Number(data.pointsPerVisit !== undefined ? data.pointsPerVisit : 5),
          minSpendForVisit: Number(data.minSpendForVisit !== undefined ? data.minSpendForVisit : 0),
          bonusMultiplier: Number(data.bonusMultiplier !== undefined ? data.bonusMultiplier : 1.0),
          pointsExpiryDays: data.pointsExpiryDays !== null && data.pointsExpiryDays !== undefined ? Number(data.pointsExpiryDays) : null,
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
        menuApi.getByBusiness(BUSINESS_ID, { includeHidden: true }),
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
        setUsersList(usersData && Array.isArray(usersData.data) ? usersData.data : Array.isArray(usersData) ? usersData : []);
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
      isHidden: false,
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
      isHidden: item.isHidden || false,
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
        isHidden: menuForm.isHidden,
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

  const handleToggleMenuHidden = async (id: string, currentHidden: boolean) => {
    try {
      setLoading(true);
      await menuApi.toggleHidden(id, !currentHidden);
      toast.success(currentHidden ? 'Menu item is now visible' : 'Menu item is now hidden');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle visibility');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMenuAvailability = async (id: string, currentAvailable: boolean) => {
    try {
      setLoading(true);
      await menuApi.toggleAvailability(id, !currentAvailable);
      toast.success(!currentAvailable ? 'Menu item is now available' : 'Menu item is now marked out of stock');
      fetchAllData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to toggle availability');
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
    <div className={`admin-page ${isSidebarCollapsed ? 'admin-page--collapsed' : ''}`}>

      {/* ====== SIDEBAR ====== */}
      <aside className="admin-sidebar" style={{ display: 'flex' }}>
        <div className="admin-sidebar__heading" style={{ display: 'flex', alignItems: 'center', justifyContent: isSidebarCollapsed ? 'center' : 'space-between', gap: '8px' }}>
          <div>
            <div className="admin-sidebar__title" style={{ fontSize: isSidebarCollapsed ? '20px' : '26px' }}>
              {isSidebarCollapsed ? 'KR' : 'KAHA Resto'}
            </div>
            {!isSidebarCollapsed && <p className="admin-sidebar__sub">Business Portal v3.0</p>}
          </div>
          <button
            onClick={toggleSidebar}
            className="admin-sidebar__toggle-btn"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              {isSidebarCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          <button className={`admin-sidebar__link ${tab === 'overview' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('overview')} title={isSidebarCollapsed ? "Overview & Analytics" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
            {!isSidebarCollapsed && <span>Overview & Analytics</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'orders' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('orders')} title={isSidebarCollapsed ? "Orders" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            {!isSidebarCollapsed ? (
              <>
                <span>Orders</span>
                {pendingOrders > 0 && <span className="badge badge-warning" style={{ marginLeft: 'auto', background: '#FF5A5F', color: 'white', borderRadius: '8px' }}>{pendingOrders}</span>}
              </>
            ) : (
              pendingOrders > 0 && <span className="admin-sidebar__collapsed-badge">{pendingOrders}</span>
            )}
          </button>
          <button className={`admin-sidebar__link ${tab === 'menu' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('menu')} title={isSidebarCollapsed ? "Menu Management" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v14M12 22v-3M12 19h7v-3c0-3.3-2.7-6-6-6h-2c-3.3 0-6 2.7-6 6v3h7z" /></svg>
            {!isSidebarCollapsed && <span>Menu Management</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'categories' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('categories')} title={isSidebarCollapsed ? "Categories Control" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
            {!isSidebarCollapsed && <span>Categories Control</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'users' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('users')} title={isSidebarCollapsed ? "Users Overview" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            {!isSidebarCollapsed && <span>Users Overview</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'addons' ? 'admin-sidebar__link--active' : ''}`} onClick={() => setTab('addons')} title={isSidebarCollapsed ? "Addon Customization" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></svg>
            {!isSidebarCollapsed && <span>Addon Customization</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'customers' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('customers'); fetchCustomerInsights(); }} title={isSidebarCollapsed ? "Customer Insights" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
            {!isSidebarCollapsed && <span>Customer Insights</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'loyalty_settings' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('loyalty_settings'); fetchLoyaltyConfig(); }} title={isSidebarCollapsed ? "Loyalty Settings" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            {!isSidebarCollapsed && <span>Loyalty Settings</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'tables' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('tables'); fetchTables(); }} title={isSidebarCollapsed ? "Table Management" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            {!isSidebarCollapsed && <span>Table Management</span>}
          </button>
          <button className={`admin-sidebar__link ${tab === 'vouchers' ? 'admin-sidebar__link--active' : ''}`} onClick={() => { setTab('vouchers'); setVouchersSubTab('hub'); fetchCampaigns(); fetchAwardedVouchers(); }} title={isSidebarCollapsed ? "Vouchers & Promos" : ""}>
            <svg className="admin-sidebar__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
            {!isSidebarCollapsed && <span>Vouchers & Promos</span>}
          </button>
        </nav>

        <div className="admin-sidebar__bottom">
          {isSidebarCollapsed ? (
            <div
              className="admin-sidebar__user-avatar"
              style={{ margin: '0 auto', cursor: 'pointer' }}
              title={`${user?.name || 'Administrator'} (Super Admin) - Click to Logout`}
              onClick={() => { if (window.confirm('Logout?')) { logout(); navigate('/'); } }}
            >
              {user?.name?.charAt(0) || 'A'}
            </div>
          ) : (
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
          )}
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
              {tab === 'tables' && '🪑 Dine-in Table Setup'}
              {tab === 'vouchers' && (
                vouchersSubTab === 'hub' ? '🎟️ Voucher & Campaigns Hub' :
                vouchersSubTab === 'campaigns' ? '📊 Voucher Campaigns' :
                vouchersSubTab === 'award-campaign' ? '🎟️ Award Campaign Voucher' :
                vouchersSubTab === 'award-manual' ? '🎟️ Award Voucher Manual Issuance' :
                '📋 Awarded Vouchers Log'
              )}
            </h1>
            <p style={{ color: '#929397' }}>
              {tab === 'tables' ? 'Define table capacities, sections, and track availability.' :
                tab === 'vouchers' ? (
                  vouchersSubTab === 'hub' ? 'Manage customer incentives, discount campaigns, and manual issuances from one central control panel.' :
                  vouchersSubTab === 'campaigns' ? 'Manage marketing campaigns and issue promotional vouchers.' :
                  vouchersSubTab === 'award-campaign' ? 'Select an active campaign and issue a single-use voucher to a specific customer.' :
                  vouchersSubTab === 'award-manual' ? 'Directly award loyalty vouchers to customers.' :
                  'View and monitor the history of manually issued vouchers.'
                ) :
                "Manage and monitor your restaurant's business statistics."}
            </p>
          </div>
          <div>
            {tab === 'menu' && <button className="btn btn-primary" onClick={handleOpenAddMenu}>+ Add Menu Item</button>}
            {tab === 'categories' && <button className="btn btn-primary" onClick={() => setIsCategoryModalOpen(true)}>+ Add Category</button>}
            {tab === 'tables' && <button className="btn btn-primary" onClick={() => { setEditingTable(null); setTableForm({ tableNumber: '', capacity: 2, section: TableSection.INDOOR, notes: '', isActive: true }); setIsTableModalOpen(true); }}>+ Add Table</button>}
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
            {tab === 'vouchers' && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {vouchersSubTab !== 'hub' && (
                  <button
                    className="btn"
                    style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #EFEFF0', background: '#fff', color: '#5A5B63', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => setVouchersSubTab('hub')}
                  >
                    ← Back to Hub
                  </button>
                )}
                {vouchersSubTab === 'campaigns' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#5FC756', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
                    onClick={() => { setCampaignSuccess(null); setCampaignError(null); setIsCampaignModalOpen(true); }}
                  >
                    + Create Campaign
                  </button>
                )}
                {vouchersSubTab === 'award-manual' && (
                  <button
                    className="btn"
                    style={{ border: '1.5px solid #5FC756', background: '#EDFAEB', color: '#1B4332', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer' }}
                    onClick={() => { setVouchersSubTab('logs'); fetchAwardedVouchers(); }}
                  >
                    📋 View Award Logs
                  </button>
                )}
                {vouchersSubTab === 'logs' && (
                  <button
                    className="btn btn-primary"
                    style={{ background: '#5FC756', border: 'none', fontWeight: 'bold', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}
                    onClick={() => setVouchersSubTab('award-manual')}
                  >
                    🎟️ Award New Voucher
                  </button>
                )}
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
                <div className="admin-stat-info-wrap">
                  <div className="admin-stat-label">Gross Revenue</div>
                  <div className="admin-stat-value">NPR {totalRevenue.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#FDA014', marginTop: '4px', fontWeight: '700' }}>100% Organic Volume</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📦</div>
                <div className="admin-stat-info-wrap">
                  <div className="admin-stat-label">Total Orders</div>
                  <div className="admin-stat-value">{orders.length}</div>
                  <div style={{ fontSize: '12px', color: '#E14535', marginTop: '4px', fontWeight: '700' }}>{pendingOrders} awaiting validation</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">🥗</div>
                <div className="admin-stat-info-wrap">
                  <div className="admin-stat-label">Average Order Value</div>
                  <div className="admin-stat-value">NPR {averageOrderValue.toFixed(2)}</div>
                  <div style={{ fontSize: '12px', color: '#5FC756', marginTop: '4px', fontWeight: '700' }}>Per cart checkout</div>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">🍔</div>
                <div className="admin-stat-info-wrap">
                  <div className="admin-stat-label">Active Products</div>
                  <div className="admin-stat-value">{menus.length}</div>
                  <div style={{ fontSize: '12px', color: '#FDA014', marginTop: '4px', fontWeight: '700' }}>{menus.filter(m => m.isSignature).length} signature dishes</div>
                </div>
              </div>
            </div>

            {/* Graphical Analytics Panel */}
            <div className="admin-panel-card" style={{ padding: '28px', marginBottom: '28px' }}>
              <h3 style={{ marginBottom: '24px', color: '#272831', fontWeight: '800', fontSize: '18px' }}>Order Pipeline Analytics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px', textAlign: 'center' }}>
                <div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar chart-bar--pending"
                      style={{ height: `${orders.length ? (pendingOrders / orders.length) * 100 : 0}%`, minHeight: '6px' }}
                      title={`Pending: ${pendingOrders} (${orders.length ? Math.round((pendingOrders / orders.length) * 100) : 0}%)`}
                    ></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831', fontWeight: '800' }}>{pendingOrders}</strong>
                  <span style={{ fontSize: '13px', color: '#929397', fontWeight: '600' }}>Pending</span>
                </div>
                <div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar chart-bar--preparing"
                      style={{ height: `${orders.length ? (preparingOrders / orders.length) * 100 : 0}%`, minHeight: '6px' }}
                      title={`Preparing: ${preparingOrders} (${orders.length ? Math.round((preparingOrders / orders.length) * 100) : 0}%)`}
                    ></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831', fontWeight: '800' }}>{preparingOrders}</strong>
                  <span style={{ fontSize: '13px', color: '#929397', fontWeight: '600' }}>Preparing</span>
                </div>
                <div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar chart-bar--ready"
                      style={{ height: `${orders.length ? (readyOrders / orders.length) * 100 : 0}%`, minHeight: '6px' }}
                      title={`Ready: ${readyOrders} (${orders.length ? Math.round((readyOrders / orders.length) * 100) : 0}%)`}
                    ></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831', fontWeight: '800' }}>{readyOrders}</strong>
                  <span style={{ fontSize: '13px', color: '#929397', fontWeight: '600' }}>Ready</span>
                </div>
                <div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar chart-bar--delivered"
                      style={{ height: `${orders.length ? (deliveredOrders / orders.length) * 100 : 0}%`, minHeight: '6px' }}
                      title={`Delivered: ${deliveredOrders} (${orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0}%)`}
                    ></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831', fontWeight: '800' }}>{deliveredOrders}</strong>
                  <span style={{ fontSize: '13px', color: '#929397', fontWeight: '600' }}>Delivered</span>
                </div>
                <div>
                  <div className="chart-bar-container">
                    <div
                      className="chart-bar chart-bar--cancelled"
                      style={{ height: `${orders.length ? (cancelledOrders / orders.length) * 100 : 0}%`, minHeight: '6px' }}
                      title={`Cancelled: ${cancelledOrders} (${orders.length ? Math.round((cancelledOrders / orders.length) * 100) : 0}%)`}
                    ></div>
                  </div>
                  <strong style={{ display: 'block', fontSize: '18px', color: '#272831', fontWeight: '800' }}>{cancelledOrders}</strong>
                  <span style={{ fontSize: '13px', color: '#929397', fontWeight: '600' }}>Cancelled</span>
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
                  <div key={m.id} className="admin-item-card" style={{ opacity: m.isHidden || !m.isAvailable ? 0.75 : 1 }}>
                    <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                      <img src={imgSrc} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <span className="admin-card-badge">
                        {m.category?.name || 'Dish'}
                      </span>
                      <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {!m.isAvailable && (
                          <span style={{ background: '#e74c3c', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                            OUT OF STOCK
                          </span>
                        )}
                        {m.isHidden && (
                          <span style={{ background: '#7f8c8d', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '800' }}>
                            HIDDEN
                          </span>
                        )}
                      </div>
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

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#55617A', fontWeight: '600' }}>
                          <input
                            type="checkbox"
                            checked={m.isAvailable}
                            onChange={() => handleToggleMenuAvailability(m.id, m.isAvailable)}
                          />
                          Available
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#55617A', fontWeight: '600' }}>
                          <input
                            type="checkbox"
                            checked={m.isHidden}
                            onChange={() => handleToggleMenuHidden(m.id, m.isHidden)}
                          />
                          Hidden
                        </label>
                      </div>

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

                    {/* Accrual Mode */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Accrual Mode
                      </label>
                      <select
                        className="input"
                        style={{ height: '40px', fontSize: '13px', padding: '0 12px' }}
                        value={loyaltyConfig.accrualMode || 'SPEND'}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, accrualMode: e.target.value as any }))}
                      >
                        <option value="SPEND">Spend-based only (Points per NPR)</option>
                        <option value="VISIT">Visit-based only (Points per Order/Visit)</option>
                        <option value="BOTH">Both (Spend and Visit points combined)</option>
                      </select>
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Choose whether customers earn points based on order amount (Spend), frequency (Visit), or both.
                      </p>
                    </div>

                    {/* Points Per Visit */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Points Per Visit / Order
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="input"
                        required
                        disabled={loyaltyConfig.accrualMode === 'SPEND'}
                        style={{ height: '40px', fontSize: '13px' }}
                        value={loyaltyConfig.pointsPerVisit !== undefined ? loyaltyConfig.pointsPerVisit : 5}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, pointsPerVisit: Number(e.target.value) }))}
                        placeholder="e.g. 5"
                      />
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Points awarded per qualifying visit (order). Enabled only when using Visit or Both mode.
                      </p>
                    </div>

                    {/* Min Spend For Visit */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Min Order Amount for Visit (NPR)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        className="input"
                        required
                        disabled={loyaltyConfig.accrualMode === 'SPEND'}
                        style={{ height: '40px', fontSize: '13px' }}
                        value={loyaltyConfig.minSpendForVisit !== undefined ? loyaltyConfig.minSpendForVisit : 0}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, minSpendForVisit: Number(e.target.value) }))}
                        placeholder="e.g. 200"
                      />
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Minimum order subtotal to qualify as a visit. E.g., 200 means orders below NPR 200 earn 0 visit points.
                      </p>
                    </div>

                    {/* Bonus Multiplier */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Campaign Bonus Multiplier
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="10"
                        className="input"
                        required
                        style={{ height: '40px', fontSize: '13px' }}
                        value={loyaltyConfig.bonusMultiplier !== undefined ? loyaltyConfig.bonusMultiplier : 1.0}
                        onChange={e => setLoyaltyConfig(c => ({ ...c, bonusMultiplier: Number(e.target.value) }))}
                        placeholder="e.g. 1.0 (No Bonus), 2.0 (Double Points)"
                      />
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        Global multiplier applied on points earned. E.g. <strong>2.0</strong> for double points events.
                      </p>
                    </div>

                    {/* Points Expiry Days */}
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: '700', color: '#272831', fontSize: '13px', marginBottom: '6px' }}>
                        Points Expiry Duration (Days)
                      </label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          className="input"
                          disabled={loyaltyConfig.pointsExpiryDays === null}
                          style={{ height: '40px', fontSize: '13px', flex: 1 }}
                          value={loyaltyConfig.pointsExpiryDays || ''}
                          onChange={e => setLoyaltyConfig(c => ({ ...c, pointsExpiryDays: e.target.value ? Number(e.target.value) : null }))}
                          placeholder="Never expires"
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <input
                            type="checkbox"
                            checked={loyaltyConfig.pointsExpiryDays === null}
                            onChange={e => setLoyaltyConfig(c => ({ ...c, pointsExpiryDays: e.target.checked ? null : 365 }))}
                          />
                          Never Expire
                        </label>
                      </div>
                      <p style={{ fontSize: '11px', color: '#929397', marginTop: '6px', lineHeight: '1.4' }}>
                        How many days earned points remain valid. E.g., 365 for 1 year expiry, or check "Never Expire".
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
                        <strong style={{ color: '#5FC756' }}>
                          +{Math.floor(
                            ((loyaltyConfig.accrualMode === 'SPEND' || loyaltyConfig.accrualMode === 'BOTH' ? 1000 * loyaltyConfig.pointsPerNpr : 0) +
                              (loyaltyConfig.accrualMode === 'VISIT' || loyaltyConfig.accrualMode === 'BOTH' ? (loyaltyConfig.pointsPerVisit !== undefined ? loyaltyConfig.pointsPerVisit : 5) : 0)) *
                            (loyaltyConfig.bonusMultiplier || 1.0)
                          )} pts
                        </strong>
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
                          {(((loyaltyConfig.accrualMode === 'SPEND' || loyaltyConfig.accrualMode === 'BOTH' ? 1000 * loyaltyConfig.pointsPerNpr : 0) +
                            (loyaltyConfig.accrualMode === 'VISIT' || loyaltyConfig.accrualMode === 'BOTH' ? (loyaltyConfig.pointsPerVisit !== undefined ? loyaltyConfig.pointsPerVisit : 5) : 0)) *
                            (loyaltyConfig.bonusMultiplier || 1.0) * loyaltyConfig.pointsToNprRate / 10).toFixed(2)}%
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

        {/* ==================== TABLE MANAGEMENT TAB ==================== */}
        {tab === 'tables' && (
          <div>
            {tablesLoading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#929397' }}>Loading tables data...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left' }}>
                      <th style={{ padding: '16px' }}>Table Number</th>
                      <th>Capacity</th>
                      <th>Section</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tablesList.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #EFEFF0' }}>
                        <td style={{ padding: '16px', fontWeight: 'bold' }}>{t.tableNumber}</td>
                        <td>{t.capacity} seats</td>
                        <td style={{ textTransform: 'capitalize' }}>{t.section}</td>
                        <td>
                          <button
                            onClick={() => handleToggleTableStatus(t)}
                            className="btn btn-sm"
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '700',
                              border: 'none',
                              cursor: 'pointer',
                              background: t.status === TableStatus.AVAILABLE ? '#EDFAEB' : '#FDEBEB',
                              color: t.status === TableStatus.AVAILABLE ? '#1B4332' : '#E14535',
                            }}
                          >
                            {t.status === TableStatus.AVAILABLE ? 'Available' : 'Occupied'}
                          </button>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleTableActive(t)}
                            className={`admin-status-btn admin-status-btn--${t.isActive ? 'active' : 'inactive'}`}
                          >
                            {t.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td style={{ color: '#929397', fontSize: '13px' }}>{t.notes || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setEditingTable(t);
                                setTableForm({
                                  tableNumber: t.tableNumber,
                                  capacity: t.capacity,
                                  section: t.section,
                                  notes: t.notes || '',
                                  isActive: t.isActive,
                                });
                                setIsTableModalOpen(true);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteTable(t.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tablesList.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#929397' }}>
                          No tables configured. Click "+ Add Table" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ==================== VOUCHERS AND CAMPAIGNS HUB ==================== */}
        {tab === 'vouchers' && (
          <div style={{ width: '100%' }}>
            
            {/* 1. HUB LANDING PAGE */}
            {vouchersSubTab === 'hub' && (
              <div style={{ width: '100%' }}>
                {/* Stats Row */}
                <div className="adm-hub-stats-row">
                  <div className="adm-hub-stat-card">
                    <div className="adm-hub-icon-wrapper" style={{ background: '#EEF2FF', color: '#4F46E5', marginBottom: 0 }}>
                      📊
                    </div>
                    <div>
                      <div className="adm-hub-stat-val">{campaigns.filter((c: any) => c.status === 'active').length}</div>
                      <div className="adm-hub-stat-lbl">Active Campaigns</div>
                    </div>
                  </div>

                  <div className="adm-hub-stat-card">
                    <div className="adm-hub-icon-wrapper" style={{ background: '#EDFAEB', color: '#1B4332', marginBottom: 0 }}>
                      🎟️
                    </div>
                    <div>
                      <div className="adm-hub-stat-val">{awardedVouchers.length}</div>
                      <div className="adm-hub-stat-lbl">Manually Issued</div>
                    </div>
                  </div>

                  <div className="adm-hub-stat-card">
                    <div className="adm-hub-icon-wrapper" style={{ background: '#FFF9E6', color: '#B45309', marginBottom: 0 }}>
                      📢
                    </div>
                    <div>
                      <div className="adm-hub-stat-val">{campaigns.length}</div>
                      <div className="adm-hub-stat-lbl">Total Campaigns</div>
                    </div>
                  </div>
                </div>

                {/* Navigation Grid */}
                <div className="adm-voucher-hub-grid">
                  <div className="adm-hub-card card-campaigns">
                    <div>
                      <div className="adm-hub-icon-wrapper">📊</div>
                      <h3 className="adm-hub-card-title">Promotional Campaigns</h3>
                      <p className="adm-hub-card-desc">
                        Create and configure discount rule templates, budget caps, service restrictions, and time-based active windows.
                      </p>
                    </div>
                    <button className="adm-hub-card-btn" onClick={() => { setVouchersSubTab('campaigns'); fetchCampaigns(); }}>
                      Manage Campaigns ➔
                    </button>
                  </div>

                  <div className="adm-hub-card card-manual">
                    <div>
                      <div className="adm-hub-icon-wrapper">🎟️</div>
                      <h3 className="adm-hub-card-title">Manual Issuance</h3>
                      <p className="adm-hub-card-desc">
                        Directly award custom ad-hoc fixed or percentage discount vouchers to a specific customer's account.
                      </p>
                    </div>
                    <button className="adm-hub-card-btn" onClick={() => setVouchersSubTab('award-manual')}>
                      Issue Manual Voucher ➔
                    </button>
                  </div>

                  <div className="adm-hub-card card-award-campaign">
                    <div>
                      <div className="adm-hub-icon-wrapper">✉️</div>
                      <h3 className="adm-hub-card-title">Issue Campaign Voucher</h3>
                      <p className="adm-hub-card-desc">
                        Select an active promotional campaign template to automatically generate a voucher instance for a customer's UUID.
                      </p>
                    </div>
                    <button className="adm-hub-card-btn" onClick={() => { setCampaignAwardCampaignId(''); setCampaignAwardResult(null); setVouchersSubTab('award-campaign'); }}>
                      Award Campaign Voucher ➔
                    </button>
                  </div>

                  <div className="adm-hub-card card-logs">
                    <div>
                      <div className="adm-hub-icon-wrapper">📋</div>
                      <h3 className="adm-hub-card-title">Voucher Audit Logs</h3>
                      <p className="adm-hub-card-desc">
                        Search and view history logs of all manually issued and awarded customer vouchers.
                      </p>
                    </div>
                    <button className="adm-hub-card-btn" onClick={() => { setVouchersSubTab('logs'); fetchAwardedVouchers(); }}>
                      View Audit Logs ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. CAMPAIGNS SUB-TAB */}
            {vouchersSubTab === 'campaigns' && (
              <div className="adm-section" style={{ marginTop: '24px' }}>
                {campaignSuccess && (
                  <div style={{ padding: '12px 16px', background: '#EDFAEB', color: '#1B4332', borderRadius: '10px', fontWeight: '700', fontSize: '13px', marginBottom: '16px' }}>
                    ✅ {campaignSuccess}
                  </div>
                )}
                {campaignError && (
                  <div style={{ padding: '12px 16px', background: '#FDEBEB', color: '#E14535', borderRadius: '10px', fontWeight: '700', fontSize: '13px', marginBottom: '16px' }}>
                    ❌ {campaignError}
                  </div>
                )}

                {campaignsLoading ? (
                  <div className="adm-table-wrap" style={{ padding: '12px' }}>
                    {[1, 2, 3].map(i => <div key={i} className="adm-row-skeleton" />)}
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="adm-empty">
                    <span className="adm-empty-icon">📣</span>
                    <p className="adm-empty-title">No campaigns yet</p>
                    <p className="adm-empty-sub">Create your first campaign to start issuing vouchers.</p>
                    <button className="adm-btn-primary" onClick={() => setIsCampaignModalOpen(true)}>
                      + Create Campaign
                    </button>
                  </div>
                ) : (
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th>Status</th>
                          <th>Type</th>
                          <th>Value</th>
                          <th>Redeemed</th>
                          <th>Expires</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((c: any) => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: '700', color: '#272831' }}>{c.name}</td>
                            <td>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '800',
                                display: 'inline-block',
                                background: c.status === 'active' ? '#EDFAEB' : c.status === 'draft' ? '#FFF9E6' : '#FFF5F5',
                                color: c.status === 'active' ? '#1B4332' : c.status === 'draft' ? '#B45309' : '#C53030',
                                border: c.status === 'active' ? '1px solid #C9ECC1' : c.status === 'draft' ? '1px solid #FDE68A' : '1px solid #FEE2E2',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                {c.status}
                              </span>
                            </td>
                            <td style={{ fontWeight: '600' }}>{c.discountType}</td>
                            <td style={{ fontWeight: '700', color: c.discountType === 'PERCENTAGE' ? '#4F46E5' : '#1B4332' }}>
                              {c.discountType === 'PERCENTAGE' ? `${Number(c.discountValue).toFixed(2)}%` : `NPR ${Number(c.discountValue).toFixed(2)}`}
                            </td>
                            <td style={{ fontWeight: '700' }}>
                              {c.totalRedeemedAmount ? `NPR ${Number(c.totalRedeemedAmount).toFixed(2)}` : 'NPR 0.00'}
                              {c.totalBudgetCap && <span style={{ color: '#929397', fontSize: '11px', fontWeight: '500' }}> / NPR {Number(c.totalBudgetCap).toFixed(2)}</span>}
                            </td>
                            <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {c.status === 'draft' && (
                                  <button
                                    onClick={() => handleCampaignAction(c.id, 'activate')}
                                    style={{
                                      background: '#EDFAEB',
                                      color: '#1B4332',
                                      border: '1px solid #C9ECC1',
                                      padding: '6px 12px',
                                      borderRadius: '6px',
                                      fontWeight: '700',
                                      fontSize: '11px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setCampaignAwardCampaignId(c.id);
                                    setCampaignAwardResult(null);
                                    setVouchersSubTab('award-campaign');
                                  }}
                                  disabled={c.status !== 'active'}
                                  style={{
                                    background: c.status === 'active' ? '#EEF2FF' : '#F5F5F6',
                                    color: c.status === 'active' ? '#4F46E5' : '#929397',
                                    border: c.status === 'active' ? '1px solid #C7D2FE' : '1px solid #EFEFF0',
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    cursor: c.status === 'active' ? 'pointer' : 'not-allowed'
                                  }}
                                >
                                  Award
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 3. AWARD CAMPAIGN VOUCHER FORM */}
            {vouchersSubTab === 'award-campaign' && (
              <div className="adm-award-layout" style={{ marginTop: '24px' }}>
                <div className="adm-award-card">
                  {campaignAwardResult && (
                    <div className="adm-award-success">
                      <span>✅</span>
                      <div>
                        <p className="adm-success-title">Voucher Awarded</p>
                        <p className="adm-success-code">{campaignAwardResult}</p>
                      </div>
                    </div>
                  )}
                  {campaignError && (
                    <div className="adm-award-error">{campaignError}</div>
                  )}

                  <form onSubmit={handleCampaignAwardVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="adm-field-group">
                      <label className="adm-label">Award Method</label>
                      <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#3f3f46' }}>
                          <input
                            type="radio"
                            name="awardType"
                            value="single"
                            checked={awardType === 'single'}
                            onChange={() => { setAwardType('single'); setCampaignAwardResult(null); }}
                            style={{ width: '16px', height: '16px', accentColor: '#1b4332' }}
                          />
                          Single Customer
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: '#3f3f46' }}>
                          <input
                            type="radio"
                            name="awardType"
                            value="mass"
                            checked={awardType === 'mass'}
                            onChange={() => { setAwardType('mass'); setCampaignAwardResult(null); }}
                            style={{ width: '16px', height: '16px', accentColor: '#1b4332' }}
                          />
                          Mass Customers (Criteria-based)
                        </label>
                      </div>
                    </div>

                    {awardType === 'single' ? (
                      <div className="adm-field-group">
                        <label className="adm-label">Customer User ID <span className="adm-required">*</span></label>
                        <input
                          className="adm-input"
                          type="text"
                          placeholder="Paste customer UUID"
                          value={campaignAwardUserId}
                          onChange={(e) => setCampaignAwardUserId(e.target.value)}
                          required
                        />
                        <p className="adm-field-hint">Find the UUID on the Users Overview page.</p>
                      </div>
                    ) : (
                      <>
                        <div className="adm-field-group">
                          <label className="adm-label">Target Customer Criteria <span className="adm-required">*</span></label>
                          <select
                            className="adm-input adm-select"
                            value={massCriteria}
                            onChange={(e: any) => setMassCriteria(e.target.value)}
                            required
                          >
                            <option value="all">All Registered Customers</option>
                            <option value="min_orders">Customers with Minimum Orders</option>
                            <option value="min_spent">Customers with Minimum Spent (NPR)</option>
                          </select>
                        </div>

                        {massCriteria === 'min_orders' && (
                          <div className="adm-field-group">
                            <label className="adm-label">Minimum Orders Count <span className="adm-required">*</span></label>
                            <input
                              className="adm-input"
                              type="number"
                              min="1"
                              value={massMinOrders}
                              onChange={(e) => setMassMinOrders(Number(e.target.value))}
                              required
                            />
                            <p className="adm-field-hint">Only customers who placed this many orders or more will receive the voucher.</p>
                          </div>
                        )}

                        {massCriteria === 'min_spent' && (
                          <div className="adm-field-group">
                            <label className="adm-label">Minimum Lifetime Spent (NPR) <span className="adm-required">*</span></label>
                            <input
                              className="adm-input"
                              type="number"
                              min="1"
                              value={massMinSpent}
                              onChange={(e) => setMassMinSpent(Number(e.target.value))}
                              required
                            />
                            <p className="adm-field-hint">Only customers who spent this amount or more in total will receive the voucher.</p>
                          </div>
                        )}
                      </>
                    )}

                    <div className="adm-field-group">
                      <label className="adm-label">Campaign <span className="adm-required">*</span></label>
                      <select
                        className="adm-input adm-select"
                        value={campaignAwardCampaignId}
                        onChange={(e) => setCampaignAwardCampaignId(e.target.value)}
                        required
                      >
                        <option value="">— Select an active campaign —</option>
                        {campaigns
                          .filter((c: any) => c.status === 'active')
                          .map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.discountType === 'PERCENTAGE'
                                ? `${Number(c.discountValue).toFixed(2)}% off`
                                : `NPR ${Number(c.discountValue).toFixed(2)} off`})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="adm-field-group">
                      <label className="adm-label">Expiry Override <span className="adm-label-opt">(optional)</span></label>
                      <input
                        className="adm-input"
                        type="date"
                        value={campaignAwardExpiresAt}
                        onChange={(e) => setCampaignAwardExpiresAt(e.target.value)}
                      />
                      <p className="adm-field-hint">Leave blank to use the campaign's default expiry.</p>
                    </div>

                    <button
                      type="submit"
                      className="adm-btn-award"
                      disabled={awardType === 'single' ? (!campaignAwardUserId || !campaignAwardCampaignId) : !campaignAwardCampaignId}
                    >
                      {awardType === 'single' ? '🎫 Award Voucher' : '📢 Award Mass Vouchers'}
                    </button>
                  </form>
                </div>

                <div className="adm-award-info">
                  <h3 className="adm-info-title">How this works</h3>
                  <ol className="adm-info-list">
                    <li>Choose your Award Method (Single Customer vs Mass Customers).</li>
                    <li>If Single, paste the customer's UUID. If Mass, select target eligibility criteria.</li>
                    <li>Select any active campaign — only active campaigns can issue vouchers.</li>
                    <li>Optionally override the expiry date if customers need more time.</li>
                    <li>Click the action button — unique voucher codes will be generated and added instantly.</li>
                  </ol>
                  <div className="adm-info-note">
                    <strong>Note:</strong> Awarded vouchers will appear under the customers' Loyalty &amp; Vouchers page immediately.
                  </div>
                </div>
              </div>
            )}

            {/* 4. MANUAL VOUCHER FORM */}
            {vouchersSubTab === 'award-manual' && (
              <div className="adm-award-layout" style={{ marginTop: '24px' }}>
                {/* Award Form */}
                <div className="adm-award-card">
                  {awardSuccess && (
                    <div className="adm-award-success">
                      <span>✅</span>
                      <div>
                        <p className="adm-success-title">Voucher Issued Successfully</p>
                        <p className="adm-success-code">{awardSuccess}</p>
                      </div>
                    </div>
                  )}
                  {awardError && (
                    <div className="adm-award-error">
                      {awardError}
                    </div>
                  )}

                  <form onSubmit={handleAwardVoucher} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="adm-field-group">
                      <label className="adm-label">Select Customer <span className="adm-required">*</span></label>
                      <select
                        className="adm-input adm-select"
                        value={awardForm.userId}
                        onChange={e => setAwardForm(prev => ({ ...prev, userId: e.target.value }))}
                        required
                      >
                        <option value="">-- Choose Customer --</option>
                        {customerInsights.map(c => (
                          <option key={c.userId} value={c.userId}>
                            {c.customerName || 'Kaha User'} ({c.customerPhone || 'No contact'}) · {c.totalPoints || 0} pts
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="adm-field-group">
                      <label className="adm-label">Voucher Code <span className="adm-label-opt">(optional)</span></label>
                      <input
                        className="adm-input"
                        type="text"
                        placeholder="e.g. SPECIAL50 (leave blank to auto-generate)"
                        value={awardForm.code}
                        onChange={e => setAwardForm(prev => ({ ...prev, code: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="adm-field-group">
                        <label className="adm-label">Discount Type <span className="adm-required">*</span></label>
                        <select
                          className="adm-input adm-select"
                          value={awardForm.discountType}
                          onChange={e => setAwardForm(prev => ({ ...prev, discountType: e.target.value as any }))}
                          required
                        >
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount (NPR)</option>
                        </select>
                      </div>

                      <div className="adm-field-group">
                        <label className="adm-label">Discount Value <span className="adm-required">*</span></label>
                        <input
                          className="adm-input"
                          type="number"
                          min="1"
                          value={awardForm.discountValue}
                          onChange={e => setAwardForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="adm-field-group">
                        <label className="adm-label">Min Order (NPR)</label>
                        <input
                          className="adm-input"
                          type="number"
                          min="0"
                          value={awardForm.minOrderAmount}
                          onChange={e => setAwardForm(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                        />
                      </div>

                      <div className="adm-field-group">
                        <label className="adm-label">Max Discount (NPR)</label>
                        <input
                          className="adm-input"
                          type="number"
                          min="0"
                          value={awardForm.maxDiscountAmount}
                          onChange={e => setAwardForm(prev => ({ ...prev, maxDiscountAmount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="adm-field-group">
                      <label className="adm-label">Expiry Date</label>
                      <input
                        className="adm-input"
                        type="date"
                        value={awardForm.expiresAt}
                        onChange={e => setAwardForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>

                    <button type="submit" className="adm-btn-award" disabled={awardLoading}>
                      {awardLoading ? 'Awarding...' : 'Award Voucher 🎟️'}
                    </button>
                  </form>
                </div>

                {/* Info Card */}
                <div className="adm-award-info">
                  <h3 className="adm-info-title">💡 How this works</h3>
                  <ol className="adm-info-list" style={{ listStyle: 'none' }}>
                    <li><span className="adm-step-badge">1</span> Select the customer you want to award a voucher to.</li>
                    <li><span className="adm-step-badge">2</span> Specify a custom voucher code, or leave blank to auto-generate a secure random code.</li>
                    <li><span className="adm-step-badge">3</span> Configure the discount type (fixed amount or percentage discount).</li>
                    <li><span className="adm-step-badge">4</span> Set validation thresholds like minimum order amounts and maximum discount caps.</li>
                    <li><span className="adm-step-badge">5</span> Click Award Voucher — the voucher is created instantly and added to the customer's portal.</li>
                  </ol>
                  <div className="adm-info-note">
                    <strong>Note:</strong> The voucher will appear under the customer's Loyalty &amp; Vouchers page immediately after awarding.
                  </div>
                </div>
              </div>
            )}

            {/* 5. VOUCHER AUDIT LOGS */}
            {vouchersSubTab === 'logs' && (
              <div className="adm-section" style={{ marginTop: '24px' }}>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Customer ID</th>
                        <th>Discount Value</th>
                        <th>Usage</th>
                        <th>Expires At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awardedVouchers.map((v, idx) => (
                        <tr key={v.id || idx}>
                          <td style={{ fontWeight: '800', color: '#272831' }}>{v.code}</td>
                          <td style={{ fontSize: '12px', color: '#5A5B63', fontFamily: 'monospace' }}>
                            {v.userId ? `...${v.userId.slice(-12)}` : '—'}
                          </td>
                          <td style={{ fontWeight: '700', color: '#5FC756' }}>
                            {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : `NPR ${v.discountValue}`}
                          </td>
                          <td>{v.usesCount || 0} / {v.maxUses || 1}</td>
                          <td>
                            {v.expiresAt
                              ? new Date(v.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Never'}
                          </td>
                          <td>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '800',
                              display: 'inline-block',
                              background: v.isActive && (!v.expiresAt || new Date(v.expiresAt) > new Date()) ? '#EDFAEB' : '#FFF5F5',
                              color: v.isActive && (!v.expiresAt || new Date(v.expiresAt) > new Date()) ? '#1B4332' : '#C53030',
                              border: v.isActive && (!v.expiresAt || new Date(v.expiresAt) > new Date()) ? '1px solid #C9ECC1' : '1px solid #FEE2E2',
                            }}>
                              {v.isActive && (!v.expiresAt || new Date(v.expiresAt) > new Date()) ? 'Active' : 'Expired/Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {awardedVouchers.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#929397', fontWeight: '700' }}>
                            No vouchers issued yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create Campaign Modal */}
            {isCampaignModalOpen && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#272831' }}>Create Campaign</h2>
                    <button onClick={() => setIsCampaignModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#929397' }}>✕</button>
                  </div>
                  <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="input-group">
                      <label className="input-label">Campaign Name *</label>
                      <input type="text" className="input" required value={campaignForm.name} onChange={e => setCampaignForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Summer 10% Off" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Discount Type *</label>
                        <select className="input" value={campaignForm.discountType} onChange={e => setCampaignForm(p => ({ ...p, discountType: e.target.value as any }))}>
                          <option value="PERCENTAGE">Percentage (%)</option>
                          <option value="FIXED">Fixed Amount (NPR)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label className="input-label">Discount Value *</label>
                        <input type="number" className="input" required min={1} value={campaignForm.discountValue} onChange={e => setCampaignForm(p => ({ ...p, discountValue: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Max Discount (NPR cap)</label>
                        <input type="number" className="input" min={0} value={campaignForm.maxDiscountAmount} onChange={e => setCampaignForm(p => ({ ...p, maxDiscountAmount: e.target.value }))} placeholder="Optional" disabled={campaignForm.discountType === 'FIXED'} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Min Order Amount (NPR)</label>
                        <input type="number" className="input" min={0} value={campaignForm.minOrderAmount} onChange={e => setCampaignForm(p => ({ ...p, minOrderAmount: e.target.value }))} placeholder="Optional" />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Discount Class *</label>
                      <select className="input" value={campaignForm.discountClass} onChange={e => setCampaignForm(p => ({ ...p, discountClass: e.target.value }))}>
                        <option value="ORDER_TOTAL">Order Total</option>
                        <option value="DELIVERY_FEE">Delivery Fee</option>
                        <option value="SERVICE_CHARGE">Service Charge</option>
                        <option value="ITEM_SPECIFIC">Item Specific</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Applicable Service Types</label>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                        {['DELIVERY', 'DINE_IN', 'TAKEAWAY'].map(st => (
                          <label key={st} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={campaignForm.applicableServiceTypes.includes(st)}
                              onChange={e => setCampaignForm(p => ({
                                ...p,
                                applicableServiceTypes: e.target.checked ? [...p.applicableServiceTypes, st] : p.applicableServiceTypes.filter(x => x !== st)
                              }))}
                            />
                            {st}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Starts At</label>
                        <input type="date" className="input" value={campaignForm.startsAt} onChange={e => setCampaignForm(p => ({ ...p, startsAt: e.target.value }))} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Expires At</label>
                        <input type="date" className="input" value={campaignForm.expiresAt} onChange={e => setCampaignForm(p => ({ ...p, expiresAt: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div className="input-group">
                        <label className="input-label">Max Redemptions Total</label>
                        <input type="number" className="input" min={1} value={campaignForm.maxRedemptionsTotal} onChange={e => setCampaignForm(p => ({ ...p, maxRedemptionsTotal: e.target.value }))} placeholder="Unlimited" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Max Per User</label>
                        <input type="number" className="input" min={1} value={campaignForm.maxRedemptionsPerUser} onChange={e => setCampaignForm(p => ({ ...p, maxRedemptionsPerUser: e.target.value }))} placeholder="Unlimited" />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Max Per User/Day</label>
                        <input type="number" className="input" min={1} value={campaignForm.maxRedemptionsPerUserPerDay} onChange={e => setCampaignForm(p => ({ ...p, maxRedemptionsPerUserPerDay: e.target.value }))} placeholder="Unlimited" />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Total Budget Cap (NPR)</label>
                      <input type="number" className="input" min={0} value={campaignForm.totalBudgetCap} onChange={e => setCampaignForm(p => ({ ...p, totalBudgetCap: e.target.value }))} placeholder="Optional — no cap if blank" />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>
                      <input type="checkbox" checked={campaignForm.requiresFirstOrder} onChange={e => setCampaignForm(p => ({ ...p, requiresFirstOrder: e.target.checked }))} />
                      Only valid for customer's first order
                    </label>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button type="submit" className="btn btn-primary" style={{ flex: 1, background: '#5FC756', border: 'none', fontWeight: 'bold', padding: '12px', borderRadius: '10px', cursor: 'pointer', color: '#fff' }}>
                        Create Campaign (DRAFT)
                      </button>
                      <button type="button" onClick={() => setIsCampaignModalOpen(false)} style={{ flex: 1, background: '#F5F5F6', border: 'none', fontWeight: 'bold', padding: '12px', borderRadius: '10px', cursor: 'pointer', color: '#5A5B63' }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
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
                      { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
                      { label: 'Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
                      { label: 'Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
                      { label: 'Noodles', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80' },
                      { label: 'Curry', url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
                      { label: 'Sandwich', url: 'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&q=80' },
                      { label: 'Dessert', url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
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
                      checked={menuForm.isHidden}
                      onChange={e => setMenuForm(mf => ({ ...mf, isHidden: e.target.checked }))}
                    />
                    Hide from Customers
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
      {isTableModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingTable ? 'Edit Table Info' : 'Add New Table'}</h2>
              <button className="modal-close" onClick={() => { setIsTableModalOpen(false); setEditingTable(null); }}>×</button>
            </div>
            <form onSubmit={handleSaveTable}>
              <div className="modal-body" style={{ gridTemplateColumns: '1fr', padding: '24px' }}>
                <div className="input-group">
                  <label className="input-label">Table Number / Label *</label>
                  <input
                    type="text"
                    className="input"
                    required
                    placeholder="e.g. Table 1, Table 4B"
                    value={tableForm.tableNumber}
                    onChange={e => setTableForm(prev => ({ ...prev, tableNumber: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Capacity (seats) *</label>
                  <input
                    type="number"
                    className="input"
                    required
                    min="1"
                    value={tableForm.capacity}
                    onChange={e => setTableForm(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Section / Location *</label>
                  <select
                    className="input"
                    value={tableForm.section}
                    onChange={e => setTableForm(prev => ({ ...prev, section: e.target.value as any }))}
                  >
                    <option value={TableSection.INDOOR}>Indoor</option>
                    <option value={TableSection.OUTDOOR}>Outdoor</option>
                    <option value={TableSection.ROOFTOP}>Rooftop</option>
                    <option value={TableSection.BAR}>Bar</option>
                    <option value={TableSection.PRIVATE}>Private</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Notes / Description</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Window side, quiet corner"
                    value={tableForm.notes}
                    onChange={e => setTableForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="input-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '12px' }}>
                    <input
                      type="checkbox"
                      checked={tableForm.isActive}
                      onChange={e => setTableForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    />
                    Table is Active & Available for Orders
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setIsTableModalOpen(false); setEditingTable(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTable ? 'Save Changes' : 'Create Table'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      
    </div>
  );
};

export default AdminDashboard;
