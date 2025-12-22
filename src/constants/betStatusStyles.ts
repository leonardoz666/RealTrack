import { createElement } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  XCircle,
  Zap,
} from 'lucide-react';

type StatusKey =
  | 'Pendente'
  | 'Ganha'
  | 'Perdida'
  | 'Meio Ganha'
  | 'Meio Perdida'
  | 'Cashout'
  | 'Reembolsada'
  | 'Void'
  | 'default';

const STATUS_ICON_MAP: Record<StatusKey, LucideIcon> = {
  Pendente: Clock,
  Ganha: CheckCircle,
  Perdida: XCircle,
  'Meio Ganha': TrendingUp,
  'Meio Perdida': TrendingDown,
  Cashout: Zap,
  Reembolsada: RefreshCw,
  Void: RefreshCw,
  default: Clock,
};

export const betStatusPillBaseClass =
  'inline-flex items-center justify-center gap-1.5 rounded-sm border border-white/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white transition duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 shadow-sm';

export const betStatusPillVariants: Record<StatusKey, string> = {
  Pendente:
    'text-amber-950 bg-amber-500',
  Ganha: 'text-white bg-emerald-500',
  Perdida: 'text-white bg-red-500',
  'Meio Ganha': 'text-white bg-green-500',
  'Meio Perdida': 'text-white bg-orange-500',
  Cashout: 'text-white bg-purple-500',
  Reembolsada: 'text-white bg-blue-500',
  Void: 'text-white bg-slate-400',
  default: 'text-white/80 border border-white/15 bg-white/5',
};

export const betStatusAccentClasses: Record<StatusKey, string> = {
  Pendente: 'text-amber-400',
  Ganha: 'text-emerald-400',
  Perdida: 'text-red-400',
  'Meio Ganha': 'text-green-300',
  'Meio Perdida': 'text-orange-400',
  Cashout: 'text-purple-400',
  Reembolsada: 'text-blue-300',
  Void: 'text-slate-300',
  default: 'text-white',
};

export function getBetStatusIcon(status: string, props?: LucideProps) {
  const iconKey = (status as StatusKey) in STATUS_ICON_MAP ? (status as StatusKey) : 'default';
  const Icon = STATUS_ICON_MAP[iconKey];
  return createElement(Icon, { size: 16, ...props });
}
