import { useState } from 'react';
import { usePurchases, useProducts, useSuppliers } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X, Save } from 'lucide-react';
import type { PurchaseItem } from '@/types/pos';
import { toast } from 'sonner';

export default function Purchase() {
  const { purchases, add, remove } = usePurchases();
  const { products, addStock } = useProducts();
  const { suppliers } = useSuppliers();
  const [showForm, setShowForm] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const addItem = () => setItems(prev => [...prev, { productId: products[0]?.id || '', productName: products[0]?.name || '', qty: 1, cost: products[0]?.purchasePrice || 0 }]);

  const updateItem = (idx: number, field: string, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      if (field === 'productId') {
        const p = products.find(p => p.id === value);
        return { ...item, productId: value, productName: p?.name || '', cost: p?.purchasePrice || 0 };
      }
      return { ...item, [field]: value };
    }));
  };

  const handleSave = () => {
    if (!supplierId) { toast.error('Select a supplier'); return; }
    if (items.length === 0) { toast.error('Add at least one item'); return; }
    const supplier = suppliers.find(s => s.id === supplierId);
    
    // Add stock for each purchased item
    items.forEach(item => {
      addStock(item.productId, item.qty);
    });
    
    add({
      supplierId,
      supplierName: supplier?.name || 'Unknown',
      items,
      total: items.reduce((s, i) => s + i.qty * i.cost, 0),
      date: new Date().toISOString(),
    });
    toast.success('Purchase saved & stock updated! 📦');
    setShowForm(false);
    setItems([]);
    setSupplierId('');
  };

  return (
    <Layout title="Purchase" showBack>
      {!showForm ? (
        <>
          <Button onClick={() => setShowForm(true)} className="w-full h-11 rounded-xl font-bold mb-4"><Plus size={18} className="mr-1" />Create Purchase</Button>
          <div className="space-y-2">
            {purchases.map(p => (
              <div key={p.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-ice-peach/20 flex items-center justify-center text-xl">📦</div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{p.supplierName}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString()} · {p.items.length} items</p>
                </div>
                <p className="font-bold text-sm">₹{p.total}</p>
                <button onClick={() => { remove(p.id); toast.success('Deleted'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
            {purchases.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No purchases yet</p>}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold font-fredoka text-lg">New Purchase</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Supplier</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full h-10 rounded-xl bg-muted/50 border border-border px-3 text-sm">
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-muted/30 rounded-xl p-3 space-y-2">
                  <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="w-full h-9 rounded-lg bg-background border border-border px-2 text-sm">
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} placeholder="Qty" className="h-9 rounded-lg text-sm" />
                    <Input type="number" value={item.cost} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} placeholder="Cost" className="h-9 rounded-lg text-sm" />
                  </div>
                  <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-destructive font-medium">Remove</button>
                </div>
              ))}
            </div>

            <Button onClick={addItem} variant="outline" className="w-full h-10 rounded-xl"><Plus size={16} className="mr-1" />Add Item</Button>
            
            <div className="text-right font-bold text-lg pt-2">
              Total: ₹{items.reduce((s, i) => s + i.qty * i.cost, 0)}
            </div>

            <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold"><Save size={18} className="mr-1" />Save Purchase</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
