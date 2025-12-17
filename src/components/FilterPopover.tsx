import { memo, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string; // Novo parâmetro para controlar largura máxima
}

function FilterPopover({ open, onClose, onClear, children, footer, maxWidth = '700px' }: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-full max-w-none rounded-2xl border border-[#14b8a6]/30 bg-gradient-to-br from-[#0f3a35] via-[#0d3230] to-[#0a2a26] p-6 shadow-[0_25px_60px_rgba(20,184,166,0.25)]"
      style={{ minWidth: 400, maxWidth }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#14b8a6]/20 pb-4 mb-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#14b8a6]">Filtros</p>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {onClear && (
            <button
              type="button"
              className="text-foreground-muted transition hover:text-[#14b8a6] duration-300"
              onClick={() => onClear()}
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-background text-foreground transition hocus:border-brand-emerald/60 hocus:text-brand-emerald"
            onClick={onClose}
            aria-label="Fechar filtros"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-0">{children}</div>
        {footer && <div className="border-t border-border/20 pt-3">{footer}</div>}
      </div>
    </div>
  );
}

export default memo(FilterPopover);
