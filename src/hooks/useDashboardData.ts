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

// ============================================
// Tipos
// ============================================

export interface DashboardFilters {
  status: string;
  tipster: string;
  casa: string;
  dataInicio: string;
  dataFim: string;
  bancaId: string;
}

export interface DashboardMetricas {
  roi: number;
  taxaAcerto: number;
  lucroTotal: number;
  totalInvestido: number;
  totalDepositado: number;
  totalSacado: number;
  saldoBanca: number;
  totalApostas?: number;
  apostasGanhas?: number;
  apostasPerdidas?: number;
  apostasPendentes?: number;
  valorPerdido?: number;
  totalGanhos?: number;
  totalInvestidoPendente?: number;
}

export interface LucroAcumuladoItem {
  date: string;
  lucro: number;
  acumulado: number;
}

export interface LucroPorTipsterItem {
  tipster: string;
  lucro: number;
}

export interface ResumoEsporteItem {
  esporte: string;
  apostas: number;
  ganhas: number;
  aproveitamento: number;
  stakeMedia: number;
  lucro: number;
  roi: number;
}

export interface ResumoCasaItem {
  casa: string;
  apostas: number;
  ganhas: number;
  aproveitamento: number;
  stakeMedia: number;
  lucro: number;
  saldo: number;
  roi: number;
}

export interface ApostaRecente {
  id: string;
  evento?: string | null;
  odd?: string | number | null;
  status?: string | null;
  lucro?: number | null;
  dataEvento?: string | Date | null;
  esporte?: string | null;
  casaDeAposta?: string | null;
}

interface DashboardResponse {
  metricas: DashboardMetricas;
  lucroAcumulado: LucroAcumuladoItem[];
  lucroPorTipster: LucroPorTipsterItem[];
  resumoPorEsporte: ResumoEsporteItem[];
  resumoPorCasa: ResumoCasaItem[];
}

export interface EvolucaoBancaChartItem {
  date: string;
  diário: number;
  acumulado: number;
}

// ============================================
// Valores Iniciais
// ============================================

const initialFilters: DashboardFilters = {
  status: '',
  tipster: '',
  casa: '',
  dataInicio: '',
  dataFim: '',
  bancaId: '',
};

const initialMetricas: DashboardMetricas = {
  roi: 0,
  taxaAcerto: 0,
  lucroTotal: 0,
  totalInvestido: 0,
  totalDepositado: 0,
  totalSacado: 0,
  saldoBanca: 0,
  totalApostas: 0,
  apostasGanhas: 0,
  apostasPerdidas: 0,
  apostasPendentes: 0,
  valorPerdido: 0,
  totalGanhos: 0,
  totalInvestidoPendente: 0,
};

// ============================================
// Helpers
// ============================================

/**
 * Converte filtros para query params da API
 */
const buildParams = (filters: DashboardFilters): Partial<DashboardFilters> => {
  const params: Partial<DashboardFilters> = {};

  if (filters.status && filters.status !== 'Tudo' && filters.status !== '') {
    params.status = filters.status;
  }
  if (filters.tipster) {
    params.tipster = filters.tipster;
  }
  if (filters.casa) {
    params.casa = filters.casa;
  }
  if (filters.dataInicio) {
    params.dataInicio = filters.dataInicio;
  }
  if (filters.dataFim) {
    params.dataFim = filters.dataFim;
  }
  if (filters.bancaId) {
    params.bancaId = filters.bancaId;
  }

  return params;
};

const periodMap: Record<string, number | undefined> = {
  '7': 7,
  '30': 30,
  '60': 60,
  '90': 90,
  '180': 180,
  '365': 365,
};

const sliceByPeriod = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico: string
): LucroAcumuladoItem[] => {
  if (lucroAcumulado.length === 0) return [];
  const periodo = periodMap[periodoGrafico];
  return periodo ? lucroAcumulado.slice(-periodo) : lucroAcumulado;
};

const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const formatChartDayLabel = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

const formatISODate = (date: Date): string => date.toISOString().split('T')[0];

const getReferenceEndDate = (
  lucroAcumulado: LucroAcumuladoItem[],
  referenceDate?: Date
): Date => {
  if (referenceDate) {
    return startOfDay(referenceDate);
  }

  if (lucroAcumulado.length === 0) {
    return startOfDay(new Date());
  }

  return startOfDay(new Date(lucroAcumulado[lucroAcumulado.length - 1].date));
};

