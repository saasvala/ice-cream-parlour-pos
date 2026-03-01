import { useState } from 'react';
import { useSuppliers } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import type { Supplier } from '@/types/pos';
import { toast } from 'sonner';

export default function Suppliers() {
  const { suppliers, add, update, remove } = useSuppliers();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<{ name: string; phone: string; email?: string; company?: string }>({ name: '', phone: '', email: '', company: '' });

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', phone: '', email: '', company: '' }); setEditing(null); setShowForm(true); };
  const openEdit = (s: Supplier) => { setForm(s); setEditing(s); setShowForm(true); };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    if (editing) { update({ ...editing, ...form }); toast.success('Updated'); }
    else { add(form); toast.success('Added'); }
    setShowForm(false);
  };

  return (
    <Layout title="Suppliers" showBack>
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
            {filtered.map(s => (
              <div key={s.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-ice-mint/20 flex items-center justify-center text-lg">🚚</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.company || s.phone}</p>
                </div>
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></button>
                <button onClick={() => { remove(s.id); toast.success('Deleted'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No suppliers yet</p>}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold font-fredoka text-lg">{editing ? 'Edit' : 'Add'} Supplier</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div><label className="text-xs font-medium mb-1 block">Name *</label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <div><label className="text-xs font-medium mb-1 block">Company</label><Input value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <div><label className="text-xs font-medium mb-1 block">Phone</label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <div><label className="text-xs font-medium mb-1 block">Email</label><Input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="h-10 rounded-xl bg-muted/50" /></div>
            <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
