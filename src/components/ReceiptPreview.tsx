import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import type { OrderItem, StoreSettings } from '@/types/pos';

interface ReceiptProps {
  open: boolean;
  onClose: () => void;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMode: string;
  settings: StoreSettings;
  orderId?: string;
  customerName?: string;
}

export default function ReceiptPreview({ open, onClose, items, subtotal, discount, tax, total, paymentMode, settings, orderId, customerName }: ReceiptProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[320px] p-0 rounded-2xl overflow-hidden bg-white">
        <DialogTitle className="sr-only">Receipt Preview</DialogTitle>
        {/* Receipt */}
        <div className="p-5 font-mono text-xs text-gray-800" id="receipt-content">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-300 pb-3 mb-3">
            <div className="text-3xl mb-1">🍦</div>
            <h2 className="text-base font-bold tracking-wide">{settings.storeName}</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">{settings.storeAddress}</p>
            <p className="text-[10px] text-gray-500">Tel: {settings.storePhone}</p>
          </div>

          {/* Order Info */}
          <div className="flex justify-between text-[10px] text-gray-500 mb-2">
            <span>{dateStr} {timeStr}</span>
            <span>#{orderId?.slice(-6) || '------'}</span>
          </div>
          {customerName && (
            <p className="text-[10px] text-gray-500 mb-2">Customer: {customerName}</p>
          )}

          {/* Items */}
          <div className="border-t border-dashed border-gray-300 pt-2 mb-2">
            <div className="flex justify-between font-bold text-[10px] uppercase text-gray-500 mb-1.5">
              <span className="flex-1">Item</span>
              <span className="w-8 text-center">Qty</span>
              <span className="w-14 text-right">Amt</span>
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="mb-1.5">
                <div className="flex justify-between">
                  <span className="flex-1 truncate pr-1">{item.name}</span>
                  <span className="w-8 text-center">{item.qty}</span>
                  <span className="w-14 text-right">{settings.currency}{(item.price * item.qty).toFixed(0)}</span>
                </div>
                {item.scoops > 1 && (
                  <p className="text-[9px] text-gray-400 pl-2">{item.scoops} scoops</p>
                )}
                {item.toppings.length > 0 && (
                  <p className="text-[9px] text-gray-400 pl-2">+ {item.toppings.join(', ')}</p>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{settings.currency}{subtotal.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{settings.currency}{discount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax ({settings.taxRate}%)</span>
              <span>{settings.currency}{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-dashed border-gray-300 pt-2 mt-2">
              <span>TOTAL</span>
              <span>{settings.currency}{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500 mt-1">
              <span>Payment</span>
              <span className="uppercase font-medium">{paymentMode}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-dashed border-gray-300 mt-3 pt-3 text-center">
            <p className="text-[10px] text-gray-500">{settings.receiptFooter}</p>
            <div className="mt-2 flex justify-center">
              {/* Barcode-like visual */}
              <div className="flex gap-[1px]">
                {Array.from({ length: 30 }, (_, i) => (
                  <div key={i} className="bg-gray-800" style={{ width: Math.random() > 0.5 ? 2 : 1, height: 20 }} />
                ))}
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-2 font-sans font-bold">
              Powered by Software Vala™
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-3 border-t bg-gray-50">
          <Button onClick={handlePrint} className="flex-1 h-10 rounded-xl font-bold text-sm">
            <Printer size={16} className="mr-1.5" /> Print Receipt
          </Button>
          <Button variant="outline" onClick={onClose} className="h-10 rounded-xl">
            <X size={16} />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
