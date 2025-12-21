import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bar, BarChart, Cell, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { chartTheme } from '../utils/chartTheme';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { AnaliseFilters as AnaliseFiltersComponent } from '../components/analise/AnaliseFilters';
import AnaliseRoiChart from '../components/analise/AnaliseRoiChart';
import AnaliseOddsChart from '../components/analise/AnaliseOddsChart';
import { chartCardBaseClass, chartCardInteractiveClass, chartTitleClass } from '../components/analise/chartStyles';
import useAnaliseData from '../hooks/useAnaliseData';
import { useBancas } from '../hooks/useBancas';
import { useChartContainer } from '../hooks/useChartContainer';
import type { AnaliseFilters as AnaliseFiltersType } from '../types/AnaliseFilters';
import type { RoiChartPoint } from '../types/RoiChartPoint';
import type { OddsChartPoint } from '../types/OddsChartPoint';
import { 
  defaultHeatmap, 
  emptyAnaliseState, 
  isAnaliseState,
  normalizeHeatmap
} from '../utils/typeGuards';
import type { 
  HeatmapCell, 
  HeatmapData, 
  AnaliseViewState 
} from '../utils/typeGuards';

const heatmapRows = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const heatmapCols = ['Manhã (06-12)', 'Tarde (12-18)', 'Noite (18-24)', 'Madrugada (00-06)'];

const defaultDistribuicaoOdds: OddsChartPoint[] = [
  { faixa: '1.00-1.50', quantidade: 0 },
  { faixa: '1.51-2.00', quantidade: 0 },
  { faixa: '2.01-3.00', quantidade: 0 },
  { faixa: '3.01-5.00', quantidade: 0 },
  { faixa: '5.01+', quantidade: 0 },
];
const initialFilters: AnaliseFiltersType = {
  bancaId: '',
  status: '',
  tipster: '',
  casa: '',
  esporte: '',
  evento: '',
  dataInicio: '',
  dataFim: '',
  oddMin: '',
  oddMax: '',
};

