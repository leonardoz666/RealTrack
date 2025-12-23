import { AlertTriangle, Check, Copy, Eye, LineChart, Loader2, Pencil, Plus, Share2, Star, Trash2, User, Wallet, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useBancas } from '../hooks/useBancas';
import { useTipsters } from '../hooks/useTipsters';
import { usePagination } from '../hooks/usePagination';
import { apiClient, bancaService, tipsterService, type Banca, type BancaStats, type Tipster } from '../services/api';
import { type ApiError } from '../types/api';
import { formatNumber } from '../utils/formatters';
import { eventBus } from '../utils/eventBus';
import { cn } from '../components/ui/utils';
import { toast } from '../utils/toast';

interface EditFormState {
  nome: string;
  descricao: string;
  valorInicial: string;
  ativa: boolean;
  padrao: boolean;
  compartilhamento: boolean;
}

interface ConfirmDeleteState {
  open: boolean;
  banca: Banca | null;
  loading: boolean;
}

interface BetApi {
  createdAt?: string | null;
  dataEvento?: string | null;
  data?: string | null;
}

const defaultForm: EditFormState = {
  nome: '',
  descricao: '',
  valorInicial: '',
  ativa: true,
  padrao: false,
  compartilhamento: false,
};

const sectionCardClass =
  'rounded-[32px] border border-gray-200 bg-white p-4 md:p-6 text-gray-900 shadow-xl backdrop-blur-2xl dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]';
const dashboardCardShellClass =
  'rounded-[32px] border border-gray-200 bg-white p-4 md:p-6 text-gray-900 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-gray-300 hover:shadow-lg dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:hover:border-emerald-500/30 dark:hover:shadow-emerald-500/10';
const summaryCardBaseClass =
  'rounded-[32px] border border-gray-200 bg-white p-4 md:p-6 text-gray-900 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:scale-[1.015] hover:border-gray-300 hover:shadow-lg dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:hover:border-emerald-500/30 dark:hover:shadow-emerald-500/10';
const modalCardClass =
  'rounded-[32px] border border-gray-200 bg-white px-5 py-5 text-gray-900 shadow-xl backdrop-blur-2xl dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]';
const cardLabelClass = 'text-2xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50';
const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:border-brand-emerald/40 dark:bg-brand-emerald/10 dark:text-brand-emerald dark:hover:bg-brand-emerald/20';
const ghostButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-transparent px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-emerald-600 dark:text-white dark:hover:border-border/60 dark:hover:bg-transparent dark:hover:text-brand-emerald';

