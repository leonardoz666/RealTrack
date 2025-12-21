import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Target,
  Layers,
  RefreshCw,
  Wallet,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  LayoutGrid,
  Gift,
  Star,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { usePerfil } from '../contexts/PerfilContext';
import type { Perfil } from '../contexts/PerfilContext';
import { useBancas } from '../hooks/useBancas';
import { bancaService, perfilService, type ConsumoPlano } from '../services/api';
import { eventBus } from '../utils/eventBus';
import { AuthManager } from '../lib/auth';
import Modal from './Modal';
import { ROUTES } from '../routes';

interface CreateBancaFormState {
  nome: string;
  descricao: string;
  saldoInicial: string;
}

type CreateBancaErrors = Partial<Record<keyof CreateBancaFormState, string>>;

const CREATE_BANCA_DEFAULT: CreateBancaFormState = {
  nome: '',
  descricao: '',
  saldoInicial: '',
};

const CONSUMO_MAX_RETRIES = 2;
const CONSUMO_RETRY_BASE_DELAY = 1200;

const navLinkClasses = (isActive: boolean, collapsed: boolean) =>
  `flex items-center gap-3 py-3 rounded-lg transition-all ${
    collapsed ? 'justify-center px-0' : 'px-3'
  } ${
    isActive
      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
      : 'text-white/80 hover:text-white hover:bg-emerald-600/10'
  }`;

const PLAN_VISUALS: Record<string, { icon: LucideIcon; badgeClass: string; iconClass: string }> = {
  gratuito: {
    icon: Gift,
    badgeClass: 'bg-gradient-to-br from-plan-gratuito-start via-plan-gratuito-via to-plan-gratuito-end',
    iconClass: 'text-plan-gratuito-text',
  },
  amador: {
    icon: Star,
    badgeClass: 'bg-gradient-to-br from-plan-amador-start via-plan-amador-via to-plan-amador-end',
    iconClass: 'text-plan-amador-text',
  },
  profissional: {
    icon: Crown,
    badgeClass: 'bg-gradient-to-br from-plan-profissional-start via-plan-profissional-via to-plan-profissional-end',
    iconClass: 'text-plan-profissional-text',
  },
  default: {
    icon: Gift,
    badgeClass: 'bg-plan-default-badge',
    iconClass: 'text-white',
  },
};

