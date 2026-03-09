import { useState, useEffect, useCallback } from 'react';
import type { Product, Category, Customer, Supplier, Order, PurchaseEntry, StockAdjustment, StoreSettings } from '@/types/pos';

function getLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function setLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Default data
const defaultCategories: Category[] = [
  { id: '1', name: 'Ice Cream', icon: '🍦', color: 'hsl(200 80% 55%)' },
  { id: '2', name: 'Sundae', icon: '🍨', color: 'hsl(340 60% 65%)' },
  { id: '3', name: 'Shake', icon: '🥤', color: 'hsl(270 50% 70%)' },
  { id: '4', name: 'Cone', icon: '🍧', color: 'hsl(45 90% 65%)' },
];

const defaultProducts: Product[] = [
  { id: '1', name: 'Vanilla Classic', category: '1', purchasePrice: 30, sellingPrice: 60, stockQty: 50, variants: ['Single', 'Double'], lowStockAlert: 10, image: '' },
  { id: '2', name: 'Chocolate Fudge', category: '1', purchasePrice: 35, sellingPrice: 70, stockQty: 45, variants: ['Single', 'Double'], lowStockAlert: 10, image: '' },
  { id: '3', name: 'Strawberry Bliss', category: '1', purchasePrice: 35, sellingPrice: 70, stockQty: 40, variants: ['Single', 'Double'], lowStockAlert: 10, image: '' },
  { id: '4', name: 'Mango Tango', category: '1', purchasePrice: 40, sellingPrice: 80, stockQty: 35, variants: ['Single', 'Double'], lowStockAlert: 10, image: '' },
  { id: '5', name: 'Butterscotch', category: '1', purchasePrice: 35, sellingPrice: 65, stockQty: 30, variants: ['Single', 'Double'], lowStockAlert: 10, image: '' },
  { id: '6', name: 'Hot Fudge Sundae', category: '2', purchasePrice: 50, sellingPrice: 120, stockQty: 25, variants: ['Regular', 'Large'], lowStockAlert: 5, image: '' },
  { id: '7', name: 'Banana Split', category: '2', purchasePrice: 60, sellingPrice: 140, stockQty: 20, variants: ['Regular'], lowStockAlert: 5, image: '' },
  { id: '8', name: 'Chocolate Shake', category: '3', purchasePrice: 40, sellingPrice: 90, stockQty: 30, variants: ['Medium', 'Large'], lowStockAlert: 8, image: '' },
  { id: '9', name: 'Vanilla Shake', category: '3', purchasePrice: 35, sellingPrice: 80, stockQty: 35, variants: ['Medium', 'Large'], lowStockAlert: 8, image: '' },
  { id: '10', name: 'Waffle Cone', category: '4', purchasePrice: 25, sellingPrice: 50, stockQty: 60, variants: ['Small', 'Large'], lowStockAlert: 15, image: '' },
];

