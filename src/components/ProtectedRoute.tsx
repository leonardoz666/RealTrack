import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const GridBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#010a0f] via-transparent to-[#010a0f]" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#010a0f] via-transparent to-[#010a0f]" />

    {/* Animated Glows */}
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
  </div>
);

const BrandMark = () => (
  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)] border border-emerald-500/20 animate-pulse" aria-hidden="true">
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
    <div className="relative flex flex-col items-center justify-center gap-1">
      <div className="h-1.5 w-8 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
      <div className="h-1.5 w-5 rounded-full bg-emerald-500/60" />
      <div className="h-1.5 w-7 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
    </div>
  </div>
);

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#010a0f] font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <GridBackground />
        
        <div className="relative z-10 flex flex-col items-center gap-8">
          <BrandMark />
          
          <div className="flex flex-col items-center gap-3 text-center px-6">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-500/80">Autenticando</span>
            </div>
            <p className="text-xs font-medium text-white/40 max-w-[280px]">Aguarde enquanto validamos seu acesso ao terminal de alta performance</p>
          </div>

          {/* Loading bar */}
          <div className="relative h-1 w-48 overflow-hidden rounded-full bg-white/5">
            <div className="absolute inset-0 h-full w-full -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          </div>
        </div>

        {/* Scanline effect */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
