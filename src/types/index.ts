export type UserRole = 
  | 'customer'
  | 'super_admin'
  | 'product_manager'
  | 'inventory_manager'
  | 'order_manager'
  | 'customer_support';

export interface BangladeshAddress {
  division: string;
  district: string;
  upazila: string;
  address: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  addresses: BangladeshAddress[];
  createdAt: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  categoryId: string;
  brandId: string;
  costPrice: number;
  sellingPrice: number;
  originalPrice?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isArchived: boolean;
  isFeatured: boolean;
  warranty: string;
  returnPolicy: string;
  descriptionEn: string;
  descriptionBn: string;
  specifications: ProductSpecification[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameBn: string;
  slug: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 
  | 'cod'
  | 'bkash'
  | 'nagad'
  | 'rocket'
  | 'bank_transfer';

export type PaymentStatus = 
  | 'pending'
  | 'verified'
  | 'failed'
  | 'refunded';

export interface OrderItem {
  productId: string;
  sku: string;
  nameEn: string;
  nameBn: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderAuditLog {
  status: OrderStatus;
  updatedBy: string;
  note: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: BangladeshAddress;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: {
    transactionId?: string;
    senderNumber?: string;
    bankReference?: string;
  };
  orderStatus: OrderStatus;
  cancellationReason?: string;
  trackingNumber?: string;
  courierName?: string;
  notes?: string;
  auditLog: OrderAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productSku: string;
  productName: string;
  adminId: string;
  adminName: string;
  changeType: 'stock_in' | 'stock_out' | 'order_reserve' | 'order_cancel_return' | 'manual_adjustment';
  quantityChange: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  orderId?: string;
  timestamp: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiryDate: string;
  usageCount: number;
  isActive: boolean;
}

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface SupportMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  replyText?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeNameEn: string;
  storeNameBn: string;
  phone: string;
  email: string;
  showroomAddressEn: string;
  showroomAddressBn: string;
  shippingInsideDhaka: number;
  shippingOutsideDhaka: number;
  freeShippingThreshold: number;
  bkashMerchantNumber: string;
  nagadMerchantNumber: string;
  rocketMerchantNumber: string;
  bankDetails: string;
  allowCod: boolean;
  warrantyPolicyEn: string;
  warrantyPolicyBn: string;
  returnPolicyEn: string;
  returnPolicyBn: string;
}
