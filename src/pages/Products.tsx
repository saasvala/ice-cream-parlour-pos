import { useState } from 'react';
import { useProducts, useCategories } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import type { Product } from '@/types/pos';
import { toast } from 'sonner';

const emptyProduct: Omit<Product, 'id'> = {
  name: '', category: '', purchasePrice: 0, sellingPrice: 0, stockQty: 0,
  variants: [], lowStockAlert: 10, sku: '', image: ''
};

export default function Products() {
  const { products, add, update, remove } = useProducts();
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [variantInput, setVariantInput] = useState('');

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ ...emptyProduct, category: categories[0]?.id || '' }); setEditing(null); setShowForm(true); };
  const openEdit = (p: Product) => { setForm(p); setEditing(p); setShowForm(true); setVariantInput(''); };
  
  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Product name required'); return; }
    if (editing) { update({ ...editing, ...form }); toast.success('Product updated'); }
    else { add(form); toast.success('Product added'); }
    setShowForm(false);
  };

  const handleDelete = (id: string) => { remove(id); toast.success('Product deleted'); };

  const addVariant = () => {
    if (!variantInput.trim()) return;
    setForm(f => ({ ...f, variants: [...f.variants, variantInput.trim()] }));
    setVariantInput('');
  };

  return (
    <Layout title="Products" showBack>
      {!showForm ? (
        <>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 h-10 rounded-xl bg-muted/50" />
            </div>
            <Button onClick={openAdd} className="h-10 rounded-xl"><Plus size={18} /></Button>
          </div>

          <div className="space-y-2">
            {filtered.map(p => {
              const cat = categories.find(c => c.id === p.category);
              return (
                <div key={p.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">🍦</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{cat?.icon} {cat?.name} · Stock: {p.stockQty}</p>
                    <p className="text-sm font-bold text-primary">₹{p.sellingPrice}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No products found</p>}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold font-fredoka text-lg">{editing ? 'Edit' : 'Add'} Product</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Product Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 rounded-xl bg-muted/50" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 rounded-xl bg-muted/50 border border-border px-3 text-sm"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">SKU / Barcode</label>
              <Input value={form.sku || ''} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="h-10 rounded-xl bg-muted/50" placeholder="Optional" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Purchase Price</label>
                <Input type="number" value={form.purchasePrice || ''} onChange={e => setForm(f => ({ ...f, purchasePrice: Number(e.target.value) }))} className="h-10 rounded-xl bg-muted/50" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Selling Price</label>
                <Input type="number" value={form.sellingPrice || ''} onChange={e => setForm(f => ({ ...f, sellingPrice: Number(e.target.value) }))} className="h-10 rounded-xl bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Stock Qty</label>
                <Input type="number" value={form.stockQty || ''} onChange={e => setForm(f => ({ ...f, stockQty: Number(e.target.value) }))} className="h-10 rounded-xl bg-muted/50" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Low Stock Alert</label>
                <Input type="number" value={form.lowStockAlert || ''} onChange={e => setForm(f => ({ ...f, lowStockAlert: Number(e.target.value) }))} className="h-10 rounded-xl bg-muted/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Variants</label>
              <div className="flex gap-2">
                <Input value={variantInput} onChange={e => setVariantInput(e.target.value)} className="h-10 rounded-xl bg-muted/50" placeholder="e.g. Single Scoop" />
                <Button onClick={addVariant} variant="outline" className="h-10 rounded-xl"><Plus size={16} /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.variants.map((v, i) => (
                  <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    {v}
                    <button onClick={() => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))}><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold mt-2">
              {editing ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
