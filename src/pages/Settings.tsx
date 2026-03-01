import { useSettings } from '@/store/useStore';
import Layout from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();

  const update = (field: string, value: any) => setSettings(prev => ({ ...prev, [field]: value }));

  return (
    <Layout title="Settings" showBack>
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