export default function Bancas() {
  const [activeTab, setActiveTab] = useState<'bancas' | 'tipsters'>('bancas');
  const { bancas: remoteBancas, loading: bancasLoading, error: bancasError, invalidateCache: invalidateBancasCache } = useBancas();
  const { tipsters, loading: tipstersLoading, invalidateCache: invalidateTipstersCache } = useTipsters();

  const bancas = useMemo(() => {
    return [...remoteBancas].sort((a, b) => {
      if (a.padrao === b.padrao) return 0;
      return a.padrao ? -1 : 1;
    });
  }, [remoteBancas]);

  const [selectedBanco, setSelectedBanco] = useState<Banca | null>(null);
  const [statsOverride, setStatsOverride] = useState<BancaStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editBanco, setEditBanco] = useState<Banca | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(defaultForm);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>({
    open: false,
    banca: null,
    loading: false,
  });

  // Tipsters state
  const [tipsterModalOpen, setTipsterModalOpen] = useState(false);
  const [editingTipster, setEditingTipster] = useState<Tipster | null>(null);
  const [tipsterFormData, setTipsterFormData] = useState({ nome: '' });
  const [tipsterSaving, setTipsterSaving] = useState(false);
  const [tipsterError, setTipsterError] = useState('');

  const { paginatedItems: paginatedTipsters, page, totalPages, setPage } = usePagination(tipsters, 10);

  const refreshFromEvent = useCallback(() => {
    invalidateBancasCache();
  }, [invalidateBancasCache]);

  useEffect(() => {
    const unsubscribes = [
      eventBus.on('banca:created', refreshFromEvent),
      eventBus.on('banca:saved', refreshFromEvent),
      eventBus.on('banca:updated', refreshFromEvent),
      eventBus.on('banca:deleted', refreshFromEvent),
    ];

    return () => {
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [refreshFromEvent]);

  const summaryCards = useMemo(() => {
    const totalViews = bancas.reduce((sum, banca) => sum + banca.visualizacoes, 0);
    const totalVisitors = bancas.reduce((sum, banca) => sum + banca.visitantes, 0);
    const activeBancas = bancas.filter((bancaItem) => bancaItem.status === 'Ativa').length;
    const conversion = totalViews === 0 ? '0%' : `${Math.min(100, Math.round((totalVisitors / totalViews) * 100))}%`;

    return [
      {
        title: 'Total de visualizações',
        value: formatNumber(totalViews),
        helper: 'Últimos 30 dias',
        icon: <Eye className="h-5 w-5" />,
      },
      {
        title: 'Visitantes únicos',
        value: formatNumber(totalVisitors),
        helper: 'Audiência orgânica',
        icon: <Eye className="h-5 w-5" />,
      },
      {
        title: 'Bancas ativas',
        value: String(activeBancas),
        helper: `de ${bancas.length} registradas`,
        icon: <LineChart className="h-5 w-5" />,
      },
      {
        title: 'Taxa de conversão',
        value: conversion,
        helper: 'Visitantes / visualizações',
        icon: <LineChart className="h-5 w-5" />,
      },
    ];
  }, [bancas]);

  const statsData = selectedBanco ? statsOverride ?? selectedBanco.stats : null;

  const handleOpenStats = async (banca: Banca) => {
    setSelectedBanco(banca);
    setStatsOverride(null);
    setStatsLoading(true);

    try {
      const response = await apiClient.get<BetApi[]>('/apostas', { params: { bancaId: banca.id } });
      const views = computeViewsFromBets(response.data);
      setStatsOverride({
        ...banca.stats,
        views,
      });
    } catch (err) {
      console.warn('Não foi possível carregar métricas detalhadas.', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const openEditModal = (banca: Banca) => {
    setEditBanco(banca);
    setEditForm({
      nome: banca.nome,
      descricao: banca.descricao,
      valorInicial: '',
      ativa: banca.status === 'Ativa',
      padrao: banca.padrao,
      compartilhamento: false,
    });
  };

  const handleEditChange = <Key extends keyof EditFormState>(field: Key, value: EditFormState[Key]) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTogglePadrao = async (banca: Banca) => {
    const newValue = !banca.padrao;

    try {
      await bancaService.update(banca.id, { ePadrao: newValue });
      invalidateBancasCache();
    } catch (err) {
      console.error('Não foi possível atualizar o status padrão da banca.', err);
      invalidateBancasCache();
    }
  };

  const handleToggleStatus = async (banca: Banca) => {
    const nextStatus = banca.status === 'Ativa' ? 'Inativa' : 'Ativa';

    try {
      await bancaService.update(banca.id, { status: nextStatus });
      invalidateBancasCache();
    } catch (err) {
      console.error('Não foi possível atualizar o status da banca.', err);
      invalidateBancasCache();
    }
  };

  const handleSaveBanco = async () => {
    if (!editBanco) return;
    setSavingEdit(true);

    try {
      // Parse saldoInicial if provided
      let saldoInicial: number | undefined;
      if (editForm.valorInicial.trim()) {
        const normalized = editForm.valorInicial.replace(/\./g, '').replace(',', '.');
        const parsed = parseFloat(normalized);
        if (!isNaN(parsed) && parsed >= 0) {
          saldoInicial = parsed;
        }
      }

      await bancaService.update(editBanco.id, {
        nome: editForm.nome,
        descricao: editForm.descricao,
        status: editForm.ativa ? 'Ativa' : 'Inativa',
        ePadrao: editForm.padrao,
        saldoInicial,
      });
      setEditBanco(null);
      setStatsOverride(null);
      invalidateBancasCache();
    } catch (err) {
      console.error('Não foi possível salvar a banca.', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteBanco = async () => {
    if (!confirmDelete.banca) return;
    setConfirmDelete((prev) => ({ ...prev, loading: true }));

    try {
      await bancaService.delete(confirmDelete.banca.id);
      setConfirmDelete({ open: false, banca: null, loading: false });
      invalidateBancasCache();
    } catch (err) {
      console.error('Não foi possível excluir a banca.', err);
      setConfirmDelete((prev) => ({ ...prev, loading: false }));
    }
  };

  // Tipsters Handlers
  const handleOpenTipsterModal = useCallback((tipster?: Tipster) => {
    if (tipster) {
      setEditingTipster(tipster);
      setTipsterFormData({ nome: tipster.nome });
    } else {
      setEditingTipster(null);
      setTipsterFormData({ nome: '' });
    }
    setTipsterError('');
    setTipsterModalOpen(true);
  }, []);

  const handleCloseTipsterModal = useCallback(() => {
    setTipsterModalOpen(false);
    setEditingTipster(null);
    setTipsterFormData({ nome: '' });
    setTipsterError('');
  }, []);

  const handleTipsterSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const nome = tipsterFormData.nome.trim();
    if (!nome) {
      setTipsterError('Informe o nome do tipster.');
      return;
    }

    setTipsterSaving(true);
    setTipsterError('');

    try {
      if (editingTipster) {
        await tipsterService.update(editingTipster.id, { nome });
      } else {
        await tipsterService.create({ nome });
      }
      invalidateTipstersCache();
      handleCloseTipsterModal();
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error;
      setTipsterError(typeof errorMessage === 'string' ? errorMessage : 'Erro ao salvar tipster');
    } finally {
      setTipsterSaving(false);
    }
  }, [editingTipster, tipsterFormData.nome, handleCloseTipsterModal, invalidateTipstersCache]);

  const handleToggleTipsterActive = useCallback(async (tipster: Tipster) => {
    try {
      await tipsterService.toggleAtivo(tipster.id, tipster.ativo);
      invalidateTipstersCache();
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error;
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Erro ao atualizar tipster');
    }
  }, [invalidateTipstersCache]);

  const handleDeleteTipster = useCallback(async (tipster: Tipster) => {
    if (!window.confirm(`Tem certeza que deseja deletar o tipster "${tipster.nome}"?`)) {
      return;
    }

    try {
      await tipsterService.remove(tipster.id);
      invalidateTipstersCache();
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error;
      toast.error(typeof errorMessage === 'string' ? errorMessage : 'Erro ao deletar tipster');
    }
  }, [invalidateTipstersCache]);

  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bancas</h1>
          <p className="text-sm text-foreground-muted">Gerencie suas bancas e tipsters.</p>
        </div>
        {activeTab === 'tipsters' && (
          <button
            onClick={() => handleOpenTipsterModal()}
            className={primaryButtonClass}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipster
          </button>
        )}
      </div>

      {/* Selector de Abas */}
      <div className="flex border-b border-gray-200 dark:border-emerald-700/20">
        <button
          onClick={() => setActiveTab('bancas')}
          className={cn(
            'px-6 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'bancas'
              ? 'text-emerald-600 dark:text-brand-emerald'
              : 'text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
          )}
        >
          Minhas Bancas
          {activeTab === 'bancas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-brand-emerald" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tipsters')}
          className={cn(
            'whitespace-nowrap px-6 py-3 text-sm font-medium transition-colors relative',
            activeTab === 'tipsters'
              ? 'text-emerald-600 dark:text-brand-emerald'
              : 'text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white'
          )}
        >
          Tipsters
          {activeTab === 'tipsters' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-brand-emerald" />
          )}
        </button>
      </div>

      {activeTab === 'bancas' ? (
        <>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card, idx) => (
              <div key={idx} className={summaryCardBaseClass}>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-white/50">{card.title}</p>
                  <div className="text-emerald-600 dark:text-brand-emerald">{card.icon}</div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-white/40">{card.helper}</p>
              </div>
            ))}
          </div>

          {bancasError && (
            <div className={cn(sectionCardClass, 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/5 dark:text-rose-200')}>
              {bancasError.message}
            </div>
          )}

          <section className={cn(dashboardCardShellClass, 'space-y-6')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={cn(cardLabelClass, 'text-gray-500 dark:text-white/70')}>Bancas compartilhadas</p>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Lista completa</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/70">Gerencie o status, padrão e links públicos.</p>
            </div>

            {bancasLoading ? (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-white/70">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : bancas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/70">
                Nenhuma banca cadastrada ainda.
              </div>
            ) : (
              <>
                {/* Mobile List */}
                <div className="block md:hidden space-y-4">
                  {bancas.map((banca) => (
                    <MobileBancaCard
                      key={banca.id}
                      banca={banca}
                      onOpenStats={() => void handleOpenStats(banca)}
                      onCopyLink={() => void copyToClipboard(banca.stats.infoLink.url)}
                      onEdit={() => openEditModal(banca)}
                      onDelete={() => setConfirmDelete({ open: true, banca, loading: false })}
                      onToggleStatus={() => void handleToggleStatus(banca)}
                      onTogglePadrao={() => void handleTogglePadrao(banca)}
                    />
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-emerald-700/20">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-emerald-500/10 text-sm">
                    <thead className="bg-gray-50 dark:bg-emerald-900/20" style={{ color: '#00ff9d' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Banca</th>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Descrição</th>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Status</th>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Padrão</th>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Última visualização</th>
                        <th className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-[0.3em]">Criado em</th>
                        <th className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-[0.3em]">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                      {bancas.map((banca) => (
                        <tr key={banca.id} className="transition duration-200 hover:bg-gray-50 dark:hover:bg-white/10 cursor-default">
                          <td className="px-4 py-4 align-middle">
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{banca.nome}</p>
                              <p className="text-xs text-gray-500 dark:text-white/60">ID: {banca.id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle text-gray-600 dark:text-white/70">{banca.descricao}</td>
                          <td className="px-4 py-4 align-middle">
                            <SwitchControl
                              checked={banca.status === 'Ativa'}
                              onToggle={() => void handleToggleStatus(banca)}
                              label={`Alternar status da banca ${banca.nome}`}
                            />
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <SwitchControl
                              checked={banca.padrao}
                              onToggle={() => void handleTogglePadrao(banca)}
                              label={`Alternar banca padrão ${banca.nome}`}
                            />
                          </td>
                          <td className="px-4 py-4 align-middle text-gray-500 dark:text-white/60">{banca.ultimaVisualizacao}</td>
                          <td className="px-4 py-4 align-middle text-gray-500 dark:text-white/60">{banca.criadoEm}</td>
                          <td className="px-4 py-4 align-middle text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                className={cn(ghostButtonClass, 'h-8 w-8 rounded-lg p-0 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-emerald-400')}
                                onClick={() => void handleOpenStats(banca)}
                                title="Ver estatísticas"
                              >
                                <LineChart className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(ghostButtonClass, 'h-8 w-8 rounded-lg p-0 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-emerald-400')}
                                onClick={() => void copyToClipboard(banca.stats.infoLink.url)}
                                title="Copiar link"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(ghostButtonClass, 'h-8 w-8 rounded-lg p-0 text-gray-500 hover:bg-gray-100 hover:text-emerald-600 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-emerald-400')}
                                onClick={() => openEditModal(banca)}
                                title="Editar banca"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                className={cn(ghostButtonClass, 'h-8 w-8 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300')}
                                onClick={() => setConfirmDelete({ open: true, banca, loading: false })}
                                title="Excluir banca"
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
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <section className={cn(dashboardCardShellClass, 'space-y-6')}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={cn(cardLabelClass, 'text-gray-500 dark:text-white/70')}>Gestão de Analistas</p>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Lista de Tipsters</h2>
              </div>
              <p className="text-sm text-gray-500 dark:text-white/70">Ative ou desative tipsters para usá-los em suas apostas.</p>
            </div>

            {tipstersLoading ? (
              <div className="flex h-48 items-center justify-center text-gray-500 dark:text-white/70">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : paginatedTipsters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/70">
                Nenhum tipster cadastrado.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  {paginatedTipsters.map((tipster) => (
                    <TipsterCard
                      key={tipster.id}
                      tipster={tipster}
                      onEdit={() => handleOpenTipsterModal(tipster)}
                      onDelete={() => handleDeleteTipster(tipster)}
                      onToggleActive={() => handleToggleTipsterActive(tipster)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={ghostButtonClass}
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-500 dark:text-white/70">
                      Página {page} de {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={ghostButtonClass}
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}

      {/* Modais de Bancas */}
      <ModalShell
        open={!!selectedBanco}
        title={selectedBanco ? `Estatísticas detalhadas - ${selectedBanco.nome}` : ''}
        onClose={() => {
          setSelectedBanco(null);
          setStatsOverride(null);
        }}
        maxWidth="max-w-4xl"
      >
        {statsLoading ? (
          <div className="flex h-40 items-center justify-center text-foreground-muted">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : statsData ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(
                Object.entries(statsData.views) as [keyof BancaStats['views'], number][]
              ).map(([key, value]) => (
                <div key={key} className={modalCardClass}>
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground-muted">
                    {key === 'hoje' && 'Hoje'}
                    {key === 'semana' && 'Semana'}
                    {key === 'mes' && 'Mês'}
                    {key === 'total' && 'Total'}
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
                  <p className="text-xs text-foreground-muted">visualizações</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className={cn(modalCardClass, 'space-y-3')}>
                <p className={cardLabelClass}>Link público</p>
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-700/20 bg-emerald-900/20 px-4 py-3 text-sm">
                  <span className="flex-1 truncate text-white">{statsData.infoLink.url}</span>
                  <ActionIconButton
                    label="Copiar link"
                    icon={<Copy className="h-4 w-4" />}
                    onClick={() => {
                      void copyToClipboard(statsData.infoLink.url);
                    }}
                  />
                </div>
                <p className="text-xs text-white/50">Criado em {statsData.infoLink.criadoEm}</p>
              </div>

              <div className={cn(modalCardClass, 'space-y-3')}>
                <p className={cardLabelClass}>Engajamento</p>
                <div className="space-y-2 text-sm">
                  <StatHighlight label="Taxa de visitantes únicos" value={`${statsData.engajamento.taxaVisitantes}%`} />
                  <StatHighlight label="Média de visualizações / dia" value={statsData.engajamento.mediaVisualizacoesDia} />
                  <StatHighlight label="Última atividade" value={statsData.engajamento.ultimaAtividade} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground-muted">Não encontramos métricas para esta banca.</p>
        )}
      </ModalShell>

      <ModalShell
        open={!!editBanco}
        title="Editar banca"
        onClose={() => {
          setEditBanco(null);
          setSavingEdit(false);
        }}
        maxWidth="max-w-2xl"
      >
        {editBanco && (
          <EditBancoForm
            form={editForm}
            onChange={handleEditChange}
            onCancel={() => setEditBanco(null)}
            onSubmit={handleSaveBanco}
            saving={savingEdit}
          />
        )}
      </ModalShell>

      <ModalShell
        open={confirmDelete.open}
        title="Excluir banca"
        onClose={() => setConfirmDelete({ open: false, banca: null, loading: false })}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Tem certeza?</p>
              <p className="text-sm text-foreground-muted">
                Essa ação remove permanentemente a banca {confirmDelete.banca?.nome ?? ''} e seus dados de compartilhamento.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="rounded-2xl border border-border/40 px-4 py-2 text-sm text-foreground hocus:border-brand-emerald/40"
              onClick={() => setConfirmDelete({ open: false, banca: null, loading: false })}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="rounded-2xl border border-danger/50 bg-danger/15 px-4 py-2 text-sm font-semibold text-danger hocus:bg-danger/20"
              onClick={() => {
                void handleDeleteBanco();
              }}
              disabled={confirmDelete.loading}
            >
              {confirmDelete.loading ? 'Excluindo...' : 'Excluir banca'}
            </button>
          </div>
        </div>
      </ModalShell>

      {/* Modal de Tipster */}
      <ModalShell
        open={tipsterModalOpen}
        title={editingTipster ? 'Editar Tipster' : 'Novo Tipster'}
        onClose={handleCloseTipsterModal}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTipsterSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome do Tipster</label>
            <input
              type="text"
              value={tipsterFormData.nome}
              onChange={(e) => setTipsterFormData({ nome: e.target.value })}
              className="w-full rounded-2xl border border-border/40 bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-emerald/30"
              placeholder="Ex: João da Silva"
              autoFocus
            />
          </div>

          {tipsterError && (
            <p className="text-xs text-rose-500">{tipsterError}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleCloseTipsterModal}
              className="rounded-2xl border border-border/40 px-4 py-2 text-sm text-foreground hocus:border-brand-emerald/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={tipsterSaving}
              className={primaryButtonClass}
            >
              {tipsterSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
}

function MobileBancaCard({
  banca,
  onOpenStats,
  onCopyLink,
  onEdit,
  onDelete,
  onToggleStatus,
  onTogglePadrao,
}: {
  banca: Banca;
  onOpenStats: () => void;
  onCopyLink: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onTogglePadrao: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-2.5 shadow-sm dark:border-emerald-700/20 dark:bg-emerald-900/10">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-brand-emerald/30 dark:bg-brand-emerald/10 dark:text-brand-emerald">
          <Wallet className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">{banca.nome}</h3>
          </div>
          <p className="text-[0.65rem] text-gray-500 dark:text-white/60 truncate">ID: {banca.id}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
             onClick={onTogglePadrao}
             className={cn(
               "flex h-7 w-7 items-center justify-center rounded-lg transition",
               banca.padrao
                 ? "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400" 
                 : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/5 dark:text-white/40"
             )}
             title={banca.padrao ? 'É a banca padrão' : 'Definir como padrão'}
           >
             <Star className={cn("h-3.5 w-3.5", banca.padrao && "fill-current")} />
           </button>
           
          <button
             onClick={onToggleStatus}
             className={cn(
               "flex h-7 w-7 items-center justify-center rounded-lg transition",
               banca.status === 'Ativa'
                 ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-brand-emerald/20 dark:text-brand-emerald dark:hover:bg-brand-emerald/30" 
                 : "bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10"
             )}
             title={banca.status === 'Ativa' ? 'Desativar' : 'Ativar'}
           >
             {banca.status === 'Ativa' ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-2">
         <ActionButton icon={<LineChart className="h-3.5 w-3.5" />} onClick={onOpenStats} label="Dados" />
         <ActionButton icon={<Share2 className="h-3.5 w-3.5" />} onClick={onCopyLink} label="Link" />
         <ActionButton icon={<Pencil className="h-3.5 w-3.5" />} onClick={onEdit} label="Editar" />
         <ActionButton icon={<Trash2 className="h-3.5 w-3.5" />} onClick={onDelete} label="Excluir" variant="danger" />
      </div>

      {banca.descricao && (
        <p className="text-xs text-gray-600 dark:text-white/70 mb-2 line-clamp-2 px-1">
          {banca.descricao}
        </p>
      )}
      
      <div className="flex justify-between text-[0.65rem] text-gray-400 dark:text-white/40 px-1 pt-2 border-t border-gray-100 dark:border-white/5">
         <span>Visto: {banca.ultimaVisualizacao}</span>
         <span>Criado: {banca.criadoEm}</span>
      </div>
    </div>
  );
}

function ActionButton({ icon, onClick, label, variant = 'default' }: { icon: ReactNode, onClick: () => void, label: string, variant?: 'default' | 'danger' }) {
   return (
      <button
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl border transition",
          variant === 'danger'
            ? "border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400"
            : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-white/70"
        )}
      >
        {icon}
        <span className="text-[0.6rem] font-medium">{label}</span>
      </button>
   )
}

function SwitchControl({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/40',
        checked ? 'border-brand-emerald/50 bg-brand-emerald/20' : 'border-danger/50 bg-danger/10'
      )}
      onClick={onToggle}
    >
      <span className="sr-only">{label}</span>
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full transition shadow-sm',
          checked ? 'translate-x-6 bg-brand-emerald' : 'translate-x-1 bg-danger'
        )}
      />
    </button>
  );
}

function ActionIconButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
        variant === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-danger/40 dark:bg-danger/15 dark:text-danger/80 dark:hover:bg-danger/20'
          : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:border-emerald-400/40 dark:hover:bg-emerald-500/20'
      )}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

function ModalShell({
  open,
  title,
  onClose,
  children,
  maxWidth = 'max-w-3xl',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-fade dark:bg-black/80"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full rounded-[2.5rem] border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop-blur-3xl animate-slide-up overflow-hidden dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/90 dark:to-emerald-950/90 dark:text-white dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]',
          maxWidth
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-2xs uppercase tracking-[0.3em] text-gray-500 dark:text-white/50">Modal</p>
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h3>
          </div>
          <button
            type="button"
            className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:border-emerald-500/30 dark:bg-emerald-900/20 dark:text-emerald-100 dark:hover:bg-emerald-500/20 dark:hover:text-white"
            onClick={onClose}
            aria-label="Fechar"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatHighlight({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm dark:border-emerald-700/20 dark:bg-emerald-900/20">
      <span className="text-gray-500 dark:text-white/50">{label}</span>
      <strong className="text-gray-900 dark:text-white">{value}</strong>
    </div>
  );
}

interface EditFormProps {
  form: EditFormState;
  onChange: <Key extends keyof EditFormState>(field: Key, value: EditFormState[Key]) => void;
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
}

function EditBancoForm({ form, onChange, onCancel, onSubmit, saving }: EditFormProps) {
  const inputClass =
    'w-full rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-white dark:placeholder:text-white/30';

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-white">Nome da banca</label>
        <input className={inputClass} value={form.nome} onChange={(event) => onChange('nome', event.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-white">Descrição</label>
        <textarea
          rows={3}
          className={cn(inputClass, 'resize-none')}
          value={form.descricao}
          onChange={(event) => onChange('descricao', event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-white">Valor inicial</label>
        <input
          className={inputClass}
          value={form.valorInicial}
          placeholder="0,00"
          onChange={(event) => onChange('valorInicial', event.target.value)}
        />
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <ToggleLine
            title="Banca ativa"
            description="Ativar ou desativar esta banca no sistema."
            value={form.ativa}
            onToggle={() => onChange('ativa', !form.ativa)}
          />
          <ToggleLine
            title="Banca padrão"
            description="Defina para onde novas apostas serão direcionadas."
            value={form.padrao}
            onToggle={() => onChange('padrao', !form.padrao)}
          />
          <ToggleLine
            title="Compartilhamento público"
            description="Permitir que outras pessoas visualizem esta banca."
            value={form.compartilhamento}
            onToggle={() => onChange('compartilhamento', !form.compartilhamento)}
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-emerald-500/20 dark:bg-transparent dark:text-white dark:hover:bg-emerald-500/10"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="rounded-2xl border border-transparent bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100 dark:hover:bg-emerald-500/20"
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  );
}

function ToggleLine({
  title,
  description,
  value,
  onToggle,
}: {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-emerald-700/20 dark:bg-emerald-900/10">
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-white/50">{description}</p>
      </div>
      <SwitchControl checked={value} onToggle={onToggle} label={title} />
    </div>
  );
}

const computeViewsFromBets = (bets?: BetApi[]): BancaStats['views'] => {
  if (!Array.isArray(bets)) {
    return { hoje: 0, semana: 0, mes: 0, total: 0 };
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const getDate = (bet: BetApi) => new Date(bet.createdAt ?? bet.dataEvento ?? bet.data ?? Date.now());

  let hoje = 0;
  let semana = 0;
  let mes = 0;

  bets.forEach((bet) => {
    const date = getDate(bet);
    if (Number.isNaN(date.getTime())) return;
    if (date >= startOfDay) hoje += 1;
    if (date >= startOfWeek) semana += 1;
    if (date >= startOfMonth) mes += 1;
  });

  return {
    hoje,
    semana,
    mes,
    total: bets.length,
  };
};

const copyToClipboard = async (value?: string) => {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
  } catch (err) {
    console.error('Não foi possível copiar o valor.', err);
  }
};

function TipsterCard({
  tipster,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  tipster: Tipster;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-3 transition hover:bg-gray-100 dark:border-emerald-700/20 dark:bg-emerald-900/20 dark:hover:bg-emerald-800/20">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-brand-emerald/30 dark:bg-brand-emerald/10 dark:text-brand-emerald">
          <User className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">{tipster.nome || 'Sem nome'}</p>
          <div className="flex items-center gap-2">
            <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', tipster.ativo ? 'bg-emerald-600 dark:bg-brand-emerald' : 'bg-rose-500')} />
            <p className="text-[0.65rem] uppercase tracking-wider font-medium text-gray-500 dark:text-white/50">{tipster.ativo ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleActive}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-xl transition",
            tipster.ativo 
              ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-brand-emerald/20 dark:text-brand-emerald dark:hover:bg-brand-emerald/30" 
              : "bg-gray-200 text-gray-500 hover:bg-gray-300 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10"
          )}
          title={tipster.ativo ? 'Desativar' : 'Ativar'}
        >
          {tipster.ativo ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:bg-white/10"
          title="Editar tipster"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
          title="Excluir tipster"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

