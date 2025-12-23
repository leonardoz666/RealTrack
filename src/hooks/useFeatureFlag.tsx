/**
 * Feature Flags Hook - Frontend
 * 
 * Hook React para usar feature flags no RealTrack
 * Busca flags do backend e utiliza TanStack Query para cache e gerenciamento de estado.
 */

import { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api/apiClient';

interface FeatureFlags {
  [key: string]: boolean;
}

interface FeatureFlagContextValue {
  flags: FeatureFlags;
  isLoading: boolean;
  isEnabled: (flagKey: string) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

/**
 * Provider de Feature Flags
 * Coloque no topo da árvore de componentes (em App.tsx)
 */
export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: flags = {}, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      try {
        // apiClient já configura baseURL e interceptors (auth, etc.)
        const response = await apiClient.get<FeatureFlags>('/feature-flags/user');
        return response.data;
      } catch (error: any) {
        // Silently ignore 401 errors (user not authenticated)
        if (error.response?.status === 401) {
          return {};
        }
        console.error('Erro ao buscar feature flags:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  const isEnabled = (flagKey: string): boolean => {
    return flags[flagKey] ?? false;
  };

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, isEnabled, refresh }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook para usar feature flags
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { isEnabled } = useFeatureFlag();
 *   
 *   if (isEnabled('new-chart-design')) {
 *     return <NewChart />;
 *   }
 * ```
 */
export function useFeatureFlag() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlag deve ser usado dentro de um FeatureFlagProvider');
  }
  return context;
}