const defaultCustomers: Customer[] = [
  { id: 'c1', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@email.com' },
  { id: 'c2', name: 'Priya Patel', phone: '+91 87654 32109', email: 'priya@email.com' },
  { id: 'c3', name: 'Amit Kumar', phone: '+91 76543 21098', email: '' },
  { id: 'c4', name: 'Sneha Gupta', phone: '+91 65432 10987', email: 'sneha@email.com' },
  { id: 'c5', name: 'Vikram Singh', phone: '+91 54321 09876', email: '' },
];

const defaultSuppliers: Supplier[] = [
  { id: 's1', name: 'Amul Dairy', phone: '+91 98001 12233', email: 'supply@amul.com', company: 'Amul India' },
  { id: 's2', name: 'Mother Dairy', phone: '+91 97002 23344', email: 'orders@motherdairy.com', company: 'Mother Dairy' },
  { id: 's3', name: 'Kwality Walls', phone: '+91 96003 34455', email: 'kwality@hul.com', company: 'HUL' },
];

// Generate demo orders for last 7 days
function generateDemoOrders(): Order[] {
  const orders: Order[] = [];
  const now = new Date();
  for (let day = 0; day < 7; day++) {
    const d = new Date(now);
    d.setDate(d.getDate() - day);
    const numOrders = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < numOrders; i++) {
      const items = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numItems; j++) {
        const prod = defaultProducts[Math.floor(Math.random() * defaultProducts.length)];
        items.push({
          productId: prod.id,
          name: prod.name,
          qty: Math.floor(Math.random() * 3) + 1,
          scoops: Math.floor(Math.random() * 2) + 1,
          toppings: ['Sprinkles', 'Chocolate Sauce'].slice(0, Math.floor(Math.random() * 3)),
          price: prod.sellingPrice,
        });
      }
      const subtotal = items.reduce((s, it) => s + it.price * it.qty, 0);
      const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0;
      const tax = subtotal * 0.05;
      const total = subtotal + tax - discount;
      const custId = defaultCustomers[Math.floor(Math.random() * defaultCustomers.length)].id;
      d.setHours(Math.floor(Math.random() * 10) + 9, Math.floor(Math.random() * 60));
      orders.push({
        id: uid(),
        items,
        subtotal,
        discount,
        tax,
        total,
        paymentMode: (['cash', 'card', 'upi'] as const)[Math.floor(Math.random() * 3)],
        customerId: custId,
        date: d.toISOString(),
        status: 'completed',
      });
    }
  }
  return orders;
}

const defaultSettings: StoreSettings = {
  storeName: 'Frosty Scoops',
  storePhone: '+91 98765 43210',
  storeAddress: '123, Ice Cream Lane, Sweet City',
  taxRate: 5,
  receiptFooter: 'Thank you! Visit again 🍦',
  currency: '₹',
};

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => getLS('pos_products', defaultProducts));
  useEffect(() => setLS('pos_products', products), [products]);
  const add = useCallback((p: Omit<Product, 'id'>) => setProducts(prev => [...prev, { ...p, id: uid() }]), []);
  const update = useCallback((p: Product) => setProducts(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const remove = useCallback((id: string) => setProducts(prev => prev.filter(x => x.id !== id)), []);
  const deductStock = useCallback((productId: string, qty: number) => {
    setProducts(prev => prev.map(x => x.id === productId ? { ...x, stockQty: Math.max(0, x.stockQty - qty) } : x));
  }, []);
  const addStock = useCallback((productId: string, qty: number) => {
    setProducts(prev => prev.map(x => x.id === productId ? { ...x, stockQty: x.stockQty + qty } : x));
  }, []);
  return { products, add, update, remove, setProducts, deductStock, addStock };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(() => getLS('pos_categories', defaultCategories));
  useEffect(() => setLS('pos_categories', categories), [categories]);
  const add = useCallback((c: Omit<Category, 'id'>) => setCategories(prev => [...prev, { ...c, id: uid() }]), []);
  const update = useCallback((c: Category) => setCategories(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const remove = useCallback((id: string) => setCategories(prev => prev.filter(x => x.id !== id)), []);
  return { categories, add, update, remove };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>(() => getLS('pos_customers', defaultCustomers));
  useEffect(() => setLS('pos_customers', customers), [customers]);
  const add = useCallback((c: Omit<Customer, 'id'>) => setCustomers(prev => [...prev, { ...c, loyaltyPoints: 0, totalPointsEarned: 0, id: uid() }]), []);
  const update = useCallback((c: Customer) => setCustomers(prev => prev.map(x => x.id === c.id ? c : x)), []);
  const remove = useCallback((id: string) => setCustomers(prev => prev.filter(x => x.id !== id)), []);
  const addLoyaltyPoints = useCallback((customerId: string, points: number) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? {
      ...c,
      loyaltyPoints: (c.loyaltyPoints || 0) + points,
      totalPointsEarned: (c.totalPointsEarned || 0) + points,
    } : c));
  }, []);
  const redeemLoyaltyPoints = useCallback((customerId: string, points: number) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, loyaltyPoints: Math.max(0, (c.loyaltyPoints || 0) - points) } : c));
  }, []);
  return { customers, add, update, remove, addLoyaltyPoints, redeemLoyaltyPoints };
}

