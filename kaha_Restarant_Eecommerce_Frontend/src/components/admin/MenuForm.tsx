import React, { useState } from 'react';
import { Menu, MenuVariant } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/admin/MenuForm.css';

interface MenuFormProps {
  menu?: Menu;
  categories: Array<{ id: string; name: string }>;
  addons: Array<{ id: string; name: string; price: number | string }>;
  onSubmit: (data: MenuFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface MenuFormData {
  name: string;
  description: string;
  categoryId: string;
  price: number;
  discountedPrice?: number;
  images: string[];
  isAvailable: boolean;
  isSignature: boolean;
  allowAddOns: boolean;
  addOnIds: string[];
  services: string[];
}

interface FormErrors {
  name?: string;
  categoryId?: string;
  price?: string;
}

export const MenuForm: React.FC<MenuFormProps> = ({
  menu,
  categories,
  addons,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<MenuFormData>({
    name: menu?.name || '',
    description: menu?.description || '',
    categoryId: menu?.categoryId || '',
    price: menu?.price ? parseFloat(menu.price.toString()) : 0,
    discountedPrice: menu?.discountedPrice
      ? parseFloat(menu.discountedPrice.toString())
      : undefined,
    images: menu?.images || [],
    isAvailable: menu?.isAvailable ?? true,
    isSignature: menu?.isSignature ?? false,
    allowAddOns: menu?.allowAddOns ?? true,
    addOnIds: [], // TODO: Load from menu if available
    services: menu?.services || ['DELIVERY'],
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Menu name is required';
    } else if (formData.name.length > 100) {
      errors.name = 'Menu name must be less than 100 characters';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Category is required';
    }

    if (!formData.price || formData.price <= 0) {
      errors.price = 'Price must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="menu-form" onSubmit={handleSubmit}>
      <div className="form-section">
        <h2>{menu ? 'Edit Menu Item' : 'Create New Menu Item'}</h2>

        <div className="form-group">
          <label htmlFor="name">Menu Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="E.g., Momo, Biryani, Chow Mein"
            className={`form-control ${formErrors.name ? 'form-control-error' : ''}`}
            disabled={isSubmitting}
          />
          {formErrors.name && (
            <span className="form-error-text">{formErrors.name}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Describe the dish, ingredients, etc."
            rows={4}
            className="form-control"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              className={`form-control ${
                formErrors.categoryId ? 'form-control-error' : ''
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {formErrors.categoryId && (
              <span className="form-error-text">{formErrors.categoryId}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (Rs.) *</label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0.00"
              className={`form-control ${
                formErrors.price ? 'form-control-error' : ''
              }`}
              disabled={isSubmitting}
            />
            {formErrors.price && (
              <span className="form-error-text">{formErrors.price}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="discountedPrice">Discounted Price (Rs.)</label>
            <input
              id="discountedPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.discountedPrice || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountedPrice: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              placeholder="0.00"
              className="form-control"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Services</label>
          <div className="checkbox-group">
            {['DINE_IN', 'TAKEAWAY', 'DELIVERY'].map((service) => (
              <label key={service} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.services.includes(service)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        services: [...formData.services, service],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        services: formData.services.filter(
                          (s) => s !== service
                        ),
                      });
                    }
                  }}
                  disabled={isSubmitting}
                />
                <span>{service}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Additional Options</h3>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={formData.isSignature}
            onChange={(e) =>
              setFormData({ ...formData, isSignature: e.target.checked })
            }
            disabled={isSubmitting}
          />
          <span>Mark as Signature Dish</span>
        </label>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={formData.isAvailable}
            onChange={(e) =>
              setFormData({ ...formData, isAvailable: e.target.checked })
            }
            disabled={isSubmitting}
          />
          <span>Available</span>
        </label>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={formData.allowAddOns}
            onChange={(e) =>
              setFormData({ ...formData, allowAddOns: e.target.checked })
            }
            disabled={isSubmitting}
          />
          <span>Allow Add-ons</span>
        </label>
      </div>

      {formData.allowAddOns && (
        <div className="form-section">
          <h3>Select Add-ons</h3>
          <div className="checkbox-group">
            {addons.map((addon) => (
              <label key={addon.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.addOnIds.includes(addon.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        addOnIds: [...formData.addOnIds, addon.id],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        addOnIds: formData.addOnIds.filter(
                          (id) => id !== addon.id
                        ),
                      });
                    }
                  }}
                  disabled={isSubmitting}
                />
                <span>
                  {addon.name} (Rs. {addon.price})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="form-actions">
        <Button
          type="button"
          variant="outline"
          size="large"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={isSubmitting}
        >
          {menu ? 'Update Menu Item' : 'Create Menu Item'}
        </Button>
      </div>
    </form>
  );
};

export default MenuForm;
