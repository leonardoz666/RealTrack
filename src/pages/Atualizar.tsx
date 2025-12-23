import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Upload, Zap } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import UploadTicketModal from '../components/UploadTicketModal';
import ApostaForm, { type ApostaFormData, type ApostaFormErrors } from '../components/ApostaForm';
import ApostaStatusModal from '../components/ApostaStatusModal';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import { ESPORTES, normalizarEsporteParaOpcao } from '../constants/esportes';
import { apostaService } from '../services/api';
import { eventBus } from '../utils/eventBus';
import { toast } from '../utils/toast';
import { formatCurrency as formatCurrencyUtil, formatDate as formatDateUtil } from '../utils/formatters';
import { useTipsters } from '../hooks/useTipsters';
import { useBancas } from '../hooks/useBancas';
import { useApostasManager } from '../hooks/useApostasManager';
import { cn } from '../components/ui/utils';
import { type ApiBetWithBank, type ApiError, type ApiUploadTicketResponse } from '../types/api';
import { API_BASE_URL, API_HEALTH_URL, API_UPLOAD_URL } from '../config/api';
import { toError } from '../utils/errorUtils';
import { STATUS_WITH_RETURNS } from '../constants/marketPatterns';

import ApiDiagnostics from '../components/ApiDiagnostics';
import { useApiDiagnostics } from '../hooks/useApiDiagnostics';
import ApostasList from '../components/apostas/ApostasList';
import ApostasFilters from '../components/apostas/ApostasFilters';

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

type UploadTicketData = NonNullable<ApiUploadTicketResponse['data']>;
type UploadApiError = ApiError & {
  code?: string;
  response?: ApiError['response'] & { status?: number };
};

const pageShellClass = 'space-y-10 text-foreground';
const statGridClass = 'grid gap-6 md:grid-cols-2 xl:grid-cols-4';
const dashboardCardShellClass = 'rounded-[32px] border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop-blur-2xl dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]';
const buttonVariants = {
  primary:
    'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60',
} as const;

export default function Atualizar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
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
  
  const { apiDiagnostics, checkApiConnectivity } = useApiDiagnostics();

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

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    if (uploadModalOpen) {
      void checkApiConnectivity();
    }
  }, [uploadModalOpen, checkApiConnectivity]);

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
        alert(`Foram geradas ${createdCount} apostas antes do limite diário.\n${limitReachedMessage}`);
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

  useEffect(() => {
    const handleApostasUpdated = () => {
      void fetchApostas();
    };

    window.addEventListener('apostas-updated', handleApostasUpdated);
    return () => {
      window.removeEventListener('apostas-updated', handleApostasUpdated);
    };
  }, [fetchApostas]);

  useEffect(() => {
    const editParam = searchParams.get('edit');
    const statusParam = searchParams.get('status');
    const novaParamState = location.state as { openNovaAposta?: boolean } | null;

    if (editParam && apostas.length > 0) {
      const aposta = apostas.find(a => a.id === editParam);
      if (aposta) {
        const dataEvento = aposta.dataEvento
          ? new Date(aposta.dataEvento).toISOString().split('T')[0]
          : '';
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
        searchParams.delete('edit');
        setSearchParams(searchParams, { replace: true });
      }
    }

    if (statusParam && apostas.length > 0) {
      const aposta = apostas.find(a => a.id === statusParam);
      if (aposta) {
        setSelectedApostaForStatus(aposta);
        setStatusModalOpen(true);
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
    const streamUrl = `${API_BASE_URL}/apostas/stream`;
    const eventSource = new EventSource(streamUrl, {
      withCredentials: true
    });

    let lastFetchTime = 0;
    const THROTTLE_MS = 2000;

    const handleBetUpdate = async () => {
      const now = Date.now();
      if (now - lastFetchTime < THROTTLE_MS) {
        return;
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
      window.dispatchEvent(new Event('apostas-updated'));
    } catch (error) {
      console.error('Erro ao deletar aposta:', error);
      const apiError = error as ApiError;
      const deleteError = apiError.response?.data?.error;
      alert(typeof deleteError === 'string' ? deleteError : 'Erro ao deletar aposta. Tente novamente.');
    }
  };

  const handleEditAposta = (aposta: ApiBetWithBank) => {
    const dataEvento = aposta.dataEvento
      ? new Date(aposta.dataEvento).toISOString().split('T')[0]
      : '';
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
        await updateAposta(editingAposta, formData);
      } else {
        await createAposta(formData);
      }

      handleCloseModal();
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

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    uploadAbortControllerRef.current?.abort();
    uploadAbortControllerRef.current = null;
    setUploading(false);
  };

  const formatCurrency = useCallback((value: number): string => {
    return formatCurrencyUtil(value);
  }, []);

  const formatDate = useCallback((dateString: string): string => {
    return formatDateUtil(dateString);
  }, []);

  const handleUpdateStatus = async (statusData: StatusFormState) => {
    if (!selectedApostaForStatus) return;

    try {
      setUpdatingStatus(true);
      
      await updateStatus(selectedApostaForStatus.id, selectedApostaForStatus, statusData);

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

  const handleOpenStatusModal = useCallback((aposta: ApiBetWithBank) => {
    setSelectedApostaForStatus(aposta);
    setStatusModalOpen(true);
  }, []);

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
        badge="APOSTAS"
        actions={
          <div className="flex flex-wrap items-center gap-3 relative">
            <ApostasFilters
              filters={filters}
              setFilters={setFilters}
              activeFilterCount={activeFilterCount}
              bancas={bancas}
              tipsters={tipsters}
              onBancaChange={() => {
                autoSyncBancaRef.current = false;
              }}
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-emerald-500/50 hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
              onClick={seedTestBets}
              title="Gerar 200 apostas de teste"
            >
              Gerar testes
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
          </div>
        }
      />

      <div className={statGridClass}>
        {stats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} helper={stat.helper} color={stat.color} />
        ))}
      </div>

      <ApostasList
        apostas={apostas}
        onEdit={handleEditAposta}
        onDelete={handleDeleteAposta}
        onStatusClick={handleOpenStatusModal}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

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

      <UploadTicketModal
        isOpen={uploadModalOpen}
        onClose={handleCloseUploadModal}
        onProcess={handleUpload}
        loading={uploading}
      />

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
