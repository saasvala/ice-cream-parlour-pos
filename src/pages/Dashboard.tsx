import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, useOrders, useProducts } from '@/store/useStore';
import Layout from '@/components/Layout';
import { 
  ShoppingCart, IceCream, LayoutGrid, Users, Truck, Package, 
  BarChart3, Settings, TrendingUp, Star, AlertTriangle, Clock,
  Plus, LogOut
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const { orders } = useOrders();
  const { products } = useProducts();

  if (!isLoggedIn) { return <Navigate to="/login" replace />; }

  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockItems = products.filter(p => p.stockQty <= p.lowStockAlert).length;

  const stats = [
    { label: 'Today Sales', value: `₹${todaySales.toLocaleString()}`, icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { label: 'Top Flavors', value: '5 Active', icon: Star, color: 'bg-ice-vanilla/30 text-accent-foreground' },
    { label: 'Low Stock', value: `${lowStockItems} Items`, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Pending', value: `${pendingOrders} Orders`, icon: Clock, color: 'bg-ice-lavender/30 text-foreground' },
  ];

  const menu = [
    { label: 'New Sale', icon: ShoppingCart, path: '/new-sale', emoji: '🛒' },
    { label: 'Products', icon: IceCream, path: '/products', emoji: '🍦' },
    { label: 'Categories', icon: LayoutGrid, path: '/categories', emoji: '📂' },
    { label: 'Customers', icon: Users, path: '/customers', emoji: '👥' },
    { label: 'Suppliers', icon: Truck, path: '/suppliers', emoji: '🚚' },
    { label: 'Purchase', icon: Package, path: '/purchase', emoji: '📦' },
    { label: 'Inventory', icon: Package, path: '/inventory', emoji: '📊' },
    { label: 'Reports', icon: BarChart3, path: '/reports', emoji: '📈' },
    { label: 'Orders', icon: Clock, path: '/orders', emoji: '📋' },
    { label: 'Settings', icon: Settings, path: '/settings', emoji: '⚙️' },
  ];

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-fredoka font-bold text-gradient-ice">Frosty Scoops</h1>
          <p className="text-sm text-muted-foreground">Dashboard</p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <LogOut size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="glass-card-hover p-4 cursor-pointer" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-2`}>
              <s.icon size={20} />
            </div>
            <p className="text-lg font-bold font-fredoka">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu Grid */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Menu</h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {menu.map((m, i) => (
          <button
            key={i}
            onClick={() => navigate(m.path)}
            className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center active:scale-95 transition-transform"
          >
            <span className="text-3xl">{m.emoji}</span>
            <span className="text-xs font-semibold">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Quick Shortcuts Bar */}
      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {[
          { label: 'New Sale', icon: ShoppingCart, path: '/new-sale', accent: 'bg-primary text-primary-foreground' },
          { label: 'View Orders', icon: Clock, path: '/orders', accent: 'bg-accent text-accent-foreground' },
          { label: 'Add Product', icon: Plus, path: '/products?add=true', accent: 'bg-secondary text-secondary-foreground' },
          { label: 'Reports', icon: BarChart3, path: '/reports', accent: 'bg-muted text-foreground' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-semibold text-sm whitespace-nowrap shadow-md active:scale-95 transition-transform ${action.accent}`}
          >
            <action.icon size={16} />
            {action.label}
          </button>
        ))}
      </div>

      {/* Floating New Sale Button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4">
        <button
          onClick={() => navigate('/new-sale')}
          className="h-12 px-8 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          🍦 Scoop Sale
        </button>
      </div>
    </Layout>
  );
}
