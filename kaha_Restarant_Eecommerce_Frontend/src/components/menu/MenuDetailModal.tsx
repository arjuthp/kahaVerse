import React, { useState, useEffect } from 'react';
import type { Menu, MenuVariant, AddonGroup } from '../../types';
import { AddonSelectionTypeEnum } from '../../types';
import { menuApi } from '../../api/menu.api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './MenuDetailModal.css';

interface Props {
  menu: Menu;
  onClose: () => void;
}

const MenuDetailModal: React.FC<Props> = ({ menu, onClose }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [variants, setVariants] = useState<MenuVariant[]>(menu.variants ?? []);
  const [addonGroups] = useState<AddonGroup[]>(menu.addonGroups ?? []);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    menu.variants?.[0] ?? null,
  );
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVariants = async () => {
      setFetchingDetails(true);
      try {
        const fetched = await menuApi.getVariants(menu.id);
        const normalized: MenuVariant[] = (fetched as any[]).map(v => ({
          ...v,
          price: Number(v.price),
        }));
        setVariants(normalized);
        if (normalized.length > 0) {
          setSelectedVariant(normalized[0]);
        }
      } catch {
        // Item may genuinely have no variants
      } finally {
        setFetchingDetails(false);
      }
    };
    fetchVariants();
  }, [menu.id]);

  const toggleAddon = (group: AddonGroup, addonId: string) => {
    setSelectedAddons(prev => {
      const current = prev[group.id] || [];
      if (group.selectionType === AddonSelectionTypeEnum.SINGLE) {
        return { ...prev, [group.id]: [addonId] };
      }
      if (current.includes(addonId)) {
        return { ...prev, [group.id]: current.filter(id => id !== addonId) };
      }
      if (group.maxSelect && current.length >= group.maxSelect) {
        toast.error(`Max ${group.maxSelect} selections for "${group.name}"`);
        return prev;
      }
      return { ...prev, [group.id]: [...current, addonId] };
    });
  };

  const validate = (): boolean => {
    if (variants.length > 0 && !selectedVariant) {
      toast.error('Please select a size/variant');
      return false;
    }
    for (const group of addonGroups) {
      const picked = selectedAddons[group.id]?.length || 0;
      if (group.isRequired && picked < group.minSelect) {
        toast.error(`"${group.name}" requires at least ${group.minSelect} selection(s)`);
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in first');
      navigate('/login');
      return;
    }
    if (!validate()) return;

    const addonInfo = Object.values(selectedAddons)
      .flat()
      .map(id => ({ addonsId: id, quantity: 1 }));

    setLoading(true);
    try {
      await addItem({
        menuId: menu.id,
        menuVariantId: selectedVariant?.id,
        quantity,
        specialInstructions: specialInstructions || undefined,
        addonInfo,
      });
      toast.success(`${menu.name} added to cart!`);
      onClose();
    } catch {
      // error handled by Context
    } finally {
      setLoading(false);
    }
  };

  const addonTotal = Object.entries(selectedAddons).reduce((total, [groupId, addonIds]) => {
    const group = addonGroups.find(g => g.id === groupId);
    if (!group) return total;
    return total + addonIds.reduce((sum, id) => {
      const addon = group.addons.find(a => a.id === id);
      return sum + Number(addon?.price || 0);
    }, 0);
  }, 0);

  const basePrice = selectedVariant
    ? Number(selectedVariant.price)
    : Number(menu.price ?? 0);
  const totalPrice = (basePrice + addonTotal) * quantity;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="menu-modal-box" onClick={e => e.stopPropagation()}>
        <button className="menu-modal-close" onClick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        <div className="menu-modal-img-wrap">
          <img
            src={menu.image || menu.images?.[0] || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80'}
            alt={menu.name}
            className="menu-modal-img"
          />
          <div className="menu-modal-badges">
            {menu.isSignature && <span className="badge badge-signature">✦ Signature</span>}
          </div>
        </div>

        <div className="menu-modal-content">
          <div className="menu-modal-body">
            <div className="menu-modal-head">
              <h2 className="menu-modal-title">{menu.name}</h2>
              <div className="menu-modal-price">NPR {basePrice.toFixed(2)}</div>
              {menu.description && <p className="menu-modal-desc">{menu.description}</p>}
            </div>

            {fetchingDetails ? (
              <div style={{ color: 'var(--slate-gray)', fontSize: '14px' }}>Loading options...</div>
            ) : variants.length > 0 ? (
              <div className="menu-modal-section">
                <div className="menu-modal-section-title">
                  <span>Choose Size</span>
                  <span className="menu-modal-req">Required</span>
                </div>
                <div className="menu-option-list">
                  {variants.map(v => (
                    <label key={v.id} className={`menu-option-label ${selectedVariant?.id === v.id ? 'menu-option-label--checked' : ''}`} style={{ opacity: v.isAvailable ? 1 : 0.5 }}>
                      <input
                        type="radio"
                        className="menu-option-input"
                        checked={selectedVariant?.id === v.id}
                        onChange={() => v.isAvailable && setSelectedVariant(v)}
                        disabled={!v.isAvailable}
                      />
                      <span className="menu-option-text">{v.name} {!v.isAvailable && '(Unavailable)'}</span>
                      <span className="menu-option-price">NPR {Number(v.price).toFixed(2)}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            {addonGroups.map(group => (
              <div key={group.id} className="menu-modal-section">
                <div className="menu-modal-section-title">
                  <span>{group.name}</span>
                  {group.isRequired ? (
                    <span className="menu-modal-req">Required</span>
                  ) : (
                    <span className="menu-modal-opt">Optional</span>
                  )}
                </div>
                <div className="menu-option-list">
                  {group.addons.map(addon => {
                    const isSelected = (selectedAddons[group.id] || []).includes(addon.id);
                    const isSingle = group.selectionType === AddonSelectionTypeEnum.SINGLE;
                    return (
                      <label key={addon.id} className={`menu-option-label ${isSelected ? 'menu-option-label--checked' : ''}`} style={{ opacity: addon.isActive ? 1 : 0.5 }}>
                        <input
                          type={isSingle ? 'radio' : 'checkbox'}
                          className="menu-option-input"
                          checked={isSelected}
                          onChange={() => addon.isActive && toggleAddon(group, addon.id)}
                          disabled={!addon.isActive}
                        />
                        <span className="menu-option-text">{addon.name}</span>
                        <span className="menu-option-price">{Number(addon.price) > 0 ? `+NPR ${Number(addon.price).toFixed(2)}` : 'Free'}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="menu-modal-section">
              <div className="menu-modal-section-title">Special Instructions</div>
              <textarea
                className="input"
                placeholder="Any special requests? (optional)"
                value={specialInstructions}
                onChange={e => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          <div className="menu-modal-footer">
            <div className="menu-modal-qty">
              <button className="menu-modal-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span className="menu-modal-qty-count">{quantity}</span>
              <button className="menu-modal-qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
            <button className="menu-modal-add-btn" onClick={handleAddToCart} disabled={loading || fetchingDetails}>
              {loading ? 'Adding...' : `Add to Cart — NPR ${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDetailModal;
