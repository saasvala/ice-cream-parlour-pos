import type { Order, StoreSettings } from '@/types/pos';

// ─── CSV Export ───────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportOrdersToCSV(
  orders: Order[],
  getCustomerName: (id?: string) => string,
  settings: StoreSettings
) {
  const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment', 'Status'];
  const rows = orders.map(o => [
    o.id,
    new Date(o.date).toLocaleString('en-IN'),
    getCustomerName(o.customerId),
    o.items.map(i => `${i.name} x${i.qty}`).join('; '),
    o.subtotal.toFixed(2),
    o.discount.toFixed(2),
    o.tax.toFixed(2),
    o.total.toFixed(2),
    o.paymentMode.toUpperCase(),
    o.status,
  ]);

  const csv = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
  downloadFile(csv, `${settings.storeName.replace(/\s+/g, '_')}_Orders_${formatFileDate()}.csv`, 'text/csv');
}

export function exportReportToCSV(
  data: { label: string; value: string | number }[],
  reportName: string,
  storeName: string
) {
  const headers = ['Metric', 'Value'];
  const rows = data.map(d => [d.label, String(d.value)]);
  const csv = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
  downloadFile(csv, `${storeName.replace(/\s+/g, '_')}_${reportName}_${formatFileDate()}.csv`, 'text/csv');
}

// ─── PDF Export (HTML → Print) ────────────────────────────────

export function exportOrdersToPDF(
  orders: Order[],
  getCustomerName: (id?: string) => string,
  settings: StoreSettings,
  filterLabel?: string
) {
  const rows = orders.map(o => `
    <tr>
      <td>${o.id.slice(-6)}</td>
      <td>${new Date(o.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
      <td>${getCustomerName(o.customerId)}</td>
      <td>${o.items.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
      <td style="text-align:right">${settings.currency}${o.subtotal.toFixed(0)}</td>
      <td style="text-align:right">${o.discount > 0 ? `-${settings.currency}${o.discount.toFixed(0)}` : '—'}</td>
      <td style="text-align:right">${settings.currency}${o.tax.toFixed(2)}</td>
      <td style="text-align:right;font-weight:600">${settings.currency}${o.total.toFixed(2)}</td>
      <td>${o.paymentMode.toUpperCase()}</td>
    </tr>
  `).join('');

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  const html = `
    <!DOCTYPE html>
    <html><head>
      <title>${settings.storeName} — Order Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1a1a2e; font-size: 12px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 16px; font-size: 11px; }
        .summary { display: flex; gap: 24px; margin-bottom: 16px; }
        .summary-card { padding: 8px 16px; background: #f0f4ff; border-radius: 8px; }
        .summary-card .num { font-size: 18px; font-weight: 700; color: #0ea5e9; }
        .summary-card .label { font-size: 10px; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 6px 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
        tr:last-child td { border-bottom: 2px solid #0ea5e9; }
        .footer { margin-top: 16px; font-size: 10px; color: #999; text-align: center; }
        @media print { body { padding: 12px; } }
      </style>
    </head><body>
      <h1>${settings.storeName}</h1>
      <p class="meta">${settings.storeAddress} · ${settings.storePhone}</p>
      <p class="meta">${filterLabel || 'All Orders'} · Generated: ${new Date().toLocaleString('en-IN')}</p>
      <div class="summary">
        <div class="summary-card"><div class="num">${orders.length}</div><div class="label">Orders</div></div>
        <div class="summary-card"><div class="num">${settings.currency}${totalRevenue.toFixed(0)}</div><div class="label">Revenue</div></div>
      </div>
      <table>
        <thead><tr>
          <th>ID</th><th>Date</th><th>Customer</th><th>Items</th><th style="text-align:right">Subtotal</th><th style="text-align:right">Discount</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th><th>Payment</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footer">${settings.receiptFooter}</p>
    </body></html>
  `;

  printHTML(html);
}

// ─── Helpers ──────────────────────────────────────────────────

function formatFileDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printHTML(html: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.print();
  };
}
