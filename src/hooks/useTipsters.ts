/**
 * Hook para gerenciamento de tipsters
 * 
 * Utiliza o tipsterService para operações de CRUD e
 * mantém cache local para otimização.
 */

import { useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tipsterService, type Tipster } from '../services/api';

// Re-exportar tipo para manter compatibilidade
export type { Tipster };

interface UseTipstersResult {
  tipsters: Tipster[];
  loading: boolean;
  error: Error | null;
  refetch: (force?: boolean) => Promise<void>;
  invalidateCache: () => void;
}

export function useTipsters(): UseTipstersResult {
  const queryClient = useQueryClient();

  const {
    data: tipsters = [],
    isLoading: loading,
    error,
    refetch: queryRefetch,
  } = useQuery({
    queryKey: ['tipsters'],
    queryFn: async () => {
      return await tipsterService.getAll();
    },
    staleTime: 1000 * 60, // 1 minuto de cache
  });

  // Wrapper para refetch compatível
  const handleRefetch = useCallback(async (force = false) => {
    if (force) {
      await queryClient.invalidateQueries({ queryKey: ['tipsters'] });
    } else {
      await queryRefetch();
    }
  }, [queryClient, queryRefetch]);

  // Função para invalidar cache
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tipsters'] });
  }, [queryClient]);

  return useMemo(
    () => ({ 
      tipsters, 
      loading, 
      error: error as Error | null,
      refetch: handleRefetch, 
      invalidateCache 
    }),
    [tipsters, loading, error, handleRefetch, invalidateCache]
  );
}

export default useTipsters;

