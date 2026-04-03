import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, useOrders, useProducts, useCustomers } from '@/store/useStore';
import Layout from '@/components/Layout';
import { LOYALTY_TIERS, getTier } from '@/lib/loyalty';
import {
  ShoppingCart, IceCream, LayoutGrid, Users, Truck, Package,
  BarChart3, Settings, TrendingUp, Star, AlertTriangle, Clock,
  Plus, LogOut, Trophy, Award, Bot
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { hasValidSession, logout, role } = useAuth();
  const { orders } = useOrders();
  const { products } = useProducts();
  const { customers } = useCustomers();

  if (!hasValidSession) { return <Navigate to="/login" replace />; }

  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);
  const todaySales = todayOrders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockItems = products.filter(p => p.stockQty <= p.lowStockAlert).length;

  const tierDistribution = LOYALTY_TIERS.map(tier => ({
    ...tier,
    count: customers.filter(c => getTier(c.totalPointsEarned || 0).name === tier.name).length,
  }));

  const topCustomers = [...customers]
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0))
    .slice(0, 5);

  const stats = [
    { label: 'Today Sales', value: `₹${todaySales.toLocaleString()}`, icon: TrendingUp, color: 'bg-primary/10 text-primary' },
    { label: 'Top Flavors', value: '5 Active', icon: Star, color: 'bg-ice-vanilla/30 text-accent-foreground' },
    { label: 'Low Stock', value: `${lowStockItems} Items`, icon: AlertTriangle, color: 'bg-destructive/10 text-destructive' },
    { label: 'Pending', value: `${pendingOrders} Orders`, icon: Clock, color: 'bg-ice-lavender/30 text-foreground' },
  ];

  const menu = [
    { label: 'New Sale', path: '/new-sale', emoji: '🛒' },
    { label: 'Products', path: '/products', emoji: '🍦' },
    { label: 'Categories', path: '/categories', emoji: '📂' },
    { label: 'Customers', path: '/customers', emoji: '👥' },
    { label: 'Suppliers', path: '/suppliers', emoji: '🚚' },
    { label: 'Purchase', path: '/purchase', emoji: '📦' },
    { label: 'Inventory', path: '/inventory', emoji: '📊' },
    { label: 'Reports', path: '/reports', emoji: '📈' },
    { label: 'Orders', path: '/orders', emoji: '📋' },
    { label: 'Settings', path: '/settings', emoji: '⚙️' },
    { label: 'Vala Builder', path: '/vala-builder', emoji: '🤖' },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-fredoka font-bold text-gradient-ice">Frosty Scoops</h1>
          <p className="text-sm text-muted-foreground">Dashboard · {roleLabel}</p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} className="p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
          <LogOut size={18} className="text-muted-foreground" />
        </button>
      </div>

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

      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {[
          { label: 'New Sale', icon: ShoppingCart, path: '/new-sale', accent: 'bg-primary text-primary-foreground' },
          { label: 'View Orders', icon: Clock, path: '/orders', accent: 'bg-accent text-accent-foreground' },
          { label: 'Add Product', icon: Plus, path: '/products?add=true', accent: 'bg-secondary text-secondary-foreground' },
          { label: 'Reports', icon: BarChart3, path: '/reports', accent: 'bg-muted text-foreground' },
          { label: 'Vala Builder', icon: Bot, path: '/vala-builder', accent: 'bg-ice-lavender/40 text-foreground' },
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

      <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">Loyalty Rewards</h2>

      <div className="glass-card-hover p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award size={16} className="text-primary" />
          <span className="text-sm font-semibold">Tier Distribution</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tierDistribution.map((tier) => (
            <div key={tier.name} className="bg-background/50 rounded-lg p-2.5 text-center">
              <div className="text-lg mb-1">{tier.icon}</div>
              <p className="text-xs font-semibold">{tier.name}</p>
              <p className="text-sm font-bold text-primary">{tier.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card-hover p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-primary" />
          <span className="text-sm font-semibold">Top Customers</span>
        </div>
        <div className="space-y-2">
          {topCustomers.length > 0 ? (
            topCustomers.map((customer) => {
              const tier = getTier(customer.totalPointsEarned || 0);
              return (
                <div key={customer.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{tier.icon}</span>
                    <span className="font-medium truncate text-xs">{customer.name}</span>
                  </div>
                  <span className="font-bold text-primary text-xs">{customer.loyaltyPoints || 0}pts</span>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No customers yet</p>
          )}
        </div>
      </div>

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