const getPlanVisual = (planName?: string) => {
  if (!planName) return PLAN_VISUALS.default;
  const key = planName.trim().toLowerCase();
  return PLAN_VISUALS[key] ?? PLAN_VISUALS.default;
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const { perfil, loading: perfilLoading } = usePerfil();
  const { bancas, loading: bancasLoading, refetch: refetchBancas } = useBancas();
  const [consumoPlano, setConsumoPlano] = useState<ConsumoPlano | null>(null);
  const [consumoLoading, setConsumoLoading] = useState(false);
  const [consumoError, setConsumoError] = useState<string | null>(null);
  const [isBancaDropdownOpen, setIsBancaDropdownOpen] = useState(false);
  const [updatingBancaId, setUpdatingBancaId] = useState<string | null>(null);
  const [isCreateBancaOpen, setIsCreateBancaOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateBancaFormState>({ ...CREATE_BANCA_DEFAULT });
  const [createErrors, setCreateErrors] = useState<CreateBancaErrors>({});
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [creatingBanca, setCreatingBanca] = useState(false);
  const navigate = useNavigate();
  const bancaDropdownRef = useRef<HTMLDivElement | null>(null);
  const isMountedRef = useRef(true);
  const sectionPadding = collapsed ? 'px-2' : 'px-4';

  const fetchConsumo = useCallback(async () => {
    if (!perfil || !isMountedRef.current) return;

    setConsumoLoading(true);
    setConsumoError(null);

    const attemptFetch = async (attempt: number): Promise<void> => {
      try {
        const response = await perfilService.getConsumo();
        if (!isMountedRef.current) return;
        setConsumoPlano(response);
      } catch (error) {
        if (attempt < CONSUMO_MAX_RETRIES) {
          const delay = CONSUMO_RETRY_BASE_DELAY * (attempt + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          if (!isMountedRef.current) return;
          return attemptFetch(attempt + 1);
        }

        if (!isMountedRef.current) return;
        console.error('Erro ao carregar consumo do plano:', error);
        setConsumoError('Não foi possível carregar o limite diário.');
      }
    };

    await attemptFetch(0);

    if (isMountedRef.current) {
      setConsumoLoading(false);
    }
  }, [perfil]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!perfil) return;
    void fetchConsumo();
  }, [perfil, fetchConsumo]);

  useEffect(() => {
    const unsubscribeProfile = eventBus.on('profile:updated', () => {
      void fetchConsumo();
    });
    const unsubscribeApostas = eventBus.on('apostas:updated', () => {
      void fetchConsumo();
    });
    return () => {
      unsubscribeProfile();
      unsubscribeApostas();
    };
  }, [fetchConsumo]);

  const planoNome = perfil?.plano?.nome ?? 'Plano';
  const planVisual = getPlanVisual(perfil?.plano?.nome);
  const PlanIcon = planVisual.icon;
  const nickname = perfil?.nomeCompleto || perfil?.email || 'Usuário';

  const consumoInfo = useMemo(() => {
    const planName = (consumoPlano?.plano?.nome ?? perfil?.plano?.nome ?? '').trim().toLowerCase();
    const isUnlimitedPlan = planName.includes('profissional');

    if (!consumoPlano) {
      const limiteFallback = perfil?.plano?.limiteApostasDiarias ?? 0;
      if (isUnlimitedPlan || !limiteFallback) {
        return {
          label: 'Ilimitado',
          percent: 0,
          isUnlimited: true,
        };
      }
      return {
        label: `0 / ${limiteFallback}`,
        percent: 0,
        isUnlimited: false,
      };
    }

    const limite = consumoPlano.consumo.limite || consumoPlano.plano.limiteDiario;
    const apostasHoje = consumoPlano.consumo.apostasHoje;

    if (isUnlimitedPlan || !limite) {
      return {
        label: 'Ilimitado',
        percent: 0,
        isUnlimited: true,
      };
    }

    const percent = Math.min(consumoPlano.consumo.porcentagem || (apostasHoje / limite) * 100, 100);
    return {
      label: `${apostasHoje} / ${limite}`,
      percent,
      isUnlimited: false,
    };
  }, [consumoPlano, perfil]);

  const resetTime = useMemo(() => {
    const raw = consumoPlano?.consumo.proximoReset;
    if (!raw) return '00:00h';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '00:00h';
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }, [consumoPlano]);

  const isLoading = perfilLoading || consumoLoading;
  const bancaPanelLoading = bancasLoading && bancas.length === 0;
  const currentBanca = useMemo(() => {
    if (bancas.length === 0) return null;
    const padrao = bancas.find((banca) => banca.padrao);
    return padrao ?? bancas[0];
  }, [bancas]);

  const handleOpenSettings = () => {
    navigate(ROUTES.PERFIL);
  };

  const handleLogout = async () => {
    await AuthManager.logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const toggleBancaDropdown = () => {
    setIsBancaDropdownOpen((prev) => !prev);
  };

  const handleRefreshConsumo = useCallback(() => {
    void fetchConsumo();
  }, [fetchConsumo]);

  const handleSelectBanca = async (bancaId: string) => {
    const selected = bancas.find((banca) => banca.id === bancaId);
    if (!selected || selected.padrao) {
      setIsBancaDropdownOpen(false);
      return;
    }

    setUpdatingBancaId(bancaId);
    try {
      await bancaService.update(bancaId, { ePadrao: true });
      await refetchBancas(true);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('Não foi possível definir a banca padrão.', error);
    } finally {
      setUpdatingBancaId(null);
      setIsBancaDropdownOpen(false);
    }
  };

  const handleCreateBanca = () => {
    setIsBancaDropdownOpen(false);
    setCreateForm({ ...CREATE_BANCA_DEFAULT });
    setCreateErrors({});
    setCreateErrorMessage(null);
    setIsCreateBancaOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateBancaOpen(false);
    setCreatingBanca(false);
    setCreateForm({ ...CREATE_BANCA_DEFAULT });
    setCreateErrors({});
    setCreateErrorMessage(null);
  };

  const handleCreateFormChange = (field: keyof CreateBancaFormState, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    if (createErrors[field]) {
      setCreateErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (createErrorMessage) {
      setCreateErrorMessage(null);
    }
  };

  const handleCreateBancaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: CreateBancaErrors = {};

    if (!createForm.nome.trim()) {
      errors.nome = 'Informe o nome da banca.';
    }

    let saldoInicial: number | undefined;
    if (createForm.saldoInicial.trim()) {
      const normalized = createForm.saldoInicial.replace(/\./g, '').replace(',', '.');
      const parsed = Number.parseFloat(normalized);
      if (Number.isNaN(parsed)) {
        errors.saldoInicial = 'Valor inválido';
      } else {
        saldoInicial = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreateErrors({});
    setCreatingBanca(true);
    setCreateErrorMessage(null);
    try {
      await bancaService.create({
        nome: createForm.nome.trim(),
        descricao: createForm.descricao.trim() || undefined,
        saldoInicial,
      });
      await refetchBancas(true);
      closeCreateModal();
    } catch (error) {
      console.error('Não foi possível criar a banca.', error);
      setCreateErrorMessage('Erro ao criar banca. Tente novamente.');
      setCreatingBanca(false);
    }
  };

  useEffect(() => {
    if (!isBancaDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (bancaDropdownRef.current && !bancaDropdownRef.current.contains(event.target as Node)) {
        setIsBancaDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isBancaDropdownOpen]);

  useEffect(() => {
    if (!collapsed) return;
    setIsBancaDropdownOpen(false);
    setIsCreateBancaOpen(false);
  }, [collapsed]);

  return (
    <div
      className={`relative sticky top-0 flex h-screen max-h-screen flex-shrink-0 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button
        type="button"
        className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/30"
        onClick={onToggle}
        aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-r border-emerald-700/20 text-white">
        <div className={`${sectionPadding} pt-6 pb-8`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14b8a6]">
              <Target className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
                {!collapsed && (
              <div className="flex flex-col">
                <h1 className="text-white tracking-tight">Real Comando</h1>
                <p className="text-sm text-[#14b8a6]">Planilha Esportiva</p>
              </div>
            )}
          </div>
        </div>

        {!collapsed && (
          <div className={`mb-6 ${sectionPadding}`} ref={bancaDropdownRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-emerald-600/20 bg-emerald-950/30 px-3 py-3 transition-all hover:bg-emerald-900/40 hover:border-emerald-600/30"
              onClick={toggleBancaDropdown}
              aria-expanded={isBancaDropdownOpen}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 shadow-lg shadow-emerald-600/20">
                  <Layers className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs text-emerald-100/60">Banca Atual</span>
                  <span className="text-sm font-medium text-white">
                    {bancaPanelLoading ? 'Carregando...' : currentBanca?.nome ?? 'Nenhuma banca'}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-emerald-100/50 transition-transform ${isBancaDropdownOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </button>

            {isBancaDropdownOpen && (
              <div className="mt-2 space-y-2 rounded-lg border border-emerald-600/20 bg-emerald-950 p-2 shadow-xl shadow-black/40">
                {bancaPanelLoading ? (
                  <div className="flex h-20 items-center justify-center text-sm text-white/80">
                    Carregando bancas...
                  </div>
                ) : bancas.length === 0 ? (
                  <div className="text-sm text-white/80">Nenhuma banca cadastrada ainda.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {[...bancas]
                      .sort((a, b) => {
                        if (a.padrao === b.padrao) return 0;
                        return a.padrao ? -1 : 1;
                      })
                      .map((banca) => (
                        <button
                          key={banca.id}
                          type="button"
                          className={`flex flex-col rounded-lg border px-3 py-2.5 text-left transition-all ${
                            banca.padrao
                              ? 'border-emerald-600/50 bg-emerald-900/20'
                              : 'border-transparent hover:bg-white/5'
                          }`}
                          onClick={() => handleSelectBanca(banca.id)}
                          disabled={updatingBancaId === banca.id}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white">{banca.nome}</span>
                            {banca.padrao && (
                              <span className="rounded bg-emerald-600/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                                Atual
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center justify-between text-xs text-white/60">
                            <span className="inline-flex items-center gap-2">
                              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{banca.status}</span>
                            </span>
                            <span className="ml-2 flex-1 truncate text-right">{banca.descricao}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-600/30 px-3 py-2 text-xs font-medium text-emerald-400 transition-colors hover:border-emerald-600 hover:bg-emerald-600/10"
                  onClick={handleCreateBanca}
                >
                  + Nova Banca
                </button>
              </div>
            )}
          </div>
        )}

        <nav className={`flex-1 ${sectionPadding}`}>
          <ul className="space-y-1">
            <li>
              <NavLink to={ROUTES.DASHBOARD} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
                <LayoutGrid className="h-5 w-5" strokeWidth={2} />
                {!collapsed && <span>Início</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.BANCAS} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
                <Layers className="h-5 w-5" strokeWidth={2} />
                {!collapsed && <span>Bancas</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.ATUALIZAR} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
                <RefreshCw className="h-5 w-5" strokeWidth={2} />
                {!collapsed && <span>Apostas</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.FINANCEIRO} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
                <Wallet className="h-5 w-5" strokeWidth={2} />
                {!collapsed && <span>Financeiro</span>}
              </NavLink>
            </li>
            <li>
              <NavLink to={ROUTES.ANALISE} className={({ isActive }) => navLinkClasses(isActive, collapsed)}>
                <BarChart3 className="h-5 w-5" strokeWidth={2} />
                {!collapsed && <span>Análise</span>}
              </NavLink>
            </li>
          </ul>
        </nav>

        {!collapsed && (
          <div className={`mb-6 ${sectionPadding}`}>
            <div className="rounded-lg border border-emerald-700/20 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${planVisual.badgeClass}`}>
                    <PlanIcon className={`h-4 w-4 ${planVisual.iconClass}`} strokeWidth={2.5} />
                  </div>
                  <span className="text-white">{planoNome}</span>
                </div>
                <button
                  type="button"
                  className="rounded-full p-2 text-white/80 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Atualizar consumo"
                  disabled={consumoLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${consumoLoading ? 'animate-spin' : ''}`} strokeWidth={2} />
                </button>
              </div>

              <div className="mb-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-white/80">Limite Diário</span>
                  <span className="text-white">{isLoading ? 'Carregando...' : consumoInfo.label}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#0a2e2a]">
                  {consumoInfo.isUnlimited ? (
                    <div className="h-full w-full rounded-full bg-brand-teal" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-brand-teal transition-all"
                      style={{ width: `${Math.min(consumoInfo.percent, 100)}%` }}
                    />
                  )}
                </div>
                {consumoError && (
                  <div className="mt-2 flex items-center justify-between text-xs text-red-400">
                    <span>{consumoError}</span>
                    <button
                      type="button"
                      className="font-semibold text-red-200 underline-offset-2 transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleRefreshConsumo}
                      disabled={consumoLoading}
                    >
                      Tentar novamente
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-white/80">Renova {isLoading ? '...' : resetTime}</p>
            </div>
          </div>
        )}

        <div className={`${sectionPadding} pb-6`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                {perfil?.fotoPerfil ? (
                  <img src={perfil.fotoPerfil} alt="Foto de perfil" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#14b8a6]">
                    <Target className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                )}
                {!collapsed && <span className="text-white">{nickname}</span>}
            </div>
            {!collapsed && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center text-white/80 transition-colors hover:text-white"
                  aria-label="Configurações"
                  onClick={handleOpenSettings}
                >
                  <Settings className="h-5 w-5" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center text-[#ef4444] transition-colors hover:text-[#dc2626]"
                  aria-label="Sair"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isCreateBancaOpen} title="Criar nova banca" onClose={closeCreateModal} size="sm">
        <form className="space-y-4" onSubmit={handleCreateBancaSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="novo-nome-banca">
              Nome
            </label>
            <input
              id="novo-nome-banca"
              type="text"
              className="w-full rounded-lg border border-white/10 bg-[#0f3d38] px-3 py-2 text-sm text-white placeholder:text-[#6b9692] focus:border-[#14b8a6] focus:outline-none"
              value={createForm.nome}
              onChange={(event) => handleCreateFormChange('nome', event.target.value)}
            />
            {createErrors.nome && <p className="text-xs text-red-400">{createErrors.nome}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="nova-descricao-banca">
              Descrição (opcional)
            </label>
            <textarea
              id="nova-descricao-banca"
              className="h-20 w-full resize-none rounded-lg border border-white/10 bg-[#0f3d38] px-3 py-2 text-sm text-white placeholder:text-[#6b9692] focus:border-[#14b8a6] focus:outline-none"
              value={createForm.descricao}
              onChange={(event) => handleCreateFormChange('descricao', event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white" htmlFor="novo-saldo-inicial">
              Saldo inicial (opcional)
            </label>
            <input
              id="novo-saldo-inicial"
              type="text"
              className="w-full rounded-lg border border-white/10 bg-[#0f3d38] px-3 py-2 text-sm text-white placeholder:text-[#6b9692] focus:border-[#14b8a6] focus:outline-none"
              value={createForm.saldoInicial}
              onChange={(event) => handleCreateFormChange('saldoInicial', event.target.value)}
              placeholder="0,00"
            />
            {createErrors.saldoInicial && <p className="text-xs text-red-400">{createErrors.saldoInicial}</p>}
          </div>

          {createErrorMessage && <p className="text-sm text-red-400">{createErrorMessage}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:border-white/40"
              onClick={closeCreateModal}
              disabled={creatingBanca}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#14b8a6] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0f9d90] disabled:opacity-60"
              disabled={creatingBanca}
            >
              {creatingBanca ? 'Criando...' : 'Criar banca'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sidebar;
