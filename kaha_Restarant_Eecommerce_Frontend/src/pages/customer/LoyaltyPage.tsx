import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loyaltyApi } from '../../api/loyalty.api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './LoyaltyPage.css';

/* ── Types ─────────────────────────────────────────────────────── */
interface Ledger {
  totalPoints: number;
  lifetimePointsEarned: number;
  lifetimePointsRedeemed: number;
  totalOrders: number;
  totalSpent: number;
}

interface Transaction {
  id: string;
  type: 'earn' | 'redeem' | 'expire' | 'manual_adjust';
  points: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface Voucher {
  id: string;
  code: string;
  discountAmount: number;
  pointsUsed: number;
  status: 'active' | 'used' | 'expired';
  expiresAt: string;
  createdAt: string;
}

/* ── Tier helper ────────────────────────────────────────────────── */
function getTierInfo(orders: number, spent: number) {
  if (orders >= 20 || spent >= 10000) return { label: 'VIP', icon: '👑', color: '#f59e0b', next: null, progress: 100 };
  if (orders >= 10 || spent >= 5000)  return { label: 'Gold', icon: '⭐', color: '#eab308', next: 'VIP', ordersNeeded: Math.max(0, 20 - orders), progress: Math.min(100, (orders / 20) * 100) };
  if (orders >= 5  || spent >= 2000)  return { label: 'Silver', icon: '🥈', color: '#94a3b8', next: 'Gold', ordersNeeded: Math.max(0, 10 - orders), progress: Math.min(100, (orders / 10) * 100) };
  if (orders >= 2)                    return { label: 'Bronze', icon: '🥉', color: '#cd7f32', next: 'Silver', ordersNeeded: Math.max(0, 5 - orders), progress: Math.min(100, (orders / 5) * 100) };
  return { label: 'New', icon: '🌱', color: '#22c55e', next: 'Bronze', ordersNeeded: Math.max(0, 2 - orders), progress: Math.min(100, (orders / 2) * 100) };
}

/* ── Component ──────────────────────────────────────────────────── */
const LoyaltyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [ledger, setLedger]         = useState<Ledger | null>(null);
  const [transactions, setTx]       = useState<Transaction[]>([]);
  const [vouchers, setVouchers]     = useState<Voucher[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'overview' | 'history' | 'vouchers'>('overview');
  const [redeemPoints, setRedeem]   = useState(100);
  const [redeeming, setRedeeming]   = useState(false);
  const [copiedCode, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [l, tx, v] = await Promise.all([
        loyaltyApi.getLedger(user!.id),
        loyaltyApi.getTransactions(user!.id),
        loyaltyApi.getVouchers(user!.id),
      ]);
      setLedger(l);
      setTx(Array.isArray(tx) ? tx : []);
      setVouchers(Array.isArray(v) ? v : []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to load loyalty data');
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!user?.id) return;
    if ((ledger?.totalPoints ?? 0) < redeemPoints) {
      toast.error(`You need at least ${redeemPoints} points`);
      return;
    }
    setRedeeming(true);
    try {
      const voucher = await loyaltyApi.redeemPoints(user.id, redeemPoints);
      toast.success(`🎟️ Voucher ${voucher.code} created! NPR ${voucher.discountAmount} off.`);
      await fetchAll();
      setActiveTab('vouchers');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success('Code copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="loyalty-page">
        <div className="loyalty-loading">
          <div className="spinner spinner-lg" />
          <p>Loading your loyalty account…</p>
        </div>
      </div>
    );
  }

  const tier = getTierInfo(ledger?.totalOrders ?? 0, ledger?.totalSpent ?? 0);
  const activeVouchers  = vouchers.filter(v => v.status === 'active');
  const usedVouchers    = vouchers.filter(v => v.status !== 'active');

  return (
    <div className="loyalty-page">
      <div className="container">

        {/* ── Back ── */}
        <button className="loyalty-back" onClick={() => navigate('/orders')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Orders
        </button>

        {/* ── Hero Banner ── */}
        <div className="loyalty-hero" style={{ '--tier-color': tier.color } as React.CSSProperties}>
          <div className="loyalty-hero-left">
            <div className="loyalty-tier-badge">
              <span className="loyalty-tier-icon">{tier.icon}</span>
              <span className="loyalty-tier-label">{tier.label} Member</span>
            </div>
            <h1 className="loyalty-hero-name">Hey, {(user as any)?.fullName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'}!</h1>
            <p className="loyalty-hero-sub">Your rewards are growing with every order 🚀</p>

            {tier.next && (
              <div className="loyalty-progress-wrap">
                <div className="loyalty-progress-labels">
                  <span>{tier.label}</span>
                  <span>{tier.next}</span>
                </div>
                <div className="loyalty-progress-bar">
                  <div className="loyalty-progress-fill" style={{ width: `${tier.progress}%` }} />
                </div>
                {(tier as any).ordersNeeded > 0 && (
                  <p className="loyalty-progress-hint">
                    {(tier as any).ordersNeeded} more order{(tier as any).ordersNeeded > 1 ? 's' : ''} to reach {tier.next}!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="loyalty-hero-points">
            <div className="loyalty-points-ring">
              <div className="loyalty-points-value">{ledger?.totalPoints ?? 0}</div>
              <div className="loyalty-points-unit">POINTS</div>
            </div>
            <p className="loyalty-points-hint">≈ NPR {((ledger?.totalPoints ?? 0) * 0.5).toFixed(0)} in vouchers</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="loyalty-stats">
          {[
            { label: 'Total Orders', value: ledger?.totalOrders ?? 0, icon: '📦' },
            { label: 'Total Spent',  value: `NPR ${Number(ledger?.totalSpent ?? 0).toFixed(0)}`, icon: '💰' },
            { label: 'Points Earned', value: ledger?.lifetimePointsEarned ?? 0, icon: '⭐' },
            { label: 'Points Redeemed', value: ledger?.lifetimePointsRedeemed ?? 0, icon: '🎟️' },
          ].map(s => (
            <div key={s.label} className="loyalty-stat-card">
              <div className="loyalty-stat-icon">{s.icon}</div>
              <div className="loyalty-stat-value">{s.value}</div>
              <div className="loyalty-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div className="loyalty-tabs">
          {(['overview', 'history', 'vouchers'] as const).map(tab => (
            <button
              key={tab}
              id={`loyalty-tab-${tab}`}
              className={`loyalty-tab ${activeTab === tab ? 'loyalty-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview'  && '🏠 Overview'}
              {tab === 'history'   && `📋 History (${transactions.length})`}
              {tab === 'vouchers'  && `🎟️ Vouchers (${vouchers.length})`}
            </button>
          ))}
        </div>

        {/* ────────────── TAB: OVERVIEW ────────────── */}
        {activeTab === 'overview' && (
          <div className="loyalty-tab-content">

            {/* How it works */}
            <div className="loyalty-card loyalty-how">
              <h3>How It Works</h3>
              <div className="loyalty-steps">
                {[
                  { step: '1', icon: '🛒', title: 'Place an Order', desc: 'Earn 1 point for every NPR 10 spent' },
                  { step: '2', icon: '📦', title: 'Order Delivered', desc: 'Points credited automatically on delivery' },
                  { step: '3', icon: '🎟️', title: 'Redeem for Voucher', desc: '100 pts = NPR 50 discount voucher' },
                  { step: '4', icon: '💸', title: 'Save at Checkout', desc: 'Apply your voucher code at checkout' },
                ].map(s => (
                  <div key={s.step} className="loyalty-step">
                    <div className="loyalty-step-num">{s.step}</div>
                    <div className="loyalty-step-icon">{s.icon}</div>
                    <div className="loyalty-step-title">{s.title}</div>
                    <div className="loyalty-step-desc">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Redeem section */}
            <div className="loyalty-card loyalty-redeem-card">
              <h3>Redeem Your Points</h3>
              <p className="loyalty-redeem-sub">Choose how many points to convert into a discount voucher</p>

              <div className="loyalty-redeem-options">
                {[100, 200, 500].map(pts => (
                  <button
                    key={pts}
                    id={`loyalty-redeem-${pts}`}
                    className={`loyalty-redeem-opt ${redeemPoints === pts ? 'loyalty-redeem-opt--active' : ''}`}
                    onClick={() => setRedeem(pts)}
                    disabled={(ledger?.totalPoints ?? 0) < pts}
                  >
                    <div className="loyalty-redeem-pts">{pts} pts</div>
                    <div className="loyalty-redeem-val">= NPR {pts * 0.5}</div>
                  </button>
                ))}
              </div>

              <div className="loyalty-redeem-summary">
                <div className="loyalty-redeem-eq">
                  <span>{redeemPoints} pts</span>
                  <span className="loyalty-redeem-arrow">→</span>
                  <span className="loyalty-redeem-result">NPR {(redeemPoints * 0.5).toFixed(0)} voucher</span>
                </div>
                <div className="loyalty-redeem-balance">
                  Available: <strong>{ledger?.totalPoints ?? 0} pts</strong>
                </div>
              </div>

              <button
                id="loyalty-redeem-btn"
                className="loyalty-redeem-btn"
                onClick={handleRedeem}
                disabled={redeeming || (ledger?.totalPoints ?? 0) < redeemPoints}
              >
                {redeeming ? <div className="spinner" /> : `🎟️ Generate Voucher for NPR ${(redeemPoints * 0.5).toFixed(0)}`}
              </button>

              {(ledger?.totalPoints ?? 0) < 100 && (
                <p className="loyalty-redeem-notice">
                  You need at least <strong>100 points</strong> to redeem. Keep ordering! 🚀
                </p>
              )}
            </div>

            {/* Tier ladder */}
            <div className="loyalty-card loyalty-tiers-card">
              <h3>Loyalty Tiers</h3>
              <div className="loyalty-tiers">
                {[
                  { label: 'New 🌱',    req: '1st order',         color: '#22c55e' },
                  { label: 'Bronze 🥉', req: '2+ orders',          color: '#cd7f32' },
                  { label: 'Silver 🥈', req: '5+ orders / NPR 2K', color: '#94a3b8' },
                  { label: 'Gold ⭐',   req: '10+ orders / NPR 5K',color: '#eab308' },
                  { label: 'VIP 👑',    req: '20+ orders / NPR 10K',color: '#f59e0b' },
                ].map(t => (
                  <div key={t.label} className={`loyalty-tier-row ${tier.label === t.label.split(' ')[0] ? 'loyalty-tier-row--current' : ''}`}>
                    <div className="loyalty-tier-dot" style={{ background: t.color }} />
                    <div className="loyalty-tier-row-label">{t.label}</div>
                    <div className="loyalty-tier-row-req">{t.req}</div>
                    {tier.label === t.label.split(' ')[0] && <div className="loyalty-tier-you">← You</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ────────────── TAB: HISTORY ────────────── */}
        {activeTab === 'history' && (
          <div className="loyalty-tab-content">
            <div className="loyalty-card">
              <h3>Points History</h3>
              {transactions.length === 0 ? (
                <div className="loyalty-empty">
                  <div className="loyalty-empty-icon">📋</div>
                  <p>No transactions yet. Place your first order to start earning!</p>
                  <button className="btn btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
                </div>
              ) : (
                <div className="loyalty-tx-list">
                  {transactions.map(tx => (
                    <div key={tx.id} className={`loyalty-tx-item loyalty-tx-item--${tx.type}`}>
                      <div className="loyalty-tx-icon">
                        {tx.type === 'earn' ? '⭐' : tx.type === 'redeem' ? '🎟️' : tx.type === 'expire' ? '⏰' : '✏️'}
                      </div>
                      <div className="loyalty-tx-info">
                        <div className="loyalty-tx-desc">{tx.description}</div>
                        <div className="loyalty-tx-date">{new Date(tx.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className={`loyalty-tx-pts ${tx.points > 0 ? 'loyalty-tx-pts--earn' : 'loyalty-tx-pts--redeem'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                      </div>
                      <div className="loyalty-tx-balance">Balance: {tx.balanceAfter}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────────────── TAB: VOUCHERS ────────────── */}
        {activeTab === 'vouchers' && (
          <div className="loyalty-tab-content">

            {activeVouchers.length > 0 && (
              <div className="loyalty-card">
                <h3>🟢 Active Vouchers</h3>
                <div className="loyalty-voucher-grid">
                  {activeVouchers.map(v => (
                    <div key={v.id} className="loyalty-voucher">
                      <div className="loyalty-voucher-left">
                        <div className="loyalty-voucher-amount">NPR {v.discountAmount}</div>
                        <div className="loyalty-voucher-pts">{v.pointsUsed} pts redeemed</div>
                        <div className="loyalty-voucher-expiry">
                          Expires: {new Date(v.expiresAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="loyalty-voucher-right">
                        <div className="loyalty-voucher-code">{v.code}</div>
                        <button
                          id={`loyalty-copy-${v.id}`}
                          className={`loyalty-copy-btn ${copiedCode === v.code ? 'loyalty-copy-btn--copied' : ''}`}
                          onClick={() => handleCopy(v.code)}
                        >
                          {copiedCode === v.code ? '✅ Copied!' : '📋 Copy Code'}
                        </button>
                        <button
                          className="loyalty-use-btn"
                          onClick={() => navigate('/checkout')}
                        >
                          Use at Checkout →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {usedVouchers.length > 0 && (
              <div className="loyalty-card">
                <h3>Past Vouchers</h3>
                <div className="loyalty-voucher-grid">
                  {usedVouchers.map(v => (
                    <div key={v.id} className={`loyalty-voucher loyalty-voucher--${v.status}`}>
                      <div className="loyalty-voucher-left">
                        <div className="loyalty-voucher-amount">NPR {v.discountAmount}</div>
                        <div className="loyalty-voucher-pts">{v.pointsUsed} pts</div>
                      </div>
                      <div className="loyalty-voucher-right">
                        <div className="loyalty-voucher-code loyalty-voucher-code--faded">{v.code}</div>
                        <span className={`loyalty-voucher-status loyalty-voucher-status--${v.status}`}>
                          {v.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vouchers.length === 0 && (
              <div className="loyalty-card">
                <div className="loyalty-empty">
                  <div className="loyalty-empty-icon">🎟️</div>
                  <p>No vouchers yet. Accumulate 100 points and redeem your first voucher!</p>
                  <button className="btn btn-primary" onClick={() => setActiveTab('overview')}>View Overview</button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default LoyaltyPage;
