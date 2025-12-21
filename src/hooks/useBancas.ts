/**
 * Hook para gerenciamento de bancas
 * 
 * Utiliza o bancaService para operações de CRUD e
 * mantém cache local para otimização.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bancaService, type Banca } from '../services/api';
import { eventBus, type EventName } from '../utils/eventBus';

// Re-exportar tipo para manter compatibilidade
export type { Banca };

interface UseBancasResult {
  bancas: Banca[];
  loading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

export function useBancas(): UseBancasResult {
  const queryClient = useQueryClient();

  const {
    data: bancas = [],
    isLoading: loading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['bancas'],
    queryFn: async () => {
      return await bancaService.getAll();
    },
    staleTime: 1000 * 60, // 1 minuto de cache
  });

  // Wrapper para refetch compatível com a interface anterior
  const handleRefetch = useCallback(async (force = false) => {
    if (force) {
      await queryClient.invalidateQueries({ queryKey: ['bancas'] });
    } else {
      await queryRefetch();
    }
  }, [queryClient, queryRefetch]);

  // Invalidar cache
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['bancas'] });
  }, [queryClient]);

  // Listeners de eventos
  useEffect(() => {
    const events: EventName[] = ['banca:created', 'banca:updated', 'banca:deleted', 'banca:saved'];
    const unsubscribes = events.map((event) =>
      eventBus.on(event, () => {
        void queryClient.invalidateQueries({ queryKey: ['bancas'] });
      })
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [queryClient]);

  return useMemo(
    () => ({ 
      bancas, 
      loading, 
      error: error as Error | null,
      refetch: handleRefetch, 
      invalidateCache 
    }),
    [bancas, loading, error, handleRefetch, invalidateCache]
  );
}

export default useBancas;

