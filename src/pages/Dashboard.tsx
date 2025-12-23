import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  Plus,
  TrendingUp,
  TrendingDown,
  Trophy,
  Wallet,
  Upload,
  Hourglass,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import FilterPopover from '../components/FilterPopover';
import DropdownSelect from '../components/DropdownSelect';
import DateInput from '../components/DateInput';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import { formatCurrency, formatPercent, getFirstName, formatAxisCurrency } from '../utils/formatters';
import { useDashboardData, useTipsters, useBancas, useChartContainer } from '../hooks';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../components/ui/utils';
import ImportCSVModal from '../components/ImportCSVModal';
import { DashboardSkeleton } from '../components/skeletons/DashboardSkeleton';
import { ChartSkeleton } from '../components/skeletons/ChartSkeleton';
import {
  formatSignedPercent,
  formatSignedCurrency,
  getSportIcon,
  getSportDisplayName,
} from '../utils/dashboardUtils';
import {
  betStatusPillBaseClass,
  betStatusPillVariants,
} from '../constants/betStatusStyles';
import { ROUTES } from '../routes';

const DashboardChart = lazy(() => import('../components/dashboard/DashboardChart'));



const timeframeOptions = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
];

const labelTextClass = 'text-white/65';
const softLabelTextClass = 'text-white/55';


interface BreakdownCardItem {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  roi: number;
  lucro: number;
  apostas: number;
  ganhas: number;
  aproveitamento: number;
  stake: number;
  extraStats?: {
    label: string;
    value: string;
    helper?: string;
    highlight?: 'positive' | 'negative';
  }[];
}

interface BreakdownListProps {
  items: BreakdownCardItem[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  emptyMessage: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedSport, setExpandedSport] = useState<string | null>(null);
  const [expandedCasa, setExpandedCasa] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const {
    loading,
    profile,
    metricas,
    resumoPorEsporte,
    resumoPorCasa,
    apostasRecentes,
    loadingApostasRecentes,
    filters,
    handleFilterChange,
    clearFilters,
    activeFiltersCount,
    periodoGrafico,
    setPeriodoGrafico,
    evolucaoBancaChart,
    crescimentoPercentual,
    melhorDia,
    piorDia,
    mediaDiaria,
    fetchDashboardData,
  } = useDashboardData();

  const {
    containerRef: evolucaoChartRef,
    hasSize: evolucaoChartReady,
    dimensions: evolucaoChartDimensions,
  } = useChartContainer({ minHeight: 200, minWidth: 200 });
  const evolucaoChartWidth = Math.max(evolucaoChartDimensions.width, 0);
  const evolucaoChartHeight = Math.max(evolucaoChartDimensions.height, 0);

  const { tipsters } = useTipsters();
  const { bancas: userBancas, loading: bancasLoading } = useBancas();

  const defaultBancaId = useMemo(() => {
    if (!userBancas.length) return '';
    const padrao = userBancas.find((banca) => banca.padrao);
    return padrao?.id ?? userBancas[0]?.id ?? '';
  }, [userBancas]);

  useEffect(() => {
    if (!defaultBancaId) return;
    const bancaStillExists = userBancas.some((banca) => banca.id === filters.bancaId);
    const shouldSync = !filters.bancaId || !bancaStillExists;
    if (shouldSync && filters.bancaId !== defaultBancaId) {
      handleFilterChange('bancaId', defaultBancaId);
    }
  }, [defaultBancaId, filters.bancaId, handleFilterChange, userBancas]);

  const handleApplyFilters = () => {
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    clearFilters();
    setFiltersOpen(false);
  };

