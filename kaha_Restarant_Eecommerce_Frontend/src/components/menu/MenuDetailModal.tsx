import React, { useState, useEffect } from 'react';
import type { Menu, MenuVariant, AddonGroup } from '../../types';
import { AddonSelectionTypeEnum } from '../../types';
import { menuApi } from '../../api/menu.api';
import { addonGroupApi } from '../../api/addon.api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './MenuDetailModal.css';

interface Props {
  menu: Menu;
  onClose: () => void;
  isOpen?: boolean;
  addOns?: any[];
  onAddToCart?: (item: any) => Promise<void>;
}

const MenuDetailModal: React.FC<Props> = ({ menu, onClose, isOpen = true, addOns = [], onAddToCart }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [variants, setVariants] = useState<MenuVariant[]>(menu.variants ?? []);
  const [addonGroups, setAddonGroups] = useState<AddonGroup[]>([]);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    menu.variants?.[0] ?? null,
  );
  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setFetchingDetails(true);

      // Fetch variants — failure is non-fatal (item may have none)
      try {
        const fetchedVariants = await menuApi.getVariants(menu.id);
        const normalizedVariants: MenuVariant[] = (fetchedVariants as any[]).map(v => ({
          ...v,
          price: Number(v.price),
        }));
        setVariants(normalizedVariants);
        if (normalizedVariants.length > 0) {
          setSelectedVariant(normalizedVariants[0]);
        }
      } catch (err) {
        console.warn('No variants for this item:', err);
      }

      // Fetch addon groups — independent of variants, failure is non-fatal
      try {
        const fetchedAddonGroups = await addonGroupApi.getByMenu(menu.id);
        setAddonGroups(Array.isArray(fetchedAddonGroups) ? fetchedAddonGroups : []);
      } catch (err) {
        console.warn('No addon groups for this item:', err);
        setAddonGroups([]);
      }

      setFetchingDetails(false);
    };
    fetchDetails();
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
      sessionStorage.setItem('post_login_redirect', location.pathname + location.search);
      toast.error('Please sign in to add items');
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

  const [openSectionId, setOpenSectionId] = useState<string | null>('size');

  useEffect(() => {
    if (variants.length === 0 && addonGroups.length > 0) {
      setOpenSectionId(addonGroups[0].id);
    }
  }, [variants.length, addonGroups]);

  const toggleSection = (id: string) => {
    setOpenSectionId(prev => (prev === id ? null : id));
  };

  const getSelectedAddonsLabel = (group: AddonGroup) => {
    const selectedIds = selectedAddons[group.id] || [];
    if (selectedIds.length === 0) {
      return group.isRequired ? 'Selection Required' : 'None selected';
    }
    const names = selectedIds
      .map(id => {
        const addon = group.addons.find(a => a.id === id);
        return addon ? addon.name : '';
      })
      .filter(Boolean);
    return names.join(', ');
  };

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
              <div style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-gray)', fontSize: '14px', padding: '12px 0' }}>
                Loading options...
              </div>
            ) : (
              <>
                {/* Size variants */}
                {variants.length > 0 && (
                  <div>
                    <button
                      type="button"
                      className={`dropdown-trigger ${openSectionId === 'size' ? 'dropdown-trigger--active' : ''}`}
                      onClick={() => toggleSection('size')}
                    >
                      <div className="dropdown-trigger-title-wrap">
                        <span className="dropdown-trigger-label">
                          Choose Size <span className="menu-modal-req" style={{ marginLeft: 8 }}>Required</span>
                        </span>
                        <span className="dropdown-trigger-value">
                          {selectedVariant ? `${selectedVariant.name} (NPR ${Number(selectedVariant.price).toFixed(2)})` : 'Select a size'}
                        </span>
                      </div>
                      <span className="dropdown-arrow-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                      </span>
                    </button>
                    {openSectionId === 'size' && (
                      <div className="dropdown-content-panel">
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
                    )}
                  </div>
                )}

                {/* Add-ons & extras groups */}
                {addonGroups.length > 0 && (
                  <div>
                    {addonGroups.map(group => {
                      const isOpen = openSectionId === group.id;
                      return (
                        <div key={group.id}>
                          <button
                            type="button"
                            className={`dropdown-trigger ${isOpen ? 'dropdown-trigger--active' : ''}`}
                            onClick={() => toggleSection(group.id)}
                          >
                            <div className="dropdown-trigger-title-wrap">
                              <span className="dropdown-trigger-label">
                                {group.name}
                                {group.isRequired ? (
                                  <span className="menu-modal-req" style={{ marginLeft: 8 }}>Required</span>
                                ) : (
                                  <span className="menu-modal-opt" style={{ marginLeft: 8 }}>Optional</span>
                                )}
                              </span>
                              <span className="dropdown-trigger-value">
                                {getSelectedAddonsLabel(group)}
                              </span>
                            </div>
                            <span className="dropdown-arrow-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </span>
                          </button>
                          {isOpen && (
                            <div className="dropdown-content-panel">
                              <div className="menu-option-list">
                                {(group.addons || []).map(addon => {
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

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
              <button type="button" className="menu-modal-qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
              <span className="menu-modal-qty-count">{quantity}</span>
              <button type="button" className="menu-modal-qty-btn" onClick={() => setQuantity(q => q + 1)}>+</button>
            </div>
            <button type="button" className="menu-modal-add-btn" onClick={handleAddToCart} disabled={loading || fetchingDetails}>
              {loading ? 'Adding...' : `Add to Cart — NPR ${totalPrice.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuDetailModal;
