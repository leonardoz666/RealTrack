import { useState, useCallback, useMemo } from 'react';
import Modal from './Modal';
import { toast } from '../utils/toast';
import {
  STATUS_WITH_RETURNS,
  calcularRetornoObtido,
  parseNullableNumber,
  type StatusFormState,
} from '../hooks/useApostasManager';
import type { ApiBetWithBank } from '../types/api';
import { cn } from './ui/utils';
import {
  Check,
  X,
  Clock,
  Zap,
  RefreshCw,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// ============================================
// Tipos
// ============================================

interface ApostaStatusModalProps {
  isOpen: boolean;
  aposta: ApiBetWithBank | null;
  onClose: () => void;
  onConfirm: (statusData: StatusFormState) => Promise<void>;
  loading?: boolean;
}

// ============================================
// Componente
// ============================================

export default function ApostaStatusModal({
  isOpen,
  aposta,
  onClose,
  onConfirm,
  loading = false,
}: ApostaStatusModalProps) {
  if (!aposta) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Definir Resultado"
      subtitle="Atualize o status e o retorno da sua aposta"
      size="sm"
    >
      {isOpen ? (
        <StatusFormContent
          key={aposta.id}
          aposta={aposta}
          onClose={onClose}
          onConfirm={onConfirm}
          loading={loading}
        />
      ) : null}
    </Modal>
  );
}

interface StatusFormContentProps {
  aposta: ApiBetWithBank;
  onClose: () => void;
  onConfirm: (statusData: StatusFormState) => Promise<void>;
  loading: boolean;
}

