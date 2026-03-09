import { useState } from 'react';
import { useCustomers, useOrders } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, X, Search, History, Star } from 'lucide-react';
import type { Customer } from '@/types/pos';
import { toast } from 'sonner';

export default function Customers() {
  const { customers, add, update, remove } = useCustomers();
  const { orders } = useOrders();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; email?: string }>({ name: '', phone: '', email: '' });
  const [viewHistory, setViewHistory] = useState<string | null>(null);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', phone: '', email: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (c: Customer) => { setForm(c); setEditing(c); setShowForm(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (editing) { update({ ...editing, ...form }); toast.success('Updated'); }
    else { add(form); toast.success('Added'); }
    setShowForm(false);
  };

  const customerOrders = viewHistory ? orders.filter(o => o.customerId === viewHistory) : [];

  if (viewHistory) {
    const customer = customers.find(c => c.id === viewHistory);
    return (
      <Layout title={`${customer?.name} - History`} showBack>
        <button onClick={() => setViewHistory(null)} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">← Back to Customers</button>
        {customer && (
          <div className="glass-card p-3 mb-4 flex items-center gap-2">
            <Star size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{customer.loyaltyPoints || 0} loyalty points</span>
          </div>
        )}
        {customerOrders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No purchase history</p>
        ) : (
          <div className="space-y-2">
            {customerOrders.map(o => (
              <div key={o.id} className="glass-card p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">₹{o.total.toFixed(2)}</span>
                  <span className="text-muted-foreground">{new Date(o.date).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{o.items.map(i => i.name).join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </Layout>
    );
  }

  return (
    <Layout title="Customers" showBack>
      {!showForm ? (
        <>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9 h-10 rounded-xl bg-muted/50" />
            </div>
            <Button onClick={openAdd} className="h-10 rounded-xl"><Plus size={18} /></Button>
          </div>
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">{c.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                  {(c.loyaltyPoints || 0) > 0 && (
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-400 flex items-center gap-0.5 mt-0.5">
                      <Star size={10} className="text-yellow-500" /> {c.loyaltyPoints} pts
                    </p>
                  )}
                </div>
                <button onClick={() => setViewHistory(c.id)} className="p-2 rounded-lg bg-muted text-muted-foreground"><History size={14} /></button>
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></button>
                <button onClick={() => { remove(c.id); toast.success('Deleted'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No customers yet</p>}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold font-fredoka text-lg">{editing ? 'Edit' : 'Add'} Customer</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div><label className="text-xs font-medium mb-1 block">Name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <div><label className="text-xs font-medium mb-1 block">Phone</label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <div><label className="text-xs font-medium mb-1 block">Email</label><Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
