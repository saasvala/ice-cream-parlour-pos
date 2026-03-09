import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Save, Moon, Sun, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';

const BACKUP_KEYS = [
  'pos_products', 'pos_categories', 'pos_customers', 'pos_suppliers',
  'pos_orders', 'pos_purchases', 'pos_adjustments', 'pos_settings',
];

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.style.transition = 'background-color 0.4s ease, color 0.3s ease';
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('pos_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pos_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const saved = localStorage.getItem('pos_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const update = (field: string, value: any) => setSettings(prev => ({ ...prev, [field]: value }));

  const handleBackup = () => {
    const data: Record<string, any> = {};
    BACKUP_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${settings.storeName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded! 💾');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let restored = 0;
        BACKUP_KEYS.forEach(key => {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            restored++;
          }
        });
        toast.success(`Restored ${restored} data sets! Reloading...`);
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Layout title="Settings" showBack>
      {/* Appearance */}
      <div className="glass-card p-5 mb-4">
        <h2 className="font-bold font-fredoka text-lg mb-3">Appearance</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-accent" />}
            <div>
              <p className="text-sm font-semibold">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-[10px] text-muted-foreground">Switch between light and dark themes</p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </div>
      </div>

      {/* Backup / Restore */}
      <div className="glass-card p-5 mb-4">
        <h2 className="font-bold font-fredoka text-lg mb-3">Data Backup</h2>
        <p className="text-xs text-muted-foreground mb-3">Export all store data as a JSON file or restore from a previous backup.</p>
        <div className="flex gap-2">
          <Button onClick={handleBackup} variant="outline" className="flex-1 h-10 rounded-xl text-sm">
            <Download size={16} className="mr-1" /> Export Backup
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="outline" className="flex-1 h-10 rounded-xl text-sm">
            <Upload size={16} className="mr-1" /> Import Backup
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
        </div>
      </div>

      {/* Store Info */}
      <div className="glass-card p-5 space-y-4">
        <h2 className="font-bold font-fredoka text-lg mb-2">Store Information</h2>
        
        <div>
          <label className="text-xs font-medium mb-1 block">Store Name</label>
          <Input value={settings.storeName} onChange={e => update('storeName', e.target.value)} className="h-10 rounded-xl bg-muted/50" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Phone</label>
          <Input value={settings.storePhone} onChange={e => update('storePhone', e.target.value)} className="h-10 rounded-xl bg-muted/50" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Address</label>
          <Input value={settings.storeAddress} onChange={e => update('storeAddress', e.target.value)} className="h-10 rounded-xl bg-muted/50" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Tax Rate (%)</label>
          <Input type="number" value={settings.taxRate} onChange={e => update('taxRate', Number(e.target.value))} className="h-10 rounded-xl bg-muted/50" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Currency Symbol</label>
          <Input value={settings.currency} onChange={e => update('currency', e.target.value)} className="h-10 rounded-xl bg-muted/50" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Receipt Footer</label>
          <Input value={settings.receiptFooter} onChange={e => update('receiptFooter', e.target.value)} className="h-10 rounded-xl bg-muted/50" />
        </div>

        <Button onClick={() => toast.success('Settings saved! ⚙️')} className="w-full h-11 rounded-xl font-bold">
          <Save size={18} className="mr-1" /> Save Settings
        </Button>
      </div>

      <div className="glass-card p-5 mt-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Version 1.0.0</p>
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-bold text-gradient-ice">Software Vala™</span>
        </p>
      </div>
    </Layout>
  );
}
