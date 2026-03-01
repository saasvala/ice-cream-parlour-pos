import { useState } from 'react';
import { useProducts, useCategories, useOrders, useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, X, ShoppingBag, CreditCard, Banknote, Smartphone, Printer, Save, Trash2 } from 'lucide-react';
import type { OrderItem } from '@/types/pos';
import { toast } from 'sonner';

const TOPPINGS = ['Sprinkles', 'Chocolate Sauce', 'Caramel', 'Nuts', 'Whipped Cream', 'Cherry'];

export default function NewSale() {
  const { products } = useProducts();
  const { categories } = useCategories();
  const { add: addOrder } = useOrders();
  const { settings } = useSettings();
  
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('cash');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filteredProducts = products.filter(p => p.category === activeCategory);
  
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = subtotal * (settings.taxRate / 100);
  const total = subtotal + taxAmount - discount;

  const addToCart = (productId: string, scoops: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existing = cart.findIndex(i => i.productId === productId);
    if (existing >= 0) {
      setCart(prev => prev.map((item, idx) => idx === existing ? { ...item, qty: item.qty + 1, scoops } : item));
    } else {
      setCart(prev => [...prev, { productId, name: product.name, qty: 1, scoops, toppings: [], price: product.sellingPrice }]);
    }
    setSelectedProduct(null);
  };

  const toggleTopping = (cartIndex: number, topping: string) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx !== cartIndex) return item;
      const has = item.toppings.includes(topping);
      return { ...item, toppings: has ? item.toppings.filter(t => t !== topping) : [...item.toppings, topping] };
    }));
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((item, i) => i === idx ? { ...item, qty: Math.max(1, item.qty + delta) } : item));
  };

  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (cart.length === 0) { toast.error('Add items to cart first'); return; }
    addOrder({
      items: cart,
      subtotal,
      discount,
      tax: taxAmount,
      total,
      paymentMode,
      date: new Date().toISOString(),
      status: 'completed',
    });
    toast.success('Order saved successfully! 🍦');
    setCart([]);
    setDiscount(0);
  };

  return (
    <Layout title="New Sale" showBack>
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {filteredProducts.map(product => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
            className={`glass-card-hover p-3 text-left active:scale-95 transition-transform ${
              selectedProduct === product.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="text-3xl mb-2">🍦</div>
            <p className="font-bold text-sm truncate">{product.name}</p>
            <p className="text-primary font-bold">₹{product.sellingPrice}</p>
            {product.stockQty <= product.lowStockAlert && (
              <span className="text-[10px] text-destructive font-medium">Low Stock</span>
            )}
          </button>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">No products in this category</div>
        )}
      </div>

      {/* Scoop Selector */}
      {selectedProduct && (
        <div className="glass-card p-4 mb-4 animate-scale-in">
          <p className="font-bold text-sm mb-2">Select Scoops:</p>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => addToCart(selectedProduct, s)}
                className="flex-1 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary hover:text-primary-foreground transition-colors active:scale-95"
              >
                {s} {s === 1 ? 'Scoop' : 'Scoops'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="glass-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={18} className="text-primary" />
            <h3 className="font-bold font-fredoka">Cart ({cart.length})</h3>
          </div>

          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-muted/30 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.scoops} scoop(s) · ₹{item.price}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Minus size={14} />
                    </button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => removeItem(idx)} className="w-7 h-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Toppings */}
                <div className="flex flex-wrap gap-1.5">
                  {TOPPINGS.map(t => (
                    <button
                      key={t}
                      onClick={() => toggleTopping(idx, t)}
                      className={`text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                        item.toppings.includes(t) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border/50 mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Discount</span>
              <Input 
                type="number" 
                value={discount || ''} 
                onChange={e => setDiscount(Number(e.target.value))} 
                className="w-24 h-8 text-right rounded-lg text-sm"
                placeholder="0"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({settings.taxRate}%)</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold font-fredoka pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="text-gradient-ice">₹{total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Payment Mode</p>
            <div className="flex gap-2">
              {[
                { mode: 'cash' as const, icon: Banknote, label: 'Cash' },
                { mode: 'card' as const, icon: CreditCard, label: 'Card' },
                { mode: 'upi' as const, icon: Smartphone, label: 'UPI' },
              ].map(pm => (
                <button
                  key={pm.mode}
                  onClick={() => setPaymentMode(pm.mode)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    paymentMode === pm.mode
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <pm.icon size={16} />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/25">
              <Save size={18} className="mr-1" /> Save Order
            </Button>
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => toast.info('Receipt printed! 🧾')}>
              <Printer size={18} />
            </Button>
          </div>
        </div>
      )}

      <div className="h-20" />
    </Layout>
  );
}
