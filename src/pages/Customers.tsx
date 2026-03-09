import { useState } from 'react';
import { useCustomers, useOrders, useLoyaltyHistory } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, X, Search, History, Star, ArrowUp, ArrowDown } from 'lucide-react';
import type { Customer } from '@/types/pos';
import { toast } from 'sonner';
import { getTier, getNextTier, LOYALTY_TIERS } from '@/lib/loyalty';

export default function Customers() {
  const { customers, add, update, remove } = useCustomers();
  const { orders } = useOrders();
  const { getCustomerHistory } = useLoyaltyHistory();
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
    const tier = getTier(customer?.totalPointsEarned || 0);
    const next = getNextTier(customer?.totalPointsEarned || 0);
    const pointsHistory = getCustomerHistory(viewHistory);

    return (
      <Layout title={`${customer?.name}`} showBack>
        <button onClick={() => setViewHistory(null)} className="text-sm text-primary font-medium mb-4 flex items-center gap-1">← Back to Customers</button>
        
        {/* Loyalty Card */}
        {customer && (
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${tier.color}`}>{tier.name} Member</p>
                  <p className="text-[10px] text-muted-foreground">{tier.multiplier}x points multiplier</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold font-fredoka text-primary">{customer.loyaltyPoints || 0}</p>
                <p className="text-[10px] text-muted-foreground">Available pts</p>
              </div>
            </div>
            
            {/* Tier Progress */}
            {next && (
              <div>
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>{tier.icon} {tier.name}</span>
                  <span>{next.icon} {next.name} ({next.minPoints} pts)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, ((customer.totalPointsEarned || 0) / next.minPoints) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  {next.minPoints - (customer.totalPointsEarned || 0)} pts to {next.name}
                </p>
              </div>
            )}
            {!next && (
              <p className="text-[10px] text-center text-muted-foreground">🎉 Highest tier reached!</p>
            )}

            {/* All Tiers */}
            <div className="flex justify-between mt-3 pt-3 border-t border-border/50">
              {LOYALTY_TIERS.map(t => (
                <div key={t.name} className={`text-center ${(customer.totalPointsEarned || 0) >= t.minPoints ? '' : 'opacity-40'}`}>
                  <span className="text-lg">{t.icon}</span>
                  <p className="text-[9px] font-semibold">{t.name}</p>
                  <p className="text-[8px] text-muted-foreground">{t.multiplier}x</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="w-full rounded-xl bg-muted/50 mb-4">
            <TabsTrigger value="orders" className="flex-1 rounded-lg text-xs">Orders</TabsTrigger>
            <TabsTrigger value="points" className="flex-1 rounded-lg text-xs">Points Log</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {customerOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No purchase history</p>
            ) : (
              <div className="space-y-2">
                {customerOrders.slice().reverse().map(o => (
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
          </TabsContent>

          <TabsContent value="points">
            {pointsHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No points activity yet</p>
            ) : (
              <div className="space-y-2">
                {pointsHistory.slice().reverse().map(event => (
                  <div key={event.id} className="glass-card p-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      event.type === 'earn' ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
                    }`}>
                      {event.type === 'earn' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold text-sm ${event.type === 'earn' ? 'text-primary' : 'text-destructive'}`}>
                          {event.type === 'earn' ? '+' : '-'}{event.points} pts
                        </span>
                        {event.tier && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{event.tier}</span>}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{event.description}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {new Date(event.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
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
            {filtered.map(c => {
              const t = getTier(c.totalPointsEarned || 0);
              return (
                <div key={c.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">{t.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm truncate">{c.name}</p>
                      <span className={`text-[9px] font-semibold ${t.color}`}>{t.name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                    {(c.loyaltyPoints || 0) > 0 && (
                      <p className="text-[10px] text-primary flex items-center gap-0.5 mt-0.5">
                        <Star size={10} /> {c.loyaltyPoints} pts
                      </p>
                    )}
                  </div>
                  <button onClick={() => setViewHistory(c.id)} className="p-2 rounded-lg bg-muted text-muted-foreground"><History size={14} /></button>
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg bg-primary/10 text-primary"><Pencil size={14} /></button>
                  <button onClick={() => { remove(c.id); toast.success('Deleted'); }} className="p-2 rounded-lg bg-destructive/10 text-destructive"><Trash2 size={14} /></button>
                </div>
              );
            })}
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