  const rawAccuracyPercent = Number.isFinite(metricas.taxaAcerto) ? metricas.taxaAcerto : 0;
  const normalizedAccuracyPercent = rawAccuracyPercent > 1 ? rawAccuracyPercent / 100 : rawAccuracyPercent;
  const accuracyPercent = Math.min(Math.max(normalizedAccuracyPercent, 0), 1);
  const accuracyPercentLabel = formatPercent(accuracyPercent * 100);
  const totalApostas = metricas.totalApostas ?? 0;
  const apostasGanhas = metricas.apostasGanhas ?? Math.round(totalApostas * accuracyPercent);
  const derrotasCalculadas = metricas.apostasPerdidas ?? Math.max(totalApostas - apostasGanhas, 0);
  const derrotasLabel = derrotasCalculadas === 1 ? 'derrota' : 'derrotas';
  const apostasLabel = totalApostas === 1 ? 'aposta' : 'apostas';
  const accuracyDetailText = `${derrotasCalculadas} ${derrotasLabel} de ${totalApostas} ${apostasLabel}`;
  const handleNovaAposta = () => {
    navigate(ROUTES.ATUALIZAR, { state: { openNovaAposta: true } });
  };

  const sportBreakdown = useMemo<BreakdownCardItem[]>(
    () =>
      resumoPorEsporte.slice(0, 4).map((item, index) => ({
        id: item.esporte || `esporte-${index}`,
        icon: getSportIcon(item.esporte),
        name: item.esporte || 'Outros',
        subtitle: `${item.apostas} apostas • ${formatPercent(item.aproveitamento)} de vitórias`,
        roi: item.roi,
        lucro: item.lucro,
        apostas: item.apostas,
        ganhas: item.ganhas,
        aproveitamento: item.aproveitamento,
        stake: item.stakeMedia,
      })),
    [resumoPorEsporte]
  );

  const casaBreakdown = useMemo<BreakdownCardItem[]>(
    () =>
      resumoPorCasa.slice(0, 4).map((item, index) => ({
        id: item.casa || `casa-${index}`,
        icon: '🏦',
        name: item.casa || 'Outras casas',
        subtitle: `${item.apostas} apostas \u2022 ${formatPercent(item.aproveitamento)} de vit\u00F3rias`,
        roi: item.roi,
        lucro: item.lucro,
        apostas: item.apostas,
        ganhas: item.ganhas,
        aproveitamento: item.aproveitamento,
        stake: item.stakeMedia,
        extraStats: [
          {
            label: 'Saldo',
            value: formatCurrency(item.saldo),
            highlight: item.saldo >= 0 ? 'positive' : 'negative',
          },
        ],
      })),
    [resumoPorCasa]
  );

  const lucroPeriodo = useMemo(
    () => evolucaoBancaChart.reduce((total, item) => total + item.diário, 0),
    [evolucaoBancaChart]
  );
  const periodoDiasLabel = `${periodoGrafico} dias`;
  const melhorDiaFormatado = useMemo(() => {
    if (!melhorDia.data) return 'Sem histórico';
    const parsed = new Date(melhorDia.data);
    if (Number.isNaN(parsed.getTime())) return melhorDia.data;
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  }, [melhorDia.data]);
  const crescimentoLabel = formatSignedPercent(crescimentoPercentual);
  const crescimentoNegativo = crescimentoPercentual < 0;
  const GrowthTrendIcon = crescimentoNegativo ? ArrowDownRight : ArrowUpRight;
  const growthColorClass = crescimentoNegativo ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-brand-neon-light';

  const filterInputClass =
    'mt-2 w-full rounded-2xl border border-gray-300 dark:border-border/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted transition focus-visible:border-emerald-500 dark:focus-visible:border-brand-emerald focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:focus-visible:ring-brand-emerald/30';

  const sectionCardClass = useMemo(() => {
    const base = 'rounded-[32px] border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-700/20 dark:bg-transparent dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:hover:shadow-glow';
    
    if (theme === 'dark-standard') {
      return cn(base, 'dark:bg-[#08181a] dark:border-[#06322d] dark:shadow-none');
    }
    
    return cn(base, 'dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20');
  }, [theme]);

  const evolutionCardClass = useMemo(() => {
    const base = 'rounded-[32px] border border-gray-200 bg-white p-6 sm:p-8 text-gray-900 shadow-xl backdrop-blur-2xl transition hover:-translate-y-0.5 hover:shadow-lg dark:border-emerald-700/20 dark:bg-transparent dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:hover:shadow-glow';

    if (theme === 'dark-standard') {
      return cn(base, 'dark:bg-[#08181a] dark:border-[#06322d] dark:shadow-none');
    }
    
    return cn(base, 'dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20');
  }, [theme]);

