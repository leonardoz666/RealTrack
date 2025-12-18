import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Copy,
  Crown,
  Gift,
  Infinity as InfinityIcon,
  Lock,
  Mail,
  MessageCircle,
  RefreshCw,
  Shield,
  Star,
  Trash2,
  User,
  X,
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { perfilService } from '../services/api';
import { type ApiProfileResponse } from '../types/api';
import { formatDate as formatDateUtil } from '../utils/formatters';
import { cn } from '../components/ui/utils';
import { toast } from '../utils/toast';

const cardBaseClass =
  'relative overflow-hidden rounded-[32px] border border-white/5 bg-[#020c14]/60 p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-300';
const labelClass = 'text-[0.65rem] font-bold uppercase tracking-[0.3em] text-emerald-500/80';
const inputClass =
  'w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white placeholder:text-white/20 backdrop-blur-md transition-all duration-300 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white/10';
const primaryButtonClass =
  'relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(5,150,105,0.3)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';
const neutralButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white/70 transition hover:border-emerald-500/50 hover:bg-white/10 hover:text-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30';
const dangerButtonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-sm font-bold uppercase tracking-widest text-red-200 transition hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40';

const PLAN_VISUALS: Record<string, { Icon: LucideIcon; colorClass: string; glowClass: string }> = {
  gratuito: {
    Icon: Gift,
    colorClass: 'text-emerald-400',
    glowClass: 'from-emerald-500/20 to-transparent',
  },
  amador: {
    Icon: Star,
    colorClass: 'text-blue-400',
    glowClass: 'from-blue-500/20 to-transparent',
  },
  profissional: {
    Icon: Crown,
    colorClass: 'text-purple-400',
    glowClass: 'from-purple-500/20 to-transparent',
  },
  default: {
    Icon: Crown,
    colorClass: 'text-white',
    glowClass: 'from-white/10 to-transparent',
  },
};

const ScanlineOverlay = () => (
  <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.01),rgba(0,255,0,0.005),rgba(0,0,255,0.01))] bg-[length:100%_2px,3px_100%] opacity-20" />
);

const getPlanVisual = (planName?: string) => {
  if (!planName) return PLAN_VISUALS.default;
  const key = planName.trim().toLowerCase();
  return PLAN_VISUALS[key] ?? PLAN_VISUALS.default;
};

