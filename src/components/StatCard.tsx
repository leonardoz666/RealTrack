import { memo, type ReactNode } from 'react';
import { cn } from './ui/utils';

export type StatCardColor = 'emerald' | 'blue' | 'red' | 'purple' | 'amber' | 'cyan';

interface StatCardProps {
  title: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
  color?: StatCardColor;
}

const COLOR_STYLES: Record<StatCardColor, { wrapper: string; title: string; value: string; helper: string }> = {
  emerald: {
    wrapper: 'bg-emerald-200 border-emerald-300 dark:bg-emerald-500/25 dark:border-emerald-500/40',
    title: 'text-emerald-900 dark:text-emerald-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-emerald-800 dark:text-emerald-400',
  },
  blue: {
    wrapper: 'bg-blue-200 border-blue-300 dark:bg-blue-500/25 dark:border-blue-500/40',
    title: 'text-blue-900 dark:text-blue-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-blue-800 dark:text-blue-400',
  },
  red: {
    wrapper: 'bg-rose-200 border-rose-300 dark:bg-rose-500/30 dark:border-rose-500/50',
    title: 'text-rose-900 dark:text-rose-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-rose-800 dark:text-rose-400',
  },
  purple: {
    wrapper: 'bg-violet-200 border-violet-300 dark:bg-violet-500/25 dark:border-violet-500/40',
    title: 'text-violet-900 dark:text-violet-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-violet-800 dark:text-violet-400',
  },
  amber: {
    wrapper: 'bg-amber-200 border-amber-300 dark:bg-amber-500/25 dark:border-amber-500/40',
    title: 'text-amber-900 dark:text-amber-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-amber-800 dark:text-amber-400',
  },
  cyan: {
    wrapper: 'bg-cyan-200 border-cyan-300 dark:bg-cyan-500/25 dark:border-cyan-500/40',
    title: 'text-cyan-900 dark:text-cyan-500',
    value: 'text-gray-950 dark:text-white',
    helper: 'text-cyan-800 dark:text-cyan-400',
  },
};

const STAT_CARD_BASE =
  'rounded-[32px] border p-6 flex flex-col justify-center transition duration-300 hover:-translate-y-0.5 relative overflow-hidden backdrop-blur-sm';

function StatCard({ title, value, helper, icon, color = 'emerald' }: StatCardProps) {
  const style = COLOR_STYLES[color];

  return (
    <div className={cn(STAT_CARD_BASE, style.wrapper)}>
      <div className={cn('flex items-center gap-2 mb-2', style.title)}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-[0.2em]">{title}</span>
      </div>
      <p className={cn('text-3xl font-bold tracking-tight', style.value)}>{value}</p>
      {helper && <p className={cn('mt-1 text-xs font-medium', style.helper)}>{helper}</p>}
    </div>
  );
}

// Memoizar para evitar re-renders desnecessários quando props não mudam
export default memo(StatCard);


