import React, { useState } from 'react';
import type { Menu } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './MenuCard.css';

interface Props { 
  menu: Menu; 
  onClick?: () => void;
  onViewDetails?: (menuId: string) => void;
  onAddToCart?: (item: any) => Promise<void>;
}

const MenuCard: React.FC<Props> = ({ menu, onClick, onViewDetails, onAddToCart }) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [qty, setQty] = useState(1);

  const displayPrice = menu.variants && menu.variants.length > 0
    ? Math.min(...menu.variants.map(v => Number(v.price)))
    : Number(menu.price ?? 0);
  const discountedPrice = menu.discountedPrice ? Number(menu.discountedPrice) : null;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      // Allow browsing menu publicly; ask login only when needed.
      sessionStorage.setItem('post_login_redirect', location.pathname + location.search);
      toast.error('Please sign in to add items');
      navigate('/login');
      return;
    }
    const hasMultipleVariants = menu.variants && menu.variants.length > 1;
    const hasRequiredAddons = menu.addonGroups?.some(g => g.isRequired);
    if (hasMultipleVariants || hasRequiredAddons) { onClick?.(); return; }
    try {
      await addItem({ menuId: menu.id, menuVariantId: menu.variants?.[0]?.id, quantity: qty });
      toast.success(`${menu.name} added to cart!`);
    } catch {
      // error toast already handled in CartContext
    }
  };

  const handleQtyChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setQty(q => Math.max(1, q + delta));
  };

  const imgSrc = menu.images?.[0] || menu.image ||
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

  return (
    <div className="menu-card" onClick={onClick}>
      {/* Image */}
      <div className="menu-card__image-wrap">
        <img src={imgSrc} alt={menu.name} className="menu-card__image" loading="lazy" />

        {/* Badges */}
        <div className="menu-card__badges">
          {menu.isSignature && (
            <span className="badge badge-signature">✦ Signature</span>
          )}
          {discountedPrice && (
            <span className="badge badge-success">Sale</span>
          )}
        </div>

        {!menu.isAvailable && (
          <div className="menu-card__unavailable">Unavailable</div>
        )}
      </div>

      {/* Body */}
      <div className="menu-card__body">
        <div className="menu-card__header">
          <h3 className="menu-card__name">{menu.name}</h3>
          <div className="menu-card__price-col">
            <span className="price">
              {(menu.variants?.length ?? 0) > 1 ? 'From ' : ''}
              NPR {displayPrice.toFixed(2)}
            </span>
            {discountedPrice && (
              <span className="price-original">NPR {discountedPrice.toFixed(2)}</span>
            )}
          </div>
        </div>

        {menu.averageRating && (
          <div className="menu-card__rating">
            ★ {Number(menu.averageRating).toFixed(1)}
          </div>
        )}

        {menu.description && (
          <p className="menu-card__desc">{menu.description}</p>
        )}

        {menu.isAvailable && (
          <div className="menu-card__footer">
            {/* Quantity selector */}
            <div className="menu-card__qty" onClick={e => e.stopPropagation()}>
              <button className="menu-card__qty-btn" onClick={e => handleQtyChange(e, -1)}>−</button>
              <span className="menu-card__qty-count">{qty}</span>
              <button className="menu-card__qty-btn" onClick={e => handleQtyChange(e, 1)}>+</button>
            </div>
            {/* Add to cart */}
            <button className="menu-card__add-btn" onClick={handleQuickAdd} aria-label={`Add ${menu.name}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
            </button>
          </div>
        )}

        {(menu.variants?.length ?? 0) > 1 && (
          <p className="menu-card__variants-hint">{menu.variants?.length} sizes available — tap to customise</p>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
