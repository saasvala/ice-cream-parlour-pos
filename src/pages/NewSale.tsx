import { useState } from 'react';
import { useProducts, useCategories, useOrders, useSettings, useCustomers } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, ShoppingBag, CreditCard, Banknote, Smartphone, Printer, Save, Trash2, User, Star } from 'lucide-react';
import type { OrderItem } from '@/types/pos';
import { toast } from 'sonner';
import ReceiptPreview from '@/components/ReceiptPreview';

const TOPPINGS = ['Sprinkles', 'Chocolate Sauce', 'Caramel', 'Nuts', 'Whipped Cream', 'Cherry'];
const POINTS_PER_100 = 10; // earn 10 points per ₹100 spent
const POINTS_VALUE = 1; // 1 point = ₹1 discount

export default function NewSale() {
  const { products, deductStock } = useProducts();
  const { categories } = useCategories();
  const { add: addOrder } = useOrders();
  const { settings } = useSettings();
  const { customers, addLoyaltyPoints, redeemLoyaltyPoints } = useCustomers();
  
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('cash');
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrderId, setLastOrderId] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(0);

  const filteredProducts = products.filter(p => p.category === activeCategory);
  const selectedCust = customers.find(c => c.id === selectedCustomer);
  const availablePoints = selectedCust?.loyaltyPoints || 0;
  
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const taxAmount = subtotal * (settings.taxRate / 100);
  const pointsDiscount = Math.min(redeemPoints * POINTS_VALUE, subtotal);
  const total = subtotal + taxAmount - discount - pointsDiscount;

  const addToCart = (productId: string, scoops: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    if (product.stockQty <= 0) { toast.error('Out of stock!'); return; }
    
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
    
    cart.forEach(item => { deductStock(item.productId, item.qty); });
    
    const order = addOrder({
      items: cart,
      subtotal,
      discount: discount + pointsDiscount,
      tax: taxAmount,
      total,
      paymentMode,
      customerId: selectedCustomer || undefined,
      date: new Date().toISOString(),
      status: 'completed',
    });

    // Loyalty points: redeem then earn
    if (selectedCustomer) {
      if (redeemPoints > 0) {
        redeemLoyaltyPoints(selectedCustomer, redeemPoints);
      }
      const earned = Math.floor((total / 100) * POINTS_PER_100);
      if (earned > 0) {
        addLoyaltyPoints(selectedCustomer, earned);
        toast.success(`Earned ${earned} loyalty points! ⭐`);
      }
    }
    
    setLastOrderId(order.id);
    toast.success('Order saved successfully! 🍦');
    setShowReceipt(true);
  };

  const handleNewOrder = () => {
    setCart([]);
    setDiscount(0);
    setRedeemPoints(0);
    setSelectedCustomer('');
    setShowReceipt(false);
  };

  const customerName = selectedCust?.name;

  return (
    <Layout title="New Sale" showBack>
      {/* Customer Selection */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center gap-2">
          <User size={16} className="text-muted-foreground flex-shrink-0" />
          <select
            value={selectedCustomer}
            onChange={e => { setSelectedCustomer(e.target.value); setRedeemPoints(0); }}
            className="flex-1 h-8 rounded-lg bg-transparent border-0 text-sm focus:outline-none"
          >
            <option value="">Walk-in Customer</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>
        </div>
        {selectedCustomer && (
          <div className="flex items-center gap-2 mt-2 px-1">
            <Star size={14} className="text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{availablePoints} loyalty points</span>
            <span className="text-[10px] text-muted-foreground">(= {settings.currency}{availablePoints * POINTS_VALUE} value)</span>
          </div>
        )}
      </div>

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
            } ${product.stockQty <= 0 ? 'opacity-50' : ''}`}
          >
            <div className="text-3xl mb-2">🍦</div>
            <p className="font-bold text-sm truncate">{product.name}</p>
            <p className="text-primary font-bold">{settings.currency}{product.sellingPrice}</p>
            <p className="text-[10px] text-muted-foreground">Stock: {product.stockQty}</p>
            {product.stockQty <= product.lowStockAlert && product.stockQty > 0 && (
              <span className="text-[10px] text-destructive font-medium">Low Stock</span>
            )}
            {product.stockQty <= 0 && (
              <span className="text-[10px] text-destructive font-bold">Out of Stock</span>
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
                    <p className="text-xs text-muted-foreground">{item.scoops} scoop(s) · {settings.currency}{item.price}</p>
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
              <span>{settings.currency}{subtotal}</span>
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
            {/* Loyalty Points Redemption */}
            {selectedCustomer && availablePoints > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground flex items-center gap-1"><Star size={12} className="text-yellow-500" /> Redeem Points</span>
                <div className="flex items-center gap-1">
                  <Input 
                    type="number" 
                    value={redeemPoints || ''} 
                    onChange={e => setRedeemPoints(Math.min(availablePoints, Math.max(0, Number(e.target.value))))} 
                    className="w-20 h-8 text-right rounded-lg text-sm"
                    placeholder="0"
                    max={availablePoints}
                  />
                  <button onClick={() => setRedeemPoints(availablePoints)} className="text-[10px] text-primary font-semibold px-2">Max</button>
                </div>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-sm text-yellow-600 dark:text-yellow-400">
                <span>Points Discount</span>
                <span>-{settings.currency}{pointsDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({settings.taxRate}%)</span>
              <span>{settings.currency}{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold font-fredoka pt-2 border-t border-border/50">
              <span>Total</span>
              <span className="text-gradient-ice">{settings.currency}{total.toFixed(2)}</span>
            </div>
            {selectedCustomer && (
              <p className="text-[10px] text-muted-foreground text-right">
                ⭐ Will earn ~{Math.floor((total / 100) * POINTS_PER_100)} loyalty points
              </p>
            )}
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
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => {
              if (cart.length === 0) { toast.error('Add items first'); return; }
              setShowReceipt(true);
            }}>
              <Printer size={18} />
            </Button>
          </div>
        </div>
      )}

      <div className="h-20" />

      {/* Receipt Preview Modal */}
      <ReceiptPreview
        open={showReceipt}
        onClose={handleNewOrder}
        items={cart.length > 0 ? cart : []}
        subtotal={subtotal}
        discount={discount + pointsDiscount}
        tax={taxAmount}
        total={total}
        paymentMode={paymentMode}
        settings={settings}
        orderId={lastOrderId}
        customerName={customerName}
      />
    </Layout>
  );
}
