import { useQuery } from '@tanstack/react-query';
import { analiseService } from '../services/api';
import type {
  AnaliseBookmakerComparison,
  AnaliseHeatmapData,
  AnaliseOddDistribution,
  AnaliseRoiEntry,
  AnaliseWinRatePorEsporte,
} from '../types/AnaliseData';
import type { AnaliseFilters } from '../types/analise';

export interface UseAnaliseDataState {
  evolucaoRoiMensal: AnaliseRoiEntry[];
  distribuicaoOdds: AnaliseOddDistribution[];
  heatmap: AnaliseHeatmapData;
  comparacaoBookmakers: AnaliseBookmakerComparison[];
  winRatePorEsporte: AnaliseWinRatePorEsporte[];
}

export interface UseAnaliseDataResult {
  data: UseAnaliseDataState;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}

const defaultState: UseAnaliseDataState = {
  evolucaoRoiMensal: [],
  distribuicaoOdds: [],
  heatmap: {},
  comparacaoBookmakers: [],
  winRatePorEsporte: [],
};

const PERFORMANCE_ERROR_FALLBACK = 'Erro ao carregar dados de performance.';

export function useAnaliseData(filters: AnaliseFilters): UseAnaliseDataResult {
  const hasBanca = Boolean(filters.bancaId);

  // Build query params
  const queryParams = {
    bancaId: filters.bancaId,
    ...(filters.status && filters.status !== 'Tudo' && { status: filters.status }),
    ...(filters.tipster && { tipster: filters.tipster }),
    ...(filters.casa && { casa: filters.casa }),
    ...(filters.esporte && { esporte: filters.esporte }),
    ...(filters.evento && { evento: filters.evento }),
    ...(filters.dataInicio && { dataInicio: filters.dataInicio }),
    ...(filters.dataFim && { dataFim: filters.dataFim }),
    ...(filters.oddMin && { oddMin: filters.oddMin }),
    ...(filters.oddMax && { oddMax: filters.oddMax }),
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analise', queryParams],
    queryFn: async () => {
      try {
        const result = await analiseService.getPerformance(queryParams as Record<string, string>);
        return result;
      } catch (err: any) {
        if (err.response?.status !== 429) {
          console.error('Erro ao carregar dados de performance:', err);
        }
        throw err instanceof Error ? err : new Error(PERFORMANCE_ERROR_FALLBACK);
      }
    },
    enabled: hasBanca,
  });

  return {
    data: data || defaultState,
    isLoading,
    error: error as Error | null,
    reload: refetch,
  };
}

export default useAnaliseData;


