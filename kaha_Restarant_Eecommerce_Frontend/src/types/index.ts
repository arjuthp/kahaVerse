// ===== ENUMS =====

export enum AddonSelectionTypeEnum {
  SINGLE = 'single',
  MULTI = 'multi',
}

export enum OrderStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum ServiceTypeEnum {
  DINE_IN = 'DINE_IN',
  DELIVERY = 'DELIVERY',
  TAKEAWAY = 'TAKEAWAY',
}

export enum PaymentMethodEnum {
  CASH = 'CASH',
  CARD = 'CARD',
  WALLET = 'WALLET',
  ONLINE = 'ONLINE',
  COD = 'COD',
}

export enum PaymentStatusEnum {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export enum UserRoleEnum {
  USER = 'user',
  ADMIN = 'admin',
  BUSINESS_SUPER_ADMIN = 'business_super_admin',
  SUPER_ADMIN = 'super_admin',
}

// ===== CATEGORY =====

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  businessId: string;
  parentId?: string;
  isActive: boolean;
  position: number;
  children?: Category[];
}

// ===== MENU =====

export interface MenuVariant {
  id: string;
  name: string; // e.g., "Small", "Regular", "Large"
  price: number | string; // API returns string e.g. "450.00"
  isAvailable: boolean;
  sortOrder?: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number | string; // API may return string
  description?: string;
  coverImg?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface AddonGroup {
  id: string;
  name: string;
  businessId?: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect?: number;
  selectionType: AddonSelectionTypeEnum;
  isActive?: boolean;
  addons: Addon[];
}

// Lightweight addon info returned in menu list endpoint
export interface AddonInfo {
  id: string;
  name: string;
  isRequired: boolean;
}

// Alias for addon type to avoid confusion
export type MenuAddon = Addon;

export interface Menu {
  id: string;
  name: string;
  description?: string;
  image?: string;
  images?: string[];
  details?: Record<string, string>;
  isAvailable: boolean;
  isSignature: boolean;
  isBarItem?: boolean;
  allowAddOns?: boolean;
  price: number | string; // API returns string e.g. "450.00"
  discountedPrice?: number | string;
  categoryId?: string;
  businessId: string;
  services?: string[];
  variants?: MenuVariant[];   // Only present when fetched individually
  addonGroups?: AddonGroup[]; // Only present when fetched individually
  addonsInfo?: AddonInfo[];   // Present in list view
  averageRating?: number;
  category?: Category;
  createdAt?: string;
  updatedAt?: string;
}

// ===== CART =====

export interface CartItemAddon {
  id: string;
  quantity: number;
  addon: Addon;
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPriceSnapshot: number;
  specialInstructions?: string;
  menu: Menu;
  menuVariant?: MenuVariant;
  addOns: CartItemAddon[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Cart {
  id: string;
  userId: string;
  businessId: string;
  cartItems: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AddToCartDto {
  menuId: string;
  menuVariantId?: string;
  quantity: number;
  specialInstructions?: string;
  addonInfo?: { addonsId: string; quantity: number }[];
}

// ===== ORDER =====

export interface OrderItemAddon {
  id: string;
  quantity: number;
  addonNameSnapshot: string;
  priceSnapshot: number;
  addon?: Addon;
}

export interface OrderItem {
  id: string;
  quantity: number;
  menuNameSnapshot: string;
  variantNameSnapshot?: string;
  unitPriceSnapshot: number;
  addonsTotal: number;
  lineTotal: number;
  specialInstructions?: string;
  menu?: Menu;
  menuVariant?: MenuVariant;
  addons: OrderItemAddon[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatusHistory {
  id: string;
  status: OrderStatusEnum;
  remarks?: string;
  updatedBy: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  serviceType: ServiceTypeEnum;
  tableNumber?: string;
  subtotal: number;
  taxAmount: number;
  deliveryFee: number;
  serviceCharge: number;
  discountAmount: number;
  tipAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatusEnum;
  paymentMethod?: PaymentMethodEnum;
  remarks?: string;
  orderItems: OrderItem[];
  orderStatus: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
  userInfo?: {
    name: string;
    email: string;
    contact: string;
    avatar: string;
  };
}

export interface CreateOrderDto {
  businessId: string;
  serviceType: ServiceTypeEnum;
  tableNumber?: string;
  remarks?: string;
  paymentMethod?: PaymentMethodEnum;
  deliveryFee?: number;
  serviceCharge?: number;
  tipAmount?: number;
  discountAmount?: number;
  orderItems: {
    menuId: string;
    menuVariantId?: string;
    quantity: number;
    itemAddons?: { addonId: string; quantity: number }[];
  }[];
}

export interface CreateOrderFromCartDto {
  businessId: string;
  serviceType: ServiceTypeEnum;
  tableNumber?: string;
  remarks?: string;
  paymentMethod?: PaymentMethodEnum;
  cartItemIds?: string[];
  deliveryFee?: number;
  serviceCharge?: number;
  tipAmount?: number;
  discountAmount?: number;
}

export interface PlaceOrderDto extends CreateOrderFromCartDto {
  cartId?: string;
}

// ===== RATING =====

export interface MenuRating {
  id: string;
  menuId: string;
  businessId: string;
  orderItemId: string;
  rating: number;
  review?: string;
  isVisible: boolean;
  ratedBy: string;
  createdAt: string;
}

export interface CreateRatingDto {
  businessId: string;
  menuId: string;
  orderItemId: string;
  rating: number;
  review?: string;
}

// ===== AUTH =====

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRoleEnum;
  businessId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ===== API =====

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

export interface PaginatedResponse<T> {
  metaData: PaginationMeta;
  data: T[];
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
