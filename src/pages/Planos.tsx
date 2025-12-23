import { useEffect, useState } from 'react';
import {
  Check,
  Crown,
  Gift,
  Star,
  Shield,
  Zap,
  CheckCircle2,
  ExternalLink,
  QrCode,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { perfilService, type Plano } from '../services/api';
import { usePerfil } from '../contexts/PerfilContext';
import { cn } from '../components/ui/utils';
import { toast } from '../utils/toast';
import Modal from '../components/Modal';

const PLAN_VISUALS: Record<string, { Icon: LucideIcon; colorClass: string; glowClass: string; bgClass: string; borderClass: string }> = {
  gratuito: {
    Icon: Gift,
    colorClass: 'text-emerald-400',
    glowClass: 'from-emerald-500/20 to-transparent',
    bgClass: 'bg-emerald-500/5',
    borderClass: 'border-emerald-500/20',
  },
  amador: {
    Icon: Star,
    colorClass: 'text-blue-400',
    glowClass: 'from-blue-500/20 to-transparent',
    bgClass: 'bg-blue-500/5',
    borderClass: 'border-blue-500/20',
  },
  profissional: {
    Icon: Crown,
    colorClass: 'text-purple-400',
    glowClass: 'from-purple-500/20 to-transparent',
    bgClass: 'bg-purple-500/5',
    borderClass: 'border-purple-500/20',
  },
  default: {
    Icon: Shield,
    colorClass: 'text-gray-400',
    glowClass: 'from-gray-500/20 to-transparent',
    bgClass: 'bg-gray-500/5',
    borderClass: 'border-gray-500/20',
  },
};

const getPlanVisual = (planName?: string) => {
  if (!planName) return PLAN_VISUALS.default;
  const key = planName.trim().toLowerCase();
  return PLAN_VISUALS[key] ?? PLAN_VISUALS.default;
};

export default function Planos() {
  const { perfil, atualizarPerfil } = usePerfil();
  const [plans, setPlans] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [customerInfoModalOpen, setCustomerInfoModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<Plano | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ cpf: '', phone: '' });
  const [paymentData, setPaymentData] = useState<{ url: string; id: string } | null>(null);

  useEffect(() => {
    void fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await perfilService.listPlans();
      // Ordenar por preço: Gratuito (0) -> Amador (~49) -> Profissional (~89)
      const sortedPlans = data.sort((a, b) => a.preco - b.preco);
      setPlans(sortedPlans);
    } catch (err) {
      console.error('Erro ao carregar planos:', err);
      toast.error('Erro ao carregar planos disponíveis.');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePayment = () => {
    setPaymentModalOpen(false);
    setPaymentData(null);
  };

  const handleCustomerInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment) return;

    try {
      setUpdating(selectedPlanForPayment.id);
      setCustomerInfoModalOpen(false); // Close info modal
      
      const data = await perfilService.createPayment(selectedPlanForPayment.id, customerInfo);
      setPaymentData(data);
      setPaymentModalOpen(true); // Open payment modal
    } catch (err) {
      console.error('Erro ao gerar pagamento:', err);
      toast.error('Erro ao gerar pagamento. Verifique seus dados e tente novamente.');
      setCustomerInfoModalOpen(true); // Reopen info modal on error
    } finally {
      setUpdating(null);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (handleSelectPlan = async (plan: Plano) => {
    if (!perfil || perfil.plano.id === plan.id) return;
    
    if (plan.preco > 0) {
      setSelectedPlanForPayment(plan);
      setCustomerInfoModalOpen(true);
      return;
    }

    if (!window.confirm(`Deseja alterar seu plano para ${plan.nome}?`)) {
      return;
    }

    try {
      setUpdating(plan.id);
      await perfilService.updatePlan(plan.id);
      await atualizarPerfil();
      toast.success(`Plano alterado para ${plan.nome} com sucesso!`);
    } catch (err) {
      console.error('Erro ao atualizar plano:', err);
      toast.error('Não foi possível atualizar o plano.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-8">
      <PageHeader 
        title="Planos & Assinaturas" 
        subtitle="Escolha o plano ideal para sua jornada nas apostas esportivas"
      />

      <div className="grid gap-8 lg:grid-cols-3">
        {plans.map((plan) => {
          const visual = getPlanVisual(plan.nome);
          const Icon = visual.Icon;
          const isCurrent = perfil?.plano?.id === plan.id;
          const isProcessing = updating === plan.id;

          return (
            <div 
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden rounded-[32px] border p-8 transition-all duration-300 hover:shadow-xl",
                visual.bgClass,
                visual.borderClass,
                isCurrent ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background dark:ring-offset-app-layout-bg" : "hover:-translate-y-1"
              )}
            >
              {/* Glow Effect */}
              <div className={cn("absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br", visual.glowClass)} />

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-6 flex items-center justify-between">
                  <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/10", visual.colorClass)}>
                    <Icon size={28} />
                  </div>
                  {isCurrent && (
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20">
                      Atual
                    </span>
                  )}
                </div>

                <h3 className="mb-2 text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {plan.nome}
                </h3>
                
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {plan.preco === 0 ? 'Grátis' : `R$ ${plan.preco.toFixed(2)}`}
                  </span>
                  {plan.preco > 0 && <span className="text-sm text-gray-500 dark:text-gray-400">/mês</span>}
                </div>

                <div className="mb-8 space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-white/10", visual.colorClass)}>
                      <Zap size={12} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {plan.limiteApostasDiarias === 0 
                        ? 'Apostas Ilimitadas' 
                        : `${plan.limiteApostasDiarias} apostas diárias`}
                    </span>
                  </div>
                  
                  {/* Features placeholders based on plan type */}
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-white/10", visual.colorClass)}>
                      <Check size={12} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Gestão de Bancas
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-white/10", visual.colorClass)}>
                      <Check size={12} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Relatórios Detalhados
                    </span>
                  </div>

                  {plan.nome.toLowerCase().includes('profissional') && (
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded-full bg-white/10", visual.colorClass)}>
                        <Check size={12} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Suporte Prioritário
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrent || isProcessing}
                  className={cn(
                    "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold uppercase tracking-widest transition-all duration-300",
                    isCurrent 
                      ? "bg-gray-100 text-gray-400 cursor-default dark:bg-white/5 dark:text-gray-500"
                      : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-[0.98]"
                  )}
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Plano Atual</span>
                    </>
                  ) : (
                    <span>Contratar Plano</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Modal para Dados do Cliente */}
      <Modal
        isOpen={customerInfoModalOpen}
        onClose={() => setCustomerInfoModalOpen(false)}
        title="Dados para Pagamento"
      >
        <form onSubmit={handleCustomerInfoSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <p>Precisamos de alguns dados para gerar o PIX através do AbacatePay.</p>
          </div>
          
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              required
              value={customerInfo.cpf}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-brand-emerald focus:ring-brand-emerald dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-brand-emerald focus:ring-brand-emerald dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setCustomerInfoModalOpen(false)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Confirmar e Gerar PIX
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={handleClosePayment}
        title="Pagamento do Plano"
        className="max-w-md"
      >
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <QrCode className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Pagamento Gerado</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Seu pagamento PIX foi gerado com sucesso. Clique no botão abaixo para concluir o pagamento.
            </p>
          </div>

          {paymentData?.url && (
            <a
              href={paymentData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-emerald px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-95"
            >
              Pagar agora <ExternalLink size={16} />
            </a>
          )}
          
          <div className="rounded-lg bg-yellow-50 p-4 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
            <p>
              Após o pagamento, seu plano será atualizado automaticamente em alguns instantes.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
