import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../common/Button';
import '../../styles/components/admin/CategoryForm.css';

interface CategoryFormProps {
  category?: Category;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CategoryFormData {
  name: string;
  description: string;
  position: number;
  image?: string;
}

interface FormErrors {
  name?: string;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
    position: category?.position || 0,
    image: category?.image || '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    } else if (formData.name.length > 50) {
      errors.name = 'Category name must be less than 50 characters';
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
    <form className="category-form" onSubmit={handleSubmit}>
      <h2>{category ? 'Edit Category' : 'Create New Category'}</h2>

      <div className="form-group">
        <label htmlFor="name">Category Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="E.g., Appetizers, Mains, Desserts"
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
          placeholder="Describe this category"
          rows={3}
          className="form-control"
          disabled={isSubmitting}
        />
      </div>

      <div className="form-group">
        <label htmlFor="position">Display Position</label>
        <input
          id="position"
          type="number"
          min="0"
          value={formData.position}
          onChange={(e) =>
            setFormData({
              ...formData,
              position: parseInt(e.target.value) || 0,
            })
          }
          placeholder="0"
          className="form-control"
          disabled={isSubmitting}
        />
        <small>Lower numbers appear first</small>
      </div>

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
          {category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;
