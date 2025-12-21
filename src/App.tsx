import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { PerfilProvider } from './contexts/PerfilContext';
import { FeatureFlagProvider } from './hooks/useFeatureFlag';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import { ROUTES } from './routes';


// Lazy load de todas as páginas para reduzir bundle inicial
const Login = lazy(() => import('./pages/Login'));
const Cadastro = lazy(() => import('./pages/Cadastro'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Bancas = lazy(() => import('./pages/Bancas'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Analise = lazy(() => import('./pages/Analise'));
const Atualizar = lazy(() => import('./pages/Atualizar'));
const Perfil = lazy(() => import('./pages/Perfil'));
const TelegramEdit = lazy(() => import('./pages/TelegramEdit'));
const TelegramStatus = lazy(() => import('./pages/TelegramStatus'));

// Componente de loading simples para Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
    <div className="text-center">
      <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-border/60 border-t-brand-emerald animate-spin" />
      <p className="text-sm text-foreground-muted">Carregando...</p>
    </div>
  </div>
);

function App() {
  // Prefetch rotas mais usadas após montagem para reduzir TTI
  useEffect(() => {
    import('./pages/Dashboard');
    import('./pages/Bancas');
  }, []);

  return (
    <ErrorBoundary>
      <PerfilProvider>
        <FeatureFlagProvider>
          <ToastContainer />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route index element={<Navigate to={ROUTES.LOGIN} replace />} />
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.CADASTRO} element={<Cadastro />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.BANCAS} element={<Bancas />} />
                <Route path={ROUTES.FINANCEIRO} element={<Financeiro />} />
                <Route path={ROUTES.ANALISE} element={<Analise />} />
                <Route path={ROUTES.ATUALIZAR} element={<Atualizar />} />
                <Route path={ROUTES.PERFIL} element={<Perfil />} />
              </Route>
              {/* Rotas do Telegram Web App (sem ProtectedRoute, autenticação feita via WebApp) */}
              <Route path={ROUTES.TELEGRAM_EDIT} element={<TelegramEdit />} />
              <Route path={ROUTES.TELEGRAM_STATUS} element={<TelegramStatus />} />
            </Routes>
          </Suspense>
        </FeatureFlagProvider>
      </PerfilProvider>
    </ErrorBoundary>
  );
}

export default App;
