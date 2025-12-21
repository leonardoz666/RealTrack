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
  const panelClass = 'grid gap-2 sm:grid-cols-2 md:grid-cols-2';
  const fieldClass = 'flex flex-col gap-2 rounded-2xl border border-border/40 bg-background-card/40 p-2 shadow-sm shadow-black/0 backdrop-blur';
  const labelClass = 'text-2xs font-semibold uppercase tracking-[0.35em] text-foreground-muted';
  const inputClass =
    'w-full rounded-2xl border border-border/50 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted shadow-sm transition focus-visible:border-brand-emerald focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-emerald/30';
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
    <div className="relative inline-flex">
      <button
        type="button"
        className={filterButtonClass}
        onClick={() => {
          setPendingFilters(value);
          setOpen((prev) => !prev);
        }}
      >
        <Filter size={16} /> Filtros{' '}
        {activeFiltersCount > 0 && <span className={filterCountClass}>{activeFiltersCount}</span>}
      </button>
      <FilterPopoverAnalise
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        onClear={handleClear}
        footer={
          <button
            type="button"
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.99]"
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
              useWrapperClass
              searchable
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Status</label>
            <DropdownSelect
              options={STATUS_APOSTAS.map((s) => ({ value: s, label: s }))}
              value={pendingFilters.status}
              onChange={(val) => handleFilterChange('status', val)}
              placeholder="Selecione um status"
              className={inputClass}
              useWrapperClass
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
              useWrapperClass
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
              useWrapperClass
              searchable
            />
          </div>
          <div className={fieldClass}>
            <label className={labelClass}>Evento, Mercado ou Aposta</label>
            <input
              type="text"
              value={pendingFilters.evento}
              onChange={(event) => handleFilterChange('evento', event.target.value)}
              placeholder="Digite o nome do evento, mercado ou aposta"
              className={inputClass}
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
    </div>
  );
}

export default AnaliseFilters;