  const timeframeSwitchBaseClass =
    'rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-neon/40';
  const evolutionChartShellClass =
    'rounded-[28px] border border-gray-200 bg-gray-50/50 p-4 sm:p-6 shadow-sm backdrop-blur transition-all duration-300 hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-black/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] dark:hover:border-white/20 dark:hover:bg-black/20';
  const lucroLineGradientId = 'lucroLineGradient';

  // Show skeleton on initial load
  if (loading && metricas.saldoBanca === 0 && metricas.totalApostas === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 text-foreground">
      <div className="mb-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={cn('text-2xs uppercase tracking-[0.3em]', softLabelTextClass)}>Visão geral</p>
            <h1 className="text-3xl font-semibold">
              Bem-vindo de volta, {profile ? getFirstName(profile.nomeCompleto) : 'Usuário'} 👋
            </h1>
            <p className={cn('text-sm', labelTextClass)}>Acompanhe seus números mais importantes em tempo real.</p>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-3 md:mt-0">
            {loading && (
              <span className={cn('inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs text-foreground-muted', softLabelTextClass)}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Atualizando
              </span>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              onClick={handleNovaAposta}
            >
              <Plus size={16} /> Nova aposta
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
              onClick={() => setImportModalOpen(true)}
            >
              <Download size={16} /> Importar dados
            </button>
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
              >
                <Filter size={16} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-black/20 px-2 text-xs font-semibold text-white">{activeFiltersCount}</span>
                )}
              </button>
              {filtersOpen && (
                <div className="absolute left-0 top-full mt-2 z-50">
                  <FilterPopover
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    onClear={handleClearFilters}
                    maxWidth="900px"
                    footer={
                      <button
                        type="button"
                        className="w-full rounded-2xl bg-brand-linear px-4 py-2 text-sm font-semibold text-[#f2f2f2] shadow-glow transition active:scale-[0.99]"
                        onClick={handleApplyFilters}
                      >
                        Aplicar filtros
                      </button>
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-medium text-foreground">
                        <span>Status</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todos' }, ...STATUS_APOSTAS.map((s) => ({ value: s, label: s }))]}
                          value={filters.status}
                          onChange={(val) => handleFilterChange('status', val)}
                          className={filterInputClass}
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        <span>Tipster</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todos' }, ...tipsters.filter((t) => t.ativo).map((t) => ({ value: t.nome, label: t.nome }))]}
                          value={filters.tipster}
                          onChange={(val) => handleFilterChange('tipster', val)}
                          className={filterInputClass}
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        <span>Casa de aposta</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todas' }, ...CASAS_APOSTAS.map((casa) => ({ value: casa, label: casa }))]}
                          value={filters.casa}
                          onChange={(val) => handleFilterChange('casa', val)}
                          className={filterInputClass}
                          searchable
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        <span>Banca</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todas' }, ...userBancas.map((banca) => ({ value: banca.id, label: banca.nome }))]}
                          value={filters.bancaId}
                          onChange={(val) => handleFilterChange('bancaId', val)}
                          className={filterInputClass}
                          searchable
                        />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        <span>Data (de)</span>
                        <DateInput value={filters.dataInicio} onChange={(value) => handleFilterChange('dataInicio', value)} className={filterInputClass} />
                      </label>
                      <label className="text-sm font-medium text-foreground">
                        <span>Data (até)</span>
                        <DateInput value={filters.dataFim} onChange={(value) => handleFilterChange('dataFim', value)} className={filterInputClass} />
                      </label>
                      <p className="col-span-2 mt-2 text-xs text-foreground-muted">
                        Deixe o campo vazio para considerar todo o histórico.
                      </p>
                    </div>
                  </FilterPopover>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-12">
        <div
          className={cn(
            'col-span-1 flex flex-col justify-between rounded-[32px] border border-gray-200 bg-white p-8 text-gray-900 shadow-xl backdrop-blur-2xl md:col-span-2 xl:col-span-5 hover:border-gray-300 hover:shadow-lg min-w-0',
            'dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-[#032b26] dark:via-[#0d5f52] dark:to-[#032b26] dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
          )}
        >
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 dark:text-[#5eead4]">Saldo da banca</p>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold",
                metricas.roi >= 0 
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300"
              )}>
                {metricas.roi >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {formatSignedPercent(metricas.roi)}
              </span>
            </div>
            
            <p className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              {formatCurrency(metricas.saldoBanca)}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-0">
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-emerald-100/60 mb-1">Lucro total</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(metricas.lucroTotal)}</p>
              </div>
              <button className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-full bg-gray-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 whitespace-nowrap">
                Ver detalhes <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 rounded-3xl bg-gray-50 p-6 dark:bg-[#000000]/20 backdrop-blur-md">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300">
                   <Wallet size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-emerald-100/70">Total Investido</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(metricas.totalInvestido)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                   <Hourglass size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-emerald-100/70">Valor Pendente</span>
              </div>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-300">{formatCurrency(metricas.totalInvestidoPendente || 0)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
                   <TrendingDown size={14} strokeWidth={2.5} />
                </div>
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-gray-500 dark:text-emerald-100/70">Valor Perdido</span>
              </div>
              <p className="text-xl font-bold text-rose-600 dark:text-rose-300">{formatCurrency(metricas.valorPerdido || 0)}</p>
            </div>
          </div>
        </div>

        {/* Mini Cards Depósitos e Saques */}
        <div className="flex flex-col gap-4 col-span-1 md:col-span-1 xl:col-span-2 min-w-0">
          <div className={cn(sectionCardClass, 'flex items-center gap-3 p-4 h-full')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Wallet size={18} />
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">Depósitos</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight mt-0.5">{formatCurrency(metricas.totalDepositado)}</p>
            </div>
          </div>
          <div className={cn(sectionCardClass, 'flex items-center gap-3 p-4 h-full')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">Saques</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight mt-0.5">{formatCurrency(metricas.totalSacado)}</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            sectionCardClass,
            'col-span-1 flex flex-col justify-between md:col-span-1 xl:col-span-5 min-w-0 p-6 sm:p-8'
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Trophy size={20} strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Taxa de Acerto</h3>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400/80 mt-1.5">Performance Atual</p>
              </div>
            </div>
            <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{accuracyPercentLabel}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 sm:gap-y-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 dark:divide-white/10 rounded-[24px] bg-gray-50 dark:bg-emerald-900/10 p-5 mb-2">
            <div className="flex flex-col items-center justify-center px-2 py-2 sm:py-0">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-emerald-100/60 mb-1.5">Apostas</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{totalApostas}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2 sm:py-0">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-emerald-100/60 mb-1.5">Greens</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-[#34d399] leading-none">{apostasGanhas}</span>
            </div>
            <div className="flex flex-col items-center justify-center px-2 py-2 sm:py-0">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-emerald-100/60 mb-1.5">Reds</span>
              <span className="text-2xl font-bold text-rose-600 dark:text-[#f87171] leading-none">{derrotasCalculadas}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end text-sm">
              <span className="font-medium text-gray-700 dark:text-emerald-100/80">Progresso</span>
              <span className="text-xs text-gray-500 dark:text-emerald-100/50">{accuracyDetailText}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-black/30 overflow-hidden">
              <div 
                className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] relative"
                style={{ width: `${(accuracyPercent * 100).toFixed(1)}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 rounded-full blur-[1px]" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-gray-500 dark:text-emerald-100/50">Atualizado agora</span>
            </div>
            <button className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-brand-neon hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              Ver detalhes <ArrowRight size={12} />
            </button>
          </div>
        </div>

      </section>

      <section className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        <div className={cn(evolutionCardClass, 'space-y-6 xl:col-span-2 min-w-0')}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-white/10 dark:text-brand-neon">
                <CalendarDays className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">Evolução do Lucro</p>
                <p className="text-sm text-gray-500 dark:text-white/70">Acompanhe o desempenho financeiro do seu negócio.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 p-1 dark:border-white/10 dark:bg-black/20">
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    timeframeSwitchBaseClass,
                    periodoGrafico === option.value
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-brand-neon dark:text-[#031d1a] dark:shadow-[0_15px_30px_rgba(0,255,157,0.35)]'
                      : 'text-gray-500 hover:text-gray-900 dark:text-white/65 dark:hover:text-white'
                  )}
                  onClick={() => setPeriodoGrafico(option.value)}
                  disabled={loading}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <StatCard
              title="Melhor dia"
              value={formatCurrency(melhorDia && melhorDia.valor ? melhorDia.valor : 0)}
              helper={melhorDia && melhorDia.data ? melhorDia.data : 'Sem dados'}
              icon={<CalendarDays className="h-5 w-5" />}
              color="emerald"
            />
            <StatCard
              title="Pior dia"
              value={formatCurrency(piorDia && piorDia.valor ? piorDia.valor : 0)}
              helper={piorDia && piorDia.data ? piorDia.data : 'Sem dados'}
              icon={<CalendarDays className="h-5 w-5" />}
              color="red"
            />
            <StatCard
              title="Média diária"
              value={formatCurrency(mediaDiaria || 0)}
              helper={`Últimos ${periodoDiasLabel}`}
              icon={<CalendarDays className="h-5 w-5" />}
              color="blue"
            />
          </div>

          <div className={evolutionChartShellClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-white">Gráfico de desempenho</p>
                <p className="text-sm text-white/60">Lucro diário em reais</p>
              </div>
            </div>
            <div ref={evolucaoChartRef} className="mt-6 h-72 w-full">
              <Suspense fallback={<ChartSkeleton />}>
                <DashboardChart
                  width={evolucaoChartWidth}
                  height={evolucaoChartHeight}
                  data={evolucaoBancaChart}
                  isLoading={!evolucaoChartReady}
                />
              </Suspense>
            </div>
          </div>
        </div>

        <div className={cn(sectionCardClass, 'space-y-5 min-w-0')}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Performance recente</h3>
              <p className={cn('text-sm text-foreground-muted', labelTextClass)}>Últimas 5 apostas registradas</p>
            </div>
            <TrendingUp size={18} className="text-brand-emerald" />
          </div>

          {loadingApostasRecentes ? (
            <div className={cn('flex h-48 items-center justify-center text-foreground-muted', softLabelTextClass)}>
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : apostasRecentes.length === 0 ? (
            <div className={cn('flex h-48 items-center justify-center text-sm text-foreground-muted', labelTextClass)}>Nenhuma aposta recente.</div>
          ) : (
            <div className="space-y-3">
              {apostasRecentes.slice(0, 5).map((aposta) => {
                const rawStatus = aposta.status ?? 'Pendente';
                
                // Helper para normalizar o status
                const getStatusKey = (s: string): keyof typeof betStatusPillVariants => {
                  const upper = s.toUpperCase();
                  if (upper === 'GANHOU' || upper === 'GANHA') return 'Ganha';
                  if (upper === 'PERDEU' || upper === 'PERDIDA') return 'Perdida';
                  if (upper === 'MEIO GANHA') return 'Meio Ganha';
                  if (upper === 'MEIO PERDIDA') return 'Meio Perdida';
                  
                  const match = Object.keys(betStatusPillVariants).find(k => k.toUpperCase() === upper);
                  return (match as keyof typeof betStatusPillVariants) || 'default';
                };

                const statusKey = getStatusKey(rawStatus);
                const statusClass = betStatusPillVariants[statusKey];

                const isPositive = statusKey === 'Ganha' || statusKey === 'Meio Ganha';
                const isNegative = statusKey === 'Perdida' || statusKey === 'Meio Perdida';
                
                const valueClass = isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-gray-900 dark:text-foreground';
                const rawDate = aposta.dataEvento ? new Date(aposta.dataEvento) : null;
                const formattedDate = rawDate && !Number.isNaN(rawDate.getTime())
                  ? rawDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                  : '—';
                const description = aposta.evento ?? 'Aposta sem descrição';
                const oddLabel = aposta.odd ?? '-';
                const bettingHouse = aposta.casaDeAposta ?? 'Casa desconhecida';

                return (
                  <div
                    key={aposta.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm transition-all duration-300 hover:bg-gray-100 hover:border-gray-200 hover:scale-[1.01] dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20"
                  >
                    <div className="space-y-0.5 w-full sm:w-auto">
                      <p className="font-semibold text-gray-900 dark:text-foreground">{description}</p>
                      <p className={cn('text-xs text-foreground-muted', softLabelTextClass)}>
                        {formattedDate} · Odd {oddLabel} · {bettingHouse}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <span className={cn(betStatusPillBaseClass, statusClass)}>
                        {rawStatus}
                      </span>
                      <span className={cn('text-base font-semibold', valueClass)}>
                        {formatSignedCurrency(aposta.lucro ?? 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        <div className={cn(sectionCardClass, 'space-y-5 min-w-0')}>
          <div>
            <h3 className="text-lg font-semibold">Desempenho por esporte</h3>
            <p className={cn('text-sm text-foreground-muted', labelTextClass)}>Descubra onde a banca performa melhor</p>
          </div>
          <BreakdownList
            items={sportBreakdown}
            expandedId={expandedSport}
            onToggle={setExpandedSport}
            emptyMessage="Nenhum esporte registrado no período."
          />
        </div>

        <div className={cn(sectionCardClass, 'space-y-5 min-w-0')}>
          <div>
            <h3 className="text-lg font-semibold">Desempenho por casa</h3>
            <p className={cn('text-sm text-foreground-muted', labelTextClass)}>Veja quais casas oferecem melhor ROI</p>
          </div>
          <BreakdownList
            items={casaBreakdown}
            expandedId={expandedCasa}
            onToggle={setExpandedCasa}
            emptyMessage="Nenhum histórico por casa disponível."
          />
        </div>
      </section>

      {/* Import Modal */}
      <ImportCSVModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        bancas={userBancas}
        defaultBancaId={defaultBancaId}
        onImportSuccess={() => {
          void fetchDashboardData();
        }}
      />
    </div>
  );
}

function BreakdownList({ items, expandedId, onToggle, emptyMessage }: BreakdownListProps) {
  if (items.length === 0) {
    return (
      <div
        className={cn(
          'rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500 backdrop-blur dark:border-white/10 dark:bg-[#0b1f1f]/60 dark:text-white/60',
          labelTextClass
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        const lucroPositive = item.lucro > 0;
        const lucroNeutral = item.lucro === 0;
        const rawWinPercent = Number.isFinite(item.aproveitamento) ? item.aproveitamento : 0;
        const clampedWinPercent = Math.min(Math.max(rawWinPercent, 0), 100);
        const stakeValue = Number.isFinite(item.stake) ? item.stake : 0;
        const roiValue = Number.isFinite(item.roi) ? item.roi : 0;
        const progressColor =
          clampedWinPercent >= 50
            ? 'from-emerald-500 to-teal-400'
            : clampedWinPercent >= 30
              ? 'from-amber-500 to-orange-400'
              : 'from-rose-500 to-red-500';
        const roiBadgeClass =
          roiValue > 0
            ? 'border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
            : roiValue < 0
              ? 'border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300'
              : 'border border-gray-200 bg-gray-50 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/70';
        const lucroClass = lucroPositive ? 'text-emerald-600 dark:text-emerald-300' : lucroNeutral ? 'text-gray-500 dark:text-white/70' : 'text-rose-600 dark:text-rose-300';
        const roiNormalized = Math.max(0, Math.min(100, (roiValue + 100) / 2));

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-2xl border bg-white text-foreground shadow-sm transition-all duration-300 backdrop-blur-sm dark:bg-[#0b1f1f] dark:shadow-[0_25px_35px_rgba(0,0,0,0.35)]',
              isExpanded ? 'border-emerald-500/40 shadow-emerald-500/10' : 'border-gray-200 hover:border-gray-300 hover:scale-[1.01] dark:border-white/5 dark:hover:border-white/20'
            )}
          >
            <button
              type="button"
              onClick={() => onToggle(isExpanded ? null : item.id)}
              className="flex flex-wrap sm:flex-nowrap w-full items-center justify-between gap-4 px-4 py-4 text-left"
              aria-expanded={isExpanded}
            >
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-100 bg-emerald-50 text-2xl text-emerald-600 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#1b3a37] dark:to-[#132826] dark:text-white">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-white/60">
                    <span>{item.apostas} apostas</span>
                    <span>•</span>
                    <span className={cn(rawWinPercent >= 40 ? 'text-emerald-600 dark:text-emerald-300' : rawWinPercent === 0 ? 'text-gray-500 dark:text-white/60' : 'text-rose-600 dark:text-rose-300')}>
                      {formatPercent(clampedWinPercent)} win
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-auto sm:ml-0">
                <div className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold', roiBadgeClass)}>{formatSignedPercent(roiValue)}</div>
                <div className="text-right">
                  <p className={cn('text-base font-semibold', lucroClass)}>{formatSignedCurrency(item.lucro)}</p>
                  <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-white/50">Lucro</p>
                </div>
                <ChevronDown className={cn('ml-2 h-5 w-5 text-gray-400 transition dark:text-white/50', isExpanded && 'rotate-180 text-gray-600 dark:text-white/80')} />
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50 px-4 pb-5 pt-4 dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-3 pt-2 text-sm text-gray-900 dark:text-white sm:grid-cols-2 lg:grid-cols-4">
                  <BreakdownStat label="Apostas" value={item.apostas.toString()} />
                  <BreakdownStat
                    label="Vitórias"
                    value={item.ganhas.toString()}
                    helper={`${formatPercent(clampedWinPercent)} de aproveitamento`}
                    highlight={rawWinPercent >= 50 ? 'positive' : rawWinPercent <= 30 ? 'negative' : undefined}
                  />
                  <BreakdownStat label="Stake médio" value={formatCurrency(stakeValue)} helper="média" />
                  <BreakdownStat
                    label="Lucro total"
                    value={formatSignedCurrency(item.lucro)}
                    highlight={item.lucro >= 0 ? 'positive' : 'negative'}
                  />
                </div>

                {item.extraStats?.length ? (
                  <div className="mt-3 grid gap-3 text-sm text-gray-900 dark:text-white sm:grid-cols-2 lg:grid-cols-4">
                    {item.extraStats.map((extra) => (
                      <BreakdownStat
                        key={`${item.id}-${extra.label}`}
                        label={extra.label}
                        value={extra.value}
                        helper={extra.helper}
                        highlight={extra.highlight}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
                    <span>Taxa de aproveitamento</span>
                    <span>{formatPercent(clampedWinPercent)}</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full border border-gray-200 bg-gray-200 dark:border-white/10 dark:bg-[#071312]">
                    <div
                      className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', progressColor)}
                      style={{ width: `${clampedWinPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 text-xs text-gray-500 dark:text-white/60 sm:flex-row sm:items-center sm:justify-between">
                  <span>Retorno sobre investimento</span>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, index) => {
                        const threshold = (index + 1) * 20;
                        const filled = roiNormalized >= threshold;
                        const fillClass = filled
                          ? roiNormalized >= 60
                            ? 'bg-emerald-500'
                            : roiNormalized >= 40
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          : 'bg-gray-200 dark:bg-white/10';

                        return <span key={`${item.id}-roi-${index}`} className={cn('h-6 w-1.5 rounded-sm transition', fillClass)} />;
                      })}
                    </div>
                    <span className={cn('text-sm font-semibold', roiValue > 0 ? 'text-emerald-600 dark:text-emerald-300' : roiValue < 0 ? 'text-rose-600 dark:text-rose-300' : 'text-gray-500 dark:text-white/70')}>
                      {formatSignedPercent(roiValue)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BreakdownStat({
  label,
  value,
  helper,
  highlight,
}: {
  label: string;
  value: string;
  helper?: string;
  highlight?: 'positive' | 'negative';
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-[#0d2424]">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 dark:text-white/45">{label}</p>
      <p
        className={cn(
          'mt-2 text-xl font-semibold text-gray-900 dark:text-white',
          highlight === 'positive' && 'text-emerald-600 dark:text-emerald-300',
          highlight === 'negative' && 'text-rose-600 dark:text-rose-300'
        )}
      >
        {value}
      </p>
      {helper && <p className="text-xs text-gray-500 dark:text-white/60">{helper}</p>}
    </div>
  );
}
