// Funções de verificação de tipo (Type Guards)
// Movidas de Analise.tsx para melhor organização

export interface HeatmapCell {
  investido: number;
  resultado: number;
  roi: number;
}

export type HeatmapRow = Record<string, HeatmapCell | undefined>;
export type HeatmapData = Record<string, HeatmapRow | undefined>;

export interface AnaliseViewState {
  evolucaoRoiMensal: { mes: string; roi: number }[];
  distribuicaoOdds: { faixa: string; quantidade: number }[];
  heatmap: HeatmapData;
  comparacaoBookmakers: { casa: string; investido: number; resultado: number; roi: number }[];
  winRatePorEsporte: { esporte: string; total: number; ganhas: number; winRate: number }[];
}

export const defaultHeatmap: HeatmapData = {};
export const emptyAnaliseState: AnaliseViewState = {
  evolucaoRoiMensal: [],
  distribuicaoOdds: [],
  heatmap: defaultHeatmap,
  comparacaoBookmakers: [],
  winRatePorEsporte: [],
};

export const isRecord = (value: unknown): value is Record<string, unknown> => 
  typeof value === 'object' && value !== null;

export const isFiniteNumber = (value: unknown): value is number => 
  typeof value === 'number' && Number.isFinite(value);

export const isStringValue = (value: unknown): value is string => 
  typeof value === 'string';

export const isArrayOf = <T,>(value: unknown, predicate: (entry: unknown) => entry is T): value is T[] => {
  return Array.isArray(value) && value.every(predicate);
};

export const isRoiEntry = (value: unknown): value is { mes: string; roi: number } => {
  return isRecord(value) && isStringValue(value.mes) && isFiniteNumber(value.roi);
};

export const isOddDistribution = (value: unknown): value is { faixa: string; quantidade: number } => {
  return isRecord(value) && isStringValue(value.faixa) && isFiniteNumber(value.quantidade);
};

export const isBookmakerComparison = (value: unknown): value is { casa: string; investido: number; resultado: number; roi: number } => {
  return (
    isRecord(value) &&
    isStringValue(value.casa) &&
    isFiniteNumber(value.investido) &&
    isFiniteNumber(value.resultado) &&
    isFiniteNumber(value.roi)
  );
};

export const isWinRateEntry = (value: unknown): value is { esporte: string; total: number; ganhas: number; winRate: number } => {
  return (
    isRecord(value) &&
    isStringValue(value.esporte) &&
    isFiniteNumber(value.total) &&
    isFiniteNumber(value.ganhas) &&
    isFiniteNumber(value.winRate)
  );
};

export const isHeatmapCell = (value: unknown): value is HeatmapCell => {
  return (
    isRecord(value) &&
    isFiniteNumber(value.investido) &&
    isFiniteNumber(value.resultado) &&
    isFiniteNumber(value.roi)
  );
};

export const isHeatmapRow = (value: unknown): value is HeatmapRow => {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((cell) => cell === undefined || isHeatmapCell(cell));
};

export const isHeatmapData = (value: unknown): value is HeatmapData => {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((row) => row === undefined || isHeatmapRow(row));
};

export const normalizeHeatmap = (value: unknown): HeatmapData => (isHeatmapData(value) ? value : defaultHeatmap);

export const isAnaliseState = (value: unknown): value is AnaliseViewState => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isArrayOf(value.evolucaoRoiMensal, isRoiEntry) &&
    isArrayOf(value.distribuicaoOdds, isOddDistribution) &&
    isHeatmapData(value.heatmap) &&
    isArrayOf(value.comparacaoBookmakers, isBookmakerComparison) &&
    isArrayOf(value.winRatePorEsporte, isWinRateEntry)
  );
};
