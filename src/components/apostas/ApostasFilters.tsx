import { useState } from 'react';
import { Filter } from 'lucide-react';
import { cn } from '../ui/utils';
import FilterPopoverApostas from '../FilterPopoverApostas';
import DateInput from '../DateInput';
import DropdownSelect from '../DropdownSelect';
import { CASAS_APOSTAS } from '../../constants/casasApostas';
import { STATUS_APOSTAS } from '../../constants/statusApostas';
import { ESPORTES } from '../../constants/esportes';
import type { ApostasFilters as ApostasFiltersType } from '../../hooks/useApostasManager';
import type { ApiBanca, ApiTipster } from '../../types/api';

interface ApostasFiltersProps {
  filters: ApostasFiltersType;
  setFilters: React.Dispatch<React.SetStateAction<ApostasFiltersType>>;
  activeFilterCount: number;
  bancas: ApiBanca[];
  tipsters: ApiTipster[];
  onBancaChange?: () => void;
}

const filterButtonClass = 'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';
const filterCountClass = 'rounded-full bg-black/20 px-2 py-0.5 text-xs font-semibold text-white';
const buttonVariants = {
  primary:
    'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 disabled:cursor-not-allowed disabled:opacity-60',
};
const formGridClass = 'grid gap-4 md:grid-cols-2';
const formFieldClass = 'flex flex-col gap-2';
const labelClass = 'text-sm font-semibold text-foreground/80';
const compactInputClass = 'w-full rounded-lg border border-border/30 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus-visible:border-brand-emerald focus-visible:ring-2 focus-visible:ring-brand-emerald/30 outline-none transition';

export default function ApostasFilters({
  filters,
  setFilters,
  activeFilterCount,
  bancas,
  tipsters,
  onBancaChange,
}: ApostasFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className={filterButtonClass}
        onClick={() => setIsOpen(true)}
      >
        <Filter size={16} />
        Filtros
        {activeFilterCount > 0 && (
          <span className={filterCountClass}>{activeFilterCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50">
          <FilterPopoverApostas
            open={isOpen}
            onClose={() => setIsOpen(false)}
            footer={
              <button className={buttonVariants.primary} onClick={() => setIsOpen(false)}>
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
                  value={filters.bancaId || ''}
                  onChange={(val) => {
                    if (onBancaChange) onBancaChange();
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
            </div>
          </FilterPopoverApostas>
        </div>
      )}
    </div>
  );
}
