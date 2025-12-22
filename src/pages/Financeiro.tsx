import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Filter,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DateInput from '../components/DateInput';
import DateRangeInput from '../components/DateRangeInput';
import FilterPopover from '../components/FilterPopover';
import DropdownSelect from '../components/DropdownSelect';
import Modal from '../components/Modal';
import { EmptyState } from '../components/ui/empty-state';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import { financeiroService, type TipoTransacao } from '../services/api';
import { useBancas } from '../hooks/useBancas';
import {
  formatCurrency,
  formatDate,
  formatDateDisplay,
  formatPercent,
  getTodayDateISO,
  normalizeDisplayToISO,
  toISODate,
} from '../utils/formatters';
import {
  type ApiError,
  type ApiFinancialSummary,
  type ApiFinancialTransaction,
} from '../types/api';
import { cn } from '../components/ui/utils';

type TipoFiltro = TipoTransacao | '';

interface FinanceiroFilters {
  bancaId: string;
  tipo: TipoFiltro;
  casa: string;
  dataDe: string;
  dataAte: string;
  observacao: string;
}

const initialFilters: FinanceiroFilters = {
  bancaId: '',
  tipo: '',
  casa: '',
  dataDe: '',
  dataAte: '',
  observacao: '',
};

interface FinanceiroFormData {
  bancaId: string;
  tipo: TipoFiltro;
  casaDeAposta: string;
  valor: string;
  dataTransacao: string;
  observacao: string;
}

const createDefaultFormData = (bancaId = '', date = getTodayDateISO()): FinanceiroFormData => ({
  bancaId,
  tipo: '',
  casaDeAposta: '',
  valor: '',
  dataTransacao: date,
  observacao: '',
});

const sectionCardClass =
  'rounded-[32px] border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop-blur-2xl dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]';
const dashboardCardShellClass =
  'rounded-[32px] border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-gray-300 hover:shadow-lg dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:hover:border-emerald-500/30 dark:hover:shadow-emerald-500/10';
const sectionLabelClass = 'text-2xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50';
const inputClass =
  'w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-white dark:placeholder:text-white/30';
const headerGhostButtonClass =
  'inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';
const headerPrimaryButtonClass =
  'inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';
const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/20 dark:hover:text-white';
const tableActionButtonDangerClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20';

const emptyStats: ApiFinancialSummary = {
  totalDepositado: 0,
  totalSacado: 0,
  resultadoApostas: 0,
  apostasPendentes: 0,
  valorApostasPendentes: 0,
  saldoAtual: 0,
  totalDepositos: 0,
  totalSaques: 0,
  apostasConcluidas: 0,
  totalTransacoes: 0,
  porCasa: {},
};

const getCurrencyParts = (value: number) => {
  const normalized = formatCurrency(Math.abs(value)).replace(/\u00A0/g, ' ').trim();
  const hasSpace = normalized.includes(' ');
  const [symbol, numericPartRaw] = hasSpace ? normalized.split(' ') : ['R$', normalized];
  const numericPart = numericPartRaw ?? '0,00';
  const [integerPart, decimalPart = '00'] = numericPart.split(',');
  return {
    symbol,
    integerPart,
    decimalPart,
  };
};

