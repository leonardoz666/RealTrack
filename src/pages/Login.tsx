import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronRight, Lock } from 'lucide-react';
import { authService } from '../services/api';
import { AuthManager } from '../lib/auth';
import { type ApiError } from '../types/api';

const heroStats = [
  { value: '24/7', label: 'Bot Suporte' },
  { value: '90%', label: 'Taxa de Sucesso' },
  { value: '5+', label: 'Usuários Ativos' }
];

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
const checkboxClass =
  'h-4 w-4 rounded border border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 transition-colors';

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

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(email, senha);
      if (response.success) {
        void navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.response?.data?.error;
      setError(typeof errorMessage === 'string' ? errorMessage : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-app-login-bg font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      <GridBackground />

      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 lg:flex-row lg:gap-20 lg:px-24 lg:justify-end">

        {/* Left Side - Branding & Info */}
        <div className="mb-12 flex flex-col items-center text-center lg:mb-0 lg:w-1/2 lg:items-start lg:text-left lg:pl-0">
          <div className="mb-8 flex items-center gap-4">
            <BrandMark />
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white">REAL COMANDO</span>
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.4em] text-emerald-500/80">Sistemas de Alta Performance</span>
            </div>
          </div>

          <h1 className="mb-6 text-4xl font-extrabold leading-[1.1] text-white md:text-6xl lg:text-7xl">
            A Inteligência por trás do <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Sucesso.</span>
          </h1>

          <p className="mb-10 max-w-md text-lg font-medium text-white/50 leading-relaxed">
            Acesse a central de comando da sua planilha esportiva e transforme dados em resultados consistentes.
          </p>

          <div className="grid grid-cols-3 gap-8 border-t border-white/5 pt-10 w-full max-w-md">
            {heroStats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-white tabular-nums">{stat.value}</span>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-500/60">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md lg:w-1/2 lg:ml-auto">
          <div className="group relative">
            {/* Decorative Border Glow */}
            <div className="absolute -inset-0.5 rounded-[32px] bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 opacity-50 blur-sm transition duration-1000 group-hover:opacity-100 group-hover:duration-200" />

            <div className={formCardClass}>
              {/* Scanline effect */}
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />

              <div className="relative mb-10">
                <h2 className="text-2xl font-bold text-white">Acessar Terminal</h2>
                <p className="mt-1 text-sm font-medium text-white/40">Insira suas credenciais para autenticação</p>
                <div className="mt-4 h-1 w-12 rounded-full bg-emerald-500" />
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-6">
                <div className={fieldWrapperClass}>
                  <label htmlFor="email" className={fieldLabelClass}>Identificação</label>
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

                <div className={fieldWrapperClass}>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className={fieldLabelClass}>Chave de Acesso</label>
                    <Link to="/recuperar-senha" tabIndex={-1} className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-500/60 hover:text-emerald-400 transition-colors">
                      Esqueceu?
                    </Link>
                  </div>
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/20 transition hover:text-emerald-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="group flex cursor-pointer items-center gap-3">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={lembrarMe}
                        onChange={(e) => setLembrarMe(e.target.checked)}
                        className={checkboxClass}
                      />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white/40 transition group-hover:text-white/60">Manter Conectado</span>
                  </label>
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs font-bold uppercase tracking-wider text-red-400 animate-shake" role="alert">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} className={primaryButtonClass}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  <span className="relative">{loading ? 'Autenticando...' : 'Iniciar Sessão'}</span>
                  <ChevronRight size={18} className="relative transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              <div className="relative mt-10 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                  Novo por aqui?{' '}
                  <Link to="/cadastro" className="text-emerald-500 hover:text-emerald-400 transition-colors">
                    Criar Conta
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-4 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-white/20">
            <div className="h-px flex-1 bg-white/5" />
            <div className="flex items-center gap-2">
              <Lock size={10} className="text-emerald-500/40" />
              <span>Conexão Segura SSL</span>
            </div>
            <div className="h-px flex-1 bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
