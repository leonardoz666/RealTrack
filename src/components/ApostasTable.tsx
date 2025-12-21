/**
 * Componente de Tabela de Apostas
 * 
 * Exibe lista de apostas em formato de tabela com ações
 */

import { Pencil, Trash2 } from 'lucide-react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { formatCurrency } from '../utils/formatters';
import { EmptyState } from './ui/empty-state';
import type { ApiBetWithBank } from '../types/api';
import { cn } from './ui/utils';
import {
  betStatusPillBaseClass,
  betStatusPillVariants,
  getBetStatusIcon,
} from '../constants/betStatusStyles';
import { normalizarEsporteParaOpcao } from '../constants/esportes';

// ============================================
// Tipos
// ============================================

interface ApostasTableProps {
  apostas: ApiBetWithBank[];
  expanded: boolean;
  onToggleExpand: () => void;
  onOpenStatusModal: (aposta: ApiBetWithBank) => void;
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
  showDevButton?: boolean;
  onSeedTestBets?: () => void;
}

// ============================================
// Constantes & Styles
// ============================================

const GRID_TEMPLATE_COLUMNS = "minmax(140px, 1fr) minmax(120px, 1fr) 100px 100px minmax(200px, 2fr) 100px 100px 100px 110px 120px 80px";
const MIN_TABLE_WIDTH = 1270;
const ROW_HEIGHT = 64; // Altura aproximada da linha

// ============================================
// Helpers
// ============================================

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const formatOptionalText = (value: string | null | undefined): string => {
  if (typeof value !== 'string') {
    return '-';
  }
  const trimmed = value.trim();
  return trimmed === '' ? '-' : trimmed;
};

// ============================================
// Componente
// ============================================

export default function ApostasTable({
  apostas,
  expanded,
  onToggleExpand,
  onOpenStatusModal,
  onEdit,
  onDelete,
  showDevButton = false,
  onSeedTestBets,
}: ApostasTableProps) {
  // Dados passados para o item renderizador (Row)
  const itemData = {
    items: apostas,
    onOpenStatusModal,
    onEdit,
    onDelete,
  };

  return (
    <div className="rounded-lg border border-white/5 bg-[#0f2d29] p-6 text-white shadow-[0_25px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-semibold">Apostas</h3>
        <div className="flex flex-wrap gap-2">
          {showDevButton && onSeedTestBets && (
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hocus:border-brand-emerald/60 hocus:text-brand-emerald"
              onClick={onSeedTestBets}
              title="Gerar 200 apostas de teste (apenas desenvolvimento)"
            >
              Gerar testes
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hocus:border-brand-emerald/60 hocus:text-brand-emerald"
            onClick={onToggleExpand}
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      </div>

      {apostas.length === 0 ? (
        <EmptyState
          title="Nenhuma aposta"
          description="Cadastre uma nova aposta para começar a acompanhar resultados."
        />
      ) : (
        <div className={cn('mt-4 overflow-hidden rounded-2xl border border-white/10 flex flex-col', expanded ? 'h-[800px]' : 'h-[420px]')}>
          {/* Container com scroll horizontal para tabelas largas */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden bg-white/5">
             <div style={{ minWidth: MIN_TABLE_WIDTH, height: '100%' }} className="flex flex-col">
                {/* Header */}
                <div 
                  className="grid items-center border-b border-white/10 bg-white/5 text-left text-xs font-semibold uppercase tracking-[0.3em] text-white/60"
                  style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS, paddingRight: 8 }} // paddingRight para compensar scrollbar se necessário
                >
                  <div className="px-4 py-3">Casa de Aposta</div>
                  <div className="px-4 py-3">Tipster</div>
                  <div className="px-4 py-3">Data</div>
                  <div className="px-4 py-3">Esporte</div>
                  <div className="px-4 py-3">Evento</div>
                  <div className="px-4 py-3">Aposta</div>
                  <div className="px-4 py-3">Mercado</div>
                  <div className="px-4 py-3">Stake</div>
                  <div className="px-4 py-3">Status</div>
                  <div className="px-4 py-3">Retorno</div>
                  <div className="px-4 py-3 text-right">Ações</div>
                </div>

                {/* Lista Virtualizada */}
                <div className="flex-1">
                  <AutoSizer>
                    {({ height, width }) => (
                      <List
                        height={height}
                        width={width}
                        itemCount={apostas.length}
                        itemSize={ROW_HEIGHT}
                        itemData={itemData}
                        className="overflow-y-auto"
                      >
                        {ApostaRowRenderer}
                      </List>
                    )}
                  </AutoSizer>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Componente de Linha (Renderer)
// ============================================

interface RowData {
  items: ApiBetWithBank[];
  onOpenStatusModal: (aposta: ApiBetWithBank) => void;
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
}

function ApostaRowRenderer({ index, style, data }: ListChildComponentProps<RowData>) {
  const aposta = data.items[index];
  const { onOpenStatusModal, onEdit, onDelete } = data;
  const statusVariant = betStatusPillVariants[aposta.status] ?? betStatusPillVariants.default;

  return (
    <div 
      style={style} 
      className={cn(
        "grid items-center border-b border-white/5 text-sm transition-colors hover:bg-white/5",
        index % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]" // Zebra striping opcional
      )}
    >
      <div 
        className="grid items-center h-full w-full" 
        style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}
      >
        <div className="px-4 truncate font-medium text-white" title={aposta.casaDeAposta || ''}>{formatOptionalText(aposta.casaDeAposta)}</div>
        <div className="px-4 truncate text-white/80" title={aposta.tipster || ''}>{formatOptionalText(aposta.tipster)}</div>
        <div className="px-4 text-white/60">{formatDate(aposta.dataEvento)}</div>
        <div className="px-4 truncate text-white/80">{normalizarEsporteParaOpcao(aposta.esporte)}</div>
        <div className="px-4 truncate text-white/80" title={aposta.evento}>{aposta.evento}</div>
        <div className="px-4 truncate text-white/80" title={aposta.aposta}>{aposta.aposta}</div>
        <div className="px-4 truncate text-white/80" title={aposta.mercado}>{aposta.mercado}</div>
        <div className="px-4">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-white">{formatCurrency(aposta.valorApostado)}</span>
            <span className="text-2xs uppercase tracking-[0.3em] text-white/50">
              Odd: {aposta.odd}
            </span>
          </div>
        </div>
        <div className="px-4">
          <button
            type="button"
            onClick={() => onOpenStatusModal(aposta)}
            className={cn(betStatusPillBaseClass, 'text-xs w-full justify-center', statusVariant)}
          >
            {getBetStatusIcon(aposta.status, { className: 'h-4 w-4 shrink-0' })}
            <span className="truncate">{aposta.status}</span>
          </button>
        </div>
        <div className="px-4 font-semibold text-white">
          {aposta.retornoObtido != null ? formatCurrency(aposta.retornoObtido) : '-'}
        </div>
        <div className="px-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 transition hocus:border-brand-emerald/60 hocus:text-brand-emerald"
              onClick={() => onEdit(aposta)}
              title="Editar aposta"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl border border-rose-400/40 px-3 py-2 text-xs font-semibold text-rose-300 transition hocus:bg-rose-500/15"
              onClick={() => onDelete(aposta)}
              title="Deletar aposta"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
