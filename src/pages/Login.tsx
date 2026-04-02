import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import type { UserRole } from '@/types/pos';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLicensed } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLicensed) {
    return <Navigate to="/license" replace />;
  }

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      login(role);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen ice-gradient flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-8 left-8 text-7xl animate-float opacity-15">🍦</div>
      <div className="absolute bottom-16 right-6 text-6xl animate-float opacity-10" style={{ animationDelay: '1.5s' }}>🍨</div>
      <div className="absolute top-1/3 right-10 text-4xl animate-spin-slow opacity-8">❄️</div>

      <div className="glass-card p-8 w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="text-6xl mb-3 animate-bounce-soft">🍦</div>
          <h2 className="text-2xl font-fredoka font-bold text-gradient-ice">Welcome Back</h2>
          <p className="text-sm text-muted-foreground mt-1">Sign in to Frosty Scoops POS</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter username"
                className="pl-10 h-12 rounded-xl bg-muted/50 border-border/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                className="pl-10 pr-10 h-12 rounded-xl bg-muted/50 border-border/50"
              />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch checked={remember} onCheckedChange={setRemember} />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as UserRole)}
              className="w-full h-12 rounded-xl bg-muted/50 border border-border/50 px-3 text-sm"
            >
              <option value="user">User</option>
              <option value="reseller">Reseller</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold text-base shadow-lg shadow-primary/25"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Powered by <span className="font-bold text-gradient-ice">Software Vala™</span>
        </p>
      </div>
    </div>
  );
}
