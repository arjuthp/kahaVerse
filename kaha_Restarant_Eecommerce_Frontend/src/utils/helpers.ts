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
  if (images && images.length > 0) return images[0];
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
