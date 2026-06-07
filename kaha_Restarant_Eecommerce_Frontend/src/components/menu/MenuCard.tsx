import React from 'react';
import type { Menu } from '../../types';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../utils/helpers';
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

  const displayPrice = menu.variants && menu.variants.length > 0
    ? Math.min(...menu.variants.map(v => Number(v.price)))
    : Number(menu.price ?? 0);
  const discountedPrice = menu.discountedPrice ? Number(menu.discountedPrice) : null;

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      sessionStorage.setItem('post_login_redirect', location.pathname + location.search);
      toast.error('Please sign in to add items');
      navigate('/login');
      return;
    }
    const hasMultipleVariants = menu.variants && menu.variants.length > 1;
    const hasRequiredAddons = menu.addonGroups?.some(g => g.isRequired);
    if (hasMultipleVariants || hasRequiredAddons) { onClick?.(); return; }
    try {
      await addItem({ menuId: menu.id, menuVariantId: menu.variants?.[0]?.id, quantity: 1 });
      toast.success(`${menu.name} added to cart!`);
    } catch {
      // error toast already handled in CartContext
    }
  };

  const imgSrc = getImageUrl(menu.images, menu.image);

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
            {(menu.variants?.length ?? 0) > 1 ? (
              <span className="menu-card__customise-badge">Customisable</span>
            ) : (
              <span className="menu-card__customise-badge">Quick Add</span>
            )}
            
            {/* Add to cart */}
            <button className="menu-card__add-btn" onClick={handleQuickAdd} aria-label={`Add ${menu.name}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuCard;
