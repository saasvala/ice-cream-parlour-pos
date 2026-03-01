import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => navigate('/license'), 2500);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen ice-gradient flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-6xl animate-float opacity-20">🍦</div>
      <div className="absolute top-20 right-14 text-5xl animate-float opacity-15" style={{ animationDelay: '0.5s' }}>🍨</div>
      <div className="absolute bottom-32 left-16 text-5xl animate-float opacity-15" style={{ animationDelay: '1s' }}>🍧</div>
      <div className="absolute bottom-20 right-10 text-6xl animate-float opacity-20" style={{ animationDelay: '1.5s' }}>🥤</div>
      <div className="absolute top-1/3 right-8 text-4xl animate-spin-slow opacity-10">❄️</div>

      <div className={`flex flex-col items-center gap-6 transition-all duration-1000 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        <div className="text-9xl animate-bounce-soft drop-shadow-2xl">🍦</div>
        
        <div className="text-center">
          <h1 className="text-4xl font-fredoka font-bold text-gradient-ice mb-2">Frosty Scoops</h1>
          <p className="text-sm text-muted-foreground font-medium">Ultra Smart POS System</p>
        </div>

        <div className="flex gap-1 mt-6">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-bold text-gradient-ice">Software Vala™</span>
        </p>
      </div>
    </div>
  );
}
