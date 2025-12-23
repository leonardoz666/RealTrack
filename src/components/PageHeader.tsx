import { memo, type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
}

function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  const today = new Date();
  const day = today.getDate();
  const month = today.toLocaleString('pt-BR', { month: 'short' });
  const monthFormatted = month.replace('.', '').charAt(0).toUpperCase() + month.slice(1).replace('.', '');
  const dateString = `Hoje, ${day} ${monthFormatted}`;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-gray-200 bg-white p-5 shadow-sm backdrop-blur-2xl dark:border-[var(--header-border)] dark:bg-transparent dark:bg-[image:var(--header-bg)] dark:shadow-[var(--header-shadow)] md:p-6">
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {badge && (
              <span className="inline-flex items-center rounded-full bg-emerald-100/50 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300">
                {badge}
              </span>
            )}
            <span className="text-xs font-medium text-gray-400 dark:text-emerald-100/60">• {dateString}</span>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-sm text-gray-500 dark:text-emerald-100/70">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 pt-1">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoizar para evitar re-renders quando props não mudam
export default memo(PageHeader);

