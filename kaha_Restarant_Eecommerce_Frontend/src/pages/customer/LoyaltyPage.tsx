import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loyaltyApi } from '../../api/loyalty.api';
import { useAuth } from '../../context/AuthContext';
import './LoyaltyPage.css';

interface LoyaltyPoints {
  totalPoints: number;
  updatedAt: string;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  totalOrders: number;
  totalSpent: number;
  pointsExpireAt: string | null;
  accrualMode: string;
  minRedeemPoints: number;
  pointsToNprRate: number;
}

interface Voucher {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  expiresAt: string | null;
  status: string;
}

interface LoyaltyTransaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'manual_adjust';
  points: number;
  description?: string;
  createdAt: string;
  balanceAfter: number;
}

const LoyaltyPage: React.FC = () => {
  const { user } = useAuth();
  const [points, setPoints] = useState<LoyaltyPoints | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vouchers' | 'history'>('vouchers');

  const fetchPoints = async () => {
    if (!user) return;
    setLoadingPoints(true);
    try {
      const data = await loyaltyApi.getLedger(user.id);
      setPoints(data);
    } catch (err) {
      console.error('Error fetching loyalty points:', err);
    } finally {
      setLoadingPoints(false);
    }
  };

  const fetchVouchers = async () => {
    if (!user) return;
    setLoadingVouchers(true);
    try {
      const data = await loyaltyApi.getVouchers(user.id);
      setVouchers(data);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoadingVouchers(false);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    setLoadingTransactions(true);
    try {
      const data = await loyaltyApi.getTransactions(user.id);
      setTransactions(data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPoints();
      fetchVouchers();
      fetchTransactions();
    }
  }, [user]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRedeem = async () => {
    if (!user || !points || points.totalPoints < points.minRedeemPoints) return;
    setRedeeming(true);
    setRedeemError(null);
    setRedeemSuccess(null);
    try {
      await loyaltyApi.redeemPoints(user.id, points.minRedeemPoints);
      setRedeemSuccess(`Successfully redeemed ${points.minRedeemPoints} points for a voucher!`);
      fetchPoints();
      fetchVouchers();
      fetchTransactions();
    } catch (err: any) {
      console.error('Redemption failed:', err);
      setRedeemError(err.response?.data?.message || 'Failed to redeem points');
    } finally {
      setRedeeming(false);
    }
  };

  const isExpiringSoon = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 && diff < 1000 * 60 * 60 * 24 * 3;
  };

  if (!user) {
    return (
      <div className="lp-gate">
        <div className="lp-gate-icon">🎁</div>
        <h2 className="lp-gate-title">KAHA Loyalty Rewards</h2>
        <p className="lp-gate-sub">
          Sign in to view your points balance, tier status, and exclusive vouchers.
        </p>
        <Link to="/login" className="lp-gate-btn">Sign In to Continue</Link>
      </div>
    );
  }

  return (
    <div className="lp-root">

      {/* ── HERO POINTS CARD ── */}
      <div className="lp-hero">
        <div className="lp-hero-left">
          <p className="lp-hero-label">YOUR POINTS BALANCE</p>
          <div className="lp-hero-pts">
            {loadingPoints ? (
              <span className="lp-hero-skeleton" />
            ) : (
              <>
                <span className="lp-hero-num">{points?.totalPoints ?? 0}</span>
                <span className="lp-hero-unit">pts</span>
              </>
            )}
          </div>
          {points?.updatedAt && (
            <p className="lp-hero-updated">
              Updated {new Date(points.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}

          <div className="lp-hero-stats">
            <div className="lp-stat-mini">
              <span className="lp-stat-mini-label">Lifetime Earned</span>
              <span className="lp-stat-mini-val">{points?.lifetimePointsEarned ?? 0}</span>
            </div>
            <div className="lp-stat-mini">
              <span className="lp-stat-mini-label">Lifetime Redeemed</span>
              <span className="lp-stat-mini-val">{points?.lifetimePointsRedeemed ?? 0}</span>
            </div>
          </div>

          {points && points.totalPoints >= points.minRedeemPoints && (
            <div className="lp-redeem-action">
              <button 
                className="lp-redeem-btn" 
                onClick={handleRedeem} 
                disabled={redeeming}
              >
                {redeeming ? 'Redeeming...' : `Redeem ${points.minRedeemPoints} pts`}
              </button>
              <span className="lp-redeem-hint">
                Get NPR {points.minRedeemPoints * points.pointsToNprRate} Voucher
              </span>
            </div>
          )}
          {redeemError && <p className="lp-redeem-err">{redeemError}</p>}
          {redeemSuccess && <p className="lp-redeem-success">{redeemSuccess}</p>}
        </div>
        <div className="lp-hero-right">
          <div className="lp-earn-item">
            <span className="lp-earn-icon">🛒</span>
            <div>
              <p className="lp-earn-title">Earn on every order</p>
              <p className="lp-earn-desc">Points added automatically after each purchase.</p>
            </div>
          </div>
          <div className="lp-earn-item">
            <span className="lp-earn-icon">🎟️</span>
            <div>
              <p className="lp-earn-title">Redeem for vouchers</p>
              <p className="lp-earn-desc">Convert your points into food vouchers instantly.</p>
            </div>
          </div>
          <div className="lp-earn-item">
            <span className="lp-earn-icon">⚡</span>
            <div>
              <p className="lp-earn-title">Points expire in 365 days</p>
              <p className="lp-earn-desc">Keep ordering to keep your balance active.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB NAVIGATION ── */}
      <div className="lp-tabs">
        <button
          className={`lp-tab-btn ${activeTab === 'vouchers' ? 'lp-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          🎟️ Vouchers & Perks
        </button>
        <button
          className={`lp-tab-btn ${activeTab === 'history' ? 'lp-tab-btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📊 Points History
        </button>
      </div>

      {activeTab === 'vouchers' ? (
        /* ── VOUCHERS ── */
        <div className="lp-section">
          <div className="lp-section-header">
            <h2 className="lp-section-title">My Vouchers</h2>
            <span className="lp-voucher-count">
              {loadingVouchers ? '—' : `${vouchers.length} active`}
            </span>
          </div>

          {loadingVouchers ? (
            <div className="lp-vouchers-grid">
              {[1, 2].map(i => <div key={i} className="lp-voucher-skeleton" />)}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="lp-empty">
              <span className="lp-empty-icon">🎟️</span>
              <p className="lp-empty-title">No active vouchers</p>
              <p className="lp-empty-sub">Vouchers awarded by KAHA admins or redeemed from points will appear here.</p>
            </div>
          ) : (
            <div className="lp-vouchers-grid">
              {vouchers.map((v) => {
                const soon = isExpiringSoon(v.expiresAt);
                const discVal = Number(v.discountValue) > 0 ? Number(v.discountValue) : Number(v.discountAmount);
                return (
                  <div key={v.id} className={`lp-voucher ${soon ? 'lp-voucher--expiring' : ''}`}>
                    {soon && <div className="lp-expiring-badge">Expires Soon</div>}
                    <div className="lp-voucher-stub">
                      <span className="lp-stub-value">
                        {v.discountType === 'PERCENTAGE'
                          ? `${discVal}%`
                          : `NPR ${discVal}`}
                      </span>
                      <span className="lp-stub-label">OFF</span>
                    </div>
                    <div className="lp-voucher-notch-top" />
                    <div className="lp-voucher-notch-bottom" />
                    <div className="lp-voucher-body">
                      <button
                        className={`lp-code-btn ${copiedCode === v.code ? 'lp-code-btn--copied' : ''}`}
                        onClick={() => handleCopy(v.code)}
                      >
                        <span className="lp-code-text">{v.code}</span>
                        <span className="lp-code-action">
                          {copiedCode === v.code ? '✓ Copied' : 'Copy'}
                        </span>
                      </button>
                      <div className="lp-voucher-meta">
                        {Number(v.minOrderAmount) > 0 && (
                          <span className="lp-meta-chip">
                            Min NPR {Number(v.minOrderAmount).toLocaleString()}
                          </span>
                        )}
                        {v.maxDiscountAmount && (
                          <span className="lp-meta-chip">
                            Cap NPR {Number(v.maxDiscountAmount).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="lp-voucher-expiry">
                        {v.expiresAt
                          ? `Expires ${new Date(v.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                          : 'No expiry date'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── TRANSACTION HISTORY ── */
        <div className="lp-section">
          <div className="lp-section-header">
            <h2 className="lp-section-title">Points History</h2>
            <span className="lp-voucher-count">
              {loadingTransactions ? '—' : `${transactions.length} entries`}
            </span>
          </div>

          {loadingTransactions ? (
            <div className="lp-transactions-list">
              {[1, 2, 3].map(i => <div key={i} className="lp-tx-skeleton" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="lp-empty">
              <span className="lp-empty-icon">📊</span>
              <p className="lp-empty-title">No transactions yet</p>
              <p className="lp-empty-sub">Your earned and redeemed points history will appear here.</p>
            </div>
          ) : (
            <div className="lp-transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="lp-tx-card">
                  <div className="lp-tx-left">
                    <div className={`lp-tx-badge lp-tx-badge--${tx.type}`}>
                      {tx.type === 'earn' && '📈 Earn'}
                      {tx.type === 'redeem' && '📉 Redeem'}
                      {tx.type === 'expire' && '⚠️ Expire'}
                      {tx.type === 'manual_adjust' && '⚙️ Adjust'}
                    </div>
                    <div className="lp-tx-info">
                      <p className="lp-tx-desc">{tx.description || `Points ${tx.type}`}</p>
                      <p className="lp-tx-date">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className={`lp-tx-pts ${tx.points > 0 ? 'lp-tx-pts--positive' : 'lp-tx-pts--negative'}`}>
                    {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default LoyaltyPage;
