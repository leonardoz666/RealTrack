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
  totalRetornoPendente?: number;
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

export interface EvolucaoBancaChartItem {
  date: string;
  diário: number;
  acumulado: number;
}

export interface DashboardResponse {
  metricas: DashboardMetricas;
  lucroAcumulado: LucroAcumuladoItem[];
  lucroPorTipster: LucroPorTipsterItem[];
  resumoPorEsporte: ResumoEsporteItem[];
  resumoPorCasa: ResumoCasaItem[];
}
