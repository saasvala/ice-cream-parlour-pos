import { useOrders, useProducts, useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
    };
  });

  // Flavor-wise (by product)
  const flavorData = products.slice(0, 6).map(p => {
    const sold = orders.reduce((s, o) => s + o.items.filter(i => i.productId === p.id).reduce((a, i) => a + i.qty, 0), 0);
    return { name: p.name.split(' ')[0], sold };
  });

  // Profit
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCost = orders.reduce((s, o) => s + o.items.reduce((a, i) => {
    const prod = products.find(p => p.id === i.productId);
    return a + (prod?.purchasePrice || 0) * i.qty;
  }, 0), 0);
  const profit = totalRevenue - totalCost;

  return (
    <Layout title="Reports" showBack>
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="w-full rounded-xl bg-muted/50 mb-4">
          <TabsTrigger value="daily" className="flex-1 rounded-lg text-xs">Daily</TabsTrigger>
          <TabsTrigger value="flavor" className="flex-1 rounded-lg text-xs">Flavors</TabsTrigger>
          <TabsTrigger value="stock" className="flex-1 rounded-lg text-xs">Stock</TabsTrigger>
          <TabsTrigger value="profit" className="flex-1 rounded-lg text-xs">Profit</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <div className="glass-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold font-fredoka">Daily Sales (Last 7 Days)</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(dailySales.map(d => ({ label: d.day, value: `${settings.currency}${d.sales.toFixed(0)}` })), 'Daily_Sales', settings.storeName)
              }><Download size={12} className="mr-1" />CSV</Button>
            </div>
            <ResponsiveContainer width="100%" height={220}>
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

        <TabsContent value="flavor">
          <div className="glass-card p-4">
            <h3 className="font-bold font-fredoka mb-3">Flavor-wise Sales</h3>
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

        <TabsContent value="stock">
          <div className="glass-card p-4">
            <h3 className="font-bold font-fredoka mb-3">Stock Levels</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={products.slice(0, 8).map(p => ({ name: p.name.split(' ')[0], stock: p.stockQty, alert: p.lowStockAlert }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,25%,90%)" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={60} />
                <Tooltip />
                <Bar dataKey="stock" fill="hsl(200,80%,55%)" radius={[0, 6, 6, 0]} />
                <Bar dataKey="alert" fill="hsl(0,75%,55%)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="profit">
          <div className="space-y-3">
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