export default function Perfil() {
  const [profile, setProfile] = useState<ApiProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    nomeCompleto: '',
    email: '',
    fotoPerfil: '',
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('realteste');
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    void fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await perfilService.getProfile();
      setProfile(data);
      setUpdateForm({
        nomeCompleto: data.nomeCompleto,
        email: data.email,
        fotoPerfil: data.fotoPerfil ?? '',
      });
      setFotoPreview(data.fotoPerfil ?? null);
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();
    try {
      setUpdating(true);
      setError('');
      let fotoPerfil: string | File | undefined = updateForm.fotoPerfil;
      if (fotoFile) fotoPerfil = fotoFile;
      const data = await perfilService.updateProfile({ ...updateForm, fotoPerfil });
      setProfile(data);
      setUpdateForm({ nomeCompleto: data.nomeCompleto, email: data.email });
      window.dispatchEvent(new CustomEvent('profile-updated', { detail: data }));
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      setError('Erro ao atualizar perfil');
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (!passwordForm.senhaAtual || !passwordForm.novaSenha || !passwordForm.confirmarSenha) {
      setPasswordError('Todos os campos são obrigatórios');
      return;
    }
    if (passwordForm.novaSenha.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (passwordForm.novaSenha !== passwordForm.confirmarSenha) {
      setPasswordError('As senhas não coincidem');
      return;
    }
    try {
      setChangingPassword(true);
      await perfilService.changePassword(passwordForm);
      setPasswordSuccess(true);
      setPasswordForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError('Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleResetAccount = async () => {
    try {
      setResetting(true);
      setResetError('');
      const data = await perfilService.resetAccount();
      toast.success('Conta resetada com sucesso!');
      setResetModalOpen(false);
      void navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      setResetError('Erro ao resetar conta');
    } finally {
      setResetting(false);
    }
  };

  const handleRedeemPromo = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!promoCode.trim()) {
      setPromoError('Informe o código.');
      return;
    }
    try {
      setRedeemingPromo(true);
      setPromoError('');
      const result = await perfilService.redeemPromoCode(promoCode.trim());
      setProfile(result.profile);
      toast.success(result.message);
      setPromoModalOpen(false);
    } catch (error: any) {
      setPromoError('Não foi possível aplicar o código.');
    } finally {
      setRedeemingPromo(false);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text).then(() => toast.success('Copiado!'));
  };

  const handleLinkTelegram = () => {
    if (!profile) return;
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'RealComando_bot';
    window.open(`https://t.me/${botUsername}?start=${profile.id}`, '_blank');
  };

  const handleUnlinkTelegram = async () => {
    if (!profile || !window.confirm('Desvincular Telegram?')) return;
    try {
      const data = await perfilService.updateTelegram(null);
      setProfile(data);
      toast.success('Telegram desvinculado!');
    } catch (err) {
      toast.error('Erro ao desvincular');
    }
  };

  const handleOpenSupport = () => {
    const supportBot = import.meta.env.VITE_TELEGRAM_SUPPORT_BOT_USERNAME || 'RealComandoSuporte_bot';
    window.open(`https://t.me/${supportBot}${profile?.id ? `?start=support_${profile.id}` : ''}`, '_blank');
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
    </div>
  );

  if (!profile) return (
    <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-400">
      {error || 'Erro ao carregar perfil'}
    </div>
  );

  const planVisual = getPlanVisual(profile.plano?.nome);
  const PlanIcon = planVisual.Icon;
  const isUnlimitedPlan = (profile.plano?.nome?.toLowerCase().includes('profissional')) || profile.plano?.limiteApostasDiarias === 0;
  const promoActive = profile.promoExpiresAt ? new Date(profile.promoExpiresAt).getTime() > Date.now() : false;

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-20">
      <PageHeader 
        title="Meu Perfil" 
        subtitle="Configurações de conta e acesso ao terminal de alta performance"
        actions={
          <button onClick={handleOpenSupport} className={neutralButtonClass}>
            <MessageCircle size={16} />
            <span>Suporte</span>
          </button>
        }
      />

      {/* Hero Section: Plan Status */}
      <section className={cn(cardBaseClass, 'border-emerald-500/10')}>
        <ScanlineOverlay />
        <div className={cn("absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-20 bg-gradient-to-br", planVisual.glowClass)} />
        
        <div className="relative z-10 flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-6">
            <div className={cn("flex h-20 w-20 items-center justify-center rounded-[24px] bg-white/5 border border-white/10 shadow-2xl", planVisual.colorClass)}>
              <PlanIcon size={32} />
            </div>
            <div>
              <p className={labelClass}>Status do Plano</p>
              <h2 className="text-4xl font-black tracking-tight text-white">{profile.plano.nome}</h2>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Terminal Operacional</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-8 lg:border-l lg:border-white/5 lg:pl-10">
            <div className="space-y-1">
              <p className={labelClass}>Limite Diário</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {isUnlimitedPlan ? 'ILIMITADO' : `${profile.plano.limiteApostasDiarias} APOSTAS`}
              </p>
            </div>
            <div className="space-y-1">
              <p className={labelClass}>Ciclo de Renovação</p>
              <p className="text-xl font-bold text-white">{formatDateUtil(new Date().toISOString())}</p>
            </div>
          </div>

          <div className="lg:ml-auto">
            <button
              onClick={() => !promoActive && setPromoModalOpen(true)}
              disabled={promoActive || redeemingPromo}
              className={cn(primaryButtonClass, "px-8 lg:w-auto")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              <Gift size={18} />
              <span>{promoActive ? 'Plano Ativo' : 'Ativar 7 Dias Grátis'}</span>
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Informações Pessoais */}
        <section className={cardBaseClass}>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <User size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Informações Pessoais</h3>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Identidade no Terminal</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="flex justify-center mb-6">
              <div className="group relative h-24 w-24">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-emerald-500/40 to-teal-500/40 blur-md opacity-0 transition group-hover:opacity-100" />
                <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/10 bg-white/5">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/20">
                      <User size={40} />
                    </div>
                  )}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition group-hover:opacity-100">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0] || null;
                        setFotoFile(file);
                        if (file) setFotoPreview(URL.createObjectURL(file));
                      }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white">Alterar</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Apelido</label>
              <input
                type="text"
                className={inputClass}
                value={updateForm.nomeCompleto}
                onChange={e => setUpdateForm(f => ({ ...f, nomeCompleto: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Canal de Email</label>
              <input
                type="email"
                className={inputClass}
                value={updateForm.email}
                onChange={e => setUpdateForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            
            <button type="submit" disabled={updating} className={primaryButtonClass}>
              {updating ? 'Processando...' : 'Salvar Alterações'}
              <ChevronRight size={18} />
            </button>
          </form>
        </section>

        {/* Segurança & Status */}
        <section className={cardBaseClass}>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Segurança & Status</h3>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Proteção e Rastreabilidade</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
              <p className={labelClass}>Identificador Único (ID)</p>
              <div className="mt-2 flex items-center gap-3">
                <code className="flex-1 text-xs font-mono text-emerald-400/80 bg-black/40 px-3 py-2 rounded-lg">{profile.id}</code>
                <button onClick={() => copyToClipboard(profile.id)} className={neutralButtonClass}>
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className={labelClass}>Membro Desde</p>
                <p className="mt-1 text-sm font-bold text-white">{formatDateUtil(profile.membroDesde)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                <p className={labelClass}>Acesso</p>
                <p className="mt-1 text-sm font-bold text-white">VERIFICADO</p>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={handleOpenSupport} className={cn(primaryButtonClass, "bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-none")}>
                <MessageCircle size={18} />
                <span>Chamar Suporte</span>
              </button>
            </div>
          </div>
        </section>

        {/* Alterar Chave de Acesso */}
        <section className={cardBaseClass}>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Lock size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Alterar Chave de Acesso</h3>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Criptografia do Terminal</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5">
            <div className="space-y-2">
              <label className={labelClass}>Senha Atual</label>
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={passwordForm.senhaAtual}
                onChange={e => setPasswordForm(f => ({ ...f, senhaAtual: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Nova Chave</label>
              <input
                type="password"
                className={inputClass}
                placeholder="Nova senha de acesso"
                value={passwordForm.novaSenha}
                onChange={e => setPasswordForm(f => ({ ...f, novaSenha: e.target.value }))}
              />
            </div>
            <button type="submit" disabled={changingPassword} className={primaryButtonClass}>
              {changingPassword ? 'Criptografando...' : 'Atualizar Chave'}
            </button>
            
            {passwordError && (
              <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-[10px] font-bold uppercase tracking-wider text-red-400">
                <AlertTriangle size={14} /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                <CheckCircle2 size={14} /> Chave atualizada com sucesso!
              </div>
            )}
          </form>
        </section>

        {/* Integração Telegram */}
        <section className={cardBaseClass}>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Integração Telegram</h3>
              <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Sincronização em Tempo Real</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-[#010a0f] p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-3 w-3 rounded-full", profile.telegramId ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/20")} />
                  <span className="text-sm font-bold text-white uppercase tracking-widest">{profile.telegramId ? 'Conectado' : 'Desconectado'}</span>
                </div>
                {profile.telegramUsername && (
                  <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">@{profile.telegramUsername}</span>
                )}
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Vincule seu terminal ao Telegram para receber alertas críticos, relatórios diários e notificações de performance.
              </p>
            </div>

            <button
              onClick={profile.telegramId ? handleUnlinkTelegram : handleLinkTelegram}
              className={cn(
                "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl py-3.5 text-sm font-bold uppercase tracking-widest transition-all duration-300 active:scale-[0.98]",
                profile.telegramId 
                  ? "border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10" 
                  : "bg-[#229ED9] text-white shadow-[0_10px_20px_rgba(34,158,217,0.2)] hover:shadow-[0_0_25px_rgba(34,158,217,0.3)]"
              )}
            >
              {profile.telegramId ? <><X size={18} /> Desvincular Conta</> : <><Bot size={18} /> Vincular Telegram</>}
            </button>
          </div>
        </section>
      </div>

      {/* Zona de Risco - Full Width */}
      <section className={cn(cardBaseClass, "border-red-500/10 w-full")}>
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Zona de Risco</h3>
            <p className="text-xs font-medium text-white/30 uppercase tracking-widest">Limpeza Profunda de Dados</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-4">
            <p className="text-sm text-white/40 leading-relaxed max-w-2xl">
              Esta ação irá deletar permanentemente todas as suas bancas, apostas e histórico operacional do terminal. Esta operação é irreversível e resultará na perda total de dados estatísticos.
            </p>
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 lg:inline-flex">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/80">Protocolo de segurança: Dados não recuperáveis após execução</p>
            </div>
          </div>
          
          <div className="lg:flex lg:justify-end">
            <button onClick={() => setResetModalOpen(true)} className={cn(dangerButtonClass, "lg:max-w-xs")}>
              <Trash2 size={18} />
              Resetar Terminal Operacional
            </button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <Modal isOpen={promoModalOpen} onClose={() => setPromoModalOpen(false)} title="Ativar Terminal Premium" size="sm">
        <form className="space-y-6" onSubmit={handleRedeemPromo}>
          <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 text-center">
            <p className="text-sm text-emerald-400/80 leading-relaxed">
              Use o código abaixo para liberar acesso total por 7 dias
            </p>
            <p className="mt-2 text-2xl font-black tracking-[0.5em] text-white uppercase">REALTESTE</p>
          </div>
          
          <div className="space-y-2">
            <label className={labelClass}>Código de Ativação</label>
            <input
              type="text"
              className={inputClass}
              value={promoCode}
              onChange={e => setPromoCode(e.target.value)}
              placeholder="Digite o código aqui"
            />
          </div>

          {promoError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs font-bold text-red-400 text-center uppercase tracking-widest">
              {promoError}
            </div>
          )}

          <div className="flex gap-4">
            <button type="button" onClick={() => setPromoModalOpen(false)} className={cn(neutralButtonClass, "flex-1 py-3.5")}>
              Cancelar
            </button>
            <button type="submit" disabled={redeemingPromo} className={cn(primaryButtonClass, "flex-1")}>
              {redeemingPromo ? 'Validando...' : 'Ativar Agora'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Confirmar Reset de Dados" size="sm">
        <div className="space-y-6">
          <div className="rounded-2xl bg-red-500/5 border border-red-500/20 p-5">
            <p className="text-sm text-white/60 text-center leading-relaxed">
              Você está prestes a apagar todo o seu histórico. Digite "CONFIRMAR" para prosseguir com a deleção.
            </p>
          </div>

          <div className="flex gap-4">
            <button onClick={() => setResetModalOpen(false)} className={cn(neutralButtonClass, "flex-1 py-3.5")}>
              Cancelar
            </button>
            <button onClick={handleResetAccount} disabled={resetting} className={cn(dangerButtonClass, "flex-1")}>
              {resetting ? 'Resetando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