/**
 * Prepara dados para o gráfico de evolução da banca
 */
const prepareChartData = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico: string,
  referenceDate?: Date
): EvolucaoBancaChartItem[] => {
  if (lucroAcumulado.length === 0) return [];

  const sortedData = [...lucroAcumulado].sort((a, b) => a.date.localeCompare(b.date));
  const periodLength = periodMap[periodoGrafico];

  if (!periodLength) {
    return sortedData.map((item) => ({
      date: formatChartDayLabel(new Date(item.date)),
      diário: Number(item.lucro.toFixed(2)),
      acumulado: Number(item.acumulado.toFixed(2)),
    }));
  }

  const endDate = getReferenceEndDate(sortedData, referenceDate);
  const startDate = startOfDay(new Date(endDate));
  startDate.setDate(startDate.getDate() - (periodLength - 1));

  const datasetByDate = new Map<string, LucroAcumuladoItem>();
  sortedData.forEach((item) => datasetByDate.set(item.date, item));

  let baselineAcumulado = 0;
  for (const item of sortedData) {
    const itemDate = new Date(item.date);
    if (itemDate < startDate) {
      baselineAcumulado = item.acumulado;
    } else {
      break;
    }
  }

  const filledData: EvolucaoBancaChartItem[] = [];
  const cursor = new Date(startDate);
  let lastAcumulado = baselineAcumulado;

  while (cursor <= endDate) {
    const isoKey = formatISODate(cursor);
    const existingEntry = datasetByDate.get(isoKey);
    const dailyValue = existingEntry ? existingEntry.lucro : 0;

    if (existingEntry) {
      lastAcumulado = existingEntry.acumulado;
    }

    filledData.push({
      date: formatChartDayLabel(cursor),
      diário: Number(dailyValue.toFixed(2)),
      acumulado: Number(lastAcumulado.toFixed(2)),
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return filledData;
};

/**
 * Calcula crescimento percentual entre primeiro e último valor
 */
const calculateGrowthPercent = (chartData: EvolucaoBancaChartItem[]): number => {
  if (chartData.length < 2) return 0;

  const primeiro = chartData[0]?.acumulado ?? 0;
  const ultimo = chartData[chartData.length - 1]?.acumulado ?? 0;

  if (primeiro === 0) return 0;
  return ((ultimo - primeiro) / Math.abs(primeiro)) * 100;
};

/**
 * Encontra o melhor dia do período
 */
const findBestDay = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico?: string
): { valor: number; data: string } => {
  const dataset = periodoGrafico ? sliceByPeriod(lucroAcumulado, periodoGrafico) : lucroAcumulado;
  if (dataset.length === 0) return { valor: 0, data: '' };

  const melhor = dataset.reduce(
    (max, item) => (item.lucro > max.lucro ? item : max),
    dataset[0]
  );

  return {
    valor: melhor.lucro,
    data: new Date(melhor.date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long'
    }),
  };
};

/**
 * Calcula média diária de lucro
 */
const calculateDailyAverage = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico: string
): number => {
  const sliced = sliceByPeriod(lucroAcumulado, periodoGrafico);
  if (sliced.length === 0) return 0;
  const soma = sliced.reduce((acc, item) => acc + item.lucro, 0);

  return soma / sliced.length;
};

// ============================================
// Hook Principal
// ============================================

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
    
    // Mapeamento de campos extras se necessário (como feito no código original)
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

  // Novo: cálculo do pior dia
  const findWorstDay = (
    lucroAcumulado: LucroAcumuladoItem[],
    periodoGrafico?: string
  ): { valor: number; data: string } => {
    const dataset = periodoGrafico ? sliceByPeriod(lucroAcumulado, periodoGrafico) : lucroAcumulado;
    if (dataset.length === 0) return { valor: 0, data: '' };
    const pior = dataset.reduce(
      (min, item) => (item.lucro < min.lucro ? item : min),
      dataset[0]
    );
    return {
      valor: pior.lucro,
      data: new Date(pior.date).toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
      }),
    };
  };

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
