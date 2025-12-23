import { memo, useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';

interface FilterPopoverProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onClear?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

function FilterPopover({
  trigger,
  open,
  onOpenChange,
  onClose,
  onClear,
  children,
  footer,
  maxWidth = '600px',
}: FilterPopoverProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (!newOpen && onClose) {
      onClose();
    }
  };

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
    if (!open) return;
    // Pequeno delay para garantir que o elemento foi renderizado e tem altura
    const timeoutId = setTimeout(() => {
      updateFade();
      const el = scrollRef.current;
      if (el) {
        const ro = new ResizeObserver(() => updateFade());
        ro.observe(el);
        // Cleanup function para o observer
        return () => ro.disconnect();
      }
    }, 0);
    
    window.addEventListener('resize', updateFade);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateFade);
    };
  }, [open, updateFade]);

  const maxWidthStyle = `min(80vw, ${maxWidth})`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent
        align="end"
        className={cn(
          "w-auto max-w-none rounded-lg border border-gray-200 bg-background-card p-3 shadow-lg overflow-hidden group dark:border-border/30",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        )}
        style={{ width: 'auto', minWidth: 280, maxWidth: maxWidthStyle }}
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
              onClick={() => handleOpenChange(false)}
              aria-label="Fechar filtros"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="mt-2 flex flex-col gap-2 relative">
          <div
            ref={scrollRef}
            onScroll={updateFade}
            className="max-h-[75vh] space-y-2 overflow-y-auto pr-0 thin-scrollbar relative"
          >
            {children}
          </div>

          {showTopFade ? (
            <div
              className="pointer-events-none absolute left-3 right-3 top-3 h-4 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.12), transparent)' }}
            />
          ) : null}

          {showBottomFade ? (
            <div
              className="pointer-events-none absolute left-3 right-3 bottom-3 h-4 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.12), transparent)' }}
            />
          ) : null}

          {footer && <div className="border-t border-gray-200 pt-3 dark:border-border/20">{footer}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(FilterPopover);