export function useLoyaltyHistory() {
  const [history, setHistory] = useState<import('@/lib/loyalty').LoyaltyEvent[]>(() => getLS('pos_loyalty_history', []));
  useEffect(() => setLS('pos_loyalty_history', history), [history]);
  const addEvent = useCallback((event: Omit<import('@/lib/loyalty').LoyaltyEvent, 'id'>) => {
    setHistory(prev => [...prev, { ...event, id: uid() }]);
  }, []);
  const getCustomerHistory = useCallback((customerId: string) => {
    return history.filter(e => e.customerId === customerId);
  }, [history]);
  return { history, addEvent, getCustomerHistory };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getLS('pos_suppliers', defaultSuppliers));
  useEffect(() => setLS('pos_suppliers', suppliers), [suppliers]);
  const add = useCallback((s: Omit<Supplier, 'id'>) => setSuppliers(prev => [...prev, { ...s, id: uid() }]), []);
  const update = useCallback((s: Supplier) => setSuppliers(prev => prev.map(x => x.id === s.id ? s : x)), []);
  const remove = useCallback((id: string) => setSuppliers(prev => prev.filter(x => x.id !== id)), []);
  return { suppliers, add, update, remove };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>(() => getLS('pos_orders', generateDemoOrders()));
  useEffect(() => setLS('pos_orders', orders), [orders]);
  const add = useCallback((o: Omit<Order, 'id'>) => { const order = { ...o, id: uid() }; setOrders(prev => [...prev, order]); return order; }, []);
  const update = useCallback((o: Order) => setOrders(prev => prev.map(x => x.id === o.id ? o : x)), []);
  return { orders, add, update };
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<PurchaseEntry[]>(() => getLS('pos_purchases', []));
  useEffect(() => setLS('pos_purchases', purchases), [purchases]);
  const add = useCallback((p: Omit<PurchaseEntry, 'id'>) => setPurchases(prev => [...prev, { ...p, id: uid() }]), []);
  const update = useCallback((p: PurchaseEntry) => setPurchases(prev => prev.map(x => x.id === p.id ? p : x)), []);
  const remove = useCallback((id: string) => setPurchases(prev => prev.filter(x => x.id !== id)), []);
  return { purchases, add, update, remove };
}

export function useStockAdjustments() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>(() => getLS('pos_adjustments', []));
  useEffect(() => setLS('pos_adjustments', adjustments), [adjustments]);
  const add = useCallback((a: Omit<StockAdjustment, 'id'>) => setAdjustments(prev => [...prev, { ...a, id: uid() }]), []);
  return { adjustments, add };
}

export function useSettings() {
  const [settings, setSettings] = useState<StoreSettings>(() => getLS('pos_settings', defaultSettings));
  useEffect(() => setLS('pos_settings', settings), [settings]);
  return { settings, setSettings };
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getLS('pos_logged_in', false));
  const [isLicensed, setIsLicensed] = useState(() => getLS('pos_licensed', false));
  useEffect(() => setLS('pos_logged_in', isLoggedIn), [isLoggedIn]);
  useEffect(() => setLS('pos_licensed', isLicensed), [isLicensed]);
  const login = useCallback(() => { setIsLoggedIn(true); setLS('pos_logged_in', true); }, []);
  const logout = useCallback(() => { setIsLoggedIn(false); setLS('pos_logged_in', false); }, []);
  const activate = useCallback(() => { setIsLicensed(true); setLS('pos_licensed', true); }, []);
  return { isLoggedIn, isLicensed, login, logout, activate };
}
