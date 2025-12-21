import { Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { cn } from '../ui/utils';
import { betStatusPillBaseClass, getBetStatusIcon } from '../../constants/betStatusStyles';
import { resolveBetStatusClass, extractMarketSelections } from '../../utils/betUtils';
import { normalizarEsporteParaOpcao } from '../../constants/esportes';
import type { ApiBetWithBank } from '../../types/api';

interface ApostasListProps {
  apostas: ApiBetWithBank[];
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (aposta: ApiBetWithBank) => void;
  onDelete: (aposta: ApiBetWithBank) => void;
  onStatusClick: (aposta: ApiBetWithBank) => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateString: string) => string;
  onSeedTestBets?: () => void;
  isDev?: boolean;
}

const tableActionButtonClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/80 transition hover:border-brand-emerald/40 hover:bg-white/10 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30';
const tableActionButtonDangerClass =
  'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40';

export default function ApostasList({
  apostas,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onStatusClick,
  formatCurrency,
  formatDate,
  onSeedTestBets,
  isDev = false
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
    <div className="rounded-lg border border-white/5 bg-app-darker p-6 text-white shadow-[0_25px_45px_rgba(0,0,0,0.25)] backdrop-blur-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">Apostas</h3>
        <div className="flex items-center gap-2">
          {isDev && onSeedTestBets && (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-brand-emerald/50 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30"
              onClick={onSeedTestBets}
              title="Gerar 200 apostas de teste (apenas desenvolvimento)"
            >
              Gerar testes
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-brand-emerald/50 hover:text-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30"
            onClick={onToggleExpand}
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      </div>

      {apostas.length === 0 ? (
        <EmptyState title="Nenhuma aposta" description="Cadastre uma nova aposta para começar a acompanhar resultados." />
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border border-white/10', expanded ? '' : 'max-h-[420px] overflow-y-auto')}>
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
              {apostas.map((aposta) => {
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
                        onClick={() => onStatusClick(aposta)}
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
                          onClick={() => onEdit(aposta)}
                          title="Editar aposta"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          className={tableActionButtonDangerClass}
                          onClick={() => onDelete(aposta)}
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
  );
}
