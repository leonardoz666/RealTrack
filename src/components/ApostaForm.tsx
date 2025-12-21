import { type FormEvent, useCallback } from 'react';
import DateInput from './DateInput';
import { ESPORTES } from '../constants/esportes';
import { TIPOS_APOSTA } from '../constants/tiposAposta';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import type { ApiBankroll, ApiTipster } from '../types/api';
import { ChevronRight } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

  const inputStyles = "h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-brand-emerald/50 focus-visible:border-brand-emerald/50";
  const labelStyles = "text-[11px] font-bold uppercase tracking-wider text-white/50";
  const selectTriggerStyles = "h-11 bg-white/5 border-white/10 text-white focus:ring-brand-emerald/50";
  const selectContentStyles = "bg-[#1a1a1a] border-white/10 text-white";

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
                  <Label className={labelStyles}>Banca</Label>
                  <Select
                    value={formData.bancaId}
                    onValueChange={(value) => onChange('bancaId', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {bancas.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.bancaId && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.bancaId}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Casa de Aposta</Label>
                  <Select
                    value={formData.casaDeAposta}
                    onValueChange={(value) => onChange('casaDeAposta', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {CASAS_APOSTAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.casaDeAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.casaDeAposta}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Tipster</Label>
                  <Select
                    value={formData.tipster}
                    onValueChange={(value) => onChange('tipster', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {activeTipsters.map((t) => <SelectItem key={t.id} value={t.nome}>{(t as any).nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
                  <Label className={labelStyles}>Esporte</Label>
                  <Select
                    value={formData.esporte}
                    onValueChange={(value) => onChange('esporte', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {ESPORTES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.esporte && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.esporte}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelStyles}>Nome do Evento</Label>
                  <Input
                    value={formData.evento}
                    onChange={(e) => onChange('evento', e.target.value)}
                    placeholder="Ex: Flamengo vs Palmeiras"
                    className={inputStyles}
                  />
                  {errors.evento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.evento}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Data do Evento</Label>
                  <DateInput
                    value={formData.dataEvento}
                    onChange={(v) => onChange('dataEvento', v)}
                    placeholder="DD/MM/AAAA"
                    className={inputStyles}
                  />
                  {errors.dataEvento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.dataEvento}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => onChange('status', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {STATUS_APOSTAS.filter(s => s !== 'Tudo').map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Bônus (Opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.bonus}
                    onChange={(e) => onChange('bonus', e.target.value)}
                    placeholder="0.00"
                    className={inputStyles}
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
                  <Label className={labelStyles}>Tipo de Aposta</Label>
                  <Select
                    value={formData.tipoAposta}
                    onValueChange={(value) => onChange('tipoAposta', value)}
                  >
                    <SelectTrigger className={selectTriggerStyles}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className={selectContentStyles}>
                      {TIPOS_APOSTA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.tipoAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.tipoAposta}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelStyles}>Mercado</Label>
                  <Input
                    value={formData.mercado}
                    onChange={(e) => onChange('mercado', e.target.value)}
                    placeholder="Ex: Resultado Final"
                    className={inputStyles}
                  />
                  {errors.mercado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.mercado}</div>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelStyles}>Descrição da Aposta</Label>
                <Input
                  value={formData.aposta}
                  onChange={(e) => onChange('aposta', e.target.value)}
                  placeholder="ex: Vitória do Mandante"
                  className={inputStyles}
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
                  <Label className={labelStyles}>Valor Apostado</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-emerald font-bold text-xs z-10">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorApostado}
                      onChange={(e) => onChange('valorApostado', e.target.value)}
                      placeholder="0.00"
                      className={`${inputStyles} pl-8`}
                    />
                  </div>
                  {errors.valorApostado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.valorApostado}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Odd</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.odd}
                    onChange={(e) => onChange('odd', e.target.value)}
                    placeholder="0.00"
                    className={inputStyles}
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
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-auto inline-flex items-center justify-center gap-2 rounded-lg bg-brand-emerald px-6 py-3 text-sm font-black text-black shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:bg-brand-emerald/90 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Aposta'}
                  {!saving && <ChevronRight size={18} />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onCancel?.()}
                  className="w-full h-auto px-6 py-3 rounded-lg border-white/10 bg-transparent text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white transition-all outline-none border"
                >
                  Cancelar
                </Button>
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
