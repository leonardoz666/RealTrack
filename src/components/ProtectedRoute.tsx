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

      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