function StatusFormContent({ aposta, onClose, onConfirm, loading }: StatusFormContentProps) {
  const [formData, setFormData] = useState<StatusFormState>({
    status: aposta.status,
    retornoObtido: aposta.retornoObtido != null ? aposta.retornoObtido.toString() : '',
  });

  const handleSubmit = useCallback(async () => {
    if (!formData.status) {
      toast.error('Selecione um status');
      return;
    }
    await onConfirm(formData);
  }, [formData, onConfirm]);

  const manualRetornoValue = parseNullableNumber(formData.retornoObtido);

  const handleAutoCalculate = () => {
    const calculado = calcularRetornoObtido(
      formData.status,
      aposta.valorApostado,
      Number(aposta.odd),
      manualRetornoValue
    );
    if (calculado !== null) {
      setFormData(prev => ({ ...prev, retornoObtido: calculado.toFixed(2).replace('.', ',') }));
    }
  };

  const retornoPreview = useMemo(() => {
    const manualVal = parseNullableNumber(formData.retornoObtido.replace(',', '.'));
    
    // Agora o calcularRetornoObtido lida com TODOS os casos
    return calcularRetornoObtido(
      formData.status,
      aposta.valorApostado,
      Number(aposta.odd),
      manualVal
    ) ?? 0;
  }, [formData.status, aposta.valorApostado, aposta.odd, formData.retornoObtido]);

  const mainStatusList = ['Ganha', 'Perdida', 'Pendente'];
  const secondaryStatusList = ['Meio Ganha', 'Meio Perdida', 'Cashout', 'Reembolsada', 'Void'];

  return (
    <div className="space-y-4 pt-1">
      {/* Seção Aposta */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-white/90">Aposta</label>
        <div className="relative">
          <div className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-xs text-white/80 shadow-inner">
            <span className="font-semibold truncate">Aposta #{aposta.id.split('-')[0].toUpperCase()} - {aposta.evento}</span>
            <ChevronDown size={16} className="text-white/30 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Status Principal */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/90">Status Principal</label>
        <div className="grid grid-cols-3 gap-2">
          {mainStatusList.map((status) => {
            const isSelected = formData.status === status;
            let themeClass = "";
            let iconClass = "rounded-full p-0.5 border-2 flex items-center justify-center";
            let Icon = Clock;

            if (status === 'Ganha') {
              themeClass = isSelected
                ? "bg-[#10b981] ring-2 ring-white border-transparent shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                : "bg-[#065f46] border-white/5 opacity-80 hover:opacity-100";
              Icon = Check;
            } else if (status === 'Perdida') {
              themeClass = isSelected
                ? "bg-[#ac3c43] ring-2 ring-white border-transparent shadow-[0_0_20px_rgba(172,60,67,0.5)]"
                : "bg-[#7f1d1d] border-white/5 opacity-80 hover:opacity-100";
              Icon = X;
            } else if (status === 'Pendente') {
              themeClass = isSelected
                ? "bg-[#9a6a0e] ring-2 ring-white border-transparent shadow-[0_0_20px_rgba(154,106,14,0.5)]"
                : "bg-[#78350f] border-white/5 opacity-80 hover:opacity-100";
              Icon = Clock;
            }

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={cn(
                  "flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-bold text-white transition-all active:scale-95 shadow-md relative overflow-hidden",
                  themeClass
                )}
              >
                <div className={cn(iconClass, isSelected ? "border-white" : "border-white/20")}>
                  <Icon size={12} strokeWidth={4} />
                </div>
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Secundário */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white/90">Status Secundário (Opcional)</label>
        <div className="grid grid-cols-5 gap-1.5">
          {secondaryStatusList.map((status) => {
            const isSelected = formData.status === status;
            let themeClass = "";
            let Icon = Clock;

            if (status === 'Meio Ganha') {
              themeClass = isSelected ? "bg-green-600 border-transparent shadow-[0_0_15px_rgba(22,163,74,0.3)]" : "bg-green-900 border-white/5 opacity-80";
              Icon = ArrowUpRight;
            } else if (status === 'Meio Perdida') {
              themeClass = isSelected ? "bg-orange-700 border-transparent shadow-[0_0_15px_rgba(194,65,12,0.3)]" : "bg-orange-900 border-white/5 opacity-80";
              Icon = ArrowDownRight;
            } else if (status === 'Cashout') {
              themeClass = isSelected ? "bg-violet-600 border-transparent shadow-[0_0_15px_rgba(124,58,237,0.3)]" : "bg-violet-900 border-white/5 opacity-80";
              Icon = Zap;
            } else if (status === 'Reembolsada') {
              themeClass = isSelected ? "bg-blue-600 border-transparent shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-blue-900 border-white/5 opacity-80";
              Icon = RefreshCw;
            } else if (status === 'Void') {
              themeClass = isSelected ? "bg-slate-600 border-transparent shadow-[0_0_15px_rgba(71,85,105,0.3)]" : "bg-app-slate-light border-white/5 opacity-80";
              Icon = RefreshCw;
            }

            return (
              <button
                key={status}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg border py-2 text-[9px] font-bold text-white transition-all active:scale-95 hover:opacity-100",
                  themeClass,
                  isSelected && "ring-2 ring-white opacity-100"
                )}
              >
                <Icon size={14} />
                <span className="text-center leading-[1.1]">{status.toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção Valor Resultado */}
      <div className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-inner relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 blur-[40px]" />

        <div className="flex items-center justify-between mb-4">
          <label className="text-[10px] font-bold text-white uppercase tracking-wider">Valor Resultado</label>
          <button
            type="button"
            onClick={handleAutoCalculate}
            className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[9px] font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95"
          >
            <Zap size={10} className="fill-emerald-400" />
            CÁLCULO AUTOMÁTICO
          </button>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-emerald-500">R$</span>
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {retornoPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">Baseado na Odd e Stake</p>
          </div>

          <div className="w-32 space-y-2">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] block text-right">Ajuste Manual</label>
            <input
              type="text"
              placeholder="0,00"
              value={formData.retornoObtido}
              onChange={(e) => setFormData(prev => ({ ...prev, retornoObtido: e.target.value }))}
              className="w-full rounded-lg bg-black/20 px-3 py-2.5 text-right text-sm font-bold text-white border border-white/5 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3.5 text-sm font-bold text-white transition hover:bg-white/5 active:scale-95"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={loading || !formData.status}
          className="flex-1 rounded-xl bg-brand-emerald px-4 py-3.5 text-sm font-bold text-white shadow-[0_8px_16px_-4px_rgba(16,185,129,0.3)] transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Confirmar Status'}
        </button>
      </div>
    </div>
  );
}
