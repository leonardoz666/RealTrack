import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Filter, Plus, Pencil, Upload, Trash2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { EmptyState } from '../components/ui/empty-state';
import Modal from '../components/Modal';
import UploadTicketModal from '../components/UploadTicketModal';
import ApostaForm, { type ApostaFormData, type ApostaFormErrors } from '../components/ApostaForm';
import ApostaStatusModal from '../components/ApostaStatusModal';
import { Zap } from 'lucide-react';
import FilterPopoverApostas from '../components/FilterPopoverApostas';
import DateInput from '../components/DateInput';
import DropdownSelect from '../components/DropdownSelect';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import {
  betStatusPillBaseClass,
  betStatusPillVariants,
  getBetStatusIcon,
} from '../constants/betStatusStyles';
import { ESPORTES, normalizarEsporteParaOpcao } from '../constants/esportes';
import { apostaService, type ApostasFilter, type ApostaStatus } from '../services/api';
import { eventBus } from '../utils/eventBus';
import { toast } from '../utils/toast';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from '../utils/formatters';
import { useTipsters } from '../hooks/useTipsters';
import { useBancas } from '../hooks/useBancas';
import { cn } from '../components/ui/utils';
// Tesseract será carregado dinamicamente apenas quando necessário (biblioteca pesada ~2MB)
import { type ApiBetWithBank, type ApiError, type ApiUploadTicketResponse } from '../types/api';

const VITE_API_URL: unknown = import.meta.env.VITE_API_URL;
const API_BASE_URL = (typeof VITE_API_URL === 'string' && VITE_API_URL.length > 0 ? VITE_API_URL : 'http://localhost:3001/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
const API_HEALTH_URL = `${API_ORIGIN}/health`;
const API_UPLOAD_URL = `${API_BASE_URL}/upload/bilhete`;

const STATUS_WITH_RETURNS = ['Ganha', 'Meio Ganha', 'Cashout'];
const MARKET_LABEL_PATTERN = /^(aposta|odd|retorno|retornos?\spotenciais?|valor|stake|cotação|apostas?)[:]?/i;
const MARKET_CONNECTOR_PATTERN = /^(?:o|e|ou)\s+/i;
const MARKET_STAT_KEYWORDS = [
  'ponto',
  'pontos',
  'rebote',
  'rebotes',
  'assistencia',
  'assistencias',
  'assist',
  'gol',
  'gols',
  'escanteio',
  'escanteios',
  'cartao',
  'cartoes',
  'cartao amarelo',
  'cartao vermelho',
  'faltas',
  'finalizacao',
  'finalizacoes',
  'finalizacao no alvo',
  'finalizacoes no alvo',
  'arremesso',
  'arremessos',
  'chutes',
  'triplos',
  'duplos',
  'p+r',
  'p+a',
  'r+a',
  'rebotes+pontos',
  'rebotes+assistencias',
  'pontos+assistencias',
  'pontos+rebotes',
  'rebotes+assist',
  'pontos+rebotes+assistencias',
  'passes',
  'tackles',
  'defesas',
  'interceptacoes',
  'steals',
  'roubos',
  'bloqueios',
  'aces',
  'games',
  'sets',
  'breaks',
  'quebras'
];

const normalizeMarketKeyword = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+&\s]/g, '')
    .trim()
    .toLowerCase();

const containsStatKeyword = (value: string): boolean => {
  const normalized = normalizeMarketKeyword(value);
  if (!normalized) {
    return false;
  }
  return MARKET_STAT_KEYWORDS.some((keyword) => normalized.includes(keyword));
};

const needsStatDescriptor = (segment: string): boolean => {
  if (!segment) {
    return false;
  }
  if (containsStatKeyword(segment)) {
    return false;
  }

  const normalized = normalizeMarketKeyword(segment);
  if (!normalized) {
    return false;
  }

  const raw = segment.trim();
  if (/\d+\s*\+$/.test(raw)) {
    return true;
  }
  if (/\b(?:mais|menos|over|under|abaixo|acima)\b/.test(normalized)) {
    return true;
  }
  if (/\b(?:mais|menos)\s+de\b/.test(normalized) && /\d/.test(normalized)) {
    return true;
  }
  return false;
};

const isStatDescriptor = (segment: string): boolean => containsStatKeyword(segment);

const toError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  return new Error('Erro desconhecido');
};

type StatusStyleKey = keyof typeof betStatusPillVariants;

interface ApostaFormState {
  bancaId: string;
  esporte: string;
  evento: string;
  aposta: string;
  torneio: string;
  pais: string;
  mercado: string;
  tipoAposta: string;
  valorApostado: string;
  odd: string;
  bonus: string;
  dataEvento: string;
  tipster: string;
  status: string;
  casaDeAposta: string;
  retornoObtido: string;
}

interface StatusFormState {
  status: string;
  retornoObtido: string;
}

const resolveBetStatusClass = (status: string): string => {
  if (status in betStatusPillVariants) {
    return betStatusPillVariants[status as StatusStyleKey];
  }
  return betStatusPillVariants.default;
};

type UploadTicketData = NonNullable<ApiUploadTicketResponse['data']>;
type UploadApiError = ApiError & {
  code?: string;
  response?: ApiError['response'] & { status?: number };
};

interface FiltersState {
  bancaId: string;
  esporte: string;
  status: string;
  tipster: string;
  casaDeAposta: string;
  dataDe: string;
  dataAte: string;
  searchText: string;
  oddMin: string;
  oddMax: string;
}

type ApiDiagnosticsStatus = 'idle' | 'checking' | 'ok' | 'error';

interface ApiDiagnosticsState {
  status: ApiDiagnosticsStatus;
  message: string;
  latencyMs: number | null;
  lastCheckedAt: string | null;
  probeUrl: string | null;
}

