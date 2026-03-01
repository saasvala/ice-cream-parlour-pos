import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const IceCreamDecorations = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div className="absolute -top-16 -right-16 text-8xl opacity-10 animate-float">🍦</div>
    <div className="absolute top-1/4 -left-8 text-6xl opacity-8 animate-float" style={{ animationDelay: '1s' }}>🍨</div>
    <div className="absolute bottom-20 right-10 text-7xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>🍧</div>
    <div className="absolute top-1/2 right-1/4 text-5xl opacity-5 animate-spin-slow">❄️</div>
  </div>
);

export default function Layout({ children, title, showBack = false }: { children: ReactNode; title?: string; showBack?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const showFooter = location.pathname !== '/splash';

  return (
    <div className="min-h-screen ice-gradient relative flex flex-col">
      <IceCreamDecorations />
      
      {title && (
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            {showBack && (
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-lg font-bold font-fredoka text-gradient-ice">{title}</h1>
          </div>
        </header>
      )}

      <main className="flex-1 relative z-10 max-w-lg mx-auto w-full px-4 py-4">
        {children}
      </main>

      {showFooter && (
        <footer className="relative z-10 text-center py-3 text-xs text-muted-foreground font-medium">
          Powered by <span className="font-bold text-gradient-ice">Software Vala™</span>
        </footer>
      )}
    </div>
  );
}
