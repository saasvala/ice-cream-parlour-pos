import { useState } from 'react';
import { useCategories } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { Category } from '@/types/pos';
import { toast } from 'sonner';

const ICONS = ['🍦', '🍨', '🍧', '🥤', '🧁', '🍰', '🎂', '🍩', '🍪', '☕'];
const COLORS = [
  'hsl(200 80% 55%)', 'hsl(340 60% 65%)', 'hsl(270 50% 70%)', 'hsl(45 90% 65%)',
  'hsl(160 50% 60%)', 'hsl(20 80% 70%)', 'hsl(0 75% 55%)', 'hsl(120 40% 55%)',
];

export default function Categories() {
  const { categories, add, update, remove } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍦');
  const [color, setColor] = useState(COLORS[0]);

  const openAdd = () => { setName(''); setIcon('🍦'); setColor(COLORS[0]); setEditing(null); setShowForm(true); };
  const openEdit = (c: Category) => { setName(c.name); setIcon(c.icon); setColor(c.color); setEditing(c); setShowForm(true); };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Name required'); return; }
    if (editing) { update({ ...editing, name, icon, color }); toast.success('Updated'); }
    else { add({ name, icon, color }); toast.success('Added'); }
    setShowForm(false);
  };

  return (
    <Layout title="Categories" showBack>
      {!showForm ? (
        <>
          <Button onClick={openAdd} className="w-full h-11 rounded-xl font-bold mb-4"><Plus size={18} className="mr-1" />Add Category</Button>
          <div className="space-y-2">
            {categories.map(c => (
              <div key={c.id} className="glass-card p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: c.color + '20' }}>{c.icon}</div>
                <p className="flex-1 font-bold">{c.name}</p>
                <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></button>
                <button onClick={() => { remove(c.id); toast.success('Deleted'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass-card p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold font-fredoka text-lg">{editing ? 'Edit' : 'Add'} Category</h2>
            <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Name</label>
              <Input value={name} onChange={e => setName(e.target.value)} className="h-10 rounded-xl bg-muted/50" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)} className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${icon === i ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-muted/50'}`}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-primary scale-110' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <Button onClick={handleSave} className="w-full h-11 rounded-xl font-bold">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      )}
    </Layout>
  );
}
