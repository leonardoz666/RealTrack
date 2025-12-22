import { type FormEvent, useCallback, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { apostaSchema, type ApostaFormValues } from '../schemas/apostaSchema';
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

interface ApostaFormProps {
  formData: ApostaFormValues;
  onChange?: (field: keyof ApostaFormValues, value: string) => void;
  onSubmit: (data: ApostaFormValues) => void | Promise<void>;
  bancas: ApiBankroll[];
  tipsters: ApiTipster[];
  errors?: Record<string, string>; // Mantido para compatibilidade, mas não usado internamente
  isEditing?: boolean;
  saving?: boolean;
  notice?: string;
  onCancel?: () => void;
}

export default function ApostaForm({
  formData: initialData,
  onSubmit,
  bancas,
  tipsters,
  isEditing = false,
  saving = false,
  notice,
  onCancel,
}: ApostaFormProps) {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ApostaFormValues>({
    resolver: zodResolver(apostaSchema),
    defaultValues: {
      ...initialData,
      // Garantir que valores numéricos venham como strings se necessário para o input type="number"
      // ou mantê-los como numbers se o schema esperar numbers (nosso schema usa coerce.number)
    },
    mode: 'onBlur',
  });

  // Atualizar form quando props mudarem (ex: carregamento de edição)
  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  const valor = Number.parseFloat(String(watch('valorApostado'))) || 0;
  const odd = Number.parseFloat(String(watch('odd'))) || 0;
  const bonus = Number.parseFloat(String(watch('bonus'))) || 0;
  const totalReturn = valor * odd + bonus;
  const profit = totalReturn - valor;

  const activeTipsters = tipsters.filter((t) => (t as any).ativo !== false);

  const inputStyles = "h-11 rounded-md border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 dark:bg-white/5 dark:border-white/10 dark:text-white dark:placeholder:text-white/20 dark:focus-visible:ring-brand-emerald/50 dark:focus-visible:border-brand-emerald/50";
  const labelStyles = "text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-white/50";
  const selectTriggerStyles = "h-11 rounded-md border border-gray-300 bg-white text-gray-900 focus:ring-emerald-500 dark:bg-white/5 dark:border-white/10 dark:text-white";
  const selectContentStyles = "bg-popover border border-gray-200 text-popover-foreground dark:bg-[#1a1a1a] dark:border-white/10 dark:text-white";

  return (
    <>
      {notice && <div className="mb-4 rounded-lg border border-brand-emerald/30 bg-background/80 p-3 text-sm text-foreground">{notice}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="w-full">
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
                  <Controller
                    name="bancaId"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {bancas.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bancaId && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.bancaId.message}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Casa de Aposta</Label>
                  <Controller
                    name="casaDeAposta"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {CASAS_APOSTAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.casaDeAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.casaDeAposta.message}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Tipster</Label>
                  <Controller
                    name="tipster"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {activeTipsters.map((t) => <SelectItem key={t.id} value={t.nome}>{(t as any).nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
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
                  <Controller
                    name="esporte"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {ESPORTES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.esporte && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.esporte.message}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelStyles}>Nome do Evento</Label>
                  <Controller
                    name="evento"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Ex: Flamengo vs Palmeiras"
                        className={inputStyles}
                      />
                    )}
                  />
                  {errors.evento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.evento.message}</div>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Data do Evento</Label>
                  <Controller
                    name="dataEvento"
                    control={control}
                    render={({ field }) => (
                      <DateInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="DD/MM/AAAA"
                        className={inputStyles}
                      />
                    )}
                  />
                  {errors.dataEvento && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.dataEvento.message}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Status</Label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {STATUS_APOSTAS.filter(s => s !== 'Tudo').map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Bônus (Opcional)</Label>
                  <Controller
                    name="bonus"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value || ''}
                        placeholder="0.00"
                        className={inputStyles}
                      />
                    )}
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
                  <Controller
                    name="tipoAposta"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={selectTriggerStyles}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={selectContentStyles}>
                          {TIPOS_APOSTA.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.tipoAposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.tipoAposta.message}</div>}
                </div>

                <div className="space-y-1.5">
                  <Label className={labelStyles}>Mercado</Label>
                  <Controller
                    name="mercado"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Ex: Resultado Final"
                        className={inputStyles}
                      />
                    )}
                  />
                  {errors.mercado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.mercado.message}</div>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className={labelStyles}>Descrição da Aposta</Label>
                <Controller
                  name="aposta"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder="ex: Vitória do Mandante"
                      className={inputStyles}
                    />
                  )}
                />
                {errors.aposta && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.aposta.message}</div>}
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
                    <Controller
                      name="valorApostado"
                      control={control}
                      render={({ field }) => (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          value={field.value || ''}
                          placeholder="0.00"
                          className={`${inputStyles} pl-8`}
                        />
                      )}
                    />
                  </div>
                  {errors.valorApostado && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.valorApostado.message}</div>}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <Label className={labelStyles}>Odd</Label>
                  <Controller
                    name="odd"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        value={field.value || ''}
                        placeholder="0.00"
                        className={inputStyles}
                      />
                    )}
                  />
                  {errors.odd && <div className="text-[10px] font-medium text-rose-400 mt-1">{errors.odd.message}</div>}
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] p-4 border border-gray-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:from-brand-emerald/10 dark:to-transparent dark:border-brand-emerald/20 dark:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]">
              {/* Box Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-white/40">RETORNO</span>
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
                <p className="text-[10px] font-medium text-gray-500 dark:text-white/40">Lucro potencial</p>
                <ChevronRight size={10} className="text-brand-emerald/50 transition-transform group-hover:translate-x-0.5" />
                <span className="text-xs font-bold text-brand-emerald ml-auto">
                  R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Background accent */}
              <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-brand-emerald/5 blur-2xl" />
            </div>

            {/* Buttons and notice moved from footer */}
            <div className="pt-6 border-t border-gray-200 dark:border-white/5 space-y-4">
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full h-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Aposta'}
                  {!saving && <ChevronRight size={18} />}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onCancel?.()}
                  className="w-full h-auto px-6 py-3 rounded-lg border border-gray-300 bg-transparent text-sm font-bold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all outline-none dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
              <div className="text-[10px] text-center font-medium text-gray-400 dark:text-white/20">
                Todos os campos são obrigatórios
              </div>
            </div>
          </aside>
        </div>

      </form>
    </>
  );
}
