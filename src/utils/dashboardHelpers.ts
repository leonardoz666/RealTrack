import type {
  DashboardFilters,
  DashboardMetricas,
  EvolucaoBancaChartItem,
  LucroAcumuladoItem,
} from '../types/dashboard';

// ============================================
// Valores Iniciais
// ============================================

export const initialFilters: DashboardFilters = {
  status: '',
  tipster: '',
  casa: '',
  dataInicio: '',
  dataFim: '',
  bancaId: '',
};

export const initialMetricas: DashboardMetricas = {
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
  totalRetornoPendente: 0,
};

// ============================================
// Helpers
// ============================================

/**
 * Converte filtros para query params da API
 */
export const buildParams = (filters: DashboardFilters): Partial<DashboardFilters> => {
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

export const sliceByPeriod = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico: string
): LucroAcumuladoItem[] => {
  if (lucroAcumulado.length === 0) return [];
  const periodo = periodMap[periodoGrafico];
  return periodo ? lucroAcumulado.slice(-periodo) : lucroAcumulado;
};

export const startOfDay = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const formatChartDayLabel = (date: Date): string =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const formatISODate = (date: Date): string => date.toISOString().split('T')[0];

export const getReferenceEndDate = (
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
export const prepareChartData = (
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
export const calculateGrowthPercent = (chartData: EvolucaoBancaChartItem[]): number => {
  if (chartData.length < 2) return 0;

  const primeiro = chartData[0]?.acumulado ?? 0;
  const ultimo = chartData[chartData.length - 1]?.acumulado ?? 0;

  if (primeiro === 0) return 0;
  return ((ultimo - primeiro) / Math.abs(primeiro)) * 100;
};

/**
 * Encontra o melhor dia do período
 */
export const findBestDay = (
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
 * Encontra o pior dia do período
 */
export const findWorstDay = (
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

/**
 * Calcula média diária de lucro
 */
export const calculateDailyAverage = (
  lucroAcumulado: LucroAcumuladoItem[],
  periodoGrafico: string
): number => {
  const sliced = sliceByPeriod(lucroAcumulado, periodoGrafico);
  if (sliced.length === 0) return 0;
  const soma = sliced.reduce((acc, item) => acc + item.lucro, 0);

  return soma / sliced.length;
};
