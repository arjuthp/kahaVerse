import axiosInstance from './axios';

const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'biz-mock-001';

export const loyaltyApi = {
  // ── Customer ────────────────────────────────────────────────

  /** Get customer's current points ledger */
  getLedger: (userId: string) =>
    axiosInstance.get(`/loyalty/ledger/${userId}`, { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Get customer's transaction history */
  getTransactions: (userId: string) =>
    axiosInstance.get(`/loyalty/transactions/${userId}`, { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Get customer's vouchers */
  getVouchers: (userId: string) =>
    axiosInstance.get(`/loyalty/vouchers/${userId}`, { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Redeem points to generate a voucher */
  redeemPoints: (userId: string, points: number) =>
    axiosInstance.post('/loyalty/redeem', { userId, businessId: BUSINESS_ID, points }).then(r => r.data),

  /** Validate a voucher code at checkout */
  validateVoucher: (
    code: string,
    userId: string,
    cartTotal?: number,
    businessId?: string,
    serviceType?: string,
  ) =>
    axiosInstance.post('/loyalty/voucher/validate', {
      code,
      userId,
      cartTotal,
      businessId,
      serviceType,
    }).then(r => r.data),

  // ── Admin ────────────────────────────────────────────────────

  /** Get all customer insights for admin panel */
  getCustomerInsights: () =>
    axiosInstance.get('/loyalty/admin/insights', { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Get summary stats for admin overview */
  getBusinessSummary: () =>
    axiosInstance.get('/loyalty/admin/summary', { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Manually award points to a customer (admin action) */
  earnPoints: (userId: string, orderId: string, orderAmount: number) =>
    axiosInstance.post('/loyalty/earn', { userId, businessId: BUSINESS_ID, orderId, orderAmount }).then(r => r.data),

  /** Get loyalty settings config */
  getLoyaltyConfig: () =>
    axiosInstance.get('/loyalty/admin/config', { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Update loyalty settings config */
  updateLoyaltyConfig: (payload: {
    pointsPerNpr?: number;
    pointsToNprRate?: number;
    minRedeemPoints?: number;
    voucherExpiryDays?: number;
    accrualMode?: 'SPEND' | 'VISIT' | 'BOTH';
    pointsPerVisit?: number;
    minSpendForVisit?: number;
    bonusMultiplier?: number;
    pointsExpiryDays?: number | null;
  }) =>
    axiosInstance.post('/loyalty/admin/config', payload, { params: { businessId: BUSINESS_ID } }).then(r => r.data),

  /** Get admin vouchers (paginated and filtered) */
  getAdminVouchers: (params?: { status?: string; page?: number; limit?: number }) =>
    axiosInstance.get('/loyalty/admin/vouchers', { params: { businessId: BUSINESS_ID, ...params } }).then(r => r.data),

  /** Create admin voucher (legacy flow) */
  createAdminVoucher: (payload: { userId: string; code?: string; discountType: 'FIXED' | 'PERCENTAGE'; discountValue: number; maxDiscountAmount?: number; minOrderAmount?: number; maxUses?: number; maxUsesPerUser?: number; expiresAt?: string }) =>
    axiosInstance.post('/loyalty/admin/voucher', { ...payload, businessId: BUSINESS_ID }).then(r => r.data),

  // ── Campaign CRUD ────────────────────────────────────────────

  /** List all campaigns, optionally filter by businessId */
  getCampaigns: (businessId?: string) =>
    axiosInstance.get('/loyalty/admin/campaigns', { params: { businessId: businessId ?? BUSINESS_ID } }).then(r => r.data),

  /** Create a new DRAFT campaign */
  createCampaign: (payload: Record<string, any>) =>
    axiosInstance.post('/loyalty/admin/campaigns', payload).then(r => r.data),

  /** Update campaign fields */
  updateCampaign: (id: string, payload: Record<string, any>) =>
    axiosInstance.patch(`/loyalty/admin/campaigns/${id}`, payload).then(r => r.data),

  /** Activate a DRAFT campaign */
  activateCampaign: (id: string) =>
    axiosInstance.post(`/loyalty/admin/campaigns/${id}/activate`).then(r => r.data),

  /** Pause an ACTIVE campaign */
  pauseCampaign: (id: string) =>
    axiosInstance.post(`/loyalty/admin/campaigns/${id}/pause`).then(r => r.data),

  /** Resume a PAUSED campaign */
  resumeCampaign: (id: string) =>
    axiosInstance.post(`/loyalty/admin/campaigns/${id}/resume`).then(r => r.data),

  /** Archive a campaign (irreversible) */
  archiveCampaign: (id: string) =>
    axiosInstance.post(`/loyalty/admin/campaigns/${id}/archive`).then(r => r.data),

  /** Award a campaign voucher to a specific customer */
  awardVoucherToCustomer: (payload: { userId: string; businessId: string; campaignId: string; expiresAt?: string }) =>
    axiosInstance.post('/loyalty/admin/vouchers/award', payload).then(r => r.data),

  /** Award a campaign voucher to mass users based on criteria */
  awardVoucherToMassUsers: (payload: { campaignId: string; businessId: string; criteria: 'all' | 'min_orders' | 'min_spent'; minOrders?: number; minSpent?: number; expiresAt?: string }) =>
    axiosInstance.post('/loyalty/admin/vouchers/award-mass', payload).then(r => r.data),

  /**
   * Get redemption log for a specific campaign.
   * NOTE: Backend controller route not yet exposed (Sub-step 2 pending).
   * Add Admin UI only after the route lands.
   */
  getCampaignRedemptions: (campaignId: string, params?: { page?: number; limit?: number }) =>
    axiosInstance.get(`/loyalty/admin/campaigns/${campaignId}/redemptions`, { params }).then(r => r.data),
};

