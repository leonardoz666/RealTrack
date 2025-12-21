import { Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApiDiagnostics } from '../hooks/useApiDiagnostics';
import { cn } from './ui/utils';

export default function ApiDiagnostics() {
  const { apiDiagnostics, checkApiConnectivity } = useApiDiagnostics();

  if (apiDiagnostics.status === 'idle') return null;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border transition-colors cursor-pointer",
        apiDiagnostics.status === 'checking' && "bg-blue-500/10 text-blue-400 border-blue-500/20",
        apiDiagnostics.status === 'ok' && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        apiDiagnostics.status === 'error' && "bg-rose-500/10 text-rose-400 border-rose-500/20"
      )}
      onClick={() => checkApiConnectivity()}
      title={apiDiagnostics.message || "Clique para verificar conexão"}
    >
      {apiDiagnostics.status === 'checking' && <Activity size={12} className="animate-pulse" />}
      {apiDiagnostics.status === 'ok' && <CheckCircle2 size={12} />}
      {apiDiagnostics.status === 'error' && <AlertCircle size={12} />}
      
      <span>
        {apiDiagnostics.status === 'checking' && "Verificando API..."}
        {apiDiagnostics.status === 'ok' && `API Online (${apiDiagnostics.latencyMs}ms)`}
        {apiDiagnostics.status === 'error' && "API Offline"}
      </span>
    </div>
  );
}