const pageShellClass = 'space-y-10 text-foreground';
const statGridClass = 'grid gap-6 md:grid-cols-2 xl:grid-cols-4';
const dashboardCardShellClass = 'rounded-lg border border-white/5 bg-[#0f2d29] p-6 text-white shadow-[0_25px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm';
const buttonVariants = {
  primary:
    'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60',
  ghost:
    'inline-flex items-center gap-2 rounded-lg border border-border/40 bg-background/40 px-3 py-2 text-sm font-semibold text-foreground transition hover:border-foreground/40 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30',
  destructive:
    'inline-flex items-center gap-2 rounded-lg border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40'
} as const;
const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/80 transition hover:border-brand-emerald/40 hover:bg-white/10 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30';
const tableActionButtonDangerClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40';
const filterButtonClass = 'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';
const filterCountClass = 'rounded-full bg-black/20 px-2 py-0.5 text-xs font-semibold text-white';
const formGridClass = 'grid gap-4 md:grid-cols-2';
const formFieldClass = 'flex flex-col gap-2';
const labelClass = 'text-sm font-semibold text-foreground/80';
const inputClass = 'w-full rounded-2xl border border-border/40 bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:border-brand-emerald focus-visible:ring-2 focus-visible:ring-brand-emerald/30 outline-none transition';
const compactInputClass = 'w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus-visible:border-brand-emerald focus-visible:ring-2 focus-visible:ring-brand-emerald/30 outline-none transition';
const compactInlineInputClass = 'grid gap-2 sm:grid-cols-2';


