import React from 'react';
import { Menu } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/admin/MenuRow.css';

interface MenuRowProps {
  menu: Menu;
  onEdit: (menu: Menu) => void;
  onDelete: (menuId: string) => Promise<void>;
  onToggleHidden: (id: string, isHidden: boolean) => Promise<void>;
  onToggleAvailability: (id: string, isAvailable: boolean) => Promise<void>;
  isLoading?: boolean;
}

export const MenuRow: React.FC<MenuRowProps> = ({
  menu,
  onEdit,
  onDelete,
  onToggleHidden,
  onToggleAvailability,
  isLoading = false,
}) => {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${menu.name}"?`)) {
      await onDelete(menu.id);
    }
  };

  const handleToggleAvailability = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    await onToggleAvailability(menu.id, e.target.checked);
  };

  const price = typeof menu.price === 'string' ? parseFloat(menu.price) : menu.price;
  const discountedPrice =
    menu.discountedPrice
      ? typeof menu.discountedPrice === 'string'
        ? parseFloat(menu.discountedPrice)
        : menu.discountedPrice
      : null;

  const discountPercentage =
    discountedPrice && price ? Math.round(((price - discountedPrice) / price) * 100) : 0;

  return (
    <tr className="menu-row">
      <td className="cell-name">
        <div className="name-content">
          {menu.images?.[0] && (
            <img
              src={menu.images[0]}
              alt={menu.name}
              className="menu-thumbnail"
            />
          )}
          <div>
            <p className="menu-name">{menu.name}</p>
            {menu.isSignature && <span className="signature-badge">Signature</span>}
          </div>
        </div>
      </td>

      <td className="cell-price">
        <div className="price-content">
          <p className="current-price">Rs. {price}</p>
          {discountedPrice && (
            <p className="discounted-price">
              Rs. {discountedPrice}
              <span className="discount-badge">-{discountPercentage}%</span>
            </p>
          )}
        </div>
      </td>

      <td className="cell-category">{menu.categoryId || 'Uncategorized'}</td>

      <td className="cell-rating">
        <div className="rating-content">
          {'★'.repeat(Math.round(menu.averageRating || 0))}
          <span className="rating-count">({menu.category?.children?.length || 0})</span>
        </div>
      </td>

      <td className="cell-availability">
        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={menu.isAvailable}
            onChange={handleToggleAvailability}
            disabled={isLoading}
          />
          <span className="toggle-slider"></span>
        </label>
      </td>

      <td className="cell-actions">
        <Button
          variant="outline"
          size="small"
          onClick={() => onEdit(menu)}
          disabled={isLoading}
        >
          Edit
        </Button>
        <div className="menu-row__actions" style={{ display: 'inline-flex', gap: '6px', marginLeft: '6px' }}>
          {/* Hidden Toggle */}
          <button
            className={`btn btn-small ${menu.isHidden ? 'btn-warning' : 'btn-outline'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHidden(menu.id, !menu.isHidden);
            }}
            disabled={isLoading}
            title={menu.isHidden ? 'Click to make visible' : 'Click to hide from customers'}
          >
            {menu.isHidden ? '👁️ Hidden' : '👁️ Visible'}
          </button>

          {/* Out of Stock Toggle */}
          <button
            className={`btn btn-small ${!menu.isAvailable ? 'btn-warning' : 'btn-outline'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleAvailability(menu.id, !menu.isAvailable);
            }}
            disabled={isLoading}
            title={menu.isAvailable ? 'Mark as out of stock' : 'Mark as available'}
          >
            {menu.isAvailable ? '✅ In Stock' : '⚠️ Out of Stock'}
          </button>

          {/* Delete */}
          <button
            className="btn btn-small btn-danger"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
};

export default MenuRow;
