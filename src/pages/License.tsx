import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { KeyRound, Shield, CheckCircle } from 'lucide-react';

export default function License() {
  const navigate = useNavigate();
  const { activate, isLicensed } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivate = () => {
    if (key.trim().length < 4) {
      setError('Please enter a valid license key');
      return;
    }
    setActivating(true);
    setTimeout(() => {
      activate();
      navigate('/login');
    }, 1200);
  };

  if (isLicensed) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen ice-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 right-10 text-6xl animate-float opacity-15">🔐</div>
      <div className="absolute bottom-20 left-8 text-5xl animate-float opacity-10" style={{ animationDelay: '1s' }}>🍦</div>

      <div className="glass-card p-8 w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 float-3d">
            {activating ? (
              <CheckCircle className="text-primary animate-scale-in" size={40} />
            ) : (
              <KeyRound className="text-primary" size={40} />
            )}
          </div>
          <h2 className="text-2xl font-fredoka font-bold text-gradient-ice">Activate License</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter your license key to continue</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">License Key</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50 text-center tracking-widest font-mono"
              />
            </div>
            {error && <p className="text-destructive text-xs mt-1.5">{error}</p>}
          </div>

          <Button
            onClick={handleActivate}
            disabled={activating}
            className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/25"
          >
            {activating ? 'Activating...' : 'Activate'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => { activate(); navigate('/login'); }}
            className="w-full text-sm text-muted-foreground hover:text-primary"
          >
            Skip for now →
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Powered by <span className="font-bold text-gradient-ice">Software Vala™</span>
        </p>
      </div>
    </div>
  );
}