export default function Atualizar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedApostaForStatus, setSelectedApostaForStatus] = useState<ApiBetWithBank | null>(null);
  const [editingAposta, setEditingAposta] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { bancas, refetch: refetchBancas } = useBancas();
  const { tipsters } = useTipsters();
  const autoSyncBancaRef = useRef(true);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);
  const preferredBancaId = useMemo(() => {
    if (bancas.length === 0) {
      return '';
    }
    const bancaPadrao = bancas.find((banca) => banca.padrao);
    return bancaPadrao?.id ?? bancas[0].id;
  }, [bancas]);

  const {
    filteredApostas: apostas,
    loading: isLoadingApostas,
    fetchApostas,
    createAposta,
    updateAposta,
    deleteAposta,
    updateStatus,
    filters,
    setFilter,
    setFilters,
    activeFilterCount,
    stats: hookStats,
  } = useApostasManager({ defaultBancaId: preferredBancaId });

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [formData, setFormData] = useState<ApostaFormState>({
    bancaId: '',
    esporte: '',
    evento: '',
    aposta: '',
    torneio: '',
    pais: 'Mundo',
    mercado: '',
    tipoAposta: '',
    valorApostado: '',
    odd: '',
    bonus: '0',
    dataEvento: todayISO,
    tipster: '',
    status: 'Pendente',
    casaDeAposta: '',
    retornoObtido: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ApostaFormState, string>>>({});
  const [formNotice, setFormNotice] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [retornoManual, setRetornoManual] = useState(false);
  const [betsExpanded, setBetsExpanded] = useState(false);
  const [apiDiagnostics, setApiDiagnostics] = useState<ApiDiagnosticsState>({
    status: 'idle',
    message: '',
    latencyMs: null,
    lastCheckedAt: null,
    probeUrl: null,
  });

  const isDev = import.meta.env.DEV;

  const checkApiConnectivity = useCallback(async () => {
    setApiDiagnostics((prev) => ({ ...prev, status: 'checking' }));

    const probeCandidates = Array.from(
      new Set([
        API_HEALTH_URL,
        `${API_BASE_URL}/health`,
        API_BASE_URL,
      ]),
    ).filter((url): url is string => typeof url === 'string' && url.length > 0);

    let lastErrorMessage = 'Falha ao verificar API.';

    for (const probeUrl of probeCandidates) {
      const startMark = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const response = await fetch(probeUrl, {
          method: 'GET',
          mode: 'cors',
        });

        const endMark = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const latency = Math.round(endMark - startMark);

        if (!response.ok) {
          lastErrorMessage = `Status ${response.status} em ${probeUrl}`;
          continue;
        }

        setApiDiagnostics({
          status: 'ok',
          message: `API respondendo (HTTP ${response.status}).`,
          latencyMs: latency,
          lastCheckedAt: new Date().toISOString(),
          probeUrl,
        });
        return;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Falha ao verificar API.';
        lastErrorMessage = `${errorMessage} em ${probeUrl}`;
      }
    }

    setApiDiagnostics({
      status: 'error',
      message: lastErrorMessage,
      latencyMs: null,
      lastCheckedAt: new Date().toISOString(),
      probeUrl: null,
    });
  }, []);

  useEffect(() => {
    void checkApiConnectivity();
  }, [checkApiConnectivity]);

  useEffect(() => {
    if (uploadModalOpen) {
      void checkApiConnectivity();
    }
  }, [uploadModalOpen, checkApiConnectivity]);

  const normalizeOptionalString = (value: string) => {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  };

  const parseNumberOrFallback = (value: string, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const parseNullableNumber = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const formatOptionalCellText = (value?: string | null) => {
    if (typeof value !== 'string') {
      return '-';
    }
    const trimmed = value.trim();
    return trimmed === '' ? '-' : trimmed;
  };

  const extractMarketSelections = (market?: string | null): string[] => {
    if (typeof market !== 'string') {
      return [];
    }

    const normalized = market.trim();
    if (normalized === '' || normalized === 'N/D') {
      return [];
    }

    const fragments = normalized
      .replace(/\r/g, '\n')
      .replace(/R\$\s*[\d.,]+/gi, '\n')
      .replace(/Odd[s]?[^\n]*[\d.,]+/gi, '\n')
      .split(/\n+/)
      .flatMap((segment) => segment.split(/\s{2,}|[|]/))
      .map((segment) =>
        segment
          .replace(/R\$\s*[\d.,]+/gi, '')
          .replace(/\s{2,}/g, ' ')
          .replace(/^[^a-zA-ZÀ-ÿ0-9]+/, '')
          .replace(/^[\d\s.,:;()-]+/, '')
          .replace(MARKET_CONNECTOR_PATTERN, '')
          .trim()
      )
      .filter((segment) => segment.length > 0)
      .filter((segment) => {
        if (!/[a-zA-ZÀ-ÿ]/.test(segment)) {
          return false;
        }
        if (MARKET_LABEL_PATTERN.test(segment)) {
          return false;
        }
        if (/^[\d.,]+$/.test(segment.replace(',', '.'))) {
          return false;
        }
        return true;
      });

    const mergedFragments: string[] = [];
    for (let i = 0; i < fragments.length; i += 1) {
      const fragment = fragments[i];
      const next = fragments[i + 1];
      if (next && needsStatDescriptor(fragment) && isStatDescriptor(next)) {
        mergedFragments.push(`${fragment} ${next}`);
        i += 1;
        continue;
      }
      mergedFragments.push(fragment);
    }

    const deduped: string[] = [];
    for (const fragment of mergedFragments) {
      const normalizedFragment = fragment.toLowerCase();
      if (!deduped.some((existing) => existing.toLowerCase() === normalizedFragment)) {
        deduped.push(fragment);
      }
    }

    return deduped;
  };

  const describeNetworkFailure = useCallback((error: UploadApiError) => {
    const hints: string[] = [
      'Não foi possível conectar ao serviço de processamento.',
    ];

    const browserOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
    if (browserOffline) {
      hints.push('O navegador reporta que está offline.');
    }
    if (error.code) {
      hints.push(`Código: ${error.code}`);
    }
    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      hints.push(`Detalhe: ${error.message}`);
    }
    if (apiDiagnostics.status === 'error' && apiDiagnostics.message) {
      hints.push(`Diagnóstico recente: ${apiDiagnostics.message}`);
    }
    if (apiDiagnostics.probeUrl) {
      hints.push(`Último endpoint testado: ${apiDiagnostics.probeUrl}`);
    }

    return hints.join(' ');
  }, [apiDiagnostics]);

  const resetFormState = useCallback(() => {
    setFormData({
      bancaId: preferredBancaId || '',
      esporte: '',
      evento: '',
      aposta: '',
      torneio: '',
      pais: 'Mundo',
      mercado: '',
      tipoAposta: '',
      valorApostado: '',
      odd: '',
      bonus: '0',
      dataEvento: todayISO,
      tipster: '',
      status: 'Pendente',
      casaDeAposta: '',
      retornoObtido: ''
    });
    setRetornoManual(false);
  }, [preferredBancaId, todayISO]);

  // Função para normalizar o esporte do banco para o formato da lista do frontend
  const normalizeEsporte = (esporteFromDb: string): string => normalizarEsporteParaOpcao(esporteFromDb);

  const resolveEventoFromBet = (bet: ApiBetWithBank): string => {
    const legacyEvento = (bet as unknown as { jogo?: string }).jogo;
    return bet.evento ?? legacyEvento ?? '';
  };



  const seedTestBets = useCallback(async () => {
    try {
      if (!window.confirm('Gerar 200 apostas de teste? Isso vai inserir registros no backend.')) {
        return;
      }

      if (!preferredBancaId) {
        toast.error('Nenhuma banca encontrada para associar às apostas de teste.');
        return;
      }

      const esportesList = ESPORTES;
      const casasList = CASAS_APOSTAS;
      const statusList = STATUS_APOSTAS.filter((s) => s !== 'Tudo');

      const today = new Date();

      const payloads: Record<string, unknown>[] = [];

      for (let i = 0; i < 200; i += 1) {
        const esporte = esportesList[i % esportesList.length];
        const casaDeAposta = casasList[i % casasList.length];
        const status = statusList[i % statusList.length];
        const valorApostado = 10 + (i % 20);
        const odd = 1.5 + (i % 10) * 0.1;

        const date = new Date(today);
        date.setDate(today.getDate() - (i % 30));
        const dataEventoISO = date.toISOString();

        const payload: Record<string, unknown> = {
          bancaId: preferredBancaId,
          esporte,
          evento: `Evento de teste #${i + 1}`,
          aposta: 'Resultado Final',
          torneio: 'Liga de Teste',
          pais: 'Mundo',
          mercado: 'Resultado Final',
          tipoAposta: 'Simples',
          valorApostado,
          odd,
          bonus: 0,
          dataEvento: dataEventoISO,
          tipster: undefined,
          status,
          casaDeAposta
        };

        // Para status que têm retorno, já enviar um valor calculado, senão omitir o campo
        if (STATUS_WITH_RETURNS.includes(status)) {
          payload.retornoObtido = valorApostado * odd;
        }

        payloads.push(payload);
      }

      let createdCount = 0;
      let limitReachedMessage: string | null = null;
      let aborted = false;

      for (const payload of payloads) {
        try {
          await apostaService.create(payload as any);
          createdCount += 1;
        } catch (error) {
          const apiError = error as ApiError & { response?: { status?: number } };
          const statusCode = apiError.response?.status;
          if (statusCode === 403) {
            const errorMessage = apiError.response?.data?.error;
            limitReachedMessage =
              typeof errorMessage === 'string'
                ? errorMessage
                : 'Limite diário de apostas atingido.';
          } else {
            console.error('Erro ao criar apostas de teste:', error);
            toast.error('Erro ao criar apostas de teste. Confira o console para mais detalhes.');
          }
          aborted = true;
          break;
        }
      }

      if (createdCount > 0) {
        await fetchApostas();
        window.dispatchEvent(new Event('apostas-updated'));
      }

      if (limitReachedMessage) {
        alert(`Foram geradas ${createdCount} apostas antes do limite diário.
${limitReachedMessage}`);
        return;
      }

      if (aborted) {
        return;
      }

      alert(`${createdCount} apostas de teste criadas com sucesso.`);
    } catch (error) {
      console.error('Erro ao criar apostas de teste:', error);
      toast.error('Erro ao criar apostas de teste. Confira o console para mais detalhes.');
    }
  }, [preferredBancaId, fetchApostas]);

  // Sincronizar formulário e filtros com a banca atual
  useEffect(() => {
    if (!preferredBancaId || formData.bancaId) {
      return;
    }
    setFormData((prev) => ({ ...prev, bancaId: preferredBancaId }));
  }, [preferredBancaId, formData.bancaId]);

  useEffect(() => {
    if (!preferredBancaId) {
      return;
    }
    setFilters((prev) => {
      const bancaExists = prev.bancaId ? bancas.some((banca) => banca.id === prev.bancaId) : false;
      const shouldForceSync = !prev.bancaId || !bancaExists || autoSyncBancaRef.current;

      if (!shouldForceSync && prev.bancaId === preferredBancaId) {
        autoSyncBancaRef.current = true;
        return prev;
      }

      if (!shouldForceSync) {
        return prev;
      }

      if (prev.bancaId === preferredBancaId) {
        autoSyncBancaRef.current = true;
        return prev;
      }

      autoSyncBancaRef.current = true;
      return { ...prev, bancaId: preferredBancaId };
    });
  }, [preferredBancaId, bancas]);

  useEffect(() => {
    const unsubscribes = [
      eventBus.on('banca:updated', () => {
        void refetchBancas(true);
      }),
      eventBus.on('banca:created', () => {
        void refetchBancas(true);
      }),
      eventBus.on('banca:deleted', () => {
        void refetchBancas(true);
      }),
    ];
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [refetchBancas]);

  useEffect(() => {
    void fetchApostas();
  }, [fetchApostas]);

  // Escutar evento de atualização de apostas (disparado quando edita via Telegram)
  useEffect(() => {
    const handleApostasUpdated = () => {
      void fetchApostas();
    };

    window.addEventListener('apostas-updated', handleApostasUpdated);
    return () => {
      window.removeEventListener('apostas-updated', handleApostasUpdated);
    };
  }, [fetchApostas]);

  // Processar parâmetros de URL para abrir modais automaticamente
  useEffect(() => {
    const editParam = searchParams.get('edit');
    const statusParam = searchParams.get('status');
    const novaParamState = location.state as { openNovaAposta?: boolean } | null;

    if (editParam && apostas.length > 0) {
      const aposta = apostas.find(a => a.id === editParam);
      if (aposta) {
        // Preencher formulário com os dados da aposta (mesma lógica de handleEditAposta)
        const dataEvento = aposta.dataEvento
          ? new Date(aposta.dataEvento).toISOString().split('T')[0]
          : '';
        // Normalizar o esporte para corresponder ao formato da lista
        const esporteNormalizado = normalizeEsporte(aposta.esporte);
        setFormData({
          bancaId: aposta.bancaId,
          esporte: esporteNormalizado,
          evento: resolveEventoFromBet(aposta),
          aposta: aposta.aposta ?? '',
          torneio: aposta.torneio ?? '',
          pais: aposta.pais ?? 'Mundo',
          mercado: aposta.mercado,
          tipoAposta: aposta.tipoAposta,
          valorApostado: aposta.valorApostado.toString(),
          odd: aposta.odd.toString(),
          bonus: aposta.bonus.toString(),
          dataEvento,
          tipster: aposta.tipster ?? '',
          status: aposta.status,
          casaDeAposta: aposta.casaDeAposta,
          retornoObtido: aposta.retornoObtido != null ? aposta.retornoObtido.toString() : ''
        });
        setEditingAposta(aposta.id);
        setModalOpen(true);
        setFormErrors({});
        setRetornoManual(true);
        setFormNotice('');
        // Limpar parâmetro da URL
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    }

    if (statusParam && apostas.length > 0) {
      const aposta = apostas.find(a => a.id === statusParam);
      if (aposta) {
        setSelectedApostaForStatus(aposta);
        setStatusModalOpen(true);
        // Limpar parâmetro da URL
        searchParams.delete('status');
        setSearchParams(searchParams, { replace: true });
      }
    }

    if (novaParamState?.openNovaAposta) {
      setEditingAposta(null);
      setFormErrors({});
      setFormNotice('');
      resetFormState();
      setModalOpen(true);
      navigate(location.pathname, { replace: true });
    }
  }, [searchParams, setSearchParams, apostas, location, navigate, resetFormState]);

  useEffect(() => {
    // SSE com httpOnly cookies - backend valida automaticamente
    const streamUrl = `${API_BASE_URL}/apostas/stream`;
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true // Envia cookies httpOnly
    });

    // Throttle para evitar muitas requisições
    let lastFetchTime = 0;
    const THROTTLE_MS = 2000; // Aguardar 2 segundos entre requisições

    const handleBetUpdate = async () => {
      const now = Date.now();
      if (now - lastFetchTime < THROTTLE_MS) {
        return; // Ignorar se ainda não passou o tempo mínimo
      }
      lastFetchTime = now;
      try {
        await fetchApostas();
      } catch (error: unknown) {
        console.error('Erro ao atualizar apostas via stream:', error);
      }
      window.dispatchEvent(new Event('apostas-updated'));
    };

    eventSource.addEventListener('bet-update', handleBetUpdate);
    eventSource.onerror = (error) => {
      console.warn('Conexão com o stream de apostas instável, tentando novamente...', error);
    };

    return () => {
      eventSource.removeEventListener('bet-update', handleBetUpdate);
      eventSource.close();
    };
  }, [fetchApostas]);

  const handleFormChange = useCallback(
    <K extends keyof ApostaFormState>(field: K, value: ApostaFormState[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        if (!prev[field]) {
          return prev;
        }
        return { ...prev, [field]: undefined };
      });
    },
    []
  );

  useEffect(() => {
    if (!modalOpen || retornoManual || !STATUS_WITH_RETURNS.includes(formData.status)) {
      return;
    }

    const valor = parseFloat(formData.valorApostado);
    const odd = parseFloat(formData.odd);

    if (Number.isFinite(valor) && valor > 0 && Number.isFinite(odd) && odd > 0) {
      const retornoCalculado = (valor * odd).toFixed(2);
      setFormData(prev => {
        if (prev.retornoObtido === retornoCalculado) {
          return prev;
        }
        return { ...prev, retornoObtido: retornoCalculado };
      });
    } else {
      setFormData(prev => {
        if (prev.retornoObtido === '') {
          return prev;
        }
        return { ...prev, retornoObtido: '' };
      });
    }
  }, [modalOpen, retornoManual, formData.status, formData.valorApostado, formData.odd]);

  const handleDeleteAposta = async (aposta: ApiBetWithBank) => {
    if (!window.confirm(`Tem certeza que deseja deletar a aposta "${aposta.evento}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await deleteAposta(aposta.id);
      // Disparar evento para atualizar dashboard
      window.dispatchEvent(new Event('apostas-updated'));
    } catch (error) {
      console.error('Erro ao deletar aposta:', error);
      const apiError = error as ApiError;
      const deleteError = apiError.response?.data?.error;
      alert(typeof deleteError === 'string' ? deleteError : 'Erro ao deletar aposta. Tente novamente.');
    }
  };

  const handleEditAposta = (aposta: ApiBetWithBank) => {
    // Converter data para formato do input (YYYY-MM-DD)
    const dataEvento = aposta.dataEvento
      ? new Date(aposta.dataEvento).toISOString().split('T')[0]
      : '';
    // Normalizar o esporte para corresponder ao formato da lista
    const esporteNormalizado = normalizeEsporte(aposta.esporte);

    setFormData({
      bancaId: aposta.bancaId,
      esporte: esporteNormalizado,
      evento: resolveEventoFromBet(aposta),
      aposta: aposta.aposta ?? '',
      torneio: aposta.torneio ?? '',
      pais: aposta.pais ?? 'Mundo',
      mercado: aposta.mercado,
      tipoAposta: aposta.tipoAposta,
      valorApostado: aposta.valorApostado.toString(),
      odd: aposta.odd.toString(),
      bonus: aposta.bonus.toString(),
      dataEvento,
      tipster: aposta.tipster ?? '',
      status: aposta.status,
      casaDeAposta: aposta.casaDeAposta,
      retornoObtido: aposta.retornoObtido != null ? aposta.retornoObtido.toString() : ''
    });
    setEditingAposta(aposta.id);
    setModalOpen(true);
    setFormErrors({});
    setRetornoManual(true);
    setFormNotice('');
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingAposta(null);
    setFormErrors({});
    setFormNotice('');
    resetFormState();
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ApostaFormState, string>> = {};

    if (!formData.bancaId) {
      errors.bancaId = 'Selecione uma banca';
    }
    if (!formData.esporte) {
      errors.esporte = 'Selecione um esporte';
    }
    if (!formData.evento.trim()) {
      errors.evento = 'Digite o evento';
    }
    if (!formData.aposta.trim()) {
      errors.aposta = 'Digite a aposta';
    }
    if (!formData.mercado.trim()) {
      errors.mercado = 'Digite o mercado';
    }
    if (!formData.tipoAposta) {
      errors.tipoAposta = 'Selecione o tipo de aposta';
    }
    if (!formData.valorApostado || parseFloat(formData.valorApostado) <= 0) {
      errors.valorApostado = 'Digite um valor válido';
    }
    if (!formData.odd || parseFloat(formData.odd) <= 0) {
      errors.odd = 'Digite uma odd válida';
    }
    if (!formData.dataEvento) {
      errors.dataEvento = 'Selecione a data do evento';
    }
    if (!formData.casaDeAposta) {
      errors.casaDeAposta = 'Selecione a casa de aposta';
    }
    if (formData.status !== 'Pendente' && !formData.retornoObtido) {
      // Se o status não é Pendente, retornoObtido pode ser necessário dependendo do status
      if (['Ganha', 'Meio Ganha', 'Cashout'].includes(formData.status)) {
        if (!formData.retornoObtido || parseFloat(formData.retornoObtido) <= 0) {
          errors.retornoObtido = 'Digite o retorno obtido';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Validar e converter data
      if (!formData.dataEvento) {
        setFormErrors({ dataEvento: 'Selecione a data do evento' });
        setSaving(false);
        return;
      }

      const dataEventoDate = new Date(formData.dataEvento);
      if (isNaN(dataEventoDate.getTime())) {
        setFormErrors({ dataEvento: 'Data inválida' });
        setSaving(false);
        return;
      }

      if (editingAposta) {
        // Atualizar aposta existente
        await updateAposta(editingAposta, formData);
      } else {
        // Criar nova aposta
        await createAposta(formData);
      }

      // Limpar formulário e fechar modal
      handleCloseModal();

      // Recarregar dados do dashboard (pode ser feito via contexto ou refetch)
      window.dispatchEvent(new Event('apostas-updated'));
    } catch (error) {
      console.error('Erro ao criar aposta:', error);
      const apiError = error as ApiError;
      const responseError = apiError.response?.data?.error;
      if (Array.isArray(responseError)) {
        const zodErrors: Record<string, string> = {};
        responseError.forEach((err) => {
          const fieldKey = err.path?.[0];
          if (fieldKey) {
            zodErrors[fieldKey] = err.message ?? '';
          }
        });
        setFormErrors(zodErrors);
      } else if (typeof responseError === 'string') {
        alert(responseError);
      } else {
        toast.error('Erro ao criar aposta. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Função para processar upload e extrair dados
  const handleUpload = async (file: File) => {
    try {
      setUploading(true);

      uploadAbortControllerRef.current?.abort();
      const controller = new AbortController();
      uploadAbortControllerRef.current = controller;

      const maxAttempts = 2;
      let currentAttempt = 0;
      let uploadResponse: ApiUploadTicketResponse | null = null;

      while (currentAttempt < maxAttempts) {
        currentAttempt += 1;
        try {
          uploadResponse = await apostaService.uploadTicket(file, {
            signal: controller.signal
          });
          break;
        } catch (error) {
          const attemptError = error as UploadApiError;
          if (attemptError.code === 'ERR_CANCELED') {
            throw toError(attemptError);
          }
          const attemptStatus = attemptError.response?.status;
          if (attemptStatus === 504 && currentAttempt < maxAttempts) {
            toast.warning('O serviço demorou para responder. Tentando novamente...');
            await new Promise((resolve) => setTimeout(resolve, 1500));
            continue;
          }
          throw toError(attemptError);
        }
      }

      if (uploadResponse && uploadResponse.success && uploadResponse.data) {
        const extractedData: UploadTicketData = uploadResponse.data;

        // Preencher formulário com dados extraídos
        const defaultBancaId = preferredBancaId || '';
        const rawDate = extractedData.dataEvento ?? (extractedData as Record<string, unknown>).dataJogo;
        const normalizedDate = typeof rawDate === 'string'
          ? rawDate.split('T')[0]
          : todayISO;
        const eventoExtraido = extractedData.evento ?? (extractedData as Record<string, unknown>).jogo;
        setFormData({
          bancaId: defaultBancaId,
          esporte: extractedData.esporte ?? '',
          evento: typeof eventoExtraido === 'string' ? eventoExtraido : '',
          aposta: extractedData.aposta ?? '',
          torneio: extractedData.torneio ?? '',
          pais: extractedData.pais ?? 'Mundo',
          mercado: extractedData.mercado ?? '',
          tipoAposta: extractedData.tipoAposta ?? 'Simples',
          valorApostado: extractedData.valorApostado !== undefined ? extractedData.valorApostado.toString() : '',
          odd: extractedData.odd !== undefined ? extractedData.odd.toString() : '',
          bonus: '0',
          dataEvento: normalizedDate,
          tipster: extractedData.tipster ?? '',
          status: extractedData.status ?? 'Pendente',
          casaDeAposta: extractedData.casaDeAposta ?? '',
          retornoObtido: ''
        });

        // Fechar modal de upload e abrir modal de criação de aposta
        setUploadModalOpen(false);
        setModalOpen(true);
        setEditingAposta(null);
        setRetornoManual(false);
        setFormNotice('Dados extraídos com sucesso! Revise e ajuste os campos antes de salvar.');

      } else {
        const fallbackMessage = uploadResponse?.message ?? uploadResponse?.error ?? 'Não foi possível analisar o bilhete.';
        throw new Error(fallbackMessage);
      }
    } catch (error) {
      const apiError = error as UploadApiError;
      if (apiError.code === 'ERR_CANCELED') {
        return;
      }
      console.error('Erro ao processar upload:', error);
      const errorData = apiError.response?.data;
      const statusCode = apiError.response?.status;
      const errorMessage =
        (typeof errorData?.error === 'string' ? errorData.error : undefined) ??
        errorData?.message ??
        apiError.message ??
        'Erro ao processar imagem. Tente novamente.';

      if (!apiError.response) {
        const offlineMessage = describeNetworkFailure(apiError);
        toast.error(offlineMessage);
        console.error('Upload network failure', {
          uploadUrl: API_UPLOAD_URL,
          healthUrl: apiDiagnostics.probeUrl ?? API_HEALTH_URL,
          diagnostics: apiDiagnostics,
          code: apiError.code,
          message: apiError.message,
        });
        alert(`Erro: ${offlineMessage}`);
        return;
      }

      if (statusCode === 504) {
        const timeoutMessage = 'O serviço de reconhecimento demorou para responder (504). Tente novamente em alguns instantes.';
        toast.error(timeoutMessage);
        alert(`Erro: ${timeoutMessage}`);
        return;
      }

      // Mensagem mais detalhada para erro de quota
      if (errorMessage.includes('Quota') || errorMessage.includes('quota') || errorMessage.includes('excedida')) {
        const isGemini = errorMessage.includes('Gemini');
        const apiName = isGemini ? 'Google Gemini' : 'OpenAI';
        const billingUrl = isGemini
          ? 'https://aistudio.google.com/app/apikey'
          : 'https://platform.openai.com/account/billing';

        alert(
          `⚠️ Quota da API ${apiName} Excedida\n\n` +
          `Você excedeu a cota atual da sua conta ${apiName}.\n\n` +
          `Para resolver:\n` +
          `1. Acesse: ${billingUrl}\n` +
          `2. Verifique seus créditos disponíveis\n` +
          `3. Adicione créditos ou atualize seu plano\n\n` +
          `Após resolver, tente novamente.`
        );
        toast.error('Uso da API excedido. Ajuste a cota e tente novamente.');
      } else {
        alert(`Erro: ${errorMessage}`);
        toast.error(errorMessage);
      }
    } finally {
      uploadAbortControllerRef.current = null;
      setUploading(false);
    }
  };

  const handleOpenUploadModal = () => {
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    setUploading(false);
    setUploadModalOpen(true);
  };

  // Função para fechar modal de upload
  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    setUploading(false);
  };

  // Formatar valores monetários usando utilitário compartilhado
  const formatCurrency = useCallback((value: number): string => {
    return formatCurrencyUtil(value);
  }, []);

  // Formatar data (apenas data, sem horário) usando utilitário compartilhado
  const formatDate = useCallback((dateString: string): string => {
    return formatDateUtil(dateString);
  }, []);

  const handleUpdateStatus = async (statusData: StatusFormState) => {
    if (!selectedApostaForStatus) return;

    try {
      setUpdatingStatus(true);
      
      await updateStatus(selectedApostaForStatus.id, selectedApostaForStatus, statusData);

      // Fechar modal
      setStatusModalOpen(false);
      setSelectedApostaForStatus(null);
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status. Tente novamente.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCloseStatusModal = useCallback(() => {
    setStatusModalOpen(false);
    setSelectedApostaForStatus(null);
  }, []);

  // Função para abrir modal de status
  const handleOpenStatusModal = useCallback((aposta: ApiBetWithBank) => {
    setSelectedApostaForStatus(aposta);
    setStatusModalOpen(true);
  }, []);

  // Calcular estatísticas (recalcula automaticamente quando apostas mudam)
  const stats = useMemo(() => {
    return [
      {
        title: 'Total Apostas',
        value: hookStats.totalApostas.toString(),
        helper: 'apostas registradas',
        color: 'blue' as const
      },
      {
        title: 'Valor Investido',
        value: formatCurrency(hookStats.totalInvestido),
        helper: 'total investido',
        color: 'purple' as const
      },
      {
        title: 'Ganhos',
        value: formatCurrency(hookStats.totalGanhos),
        helper: 'lucro obtido',
        color: 'emerald' as const
      },
      {
        title: 'Pendente',
        value: formatCurrency(hookStats.totalPendente),
        helper: 'aguardando resultado',
        color: 'amber' as const
      }
    ];
  }, [hookStats, formatCurrency]);



  return (
    <div className={pageShellClass}>
      <PageHeader
        title="Atualizar Apostas"
        subtitle="Gerencie seus bilhetes, aplique filtros avançados e mantenha o histórico sincronizado"
        actions={
          <div className="flex flex-wrap items-center gap-3 relative">
            <button
              type="button"
              className={filterButtonClass}
              onClick={() => setFiltersOpen(true)}
            >
              <Filter size={16} />
              Filtros
              {activeFilterCount > 0 && (
                <span className={filterCountClass}>{activeFilterCount}</span>
              )}
            </button>
            <button
            type="button"
            className={buttonVariants.primary}
            onClick={handleOpenUploadModal}
          >
            <Upload size={16} /> Upload Bilhete
          </button>
            <button
              type="button"
              className={buttonVariants.primary}
              onClick={() => {
                setEditingAposta(null);
                setModalOpen(true);
                setRetornoManual(false);
                setFormNotice('');
              }}
            >
              <Plus size={16} /> Nova Aposta
            </button>
            {filtersOpen && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <FilterPopoverApostas
                  open={filtersOpen}
                  onClose={() => setFiltersOpen(false)}
                  footer={
                    <button className={buttonVariants.primary} onClick={() => setFiltersOpen(false)}>
                      Aplicar Filtros
                    </button>
                  }
                >
                  <div className={cn(formGridClass, 'w-[min(440px,80vw)]')}>
                    <div className={cn(formFieldClass, 'col-span-2')}>
                      <label className={labelClass}>Evento, Mercado, Aposta</label>
                      <input
                        className={compactInputClass}
                        type="text"
                        placeholder="Digite o nome do evento, mercado ou aposta"
                        value={filters.searchText}
                        onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
                      />
                    </div>

                    <div className={formFieldClass}>
                      <label className={labelClass}>Banca</label>
                      <DropdownSelect
                        options={bancas.map((banca) => ({ value: banca.id, label: banca.nome }))}
                        value={filters.bancaId}
                        onChange={(val) => {
                          autoSyncBancaRef.current = false;
                          setFilters((prev) => ({ ...prev, bancaId: val }));
                        }}
                        placeholder="Selecione uma banca"
                        className="w-full"
                        useWrapperClass
                      />
                    </div>

                    <div className={formFieldClass}>
                      <label className={labelClass}>Esporte</label>
                      <DropdownSelect
                        options={ESPORTES.map((esporte) => ({ value: esporte, label: esporte }))}
                        value={filters.esporte}
                        onChange={(val) => setFilters((prev) => ({ ...prev, esporte: val }))}
                        placeholder="Selecione…"
                        className="w-full"
                        searchable
                        useWrapperClass
                      />
                    </div>

                    <div className={formFieldClass}>
                      <label className={labelClass}>Status</label>
                      <DropdownSelect
                        options={STATUS_APOSTAS.map((s) => ({ value: s, label: s }))}
                        value={filters.status}
                        onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
                        placeholder="Selecione um status"
                        className="w-full"
                        useWrapperClass
                      />
                    </div>

                    {/** Status Salvamento removido per request */}

                    <div className={formFieldClass}>
                      <label className={labelClass}>Tipster</label>
                      <DropdownSelect
                        options={tipsters.filter((t) => t.ativo).map((t) => ({ value: t.nome, label: t.nome }))}
                        value={filters.tipster}
                        onChange={(val) => setFilters((prev) => ({ ...prev, tipster: val }))}
                        placeholder="Selecione…"
                        className="w-full"
                        useWrapperClass
                      />
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-3 items-end">
                      <div className={formFieldClass}>
                        <label className={labelClass}>Casa de Aposta</label>
                        <DropdownSelect
                          options={CASAS_APOSTAS.map((casa) => ({ value: casa, label: casa }))}
                          value={filters.casaDeAposta}
                          onChange={(val) => setFilters((prev) => ({ ...prev, casaDeAposta: val }))}
                          placeholder="Selecione…"
                          className="w-full"
                          searchable
                          useWrapperClass
                        />
                      </div>

                      <div className={formFieldClass}>
                        <label className={labelClass}>Data do Evento (De)</label>
                        <DateInput
                          value={filters.dataDe}
                          onChange={(value) => setFilters((prev) => ({ ...prev, dataDe: value }))}
                          placeholder="dd/mm/aaaa"
                          className={compactInputClass}
                        />
                      </div>

                      <div className={formFieldClass}>
                        <label className={cn(labelClass, 'whitespace-nowrap')}>Data do Evento (Até)</label>
                        <DateInput
                          value={filters.dataAte}
                          onChange={(value) => setFilters((prev) => ({ ...prev, dataAte: value }))}
                          placeholder="dd/mm/aaaa"
                          className={compactInputClass}
                        />
                      </div>

                      <p className="col-span-3 text-xs text-foreground/60 mt-1">
                        Se só preencher "De", filtramos somente este dia. Com "Até", usamos o intervalo.
                      </p>
                    </div>

                    {/** Evento field moved to top */}

                    {/** ODD filter removed per request */}
                  </div>
                </FilterPopoverApostas>
              </div>
            )}
          </div>
        }
      />

      <div className={statGridClass}>
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} helper={stat.helper} color={stat.color} />
        ))}
      </div>

      <div className={cn(dashboardCardShellClass, 'space-y-6')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Apostas</h3>
          <div className="flex items-center gap-2">
            {isDev && (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-brand-emerald/50 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30"
                onClick={() => {
                  void seedTestBets();
                }}
                title="Gerar 200 apostas de teste (apenas desenvolvimento)"
              >
                Gerar testes
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-brand-emerald/50 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30"
              onClick={() => setBetsExpanded((prev) => !prev)}
            >
              {betsExpanded ? 'Recolher' : 'Expandir'}
            </button>
          </div>
        </div>

        {apostas.length === 0 ? (
          <EmptyState title="Nenhuma aposta" description="Cadastre uma nova aposta para começar a acompanhar resultados." />
        ) : (
          <div className={cn('overflow-hidden rounded-2xl border border-white/10', betsExpanded ? '' : 'max-h-[420px] overflow-y-auto')}>
            <table className="w-full table-auto border-collapse text-left text-sm text-white">
              <thead className="bg-white/5">
                <tr>
                  {['Casa de Aposta', 'Tipster', 'Data', 'Esporte', 'Evento', 'Aposta', 'Mercado', 'Stake', 'Status', 'Retorno Obtido', 'Ações'].map((column) => (
                    <th key={column} className="px-4 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-white/60">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredApostas.map((aposta) => {
                  const marketSelections = extractMarketSelections(aposta.mercado);

                  return (
                    <tr key={aposta.id} className="text-white">
                      <td className="px-4 py-3 align-middle text-sm font-medium text-white">{formatOptionalCellText(aposta.casaDeAposta)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white/80">{formatOptionalCellText(aposta.tipster)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white/80">{formatDate(aposta.dataEvento)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white/80">{normalizeEsporte(aposta.esporte)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white">{aposta.evento}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white/80">{formatOptionalCellText(aposta.aposta)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-white/80">
                        {marketSelections.length > 0 ? (
                          <ul className="space-y-1">
                            {marketSelections.map((selection, index) => (
                              <li key={`${aposta.id}-market-${index}`} className="flex items-start gap-2">
                                <span className="mt-0.5 text-xs text-white/50">•</span>
                                <span className="whitespace-pre-line">{selection}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>{formatOptionalCellText(aposta.mercado)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-white">
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="font-semibold text-white">{formatCurrency(aposta.valorApostado)}</span>
                          <span className="text-xs text-white/60">Odd: {aposta.odd}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(aposta)}
                          className={cn(
                            betStatusPillBaseClass,
                            'text-xs',
                            resolveBetStatusClass(aposta.status)
                          )}
                        >
                          {getBetStatusIcon(aposta.status)}
                          {aposta.status}
                        </button>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-white">
                        {aposta.retornoObtido != null ? formatCurrency(aposta.retornoObtido) : '-'}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 text-white">
                          <button
                            type="button"
                            className={tableActionButtonClass}
                            onClick={() => handleEditAposta(aposta)}
                            title="Editar aposta"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className={tableActionButtonDangerClass}
                            onClick={() => handleDeleteAposta(aposta)}
                            title="Deletar aposta"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        title={editingAposta ? "Editar Aposta" : "Nova Aposta"}
        subtitle="Configure sua entrada"
        icon={<Zap size={24} className="text-black" fill="currentColor" />}
        size="form"
      >
        {formNotice && (
          <div className="mb-4 rounded-2xl border border-border/30 bg-background/80 p-4 text-sm text-foreground">
            {formNotice}
          </div>
        )}
        <ApostaForm
          formData={formData as unknown as ApostaFormData}
          onChange={handleFormChange as any}
          onSubmit={handleSubmit}
          bancas={bancas.map(b => ({ ...b, ePadrao: b.padrao } as any))}
          tipsters={tipsters}
          errors={formErrors as unknown as ApostaFormErrors}
          isEditing={!!editingAposta}
          saving={saving}
          notice={formNotice}
          onCancel={handleCloseModal}
        />
      </Modal>

      {/* Modal de Upload */}
      <UploadTicketModal
        isOpen={uploadModalOpen}
        onClose={handleCloseUploadModal}
        onProcess={handleUpload}
        loading={uploading}
      />

      {/* Modal de Status */}
      <ApostaStatusModal
        isOpen={statusModalOpen}
        aposta={selectedApostaForStatus}
        onClose={handleCloseStatusModal}
        onConfirm={handleUpdateStatus}
        loading={updatingStatus}
      />
    </div>
  );
}


