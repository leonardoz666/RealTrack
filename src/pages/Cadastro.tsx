import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Target, ChevronRight, User } from 'lucide-react';
import { authService } from '../services/api';
import { type ApiError } from '../types/api';

const BrandMark = () => (
  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/20" aria-hidden="true">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/20 to-transparent opacity-50" />
    <div className="relative flex flex-col items-center justify-center gap-0.5">
      <div className="h-1 w-6 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
      <div className="h-1 w-4 rounded-full bg-emerald-500/60" />
      <div className="h-1 w-5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
    </div>
  </div>
);

const inputClass =
  'w-full rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-medium text-white placeholder:text-white/30 backdrop-blur-md transition-all duration-300 focus:border-emerald-500/50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white/10';

const fieldLabelClass = 'text-xs font-bold uppercase tracking-widest text-emerald-400/80';
const fieldWrapperClass = 'flex flex-col gap-2.5';
const formCardClass =
  'relative z-10 w-full rounded-3xl border border-white/10 bg-app-login-card/80 p-8 md:p-10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden';
const primaryButtonClass =
  'relative mt-6 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-600 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-[0_10px_20px_rgba(5,150,105,0.3)] transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

const GridBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.15]"
      style={{
        backgroundImage: `linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-app-login-bg via-transparent to-app-login-bg" />
    <div className="absolute inset-0 bg-gradient-to-r from-app-login-bg via-transparent to-app-login-bg" />

    {/* Animated Glows */}
    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse" />
    <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
  </div>
);

export default function Cadastro() {
  const navigate = useNavigate();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (senha !== confirmarSenha) {
      setError('As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const data = await authService.register(nomeCompleto, email, senha);
      if (data.token) {
        void navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.error;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#010a0f] font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <GridBackground />

      <div className="relative z-10 flex w-full max-w-[1200px] flex-col items-center justify-center px-6 py-12 lg:flex-row lg:gap-20 lg:px-10">

        {/* Left Side - Branding & Info */}
        <div className="mb-12 flex flex-col items-center text-center lg:mb-0 lg:w-1/2 lg:items-start lg:text-left">
          <div className="mb-8 flex items-center gap-4">
            <BrandMark />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white">REAL COMANDO</span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-emerald-500/80">Sistemas de Alta Performance</span>
            </div>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] text-white md:text-6xl lg:text-7xl">
            Comece sua <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Jornada.</span>
          </h1>

          <p className="mb-10 max-w-md text-lg font-medium text-white/50 leading-relaxed">
            Crie sua conta e tenha acesso a ferramentas profissionais para análise e gestão de apostas esportivas.
          </p>

          <div className="flex items-center gap-4 border-t border-white/5 pt-10 w-full max-w-md">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 w-10 rounded-full border-2 border-app-login-bg bg-emerald-500/20 flex items-center justify-center text-[0.6rem] font-bold text-emerald-400">
                  U{i}
                </div>
              ))}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">
              Junte-se a mais de <span className="text-emerald-500">500+</span> usuários
            </p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="w-full max-w-md lg:w-1/2">
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 opacity-50 blur-sm transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />

            <div className={formCardClass}>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />

              <div className="relative mb-10">
                <h2 className="text-2xl font-bold text-white">Criar Registro</h2>
                <p className="mt-1 text-sm font-medium text-white/40">Preencha os dados para inicializar seu perfil</p>
                <div className="mt-4 h-1 w-12 rounded-full bg-emerald-500" />
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div className={fieldWrapperClass}>
                  <label htmlFor="name" className={fieldLabelClass}>Apelido / Nome</label>
                  <input
                    ref={nameInputRef}
                    id="name"
                    type="text"
                    placeholder="Como quer ser chamado?"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className={fieldWrapperClass}>
                  <label htmlFor="email" className={fieldLabelClass}>Identificação (E-mail)</label>
                  <input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className={fieldWrapperClass}>
                    <label htmlFor="password" className={fieldLabelClass}>Senha</label>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className={fieldWrapperClass}>
                    <label htmlFor="confirmPassword" className={fieldLabelClass}>Confirmar</label>
                    <div className="relative">
                      <input
                        ref={confirmPasswordInputRef}
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value)}
                        className={inputClass}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/20 transition hover:text-emerald-400"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold uppercase tracking-wider text-red-400 animate-shake" role="alert">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className={primaryButtonClass}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                  <span className="relative">{loading ? 'Processando...' : 'Finalizar Registro'}</span>
                  <ChevronRight size={18} className="relative transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <div className="relative mt-10 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                  Já possui acesso?{' '}
                  <Link to="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
