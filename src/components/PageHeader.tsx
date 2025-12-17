import { memo, type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
}

function PageHeader({ title, subtitle, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-6 border-b border-[#14b8a6]/20 pb-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{title}</h2>
          {badge && (
            <span className="inline-flex items-center rounded-full border border-[#14b8a6]/50 bg-gradient-to-r from-[#14b8a6]/15 to-[#10b981]/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#14b8a6] shadow-[0_4px_12px_rgba(20,184,166,0.15)]">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

// Memoizar para evitar re-renders quando props não mudam
export default memo(PageHeader);
