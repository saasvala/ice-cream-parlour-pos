import { useState } from 'react';
import { useProducts, useStockAdjustments } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertTriangle, Package, RotateCcw, Plus, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportReportToCSV } from '@/lib/exportUtils';

export default function Inventory() {
  const { products, update: updateProduct } = useProducts();
  const { adjustments, add: addAdjustment } = useStockAdjustments();
  const storeName = 'Frosty Scoops';
  const { adjustments, add: addAdjustment } = useStockAdjustments();
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjProduct, setAdjProduct] = useState(products[0]?.id || '');
  const [adjType, setAdjType] = useState<'add' | 'remove' | 'return'>('add');
  const [adjQty, setAdjQty] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  const lowStock = products.filter(p => p.stockQty <= p.lowStockAlert);

  const handleAdjust = () => {
    if (!adjQty || adjQty <= 0) { toast.error('Enter valid quantity'); return; }
    const product = products.find(p => p.id === adjProduct);
    if (!product) return;

    const newQty = adjType === 'remove' ? Math.max(0, product.stockQty - adjQty) : product.stockQty + adjQty;
    updateProduct({ ...product, stockQty: newQty });
    addAdjustment({
      productId: adjProduct,
      productName: product.name,
      type: adjType,
      qty: adjQty,
      reason: adjReason,
      date: new Date().toISOString(),
    });
    toast.success('Stock adjusted');
    setShowAdjust(false);
    setAdjQty(0);
    setAdjReason('');
  };

  return (
    <Layout title="Inventory" showBack>
      <Tabs defaultValue="stock" className="w-full">
        <TabsList className="w-full rounded-xl bg-muted/50 mb-4">
          <TabsTrigger value="stock" className="flex-1 rounded-lg text-xs">Stock</TabsTrigger>
          <TabsTrigger value="low" className="flex-1 rounded-lg text-xs">Low Stock</TabsTrigger>
          <TabsTrigger value="adjust" className="flex-1 rounded-lg text-xs">Adjust</TabsTrigger>
          <TabsTrigger value="returns" className="flex-1 rounded-lg text-xs">Returns</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          <div className="flex justify-end mb-3">
            <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
              exportReportToCSV(products.map(p => ({ label: p.name, value: `Stock: ${p.stockQty} | Alert: ${p.lowStockAlert}` })), 'Stock_Levels', storeName)
            }><Download size={12} className="mr-1" />Export CSV</Button>
          </div>
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">📦</div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${p.stockQty <= p.lowStockAlert ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, (p.stockQty / (p.lowStockAlert * 5)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold">{p.stockQty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="low">
          {lowStock.length > 0 && (
            <div className="flex justify-end mb-3">
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() =>
                exportReportToCSV(lowStock.map(p => ({ label: p.name, value: `Stock: ${p.stockQty} (Alert: ${p.lowStockAlert})` })), 'Low_Stock_Alert', storeName)
              }><Download size={12} className="mr-1" />Export CSV</Button>
            </div>
          )}
          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">✅ All items well stocked</div>
          ) : (
            <div className="space-y-2">
              {lowStock.map(p => (
                <div key={p.id} className="glass-card p-3 flex items-center gap-3 border-l-4 border-destructive">
                  <AlertTriangle className="text-destructive flex-shrink-0" size={18} />
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.name}</p>
                    <p className="text-xs text-destructive">Stock: {p.stockQty} (Alert: {p.lowStockAlert})</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="adjust">
          {!showAdjust ? (
            <>
              <Button onClick={() => setShowAdjust(true)} className="w-full h-11 rounded-xl font-bold mb-4"><Plus size={18} className="mr-1" />New Adjustment</Button>
              <div className="space-y-2">
                {adjustments.slice().reverse().map(a => (
                  <div key={a.id} className="glass-card p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold">{a.productName}</span>
                      <span className={`font-bold ${a.type === 'remove' ? 'text-destructive' : 'text-primary'}`}>
                        {a.type === 'remove' ? '-' : '+'}{a.qty}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.reason} · {new Date(a.date).toLocaleDateString()}</p>
                  </div>
                ))}
                {adjustments.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">No adjustments yet</p>}
              </div>
            </>
          ) : (
            <div className="glass-card p-5 animate-scale-in">
              <div className="flex justify-between mb-4">
                <h2 className="font-bold font-fredoka">Stock Adjustment</h2>
                <button onClick={() => setShowAdjust(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <select value={adjProduct} onChange={e => setAdjProduct(e.target.value)} className="w-full h-10 rounded-xl bg-muted/50 border border-border px-3 text-sm">
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQty})</option>)}
                </select>
                <div className="flex gap-2">
                  {(['add', 'remove', 'return'] as const).map(t => (
                    <button key={t} onClick={() => setAdjType(t)} className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize ${adjType === t ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>{t}</button>
                  ))}
                </div>
                <Input type="number" value={adjQty || ''} onChange={e => setAdjQty(Number(e.target.value))} placeholder="Quantity" className="h-10 rounded-xl bg-muted/50" />
                <Input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Reason" className="h-10 rounded-xl bg-muted/50" />
                <Button onClick={handleAdjust} className="w-full h-11 rounded-xl font-bold">Apply Adjustment</Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="returns">
          <div className="space-y-2">
            {adjustments.filter(a => a.type === 'return').map(a => (
              <div key={a.id} className="glass-card p-3 flex items-center gap-3">
                <RotateCcw className="text-ice-mint flex-shrink-0" size={18} />
                <div className="flex-1">
                  <p className="font-bold text-sm">{a.productName}</p>
                  <p className="text-xs text-muted-foreground">Qty: {a.qty} · {a.reason}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            ))}
            {adjustments.filter(a => a.type === 'return').length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No returns recorded</p>}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