export default function Analise() {
  const [filters, setFilters] = useState<AnaliseFiltersType>(initialFilters);
  const { bancas, loading: loadingBancas, error: errorBancas, refetch: refetchBancas } = useBancas();
  const autoSyncBancaRef = useRef(true);
  const preferredBancaId = useMemo(() => {
    if (bancas.length === 0) {
      return '';
    }
    const padrao = bancas.find((banca) => banca.padrao);
    return padrao?.id ?? bancas[0].id;
  }, [bancas]);

  useEffect(() => {
    const fallbackId = preferredBancaId || bancas[0]?.id || '';
    if (!fallbackId) {
      return;
    }
    setFilters((prev) => {
      const bancaExists = prev.bancaId ? bancas.some((banca) => banca.id === prev.bancaId) : false;
      const shouldForceSync = !prev.bancaId || !bancaExists || autoSyncBancaRef.current;

      if (!shouldForceSync && prev.bancaId === fallbackId) {
        autoSyncBancaRef.current = true;
        return prev;
      }

      if (!shouldForceSync) {
        return prev;
      }

      if (prev.bancaId === fallbackId) {
        autoSyncBancaRef.current = true;
        return prev;
      }

      autoSyncBancaRef.current = true;
      return { ...prev, bancaId: fallbackId };
    });
  }, [preferredBancaId, bancas]);

  const handleFiltersChange = useCallback((next: AnaliseFiltersType) => {
    setFilters((prev) => {
      if (next.bancaId && next.bancaId !== prev.bancaId) {
        autoSyncBancaRef.current = false;
      }
      return next;
    });
  }, []);

  const { data, isLoading, error, reload } = useAnaliseData(filters);

  if (errorBancas) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gráficos"
          subtitle="Visualize suas métricas e acompanhe evolução"
        />
        <div className="flex h-96 w-full flex-col items-center justify-center space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <div className="rounded-full bg-semantic-danger/10 p-4 text-semantic-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Erro ao carregar bancas</h3>
            <p className="max-w-md text-sm text-foreground-muted">
              {errorBancas.message || 'Não foi possível carregar suas bancas.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => refetchBancas()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!loadingBancas && bancas.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gráficos"
          subtitle="Visualize suas métricas e acompanhe evolução"
        />
        <div className="flex h-96 items-center justify-center">
          <EmptyState
            title="Nenhuma banca encontrada"
            description="Cadastre uma banca para visualizar a análise."
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Gráficos"
          subtitle="Visualize suas métricas e acompanhe evolução"
          actions={<AnaliseFiltersComponent value={filters} onChange={handleFiltersChange} />}
        />
        <div className="flex h-96 w-full flex-col items-center justify-center space-y-4 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <div className="rounded-full bg-semantic-danger/10 p-4 text-semantic-danger">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Erro ao carregar dados</h3>
            <p className="max-w-md text-sm text-foreground-muted">
              {error.message || 'Ocorreu um erro inesperado ao buscar os dados de análise.'}
            </p>
          </div>
          <Button variant="outline" onClick={() => reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const {
    evolucaoRoiMensal,
    distribuicaoOdds,
    heatmap: rawHeatmap,
    winRatePorEsporte,
    comparacaoBookmakers,
  } = data;

  const heatmap = normalizeHeatmap(rawHeatmap);

  // Preparar dados para gráfico de ROI mensal
  const roiMensalChart: RoiChartPoint[] = evolucaoRoiMensal.map((item) => ({
    mes: new Date(`${item.mes}-01`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    roi: item.roi,
  }));

  // Preparar dados para distribuição de odds
  const oddsChart: OddsChartPoint[] = distribuicaoOdds.length > 0 ? distribuicaoOdds : defaultDistribuicaoOdds;

  // Função para obter cor do heatmap baseado no ROI
  const getHeatmapColorClass = (roi: number): string => {
    if (roi > 10) return 'bg-semantic-success';
    if (roi > 0) return 'bg-semantic-warning-yellow';
    if (roi > -10) return 'bg-semantic-warning-light';
    return 'bg-semantic-danger';
  };

  const getHeatmapOpacity = (roi: number, investido: number): number => {
    if (investido === 0) return 0.1;
    const absRoi = Math.abs(roi);
    return Math.min(0.3 + (absRoi / 50) * 0.7, 1);
  };

  // Calcular estatísticas filtradas (por enquanto usando dados totais)
  const totalApostas = distribuicaoOdds.reduce((sum, item) => sum + item.quantidade, 0);
  const totalInvestido = comparacaoBookmakers.reduce((sum, item) => sum + item.investido, 0);
  const totalLucro = comparacaoBookmakers.reduce((sum, item) => sum + item.resultado, 0);
  const roiMedio = totalInvestido > 0 ? (totalLucro / totalInvestido) * 100 : 0;

  const stats = [
    { title: 'Apostas Filtradas', value: totalApostas.toString(), helper: 'Total de apostas', color: 'blue' as const },
    { title: 'Investimento Filtrado', value: formatCurrency(totalInvestido), helper: 'Total investido', color: 'purple' as const },
    { title: 'Lucro Filtrado', value: formatCurrency(totalLucro), helper: 'Lucro/prejuízo total', color: 'emerald' as const },
    { title: 'ROI Filtrado', value: formatPercent(roiMedio), helper: 'Retorno sobre investimento', color: 'amber' as const }
  ];
  const statGridClass = 'grid gap-6 sm:grid-cols-2 xl:grid-cols-4';
  const chartGridClass = 'grid gap-6 lg:grid-cols-2';
  const skeletonCardClass = `${chartCardBaseClass} animate-pulse`;
  const skeletonChartClass = `${chartCardBaseClass} h-[320px] animate-pulse`;
  const {
    containerRef: winRateContainerRef,
    hasSize: winRateReady,
    dimensions: winRateDimensions,
  } = useChartContainer({ minHeight: 200, minWidth: 200 });
  const winRateWidth = Math.max(winRateDimensions.width, 0);
  const winRateHeight = Math.max(winRateDimensions.height, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gráficos"
        subtitle="Visualize suas métricas e acompanhe evolução"
        actions={<AnaliseFiltersComponent value={filters} onChange={handleFiltersChange} />}
      />

      {isLoading ? (
        <div className={statGridClass}>
          {stats.map((stat) => (
            <Skeleton key={stat.title} className={`${skeletonCardClass} space-y-3`}>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">{stat.title}</div>
              <div className="text-3xl font-semibold text-white">...</div>
              <p className="text-sm text-white/50">{stat.helper}</p>
            </Skeleton>
          ))}
        </div>
      ) : (
        <div className={statGridClass}>
          {stats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} helper={stat.helper} color={stat.color} />
          ))}
        </div>
      )}

      <section className={chartGridClass}>
        {isLoading ? (
          <>
            <Skeleton className={skeletonChartClass} />
            <Skeleton className={skeletonChartClass} />
          </>
        ) : (
          <>
            <AnaliseRoiChart data={roiMensalChart} />
            <AnaliseOddsChart data={oddsChart} />
          </>
        )}
      </section>

      <section className={chartGridClass}>
        <div className={chartCardInteractiveClass}>
          <h3 className={chartTitleClass}>Win Rate por Esporte</h3>
          <div
            ref={winRateContainerRef}
            className="mt-2 w-full"
            style={{ minHeight: 260, height: 260 }}
          >
            {!winRateReady ? (
              <div className="flex h-full items-center justify-center text-xs font-medium text-foreground-muted">
                Preparando gráfico...
              </div>
            ) : winRatePorEsporte.length > 0 ? (
              <BarChart
                width={winRateWidth}
                height={winRateHeight}
                data={winRatePorEsporte.slice(0, 10)}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <defs>
                  <linearGradient id={chartTheme.gradients.winRate.id} x1="0" y1="0" x2="0" y2="1">
                    {chartTheme.gradients.winRate.stops.map((stop) => (
                      <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
                    ))}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.gridStroke} vertical={false} />
                <XAxis
                  dataKey="esporte"
                  stroke={chartTheme.axisStroke}
                  tick={{ ...chartTheme.axisTick }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tickLine={false}
                />
                <YAxis
                  stroke={chartTheme.axisStroke}
                  tick={{ ...chartTheme.axisTick }}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', style: chartTheme.axisLabel }}
                />
                <Tooltip
                  contentStyle={{
                    ...chartTheme.tooltip,
                    border: `1px solid ${chartTheme.colors.borderSuccess}`
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'winRate') {
                      return [formatPercent(value), 'Win Rate'];
                    }
                    return [value, name === 'ganhas' ? 'Ganhas' : 'Total'];
                  }}
                  labelStyle={chartTheme.tooltipLabel}
                  itemStyle={chartTheme.tooltipItem}
                />
                <Bar
                  dataKey="winRate"
                  fill={`url(#${chartTheme.gradients.winRate.id})`}
                  radius={chartTheme.barRadius}
                  animationDuration={800}
                  maxBarSize={32}
                >
                  {winRatePorEsporte.slice(0, 10).map((entry) => (
                    <Cell key={`cell-${entry.esporte}`} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState title="Sem dados" description="Nenhuma aposta encontrada para os filtros." />
              </div>
            )}
          </div>
        </div>
        <div className={chartCardInteractiveClass}>
          <h3 className={chartTitleClass}>Heatmap de Performance</h3>
          <div className="mt-6 overflow-x-auto text-white">
            <div
              className="grid gap-2 text-xs"
              style={{ gridTemplateColumns: `120px repeat(${heatmapCols.length}, minmax(0, 1fr))` }}
            >
              <div />
              {heatmapCols.map((col) => (
                <span
                  key={col}
                  className="text-center text-[0.7rem] font-semibold uppercase tracking-wide text-white/60"
                >
                  {col.split(' ')[0]}
                </span>
              ))}
              {heatmapRows.map((row) => (
                <div key={row} className="contents">
                  <span className="flex items-center text-sm font-semibold text-white">{row}</span>
                  {heatmapCols.map((col) => {
                    const rowData = heatmap[row];
                    const cellData = rowData?.[col];
                    const roi = cellData?.roi ?? 0;
                    const investido = cellData?.investido ?? 0;
                    const colorClass = getHeatmapColorClass(roi);
                    const opacity = getHeatmapOpacity(roi, investido);
                    const title = investido > 0 ? `ROI: ${formatPercent(roi)}\nInvestido: ${formatCurrency(investido)}` : undefined;

                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`flex h-10 items-center justify-center rounded-2xl text-[0.7rem] font-semibold transition ${colorClass} ${opacity > 0.5 ? 'text-white' : 'text-slate-900'} ${investido > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                        style={{ opacity }}
                        title={title}
                      >
                        {investido > 0 ? formatPercent(roi) : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

