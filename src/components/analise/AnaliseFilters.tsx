import { Filter } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CASAS_APOSTAS } from '../../constants/casasApostas';
import { STATUS_APOSTAS } from '../../constants/statusApostas';
import { useTipsters } from '../../hooks/useTipsters';
import { useBancas } from '../../hooks/useBancas';
import DateInput from '../DateInput';
import FilterPopover from '../FilterPopover';
import FilterPopoverAnalise from '../FilterPopoverAnalise';
import DropdownSelect from '../DropdownSelect';
import type { AnaliseFilters } from '../../types/AnaliseFilters';

interface AnaliseFiltersProps {
  value: AnaliseFilters;
  onChange: (next: AnaliseFilters) => void;
}

const initialFilters: AnaliseFilters = {
  bancaId: '',
  status: '',
  tipster: '',
  casa: '',
  esporte: '',
  evento: '',
  dataInicio: '',
  dataFim: '',
  oddMin: '',
  oddMax: '',
};

export function AnaliseFilters({ value, onChange }: AnaliseFiltersProps) {
  const { tipsters } = useTipsters();
  const { bancas } = useBancas();
  const [open, setOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<AnaliseFilters>(value);

  const filterButtonClass =
    'inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40';
  const filterCountClass =
    'rounded-full bg-black/20 px-2 text-xs font-semibold tracking-wide text-white shadow-inner';
  const panelClass = 'grid gap-4 sm:grid-cols-2';
  const fieldClass = 'flex flex-col gap-1.5';
  const labelClass = 'text-xs font-semibold uppercase tracking-wider text-foreground-muted';
  const inputClass =
    'w-full rounded-lg border border-gray-200 dark:border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted shadow-sm transition focus-visible:border-emerald-500 dark:focus-visible:border-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:focus-visible:ring-brand-emerald/30';
  const hintClass = 'text-xs leading-relaxed text-foreground-muted';

  const handleFilterChange = useCallback(
    <K extends keyof AnaliseFilters>(field: K, fieldValue: AnaliseFilters[K]) => {
      setPendingFilters((prev) => ({ ...prev, [field]: fieldValue }));
    },
    [],
  );

  const handleApply = useCallback(() => {
    onChange(pendingFilters);
    setOpen(false);
  }, [onChange, pendingFilters]);

  const handleClear = useCallback(() => {
    const nextFilters = { ...initialFilters, bancaId: value.bancaId };
    setPendingFilters(nextFilters);
    onChange(nextFilters);
    setOpen(false);
  }, [onChange, value.bancaId]);

  const activeFiltersCount = useMemo(
    () =>
      Object.entries(value)
        .filter(([key, filterValue]) => key !== 'bancaId' && filterValue !== '')
        .length,
    [value],
  );

  return (
    <FilterPopoverAnalise
        open={open}
        onOpenChange={(newOpen) => {
          if (newOpen) {
            setPendingFilters(value);
          }
          setOpen(newOpen);
        }}
        trigger={
          <button
            type="button"
            className={filterButtonClass}
          >
            <Filter size={16} /> Filtros{' '}
            {activeFiltersCount > 0 && <span className={filterCountClass}>{activeFiltersCount}</span>}
          </button>
        }
        onClear={handleClear}
        footer={
          <button
            type="button"
            className="w-full sm:w-auto rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
            onClick={handleApply}
          >
            Aplicar filtros
          </button>
        }
        maxWidth="720px"
      >
        <div className={panelClass} data-filter-context="true">
          <div className={fieldClass}>
            <label className={labelClass}>Banca</label>
            <DropdownSelect
              options={bancas.map((banca) => ({ value: banca.id, label: banca.nome }))}
              value={pendingFilters.bancaId}
              onChange={(val) => handleFilterChange('bancaId', val)}
              placeholder={bancas.length > 0 ? 'Selecione a banca' : 'Nenhuma banca disponível'}
              className={inputClass}
              searchable
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Tipsters</label>
            <DropdownSelect
              options={tipsters.filter((t) => t.ativo).map((t) => ({ value: t.nome, label: t.nome }))}
              value={pendingFilters.tipster}
              onChange={(val) => handleFilterChange('tipster', val)}
              placeholder="Selecione…"
              className={inputClass}
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Casa de Apostas</label>
            <DropdownSelect
              options={CASAS_APOSTAS.map((casa) => ({ value: casa, label: casa }))}
              value={pendingFilters.casa}
              onChange={(val) => handleFilterChange('casa', val)}
              placeholder="Selecione a casa"
              className={inputClass}
              searchable
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Data do Evento (De)</label>
            <DateInput
              value={pendingFilters.dataInicio}
              onChange={(dateValue) => handleFilterChange('dataInicio', dateValue)}
              placeholder="dd/mm/aaaa"
              className={inputClass}
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Data do Evento (Até)</label>
            <DateInput
              value={pendingFilters.dataFim}
              onChange={(dateValue) => handleFilterChange('dataFim', dateValue)}
              placeholder="dd/mm/aaaa"
              className={inputClass}
            />
            <p className={hintClass}>
              Se só preencher &quot;De&quot;, será filtrado apenas nesta data. Se preencher &quot;Até&quot;, será
              considerado como intervalo.
            </p>
          </div>
          {/* ODD fields removed per request to simplify filters */}
        </div>
      </FilterPopoverAnalise>
  );
}

export default AnaliseFilters;


