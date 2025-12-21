/**
 * Hook para dados do Dashboard
 * 
 * Encapsula toda a lógica de busca e processamento de dados
 * do dashboard, incluindo métricas, gráficos e filtros.
 * Refatorado para usar React Query (TanStack Query)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { perfilService, type Perfil } from '../services/api';
import { eventBus } from '../utils/eventBus';
import {
  DashboardFilters,
  DashboardMetricas,
  DashboardResponse,
  EvolucaoBancaChartItem,
  LucroAcumuladoItem,
  LucroPorTipsterItem,
  ResumoCasaItem,
  ResumoEsporteItem,
  ApostaRecente
} from '../types/dashboard';

// Re-exportar tipos para manter compatibilidade
export type {
  DashboardFilters,
  DashboardMetricas,
  DashboardResponse,
  EvolucaoBancaChartItem,
  LucroAcumuladoItem,
  LucroPorTipsterItem,
  ResumoEsporteItem,
  ResumoCasaItem,
  ApostaRecente
};

import {
  initialFilters,
  initialMetricas,
  buildParams,
  prepareChartData,
  calculateGrowthPercent,
  findBestDay,
  findWorstDay,
  calculateDailyAverage
} from '../utils/dashboardHelpers';

interface UseDashboardDataOptions {
  autoFetch?: boolean;
  debounceMs?: number;
}

interface UseDashboardDataResult {
  // Estados
  loading: boolean;
  error: Error | null;
  profile: Perfil | null;

  // Dados
  metricas: DashboardMetricas;
  lucroAcumulado: LucroAcumuladoItem[];
  lucroPorTipster: LucroPorTipsterItem[];
  resumoPorEsporte: ResumoEsporteItem[];
  resumoPorCasa: ResumoCasaItem[];
  apostasRecentes: ApostaRecente[];
  loadingApostasRecentes: boolean;

  // Filtros
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  handleFilterChange: (field: keyof DashboardFilters, value: string) => void;
  clearFilters: () => void;
  activeFiltersCount: number;

  // Período do gráfico
  periodoGrafico: string;
  setPeriodoGrafico: React.Dispatch<React.SetStateAction<string>>;

  // Dados calculados
  evolucaoBancaChart: EvolucaoBancaChartItem[];
  crescimentoPercentual: number;
  melhorDia: { valor: number; data: string };
  piorDia: { valor: number; data: string };
  mediaDiaria: number;

  // Ações
  fetchDashboardData: () => Promise<void>;
  fetchApostasRecentes: () => Promise<void>;
  refetch: () => void;
}

export function useDashboardData(
  options: UseDashboardDataOptions = {}
): UseDashboardDataResult {
  const { autoFetch = true } = options;
  const queryClient = useQueryClient();

  // Filtros
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const [periodoGrafico, setPeriodoGrafico] = useState('7');

  // ============================================
  // Queries
  // ============================================

  // 1. Perfil
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => perfilService.get(),
    staleTime: 1000 * 60 * 30, // 30 minutos
    enabled: autoFetch,
  });

  // Atualizar banca selecionada quando perfil carregar
  useEffect(() => {
    if (profile?.bancaAtivaId && !filters.bancaId) {
      setFilters(prev => ({ ...prev, bancaId: profile.bancaAtivaId }));
    }
  }, [profile?.bancaAtivaId, filters.bancaId]);

  // 2. Dashboard Data
  const {
    data: dashboardData,
    isLoading: loadingDashboard,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: ['dashboard', filters],
    queryFn: async () => {
      if (!filters.bancaId) return null;
      const params = buildParams(filters);
      const response = await apiClient.get<DashboardResponse>('/analise/dashboard', { params });
      return response.data;
    },
    enabled: autoFetch && !!filters.bancaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // 3. Apostas Recentes
  const {
    data: apostasRecentes,
    isLoading: loadingApostasRecentes,
    refetch: refetchApostasRecentes,
  } = useQuery({
    queryKey: ['apostasRecentes', filters.bancaId],
    queryFn: async () => {
      if (!filters.bancaId) return [];
      const response = await apiClient.get<{ data: ApostaRecente[]; nextCursor: string | null; hasMore: boolean }>('/apostas/recentes', { 
        params: { bancaId: filters.bancaId } 
      });
      return response.data?.data || [];
    },
    enabled: autoFetch && !!filters.bancaId,
  });

  // ============================================
  // Dados Derivados
  // ============================================

  const metricas = useMemo<DashboardMetricas>(() => {
    if (!dashboardData?.metricas) return initialMetricas;
    
    // Mapeamento de campos extras se necessário
    const rawMetricas = dashboardData.metricas as any;
    return {
      ...dashboardData.metricas,
      valorPerdido: rawMetricas.valorPerdido ?? dashboardData.metricas.valorPerdido,
      totalGanhos: rawMetricas.totalGanhos ?? dashboardData.metricas.totalGanhos,
    };
  }, [dashboardData]);

  const lucroAcumulado = useMemo(() => dashboardData?.lucroAcumulado || [], [dashboardData]);
  const lucroPorTipster = useMemo(() => dashboardData?.lucroPorTipster || [], [dashboardData]);
  const resumoPorEsporte = useMemo(() => dashboardData?.resumoPorEsporte || [], [dashboardData]);
  const resumoPorCasa = useMemo(() => dashboardData?.resumoPorCasa || [], [dashboardData]);

  // ============================================
  // Cálculos para Gráficos
  // ============================================

  const activeFiltersCount = useMemo(
    () => Object.values(filters).filter(v => v !== '').length,
    [filters]
  );

  const chartEndKey = useMemo(() => {
    const explicitEnd = filters.dataFim || null;
    const lastDataEnd = lucroAcumulado.length
      ? lucroAcumulado[lucroAcumulado.length - 1].date
      : null;

    if (explicitEnd && lastDataEnd) {
      return lastDataEnd > explicitEnd ? lastDataEnd : explicitEnd;
    }

    return explicitEnd ?? lastDataEnd ?? new Date().toISOString().split('T')[0];
  }, [filters.dataFim, lucroAcumulado]);

  const evolucaoBancaChart = useMemo(
    () => prepareChartData(lucroAcumulado, periodoGrafico, new Date(chartEndKey)),
    [lucroAcumulado, periodoGrafico, chartEndKey]
  );

  const crescimentoPercentual = useMemo(
    () => calculateGrowthPercent(evolucaoBancaChart),
    [evolucaoBancaChart]
  );

  const melhorDia = useMemo(
    () => findBestDay(lucroAcumulado, periodoGrafico),
    [lucroAcumulado, periodoGrafico]
  );

  const piorDia = useMemo(
    () => findWorstDay(lucroAcumulado, periodoGrafico),
    [lucroAcumulado, periodoGrafico]
  );

  const mediaDiaria = useMemo(
    () => calculateDailyAverage(lucroAcumulado, periodoGrafico),
    [lucroAcumulado, periodoGrafico]
  );

  // ============================================
  // Actions & Event Listeners
  // ============================================

  const handleFilterChange = useCallback((field: keyof DashboardFilters, value: string) => {
    setFilters((prev: DashboardFilters) => {
      if (prev[field] === value) return prev;
      return { ...prev, [field]: value };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // Wrappers para manter compatibilidade com interface original
  const fetchDashboardData = useCallback(async () => {
    await refetchDashboard();
  }, [refetchDashboard]);

  const fetchApostasRecentes = useCallback(async () => {
    await refetchApostasRecentes();
  }, [refetchApostasRecentes]);

  const refetch = useCallback(() => {
    void refetchDashboard();
    void refetchApostasRecentes();
  }, [refetchDashboard, refetchApostasRecentes]);

  // Event Listeners
  useEffect(() => {
    const unsubscribeProfile = eventBus.on('profile:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    });

    const unsubscribeBanca = eventBus.on('banca:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['apostasRecentes'] });
    });

    const unsubscribeApostas = eventBus.on('apostas:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['apostasRecentes'] });
    });

    return () => {
      unsubscribeProfile();
      unsubscribeBanca();
      unsubscribeApostas();
    };
  }, [queryClient]);

  return {
    // Estados
    loading: loadingDashboard,
    error: (dashboardError as Error) || null,
    profile: profile || null,

    // Dados
    metricas,
    lucroAcumulado,
    lucroPorTipster,
    resumoPorEsporte,
    resumoPorCasa,
    apostasRecentes: apostasRecentes || [],
    loadingApostasRecentes,

    // Filtros
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
    activeFiltersCount,

    // Período do gráfico
    periodoGrafico,
    setPeriodoGrafico,

    // Dados calculados
    evolucaoBancaChart,
    crescimentoPercentual,
    melhorDia,
    mediaDiaria,
    piorDia,

    // Ações
    fetchDashboardData,
    fetchApostasRecentes,
    refetch,
  };
}

export default useDashboardData;
