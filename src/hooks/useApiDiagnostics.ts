import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL, API_HEALTH_URL } from '../config/api';

export type ApiDiagnosticsStatus = 'idle' | 'checking' | 'ok' | 'error';

export interface ApiDiagnosticsState {
  status: ApiDiagnosticsStatus;
  message: string;
  latencyMs: number | null;
  lastCheckedAt: string | null;
  probeUrl: string | null;
}

export function useApiDiagnostics() {
  const [apiDiagnostics, setApiDiagnostics] = useState<ApiDiagnosticsState>({
    status: 'idle',
    message: '',
    latencyMs: null,
    lastCheckedAt: null,
    probeUrl: null,
  });

  const checkApiConnectivity = useCallback(async () => {
    setApiDiagnostics((prev) => ({ ...prev, status: 'checking' }));

    const probeCandidates = Array.from(
      new Set([
        API_HEALTH_URL,
        `${API_BASE_URL}/health`,
        API_BASE_URL,
      ]),
    ).filter((url): url is string => typeof url === 'string' && url.length > 0);

    let lastErrorMessage = 'Falha ao verificar API.';

    for (const probeUrl of probeCandidates) {
      const startMark = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const response = await fetch(probeUrl, {
          method: 'GET',
          mode: 'cors',
        });

        const endMark = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const latency = Math.round(endMark - startMark);

        if (!response.ok) {
          lastErrorMessage = `Status ${response.status} em ${probeUrl}`;
          continue;
        }

        setApiDiagnostics({
          status: 'ok',
          message: `API respondendo (HTTP ${response.status}).`,
          latencyMs: latency,
          lastCheckedAt: new Date().toISOString(),
          probeUrl,
        });
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Falha ao verificar API.';
        lastErrorMessage = `${errorMessage} em ${probeUrl}`;
      }
    }

    setApiDiagnostics({
      status: 'error',
      message: lastErrorMessage,
      latencyMs: null,
      lastCheckedAt: new Date().toISOString(),
      probeUrl: null,
    });
  }, []);

  useEffect(() => {
    void checkApiConnectivity();
  }, [checkApiConnectivity]);

  return {
    apiDiagnostics,
    checkApiConnectivity
  };
}
