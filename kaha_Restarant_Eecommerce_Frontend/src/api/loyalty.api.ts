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
  validateVoucher: (code: string, userId: string) =>
    axiosInstance.post('/loyalty/voucher/validate', { code, userId }).then(r => r.data),

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
  updateLoyaltyConfig: (payload: { pointsPerNpr?: number; pointsToNprRate?: number; minRedeemPoints?: number; voucherExpiryDays?: number }) =>
    axiosInstance.post('/loyalty/admin/config', payload, { params: { businessId: BUSINESS_ID } }).then(r => r.data),
};
