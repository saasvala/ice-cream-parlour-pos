import { useOrders, useProducts, useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { exportReportToCSV } from '@/lib/exportUtils';

const COLORS = ['hsl(200,80%,55%)', 'hsl(340,60%,65%)', 'hsl(45,90%,65%)', 'hsl(270,50%,70%)', 'hsl(160,50%,60%)', 'hsl(20,80%,70%)'];

export default function Reports() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { settings } = useSettings();

  // Daily sales (last 7 days)
  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const dayOrders = orders.filter(o => new Date(o.date).toDateString() === dateStr);
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      sales: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    };
  });

  // Flavor-wise (by product)
  const flavorData = products.slice(0, 6).map(p => {
    const sold = orders.reduce((s, o) => s + o.items.filter(i => i.productId === p.id).reduce((a, i) => a + i.qty, 0), 0);
    return { name: p.name.split(' ')[0], sold };
  });

  // Payment method breakdown
  const paymentData = (['cash', 'card', 'upi'] as const).map(mode => ({
    name: mode.toUpperCase(),
    count: orders.filter(o => o.paymentMode === mode).length,
    revenue: orders.filter(o => o.paymentMode === mode).reduce((s, o) => s + o.total, 0),
  }));

  // Top selling items
  const itemSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  orders.forEach(o => o.items.forEach(i => {
    if (!itemSales[i.productId]) itemSales[i.productId] = { name: i.name, qty: 0, revenue: 0 };
    itemSales[i.productId].qty += i.qty;
    itemSales[i.productId].revenue += i.price * i.qty;
  }));
  const topItems = Object.values(itemSales).sort((a, b) => b.qty - a.qty).slice(0, 6);

  // Profit
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCost = orders.reduce((s, o) => s + o.items.reduce((a, i) => {
    const prod = products.find(p => p.id === i.productId);
    return a + (prod?.purchasePrice || 0) * i.qty;
  }, 0), 0);
  const profit = totalRevenue - totalCost;

  // Stock data
  const stockData = products.slice(0, 8).map(p => ({ name: p.name.split(' ')[0], stock: p.stockQty, alert: p.lowStockAlert }));

  return (
    <Layout title="Reports" showBack>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="w-full rounded-xl bg-muted/50 mb-4">
          <TabsTrigger value="daily" className="flex-1 rounded-lg text-[10px]">Sales</TabsTrigger>
          <TabsTrigger value="flavor" className="flex-1 rounded-lg text-[10px]">Flavors</TabsTrigger>
          <TabsTrigger value="payment" className="flex-1 rounded-lg text-[10px]">Payment</TabsTrigger>
          <TabsTrigger value="top" className="flex-1 rounded-lg text-[10px]">Top Items</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 rounded-lg text-[10px]">Stock</TabsTrigger>
          <TabsTrigger value="profit" className="flex-1 rounded-lg text-[10px]">Profit</TabsTrigger>
        </TabsList>

        {/* Daily Sales + Trend */}
        <TabsContent value="daily">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Sales Trend (7 Days)</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(dailySales.map(d => ({ label: d.day, value: `${settings.currency}${d.sales.toFixed(0)}` })), 'Daily_Sales', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,25%,90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) => name === 'sales' ? `${settings.currency}${v}` : v} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(200,80%,55%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="orders" stroke="hsl(340,60%,65%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-4 mt-3">
            <h3 className="font-bold font-fredoka mb-3">Daily Revenue</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,25%,90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${settings.currency}${v}`} />
                <Bar dataKey="sales" fill="hsl(200,80%,55%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        {/* Flavor Sales */}
        <TabsContent value="flavor">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Flavor-wise Sales</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(flavorData.map(f => ({ label: f.name, value: f.sold })), 'Flavor_Sales', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            {flavorData.some(f => f.sold > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={flavorData} cx="50%" cy="50%" outerRadius={80} dataKey="sold" label={({ name, sold }) => `${name}: ${sold}`}>
                    {flavorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No sales data yet. Create some orders first!</p>
            )}
          </div>
        </TabsContent>

        {/* Payment Method Breakdown */}
        <TabsContent value="payment">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Payment Breakdown</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(paymentData.map(p => ({ label: p.name, value: `${p.count} orders · ${settings.currency}${p.revenue.toFixed(0)}` })), 'Payment_Breakdown', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            {orders.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" outerRadius={80} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                    {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => name === 'revenue' ? `${settings.currency}${v}` : v} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No orders yet</p>
            )}
          </div>
          {/* Payment summary cards */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {paymentData.map((p, i) => (
              <div key={p.name} className="glass-card p-3 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: COLORS[i] }} />
                <p className="text-lg font-bold font-fredoka text-primary">{p.count}</p>
                <p className="text-[9px] text-muted-foreground">{p.name}</p>
                <p className="text-[10px] font-semibold">{settings.currency}{p.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Top Selling Items */}
        <TabsContent value="top">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Top Selling Items</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(topItems.map(t => ({ label: t.name, value: `${t.qty} sold · ${settings.currency}${t.revenue.toFixed(0)}` })), 'Top_Items', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,25%,90%)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip formatter={(v: number, name: string) => name === 'revenue' ? `${settings.currency}${v}` : v} />
                  <Bar dataKey="qty" fill="hsl(200,80%,55%)" radius={[0, 6, 6, 0]} name="Qty Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground text-sm py-8">No sales data yet</p>
            )}
          </div>
          {/* Top items list */}
          <div className="space-y-2 mt-3">
            {topItems.map((item, i) => (
              <div key={item.name} className="glass-card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-primary-foreground" style={{ background: COLORS[i % COLORS.length] }}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{item.qty} sold</p>
                </div>
                <span className="font-bold text-sm text-primary">{settings.currency}{item.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Stock */}
        <TabsContent value="stock">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Stock Levels</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(
                  products.map(p => ({ label: p.name, value: `Stock: ${p.stockQty} | Alert: ${p.lowStockAlert}${p.stockQty <= p.lowStockAlert ? ' ⚠️ LOW' : ''}` })),
                  'Stock_Report', settings.storeName
                )
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stockData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,25%,90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="stock" fill="hsl(200,80%,55%)" radius={[0, 6, 6, 0]} />
                <Bar dataKey="alert" fill="hsl(0,75%,55%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Low stock alerts */}
          {products.filter(p => p.stockQty <= p.lowStockAlert).length > 0 && (
            <div className="mt-3 space-y-2">
              <h4 className="font-bold font-fredoka text-sm text-destructive">⚠️ Low Stock Alerts</h4>
              {products.filter(p => p.stockQty <= p.lowStockAlert).map(p => (
                <div key={p.id} className="glass-card p-3 flex items-center gap-3 border-l-4 border-destructive">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-destructive">Stock: {p.stockQty} (Alert: {p.lowStockAlert})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Profit */}
        <TabsContent value="profit">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV([
                  { label: 'Total Revenue', value: `${settings.currency}${totalRevenue.toFixed(0)}` },
                  { label: 'Total Cost', value: `${settings.currency}${totalCost.toFixed(0)}` },
                  { label: 'Net Profit', value: `${settings.currency}${profit.toFixed(0)}` },
                ], 'Profit_Report', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-bold font-fredoka text-gradient-ice">{settings.currency}{totalRevenue.toFixed(0)}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-3xl font-bold font-fredoka text-destructive">{settings.currency}{totalCost.toFixed(0)}</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-sm text-muted-foreground">Net Profit</p>
              <p className={`text-3xl font-bold font-fredoka ${profit >= 0 ? 'text-gradient-ice' : 'text-destructive'}`}>
                {settings.currency}{profit.toFixed(0)}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
