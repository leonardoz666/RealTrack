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
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 transition hover:border-emerald-400/40 hover:bg-emerald-500/20 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:text-brand-neon dark:hover:text-white';
const tableActionButtonDangerClass =
  'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-400/40 bg-rose-500/10 text-rose-600 transition hover:bg-rose-500/20 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 dark:text-rose-200 dark:hover:text-white';

// Grid configuration for consistent alignment between header and rows
// Total must cover the width. Using grid-cols-12 or arbitrary values.
// We use a custom grid template for fine control.
const GRID_TEMPLATE = "minmax(90px, 0.6fr) minmax(100px, 0.8fr) minmax(90px, 0.7fr) minmax(100px, 0.8fr) minmax(140px, 1.2fr) minmax(160px, 1.4fr) minmax(100px, 0.8fr) minmax(90px, 0.7fr) minmax(110px, 0.9fr) minmax(100px, 0.8fr) 80px";

interface RowProps {
  aposta: ApiBetWithBank;
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
  onStatusClick: (aposta: ApiBetWithBank) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  normalizeEsporte: (esporte: string) => string;
  formatOptionalCellText: (value?: string | null) => string;
}

const MobileBetCard = ({ 
  aposta, 
  onEdit, 
  onDelete, 
  onStatusClick, 
  formatCurrency, 
  formatDate,
  normalizeEsporte,
  formatOptionalCellText 
}: RowProps) => {
  const statusClass = resolveBetStatusClass(aposta.status);
  
  return (
    <div className="border border-gray-200 rounded-2xl p-4 bg-white dark:bg-white/5 dark:border-white/10 shadow-sm transition-all active:scale-[0.99]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-3 min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-2 leading-tight mb-1">
            {aposta.evento}
          </h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-white/60">
            <span>{formatDate(aposta.dataEvento)}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
            <span>{normalizeEsporte(aposta.esporte)}</span>
            {aposta.casaDeAposta && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{aposta.casaDeAposta}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => onEdit(aposta)}
            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onDelete(aposta)}
            className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4 bg-gray-50 dark:bg-emerald-900/20 rounded-xl p-3">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40 block mb-0.5">Aposta</span>
          <span className="font-medium text-gray-700 dark:text-gray-200 line-clamp-1" title={aposta.aposta}>
            {formatOptionalCellText(aposta.aposta)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40 block mb-0.5">Odd</span>
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {aposta.odd ? Number(aposta.odd).toFixed(2) : '-'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40 block mb-0.5">Valor</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(aposta.valorApostado)}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-white/40 block mb-0.5">Retorno</span>
          <span className={cn(
            "font-bold", 
            aposta.retornoObtido > 0 ? "text-emerald-600 dark:text-emerald-400" : 
            aposta.retornoObtido < 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-white/50"
          )}>
            {formatCurrency(aposta.retornoObtido)}
          </span>
        </div>
      </div>

      <button 
        onClick={() => onStatusClick(aposta)}
        className={cn(betStatusPillBaseClass, statusClass, "w-full justify-center text-xs h-9 font-semibold")}
      >
        {getBetStatusIcon(aposta.status, { size: 14, className: "mr-2" })}
        {aposta.status}
      </button>
    </div>
  );
};

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

const Row = ({ 
  aposta, 
  onEdit, 
  onDelete, 
  onStatusClick, 
  formatCurrency, 
  formatDate,
  normalizeEsporte,
  formatOptionalCellText 
}: RowProps) => {
  const marketSelections = extractMarketSelections(aposta.mercado);
  const marketDisplay = marketSelections.length > 0 ? marketSelections.join(', ') : formatOptionalCellText(aposta.mercado);
  const statusClass = resolveBetStatusClass(aposta.status);

  return (
    <div className="group border-b border-gray-200 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5 transition-colors text-sm text-gray-900 dark:text-white">
      <div 
        className="grid items-center gap-4 px-6 py-4"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
      >
        <CellTooltip content={aposta.casaDeAposta || ''}>
          <div className="truncate font-medium text-gray-900 dark:text-white">
            {formatOptionalCellText(aposta.casaDeAposta)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.tipster || ''}>
          <div className="truncate text-gray-500 dark:text-white/80">
            {formatOptionalCellText(aposta.tipster)}
          </div>
        </CellTooltip>
        
        <div className="truncate text-gray-500 dark:text-white/80">
          {formatDate(aposta.dataEvento)}
        </div>
        
        <CellTooltip content={normalizeEsporte(aposta.esporte)}>
          <div className="whitespace-normal break-words line-clamp-3 text-gray-700 dark:text-white/80 leading-tight">
            {normalizeEsporte(aposta.esporte)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.evento}>
          <div className="whitespace-normal break-words line-clamp-3 text-gray-900 dark:text-white leading-tight">
            {aposta.evento}
          </div>
        </CellTooltip>
        
        <CellTooltip content={aposta.aposta || ''}>
          <div className="whitespace-normal break-words line-clamp-3 text-gray-700 dark:text-white/80 leading-tight">
            {formatOptionalCellText(aposta.aposta)}
          </div>
        </CellTooltip>
        
        <CellTooltip content={marketDisplay}>
          <div className="whitespace-normal break-words line-clamp-3 text-gray-700 dark:text-white/80 leading-tight">
            {marketDisplay}
          </div>
        </CellTooltip>
        
        <div className="flex flex-col">
          <span className="truncate text-base font-semibold text-gray-900 dark:text-white">
            {formatCurrency(aposta.valorApostado)}
          </span>
          <span className="text-xs text-gray-500 dark:text-white/50 font-medium">
            ODD: {aposta.odd ? Number(aposta.odd).toFixed(2) : '-'}
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
          aposta.retornoObtido > 0 ? "text-emerald-600 dark:text-brand-neon" : 
          aposta.retornoObtido < 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400 dark:text-white/60"
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

  return (
    <>
      <div className="block md:hidden space-y-4 pb-4">
        {apostas.length === 0 ? (
          <EmptyState title="Nenhuma aposta" description="Cadastre uma nova aposta para começar a acompanhar resultados." />
        ) : (
          apostas.map((aposta) => (
            <MobileBetCard
              key={aposta.id}
              aposta={aposta}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusClick={onStatusClick}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              normalizeEsporte={normalizeEsporte}
              formatOptionalCellText={formatOptionalCellText}
            />
          ))
        )}
      </div>

      <TooltipProvider>
        <div className="hidden md:flex rounded-[32px] border border-gray-200 bg-white py-6 text-gray-900 shadow-xl backdrop-blur-2xl dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-emerald-800/20 dark:text-white dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6 flex-col max-h-[75vh] min-h-[500px]">
          {apostas.length === 0 ? (
            <div className="px-6">
              <EmptyState title="Nenhuma aposta" description="Cadastre uma nova aposta para começar a acompanhar resultados." />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Header */}
              <div 
                className="grid gap-4 pl-6 py-3 border-b border-gray-100 text-[0.7rem] uppercase tracking-[0.18em] font-bold shrink-0 dark:border-white/10"
                style={{ gridTemplateColumns: GRID_TEMPLATE, paddingRight: '40px', color: '#00ff9d' }}
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

              {/* Simple List */}
              <div className="flex-1 w-full overflow-y-auto">
                {apostas.map((aposta) => (
                  <Row
                    key={aposta.id}
                    aposta={aposta}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStatusClick={onStatusClick}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    normalizeEsporte={normalizeEsporte}
                    formatOptionalCellText={formatOptionalCellText}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </>
  );
}
