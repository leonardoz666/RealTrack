import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Mostrar loading enquanto verifica autenticação
    return (
      <div className="auth-bg">
        <div className="auth-card">
          <div className="auth-lock relative">
            <div className="glow" />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-8 h-8 text-white"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V8a5 5 0 0110 0v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="absolute -bottom-2 right-[-12px] w-28 h-28">
              <svg className="w-full h-full text-emerald-400 animate-spin opacity-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true">
                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
            </div>
          </div>

          <div className="auth-title">Verificando autenticação</div>
          <div className="auth-sub">Aguarde enquanto confirmamos suas credenciais de forma segura.</div>

          <div className="auth-dots" aria-hidden>
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
