import { memo, useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface FilterPopoverApostasProps {
  open: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

function FilterPopoverApostas({ open, onClose, onClear, children, footer, maxWidth = '480px' }: FilterPopoverApostasProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const node = event.target as Node | null;

      const isInIgnored = (n: Node | null): boolean => {
        let cur: Node | null = n;
        while (cur) {
          if (cur instanceof Element && cur.hasAttribute('data-ignore-click-outside')) return true;
          cur = cur.parentNode;
        }
        return false;
      };

      if (
        popoverRef.current &&
        (!event.target || !popoverRef.current.contains(event.target as Node)) &&
        !isInIgnored(node)
      ) {
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

  const maxWidthStyle = `min(75vw, ${maxWidth})`;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-auto max-w-none rounded-lg border border-gray-200 bg-background-card p-3 shadow-lg overflow-visible dark:border-border/30"
      style={{ minWidth: 240, maxWidth: maxWidthStyle }}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-border/20">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground-muted">Filtros</p>
        <div className="flex items-center gap-3 text-sm font-semibold">
          {onClear && (
            <button
              type="button"
              className="text-foreground-muted transition hocus:text-brand-emerald"
              onClick={() => onClear()}
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-background text-foreground transition hocus:border-brand-emerald/60 hocus:text-brand-emerald dark:border-border/40"
            onClick={onClose}
            aria-label="Fechar filtros"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="mt-2 flex flex-col gap-2">
        <div className="max-h-[75vh] space-y-2 overflow-y-auto pr-0">{children}</div>
        {footer && <div className="border-t border-gray-200 pt-3 dark:border-border/20">{footer}</div>}
      </div>
    </div>
  );
}

export default memo(FilterPopoverApostas);
