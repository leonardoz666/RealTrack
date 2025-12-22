import { memo, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string; // Novo parâmetro para controlar largura máxima
}

function FilterPopover({ open, onClose, onClear, children, footer, maxWidth = '600px' }: FilterPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight + 1;
    const atTop = el.scrollTop <= 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setShowTopFade(hasScroll && !atTop);
    setShowBottomFade(hasScroll && !atBottom);
  }, []);

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

      // If click is outside the popover and not inside an element that should be ignored (eg. portal calendar), close
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

  useEffect(() => {
    if (!open) return;
    updateFade();
    const el = scrollRef.current;
    const ro = new ResizeObserver(() => updateFade());
    if (el) ro.observe(el);
    window.addEventListener('resize', updateFade);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateFade);
    };
  }, [open, updateFade]);

  if (!open) return null;

  const maxWidthStyle = `min(80vw, ${maxWidth})`;

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-full mt-2 z-50 w-auto max-w-none rounded-lg border border-gray-200 bg-background-card p-3 shadow-lg overflow-hidden group dark:border-border/30"
      style={{ minWidth: 280, maxWidth: maxWidthStyle }}
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
      <div className="mt-2 flex flex-col gap-2 relative">
        <div ref={scrollRef} onScroll={updateFade} className="max-h-[75vh] space-y-2 overflow-y-auto pr-0 thin-scrollbar relative">
          {children}
        </div>

        {showTopFade ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 h-4 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), transparent)' }}
          />
        ) : null}

        {showBottomFade ? (
          <div className="pointer-events-none absolute left-3 right-3 bottom-3 h-4 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.12), transparent)' }}
          />
        ) : null}

        {footer && <div className="border-t border-gray-200 pt-3 dark:border-border/20">{footer}</div>}
      </div>
    </div>
  );
}

export default memo(FilterPopover);

