import { type FormEvent, useCallback } from 'react';
import DateInput from './DateInput';
import { ESPORTES } from '../constants/esportes';
import { TIPOS_APOSTA } from '../constants/tiposAposta';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import type { ApiBankroll, ApiTipster } from '../types/api';
import { ChevronRight } from 'lucide-react';

export interface ApostaFormData {
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

export interface ApostaFormErrors {
  bancaId?: string;
  esporte?: string;
  evento?: string;
  aposta?: string;
  mercado?: string;
  tipoAposta?: string;
  valorApostado?: string;
  odd?: string;
  dataEvento?: string;
  casaDeAposta?: string;
  retornoObtido?: string;
}

interface ApostaFormProps {
  formData: ApostaFormData;
  onChange: (field: keyof ApostaFormData, value: string) => void;
  onSubmit: (e?: FormEvent) => void | Promise<void>;
  bancas: ApiBankroll[];
  tipsters: ApiTipster[];
  errors?: ApostaFormErrors;
  isEditing?: boolean;
  saving?: boolean;
  notice?: string;
  onCancel?: () => void;
}

export default function ApostaForm({
  formData,
  onChange,
  onSubmit,
  bancas,
  tipsters,
  errors = {},
  isEditing = false,
  saving = false,
  notice,
  onCancel,
}: ApostaFormProps) {
  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  }, [onSubmit]);

  const valor = Number.parseFloat(formData.valorApostado) || 0;
  const odd = Number.parseFloat(formData.odd) || 0;
  const bonus = Number.parseFloat(formData.bonus) || 0;
  const totalReturn = valor * odd + bonus;
  const profit = totalReturn - valor;

  const activeTipsters = tipsters.filter((t) => (t as any).ativo !== false);

  return (
    <>
      {notice && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-background/80 p-3 text-sm text-foreground">{notice}</div>}

      <form onSubmit={handleSubmit} className="w-full">
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Left column */}
          <div className="space-y-6">
            {/* Identificação */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-brand-emerald pl-3">
                <h3 className="text-sm font-bold tracking-widest text-brand-emerald">IDENTIFICAÇÃO</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Banca</label>
                  <select
                    value={formData.bancaId}
                    onChange={(e) => onChange('bancaId', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Selecione</option>
                    {bancas.map((b) => <option key={b.id} value={b.id} className="bg-[#1a1a1a]">{b.nome}</option>)}
                  </select>
                  {errors.bancaId && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.bancaId}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Casa de Aposta</label>
                  <select
                    value={formData.casaDeAposta}
                    onChange={(e) => onChange('casaDeAposta', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Selecione</option>
                    {CASAS_APOSTAS.map((c) => <option key={c} value={c} className="bg-[#1a1a1a]">{c}</option>)}
                  </select>
                  {errors.casaDeAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.casaDeAposta}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Tipster</label>
                  <select
                    value={formData.tipster}
                    onChange={(e) => onChange('tipster', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Selecione</option>
                    {activeTipsters.map((t) => <option key={t.id} value={t.nome} className="bg-[#1a1a1a]">{(t as any).nome}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Evento */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-brand-emerald pl-3">
                <h3 className="text-sm font-bold tracking-widest text-brand-emerald">EVENTO</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Esporte</label>
                  <select
                    value={formData.esporte}
                    onChange={(e) => onChange('esporte', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Selecione</option>
                    {ESPORTES.map((s) => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                  </select>
                  {errors.esporte && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.esporte}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Nome do Evento</label>
                  <input
                    value={formData.evento}
                    onChange={(e) => onChange('evento', e.target.value)}
                    placeholder="Ex: Flamengo vs Palmeiras"
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  />
                  {errors.evento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.evento}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Data do Evento</label>
                  <DateInput
                    value={formData.dataEvento}
                    onChange={(v) => onChange('dataEvento', v)}
                    placeholder="DD/MM/AAAA"
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  />
                  {errors.dataEvento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.dataEvento}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    {STATUS_APOSTAS.filter(s => s !== 'Tudo').map((s) => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Bônus (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bonus}
                    onChange={(e) => onChange('bonus', e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/10 focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  />
                </div>
              </div>
            </section>

            {/* Detalhes da Aposta */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-brand-emerald pl-3">
                <h3 className="text-sm font-bold tracking-widest text-brand-emerald">DETALHES DA APOSTA</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Tipo de Aposta</label>
                  <select
                    value={formData.tipoAposta}
                    onChange={(e) => onChange('tipoAposta', e.target.value)}
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  >
                    <option value="" disabled className="bg-[#1a1a1a]">Selecione</option>
                    {TIPOS_APOSTA.map((t) => <option key={t} value={t} className="bg-[#1a1a1a]">{t}</option>)}
                  </select>
                  {errors.tipoAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.tipoAposta}</div>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Mercado</label>
                  <input
                    value={formData.mercado}
                    onChange={(e) => onChange('mercado', e.target.value)}
                    placeholder="Ex: Resultado Final"
                    className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/10 placeholder:text-white/20 text-white focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  />
                  {errors.mercado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.mercado}</div>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Descrição da Aposta</label>
                <input
                  value={formData.aposta}
                  onChange={(e) => onChange('aposta', e.target.value)}
                  placeholder="ex: Vitória do Mandante"
                  className="w-full h-11 px-4 text-sm rounded-md bg-white/5 border border-white/20 text-white focus:border-brand-emerald focus:ring-1 focus:ring-brand-emerald transition-all outline-none ring-1 ring-white/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                />
                {errors.aposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.aposta}</div>}
              </div>

            </section>
          </div>

          {/* Right column / aside */}
          <aside className="h-fit sticky top-0 space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-brand-emerald pl-3 mb-4">
              <h3 className="text-sm font-bold tracking-widest text-brand-emerald">VALORES</h3>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Valor Apostado</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-emerald font-bold text-xs">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorApostado}
                      onChange={(e) => onChange('valorApostado', e.target.value)}
                      placeholder="0.00"
                      className="w-full h-11 rounded-md bg-white/5 border border-white/10 pl-8 pr-2 text-sm text-white placeholder:text-white/10 focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                    />
                  </div>
                  {errors.valorApostado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.valorApostado}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-white/50">Odd</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.odd}
                    onChange={(e) => onChange('odd', e.target.value)}
                    placeholder="0.00"
                    className="w-full h-11 px-3 text-sm rounded-md bg-white/5 border border-white/10 text-white placeholder:text-white/10 focus:border-brand-emerald/50 focus:ring-1 focus:ring-brand-emerald/50 transition-all outline-none"
                  />
                  {errors.odd && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.odd}</div>}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-emerald/10 to-transparent p-4 border border-brand-emerald/20 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]">
              {/* Box Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">RETORNO</span>
                <div className="flex items-center gap-1.5 rounded-full bg-brand-emerald/10 px-2 py-0.5 border border-brand-emerald/20">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-emerald animate-pulse" />
                  <span className="text-[9px] font-bold text-brand-emerald uppercase tracking-tighter">LIVE</span>
                </div>
              </div>

              <div className="text-3xl font-bold text-brand-emerald tracking-tighter mb-3">
                <span className="text-xl mr-1">R$</span>
                {totalReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="flex items-center gap-2 group cursor-default">
                <p className="text-[10px] font-medium text-white/40">Lucro potencial</p>
                <ChevronRight size={10} className="text-brand-emerald/50 transition-transform group-hover:translate-x-0.5" />
                <span className="text-xs font-bold text-brand-emerald ml-auto">
                  R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Background accent */}
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-brand-emerald/5 blur-2xl" />
            </div>

            {/* Buttons and notice moved from footer */}
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-emerald px-6 py-3 text-sm font-black text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Aposta'}
                  {!saving && <ChevronRight size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => onCancel?.()}
                  className="w-full px-6 py-3 rounded-lg border border-white/10 bg-transparent text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all outline-none"
                >
                  Cancelar
                </button>
              </div>
              <div className="text-[10px] text-center font-medium text-white/20">
                Todos os campos são obrigatórios
              </div>
            </div>
          </aside>
        </div>

      </form>
    </>
  );
}