export default function Financeiro() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { bancas } = useBancas();
  const preferredBancaId = useMemo(() => {
    if (bancas.length === 0) {
      return '';
    }
    const padrao = bancas.find((banca) => banca.padrao);
    return padrao?.id ?? bancas[0].id;
  }, [bancas]);
  const [transacoes, setTransacoes] = useState<ApiFinancialTransaction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<ApiFinancialSummary>(emptyStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [formData, setFormData] = useState<FinanceiroFormData>(() => createDefaultFormData());
  const [manualDateInput, setManualDateInput] = useState(() => formatDateDisplay(getTodayDateISO()));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pendingFilters, setPendingFilters] = useState<FinanceiroFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FinanceiroFilters>(initialFilters);
  const autoSyncBancaRef = useRef(true);
  const resolvedBancaId = useMemo(
    () => appliedFilters.bancaId || preferredBancaId || (bancas[0]?.id ?? ''),
    [appliedFilters.bancaId, preferredBancaId, bancas],
  );

  useEffect(() => {
    const fallbackId = preferredBancaId || bancas[0]?.id || '';
    if (!fallbackId) {
      return;
    }

    const syncFilters = (prev: FinanceiroFilters): FinanceiroFilters => {
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
    };

    setPendingFilters(syncFilters);
    setAppliedFilters(syncFilters);
  }, [preferredBancaId, bancas]);

  useEffect(() => {
    if (!resolvedBancaId) {
      return;
    }
    setFormData((prev) => {
      const exists = prev.bancaId && bancas.some((banca) => banca.id === prev.bancaId);
      if (exists || prev.bancaId === resolvedBancaId) {
        return prev;
      }
      return { ...prev, bancaId: resolvedBancaId };
    });
  }, [resolvedBancaId, bancas]);

  const fetchTransacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!appliedFilters.bancaId) {
        setTransacoes([]);
        return;
      }

      const filters = {
        bancaId: appliedFilters.bancaId,
        tipo: appliedFilters.tipo || undefined,
        casaDeAposta: appliedFilters.casa || undefined,
        observacao: appliedFilters.observacao || undefined,
        dataInicio:
          appliedFilters.dataDe && !appliedFilters.dataAte ? appliedFilters.dataDe : appliedFilters.dataDe || undefined,
        dataFim:
          appliedFilters.dataDe && !appliedFilters.dataAte ? appliedFilters.dataDe : appliedFilters.dataAte || undefined,
      };

      const data = await financeiroService.getTransacoes(filters);
      setTransacoes(data);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setTransacoes([]);
      setError('Erro ao carregar transações. Tente recarregar a página.');
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const fetchStats = useCallback(async () => {
    const bancaIdToUse = appliedFilters.bancaId || resolvedBancaId;
    console.log('[DEBUG Financeiro] fetchStats - appliedFilters:', appliedFilters);
    console.log('[DEBUG Financeiro] fetchStats - bancaId original:', appliedFilters.bancaId);
    console.log('[DEBUG Financeiro] fetchStats - bancaId resolvido:', bancaIdToUse);

    if (!bancaIdToUse) {
      console.log('[DEBUG Financeiro] bancaId vazio, usando emptyStats');
      setStatsData(emptyStats);
      setStatsLoading(false);
      return;
    }

    try {
      setError(null);
      setStatsLoading(true);
      console.log('[DEBUG Financeiro] Chamando getSaldoGeral com bancaId:', bancaIdToUse);
      const data = await financeiroService.getSaldoGeral({ bancaId: bancaIdToUse });
      console.log('[DEBUG Financeiro] Dados recebidos:', data);
      setStatsData(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
      setStatsData(emptyStats);
      setError('Erro ao carregar estatísticas. Tente recarregar a página.');
    } finally {
      setStatsLoading(false);
    }
  }, [appliedFilters.bancaId, resolvedBancaId]);

  useEffect(() => {
    console.log('[DEBUG Financeiro] useEffect principal - appliedFilters:', appliedFilters);
    void fetchTransacoes();
    void fetchStats();
  }, [fetchTransacoes, fetchStats]);

  useEffect(() => {
    console.log('[DEBUG Financeiro] useEffect secundário - appliedFilters:', appliedFilters);
    if (appliedFilters.bancaId) {
      setStatsLoading(true);
    }
  }, [appliedFilters]);

  const handleFormChange = <K extends keyof FinanceiroFormData>(field: K, value: FinanceiroFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as string]) {
      setFormErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleFilterChange = <K extends keyof FinanceiroFilters>(field: K, value: FinanceiroFilters[K]) => {
    if (field === 'bancaId') {
      autoSyncBancaRef.current = false;
    }
    setPendingFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    setFiltersOpen(false);
  };

  const handleClearFilters = () => {
    const bancaId = pendingFilters.bancaId || appliedFilters.bancaId || resolvedBancaId;
    const reset = { ...initialFilters, bancaId }; // mantém a banca atual e limpa o restante
    autoSyncBancaRef.current = true;
    setPendingFilters(reset);
    setAppliedFilters(reset);
    setFiltersOpen(false);
  };

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(appliedFilters).filter(([key, value]) => key !== 'bancaId' && value !== '').length,
    [appliedFilters],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.bancaId) {
      errors.bancaId = 'Selecione uma banca';
    }
    if (!formData.tipo) {
      errors.tipo = 'Selecione o tipo de transação';
    }
    if (!formData.casaDeAposta) {
      errors.casaDeAposta = 'Selecione uma casa';
    }
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      errors.valor = 'Informe um valor válido';
    }
    if (!formData.dataTransacao) {
      errors.dataTransacao = 'Informe a data da transação';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const tipo = formData.tipo as TipoTransacao;
      const dataTransacaoISO = formData.dataTransacao || getTodayDateISO();

      const dataToSend = {
        bancaId: formData.bancaId,
        tipo,
        casaDeAposta: formData.casaDeAposta,
        valor: parseFloat(formData.valor),
        dataTransacao: `${dataTransacaoISO}T00:00:00`,
        observacao: formData.observacao.trim() === '' ? undefined : formData.observacao,
      };

      if (editingId) {
        await financeiroService.updateTransacao(editingId, dataToSend);
      } else {
        await financeiroService.createTransacao(dataToSend);
      }

      const today = getTodayDateISO();
      setFormData(createDefaultFormData(resolvedBancaId, today));
      setManualDateInput(formatDateDisplay(today));
      setFormErrors({});
      setEditingId(null);
      setModalOpen(false);

      await fetchTransacoes();
      await fetchStats();
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      const apiError = err as ApiError;
      const errorData = apiError.response?.data?.error;

      if (errorData) {
        const message = Array.isArray(errorData)
          ? errorData
            .map((entry) => entry.message?.trim())
            .filter((entry): entry is string => Boolean(entry && entry.length > 0))
            .join(', ') || 'Erro desconhecido.'
          : typeof errorData === 'string'
            ? errorData
            : 'Erro desconhecido.';
        alert(`Erro ao salvar transação: ${message}`);
      } else {
        showToast('Erro ao salvar transação. Tente novamente.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    const today = getTodayDateISO();
    setFormData(createDefaultFormData(resolvedBancaId, today));
    setManualDateInput(formatDateDisplay(today));
    setFormErrors({});
    setEditingId(null);
    setModalOpen(false);
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    const today = getTodayDateISO();
    setFormData(createDefaultFormData(resolvedBancaId, today));
    setManualDateInput(formatDateDisplay(today));
    setModalOpen(true);
  };

  const handleEditTransacao = (transacao: ApiFinancialTransaction) => {
    setEditingId(transacao.id);
    setFormData({
      bancaId: transacao.bancaId,
      tipo: transacao.tipo,
      casaDeAposta: transacao.casaDeAposta,
      valor: String(transacao.valor),
      dataTransacao: toISODate(transacao.dataTransacao),
      observacao: transacao.observacao ?? '',
    });
    setManualDateInput(formatDateDisplay(toISODate(transacao.dataTransacao)));
    setFormErrors({});
    setModalOpen(true);
  };

  const handleDeleteTransacao = async (transacao: ApiFinancialTransaction) => {
    if (!window.confirm('Deseja remover esta transação?')) {
      return;
    }

    try {
      await financeiroService.deleteTransacao(transacao.id);
      await fetchTransacoes();
      await fetchStats();
    } catch (err) {
      console.error('Erro ao deletar transação', err);
      showToast('Não foi possível remover a transação.', 'error');
    }
  };

  const resultadoParts = getCurrencyParts(statsData.resultadoApostas);
  const pendenteParts = getCurrencyParts(statsData.valorApostasPendentes);
  const resultadoEhNegativo = statsData.resultadoApostas < 0;
  const totalApostasConsideradas = statsData.apostasConcluidas + statsData.apostasPendentes;
  const taxaAcertoPercent = totalApostasConsideradas > 0 ? (statsData.apostasConcluidas / totalApostasConsideradas) * 100 : 0;
  const retornoPotencial = statsData.valorApostasPendentes;
  const saldoBase = statsData.totalDepositado - Math.abs(statsData.totalSacado);
  const saldoVariationPercent =
    saldoBase !== 0 ? ((statsData.saldoAtual - saldoBase) / Math.abs(saldoBase)) * 100 : 0;
  const normalizedVariation = Number.isFinite(saldoVariationPercent) ? saldoVariationPercent : 0;
  const variationIsPositive = normalizedVariation >= 0;
  const formattedVariationPercent = `${variationIsPositive ? '+' : '-'}${Math.abs(normalizedVariation).toLocaleString(
    'pt-BR',
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  )}% este mês`;
  const quickStats = [
    {
      label: 'Total Depositado',
      value: formatCurrency(statsData.totalDepositado),
      icon: ArrowUpRight,
      accent: 'bg-emerald-500/15 text-emerald-200',
    },
    {
      label: 'Total Sacado',
      value: formatCurrency(Math.abs(statsData.totalSacado)),
      icon: ArrowDownRight,
      accent: 'bg-rose-500/15 text-rose-200',
    },
    {
      label: 'Transações',
      value: statsData.totalTransacoes.toLocaleString('pt-BR'),
      icon: ReceiptText,
      accent: 'bg-cyan-500/15 text-cyan-200',
    },
  ];
  const resumoApostasCards = [
    {
      key: 'concluidas',
      label: 'Apostas/saldo recebidas',
      icon: CheckCircle2,
      accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
      cardClass: 'border-emerald-200 bg-emerald-50 shadow-sm dark:border-emerald-400/15 dark:bg-emerald-400/5 dark:shadow-[0_15px_35px_rgba(16,185,129,0.18)]',
      parts: resultadoParts,
      isNegative: resultadoEhNegativo,
      description: 'Valores finalizados',
      valueClass: 'text-gray-900 dark:text-white',
      decimalClass: 'text-gray-500 dark:text-white/60',
    },
    {
      key: 'pendentes',
      label: 'Aguardando resultado',
      icon: Clock3,
      accent: 'bg-orange-100 text-orange-700 dark:bg-[#ff9a15]/25 dark:text-[#ffebc9]',
      cardClass: 'border-orange-200 bg-orange-50 shadow-sm dark:border-[#ffb347]/50 dark:bg-gradient-to-br dark:from-[#ff8a00]/25 dark:via-[#ff9a15]/15 dark:to-transparent dark:shadow-[0_20px_45px_rgba(255,138,0,0.25)]',
      parts: pendenteParts,
      isNegative: false,
      description: 'Entradas pendentes',
      valueClass: 'text-gray-900 dark:text-[#ffd36b]',
      decimalClass: 'text-gray-500 dark:text-[#ffdd9c]',
    },
  ];

  return (
    <div className="space-y-6 text-foreground">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Financeiro</h1>
            <p className="text-sm text-foreground-muted">Gerencie transações e saldos por banca.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <button
                type="button"
                className={headerGhostButtonClass}
                onClick={() => setFiltersOpen((prev) => !prev)}
                aria-expanded={filtersOpen}
              >
                <Filter className="h-4 w-4" />
                FILTROS
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-full mt-2 z-50">
                  <FilterPopover
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    onClear={handleClearFilters}
                    maxWidth="420px"
                    footer={
                      <button
                        type="button"
                        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
                        onClick={handleApplyFilters}
                      >
                        Aplicar filtros
                      </button>
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-medium text-foreground">
                        <span>Banca</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todas' }, ...bancas.map((b) => ({ value: b.id, label: b.nome }))]}
                          value={pendingFilters.bancaId}
                          onChange={(val) => handleFilterChange('bancaId', val)}
                          className={inputClass}
                        />
                      </label>

                      <label className="text-sm font-medium text-foreground">
                        <span>Tipo</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todos' }, { value: 'Depósito', label: 'Depósito' }, { value: 'Saque', label: 'Saque' }]}
                          value={pendingFilters.tipo}
                          onChange={(val) => handleFilterChange('tipo', val as TipoFiltro)}
                          className={inputClass}
                        />
                      </label>

                      <label className="text-sm font-medium text-foreground">
                        <span>Casa</span>
                        <DropdownSelect
                          options={[{ value: '', label: 'Todas' }, ...CASAS_APOSTAS.map((c) => ({ value: c, label: c }))]}
                          value={pendingFilters.casa}
                          onChange={(val) => handleFilterChange('casa', val)}
                          className={inputClass}
                          searchable
                        />
                      </label>

                      <label className="text-sm font-medium text-foreground">
                        <span>Observação</span>
                        <input
                          className={inputClass}
                          value={pendingFilters.observacao}
                          onChange={(e) => handleFilterChange('observacao', e.target.value)}
                          placeholder="Pesquisar observação"
                        />
                      </label>

                      <label className="text-sm font-medium text-foreground col-span-2">
                        <span>Período</span>
                        <div className="w-full">
                          <DateRangeInput
                            start={pendingFilters.dataDe}
                            end={pendingFilters.dataAte}
                            onChange={(s, e) => {
                              handleFilterChange('dataDe', s);
                              handleFilterChange('dataAte', e);
                            }}
                            className={inputClass}
                          />
                        </div>
                      </label>
                    </div>
                  </FilterPopover>
                </div>
              )}
            </div>
            <button
              type="button"
              className={headerPrimaryButtonClass}
              onClick={handleOpenCreateModal}
            >
              <Plus className="h-4 w-4" />
              NOVA TRANSAÇÃO
            </button>
          </div>
        </div>
      </div>

      {/* Financial Summary and Bets Summary cards removed per request */}

      {error && (
        <div className={cn(sectionCardClass, 'border-danger/30 bg-danger/5 text-sm text-danger')}>
          {error}
        </div>
      )}

      <section className={cn(dashboardCardShellClass, 'space-y-6')}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Gerenciar Transações Financeiras</h2>
            <p className="text-sm text-gray-500 dark:text-white/70">Visualize depósitos e saques registrados.</p>
          </div>
          <span className="rounded-2xl border border-gray-200 bg-gray-100 px-4 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {transacoes.length} {transacoes.length === 1 ? 'transação' : 'transações'}
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500 dark:text-white/70">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : transacoes.length === 0 ? (
          <EmptyState title="Nenhuma transação" description="Cadastre um depósito ou saque para visualizar aqui." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-emerald-700/20">
            <table className="min-w-full table-auto text-sm text-gray-900 dark:text-white">
              <thead className="bg-gray-50 text-[0.7rem] uppercase tracking-[0.25em] text-gray-500 dark:bg-emerald-900/20 dark:text-emerald-400">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Casa</th>
                  <th className="px-4 py-3 text-left">Valor</th>
                  <th className="px-4 py-3 text-left">Observação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-emerald-500/10">
                {transacoes.map((transacao) => (
                  <tr key={transacao.id} className="text-gray-900 transition hover:bg-gray-50 dark:text-white dark:hover:bg-emerald-500/10">
                    <td className="px-4 py-4 font-medium">{formatDate(transacao.dataTransacao)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                          transacao.tipo === 'Depósito' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300'
                        )}
                      >
                        {transacao.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-white/80">{transacao.casaDeAposta}</td>
                    <td
                      className={cn(
                        'px-4 py-4 font-semibold',
                        transacao.tipo === 'Depósito' ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                      )}
                    >
                      {formatCurrency(transacao.valor)}
                    </td>
                    <td className="px-4 py-4 text-gray-500 dark:text-white/70">
                      {transacao.observacao?.trim() ? transacao.observacao : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className={tableActionButtonClass}
                          onClick={() => handleEditTransacao(transacao)}
                          aria-label="Editar transação"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className={tableActionButtonDangerClass}
                          onClick={() => handleDeleteTransacao(transacao)}
                          aria-label="Remover transação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        isOpen={modalOpen}
        title={editingId ? 'Editar transação' : 'Nova transação'}
        onClose={handleCloseModal}
        size="lg"
      >
        <form className="space-y-5 text-foreground" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Banca</label>
              <select
                className={cn(inputClass, !formData.bancaId && 'text-foreground-muted')}
                value={formData.bancaId}
                onChange={(event) => handleFormChange('bancaId', event.target.value)}
              >
                <option value="">Selecione</option>
                {bancas.map((banca) => (
                  <option key={banca.id} value={banca.id}>
                    {banca.nome}
                  </option>
                ))}
              </select>
              {formErrors.bancaId && <p className="text-xs text-danger">{formErrors.bancaId}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de transação</label>
              <select
                className={cn(inputClass, !formData.tipo && 'text-foreground-muted')}
                value={formData.tipo}
                onChange={(event) => handleFormChange('tipo', event.target.value as TipoFiltro)}
              >
                <option value="">Selecione</option>
                <option value="Depósito">Depósito</option>
                <option value="Saque">Saque</option>
              </select>
              {formErrors.tipo && <p className="text-xs text-danger">{formErrors.tipo}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Casa de apostas</label>
              <select
                className={cn(inputClass, !formData.casaDeAposta && 'text-foreground-muted')}
                value={formData.casaDeAposta}
                onChange={(event) => handleFormChange('casaDeAposta', event.target.value)}
              >
                <option value="">Selecione</option>
                {CASAS_APOSTAS.map((casa) => (
                  <option key={casa} value={casa}>
                    {casa}
                  </option>
                ))}
              </select>
              {formErrors.casaDeAposta && <p className="text-xs text-danger">{formErrors.casaDeAposta}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor</label>
              <input
                className={inputClass}
                inputMode="decimal"
                value={formData.valor}
                onChange={(event) => handleFormChange('valor', event.target.value)}
                placeholder="0,00"
              />
              {formErrors.valor && <p className="text-xs text-danger">{formErrors.valor}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <DateInput
                value={manualDateInput}
                onChange={(value) => {
                  setManualDateInput(value);
                  const isoValue = normalizeDisplayToISO(value);
                  if (isoValue) {
                    handleFormChange('dataTransacao', isoValue);
                  }
                }}
                placeholder="dd/mm/aaaa"
                className={inputClass}
              />
              {formErrors.dataTransacao && <p className="text-xs text-danger">{formErrors.dataTransacao}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observação</label>
              <input
                className={inputClass}
                value={formData.observacao}
                onChange={(event) => handleFormChange('observacao', event.target.value)}
                placeholder="Detalhes adicionais"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-2xl border border-border/40 px-4 py-2 text-sm text-foreground hocus:border-brand-emerald/40"
              onClick={handleCloseModal}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-emerald/40 bg-brand-emerald/10 px-4 py-2 text-sm font-semibold text-brand-emerald hocus:bg-brand-emerald/20"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Salvando
                </>
              ) : (
                'Salvar transação'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


