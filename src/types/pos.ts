export type UserRole = 'admin' | 'reseller' | 'user';

export interface Product {
  id: string;
  name: string;
  category: string;
  sku?: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  variants: string[];
  lowStockAlert: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyPoints?: number;
  totalPointsEarned?: number; // lifetime points for tier calculation
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  scoops: number;
  toppings: string[];
  price: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: 'cash' | 'card' | 'upi';
  customerId?: string;
  date: string;
  status: 'pending' | 'completed';
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  qty: number;
  cost: number;
}

export interface PurchaseEntry {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  date: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  type: 'add' | 'remove' | 'return';
  qty: number;
  reason: string;
  date: string;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  taxRate: number;
  receiptFooter: string;
  currency: string;
}
