import { FixedSizeList as List, type ListChildComponentProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { cn } from '../ui/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { betStatusPillBaseClass, getBetStatusIcon } from '../../constants/betStatusStyles';
import { resolveBetStatusClass, extractMarketSelections } from '../../utils/betUtils';
import { normalizarEsporteParaOpcao } from '../../constants/esportes';
import type { ApiBetWithBank } from '../../types/api';

interface ApostasListProps {
  apostas: ApiBetWithBank[];
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
  onStatusClick: (aposta: ApiBetWithBank) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
}

const tableActionButtonClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:border-brand-emerald/40 hover:bg-white/10 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30';
const tableActionButtonDangerClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40';

// Grid configuration for consistent alignment between header and rows
// Total must cover the width. Using grid-cols-12 or arbitrary values.
// We use a custom grid template for fine control.
const GRID_TEMPLATE = "minmax(90px, 0.6fr) minmax(100px, 0.8fr) minmax(90px, 0.7fr) minmax(100px, 0.8fr) minmax(140px, 1.2fr) minmax(160px, 1.4fr) minmax(100px, 0.8fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr) minmax(100px, 0.8fr) 80px";

interface RowContext {
  apostas: ApiBetWithBank[];
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
  onStatusClick: (aposta: ApiBetWithBank) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  normalizeEsporte: (esporte: string) => string;
  formatOptionalCellText: (value?: string | null) => string;
}

const CellTooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  if (!content) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs text-xs">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const Row = ({ index, style, data }: ListChildComponentProps<RowContext>) => {
  const { 
    apostas, 
    onEdit, 
    onDelete, 
    onStatusClick, 
    formatCurrency, 
    formatDate,
    normalizeEsporte,
    formatOptionalCellText 
  } = data;
  
  const aposta = apostas[index];
  const marketSelections = extractMarketSelections(aposta.mercado);
  const marketDisplay = marketSelections.length > 0 ? marketSelections.join(', ') : formatOptionalCellText(aposta.mercado);
  const statusClass = resolveBetStatusClass(aposta.status);

  return (
    <div className="group">
      <div 
        style={style} 
        className="grid items-center gap-4 px-6 border-b border-emerald-500/10 hover:bg-emerald-500/5 transition-colors h-full text-sm text-white"
      >
        <div 
          className="grid items-center gap-4 h-full w-full"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <CellTooltip content={aposta.casaDeAposta || ''}>
          <div className="truncate font-medium text-white">
            {formatOptionalCellText(aposta.casaDeAposta)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.tipster || ''}>
          <div className="truncate text-white/80">
            {formatOptionalCellText(aposta.tipster)}
          </div>
        </CellTooltip>
        
        <div className="truncate text-white/80">
          {formatDate(aposta.dataEvento)}
        </div>
        
        <CellTooltip content={normalizeEsporte(aposta.esporte)}>
          <div className="whitespace-normal break-words line-clamp-3 text-white/80 leading-tight">
            {normalizeEsporte(aposta.esporte)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.evento}>
          <div className="whitespace-normal break-words line-clamp-3 text-white leading-tight">
            {aposta.evento}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.aposta || ''}>
          <div className="whitespace-normal break-words line-clamp-3 text-white/80 leading-tight">
            {formatOptionalCellText(aposta.aposta)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={marketDisplay}>
          <div className="whitespace-normal break-words line-clamp-3 text-white/80 leading-tight">
            {marketDisplay}
          </div>
        </CellTooltip>
        
        <div className="flex flex-col">
          <span className="truncate text-base font-semibold text-white">
            {formatCurrency(aposta.valorApostado)}
          </span>
          <span className="text-xs text-white/50 font-medium">
            ODD: {aposta.odd ? aposta.odd.toFixed(2) : '-'}
          </span>
        </div>
        <div>
          <button
            onClick={() => onStatusClick(aposta)}
            className={cn(betStatusPillBaseClass, statusClass, "w-full max-w-[110px] mx-auto")}
          >
            {getBetStatusIcon(aposta.status, { size: 12, className: "mr-1.5" })}
            {aposta.status}
          </button>
        </div>
        <div className={cn(
          "truncate text-base font-bold",
          aposta.retornoObtido > 0 ? "text-emerald-400" : 
          aposta.retornoObtido < 0 ? "text-rose-400" : "text-white/60"
        )}>
          {formatCurrency(aposta.retornoObtido)}
        </div>
        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          <CellTooltip content="Editar aposta">
            <button
              type="button"
              className={tableActionButtonClass}
              onClick={() => onEdit(aposta)}
            >
              <Pencil size={14} />
            </button>
          </CellTooltip>
          
          <CellTooltip content="Deletar aposta">
            <button
              type="button"
              className={tableActionButtonDangerClass}
              onClick={() => onDelete(aposta)}
            >
              <Trash2 size={14} />
            </button>
          </CellTooltip>
        </div>
      </div>
    </div>
  </div>
  );
};

export default function ApostasList({
  apostas,
  onEdit,
  onDelete,
  onStatusClick,
  formatCurrency,
  formatDate,
}: ApostasListProps) {
  const formatOptionalCellText = (value?: string | null) => {
    if (typeof value !== 'string') {
      return '-';
    }
    const trimmed = value.trim();
    return trimmed === '' ? '-' : trimmed;
  };

  const normalizeEsporte = (esporteFromDb: string): string => normalizarEsporteParaOpcao(esporteFromDb);

  const itemData = {
    apostas,
    onEdit,
    onDelete,
    onStatusClick,
    formatCurrency,
    formatDate,
    normalizeEsporte,
    formatOptionalCellText
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border border-emerald-500/20 bg-app-slate-light py-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.3)] ring-1 ring-white/5 backdrop-blur-sm space-y-6 flex flex-col h-full min-h-[500px]">
        {apostas.length === 0 ? (
          <div className="px-6">
            <EmptyState title="Nenhuma aposta" description="Cadastre uma nova aposta para começar a acompanhar resultados." />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Header */}
            <div 
              className="grid gap-4 pl-6 py-3 border-b border-emerald-500/20 text-[0.7rem] uppercase tracking-[0.18em] text-white/60 font-medium shrink-0"
              style={{ gridTemplateColumns: GRID_TEMPLATE, paddingRight: '40px' /* Scrollbar compensation + padding */ }}
            >
              <div>Casa</div>
              <div>Tipster</div>
              <div>Data</div>
              <div>Esporte</div>
              <div>Evento</div>
              <div>Aposta</div>
              <div>Mercado</div>
              <div>Stake</div>
              <div>Status</div>
              <div>Retorno</div>
              <div className="text-right">Ações</div>
            </div>

            {/* Virtualized List */}
            <div className="flex-1 w-full">
              <AutoSizer>
                {({ height, width }) => (
                  <List
                    height={height}
                    itemCount={apostas.length}
                    itemSize={90} // Increased height to allow text wrapping
                    width={width}
                    overscanCount={5}
                    itemData={itemData}
                  >
                    {Row}
                  </List>
                )}
              </AutoSizer>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
