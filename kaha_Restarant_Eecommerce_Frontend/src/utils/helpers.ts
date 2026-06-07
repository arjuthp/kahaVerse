// ===== PRICE FORMATTING =====

export const formatPrice = (price: number, currency: string = 'NPR'): string => {
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(price);
};

export const formatPriceSimple = (price: number): string => {
  return `Rs. ${price.toFixed(2)}`;
};

// ===== DATE FORMATTING =====

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(d);
};

// ===== CART CALCULATIONS =====

export const calculateCartItemTotal = (
  quantity: number,
  unitPrice: number,
  addons?: Array<{ price: number; quantity: number }>,
): number => {
  const itemTotal = quantity * unitPrice;
  const addonsTotal = addons?.reduce((sum, addon) => sum + addon.price * addon.quantity, 0) || 0;
  return itemTotal + addonsTotal;
};

export const calculateCartTotal = (
  items: Array<{
    quantity: number;
    unitPriceSnapshot: number;
    addOns?: Array<{ addon: { price: number }; quantity: number }>;
  }>,
): number => {
  return items.reduce((total, item) => {
    const itemPrice = item.unitPriceSnapshot * item.quantity;
    const addonsPrice =
      item.addOns?.reduce((sum, addon) => sum + addon.addon.price * addon.quantity, 0) || 0;
    return total + itemPrice + addonsPrice;
  }, 0);
};

// ===== ORDER CALCULATIONS =====

export const calculateOrderTotal = (
  subtotal: number,
  taxAmount: number = 0,
  deliveryFee: number = 0,
  serviceCharge: number = 0,
  discountAmount: number = 0,
  tipAmount: number = 0,
): number => {
  return subtotal + taxAmount + deliveryFee + serviceCharge - discountAmount + tipAmount;
};

export const calculateTax = (subtotal: number, taxRate: number = 0.13): number => {
  return subtotal * taxRate;
};

// ===== VALIDATION =====

export const validateAddonSelection = (
  addonGroup: {
    isRequired: boolean;
    minSelect: number;
    maxSelect?: number;
    selectionType: 'single' | 'multi';
  },
  selectedCount: number,
): { valid: boolean; message?: string } => {
  // Check required
  if (addonGroup.isRequired && selectedCount < addonGroup.minSelect) {
    return {
      valid: false,
      message: `Please select at least ${addonGroup.minSelect} option(s)`,
    };
  }

  // Check minimum
  if (selectedCount < addonGroup.minSelect) {
    return {
      valid: false,
      message: `Select at least ${addonGroup.minSelect} option(s)`,
    };
  }

  // Check maximum
  if (addonGroup.maxSelect && selectedCount > addonGroup.maxSelect) {
    return {
      valid: false,
      message: `You can select maximum ${addonGroup.maxSelect} option(s)`,
    };
  }

  // Check selection type
  if (addonGroup.selectionType === 'single' && selectedCount > 1) {
    return {
      valid: false,
      message: 'Please select only one option',
    };
  }

  return { valid: true };
};

// ===== STRING UTILITIES =====

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatOrderNumber = (orderNumber: string): string => {
  return orderNumber.toUpperCase();
};

// ===== STATUS UTILITIES =====

export const getOrderStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PENDING: 'orange',
    PROCESSING: 'blue',
    SHIPPED: 'purple',
    DELIVERED: 'green',
    CANCELLED: 'red',
  };
  return colors[status] || 'gray';
};

export const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    UNPAID: 'orange',
    PAID: 'green',
    REFUNDED: 'blue',
    FAILED: 'red',
  };
  return colors[status] || 'gray';
};

// ===== IMAGE UTILITIES =====

export const getImageUrl = (images?: string[], fallback?: string): string => {
  if (images && images.length > 0) {
    const img = images[0];
    if (img.includes('placehold.co') || img.includes('placeholder')) {
      const lower = img.toLowerCase();
      if (lower.includes('classic+burger') || lower.includes('beef')) {
        return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
      }
      if (lower.includes('chicken+burger')) {
        return 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&q=80';
      }
      if (lower.includes('veggie')) {
        return 'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=600&q=80';
      }
      if (lower.includes('margherita')) {
        return 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80';
      }
      if (lower.includes('bbq+chicken+pizza')) {
        return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80';
      }
      if (lower.includes('carbonara')) {
        return 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80';
      }
      if (lower.includes('arrabiata')) {
        return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80';
      }
      if (lower.includes('espresso')) {
        return 'https://images.unsplash.com/photo-151097252790b-af4f982c78a2?w=600&q=80';
      }
      if (lower.includes('cappuccino')) {
        return 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80';
      }
      if (lower.includes('iced+latte') || lower.includes('caramel')) {
        return 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80';
      }
      if (lower.includes('orange') || lower.includes('juice')) {
        return 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=600&q=80';
      }
      if (lower.includes('cheesecake')) {
        return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&q=80';
      }
      if (lower.includes('tiramisu')) {
        return 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80';
      }
      if (lower.includes('salad')) {
        return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80';
      }
      if (lower.includes('lasagna')) {
        return 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&q=80';
      }
      if (lower.includes('mocha')) {
        return 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=600&q=80';
      }
      if (lower.includes('strawberry') || lower.includes('shake')) {
        return 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&q=80';
      }
      if (lower.includes('lava') || lower.includes('chocolate')) {
        return 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80';
      }
    }
    return img;
  }
  return fallback || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
};

export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallback?: string,
): void => {
  event.currentTarget.src =
    fallback || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
};

// ===== LOCAL STORAGE UTILITIES =====

export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToLocalStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export const removeFromLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
};

// ===== DEBOUNCE =====

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
