import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useOrders, useCustomers, useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Printer, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import ReceiptPreview from '@/components/ReceiptPreview';
import type { Order } from '@/types/pos';

export default function OrderHistory() {
  const { isLoggedIn } = useAuth();
  const { orders } = useOrders();
  const { customers } = useCustomers();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const sorted = [...orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = sorted.filter(o => {
    const q = search.toLowerCase();
    if (!q) return true;
    const cust = customers.find(c => c.id === o.customerId);
    return (
      o.id.toLowerCase().includes(q) ||
      cust?.name.toLowerCase().includes(q) ||
      o.items.some(it => it.name.toLowerCase().includes(q))
    );
  });

  const getCustomerName = (id?: string) => {
    if (!id) return 'Walk-in';
    return customers.find(c => c.id === id)?.name || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout title="Order History" showBack>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, customer, or item..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl bg-card/60 backdrop-blur border-border/50"
        />
      </div>

      {/* Summary */}
      <div className="flex gap-3 mb-4">
        <Card className="flex-1 p-3 text-center bg-card/60 backdrop-blur">
          <p className="text-2xl font-bold font-fredoka text-primary">{orders.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Orders</p>
        </Card>
        <Card className="flex-1 p-3 text-center bg-card/60 backdrop-blur">
          <p className="text-2xl font-bold font-fredoka text-primary">
            {settings.currency}{orders.reduce((s, o) => s + o.total, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[10px] text-muted-foreground">Total Revenue</p>
        </Card>
      </div>

      {/* Orders List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No orders found</p>
          </div>
        )}
        {filtered.map(order => {
          const expanded = expandedId === order.id;
          const custName = getCustomerName(order.customerId);
          return (
            <Card key={order.id} className="bg-card/60 backdrop-blur overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-center justify-between p-3 text-left"
                onClick={() => setExpandedId(expanded ? null : order.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">#{order.id.slice(-6)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      order.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-semibold truncate mt-0.5">{custName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(order.date)} · {formatTime(order.date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{settings.currency}{order.total.toFixed(0)}</span>
                  {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>
              </button>

              {/* Expanded details */}
              {expanded && (
                <div className="border-t border-border/50 px-3 pb-3">
                  <div className="py-2 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-foreground">
                          {item.name} × {item.qty}
                          {item.scoops > 1 && <span className="text-muted-foreground"> ({item.scoops} scoops)</span>}
                        </span>
                        <span className="text-muted-foreground">{settings.currency}{(item.price * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    {order.items.some(it => it.toppings.length > 0) && (
                      <p className="text-[10px] text-muted-foreground">
                        Toppings: {order.items.flatMap(it => it.toppings).filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="border-t border-dashed border-border/50 pt-2 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{settings.currency}{order.subtotal.toFixed(0)}</span></div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-primary"><span>Discount</span><span>-{settings.currency}{order.discount.toFixed(0)}</span></div>
                    )}
                    <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{settings.currency}{order.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold"><span>Total</span><span>{settings.currency}{order.total.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="uppercase font-medium text-muted-foreground">{order.paymentMode}</span></div>
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3 rounded-xl h-9 text-xs font-bold"
                    onClick={() => setReceiptOrder(order)}
                  >
                    <Printer size={14} className="mr-1.5" /> Reprint Receipt
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Receipt Modal */}
      {receiptOrder && (
        <ReceiptPreview
          open={!!receiptOrder}
          onClose={() => setReceiptOrder(null)}
          items={receiptOrder.items}
          subtotal={receiptOrder.subtotal}
          discount={receiptOrder.discount}
          tax={receiptOrder.tax}
          total={receiptOrder.total}
          paymentMode={receiptOrder.paymentMode}
          settings={settings}
          orderId={receiptOrder.id}
          customerName={getCustomerName(receiptOrder.customerId)}
        />
      )}
    </Layout>
  );
}
