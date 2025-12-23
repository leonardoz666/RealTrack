import { memo, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from './ui/utils';

interface FilterPopoverApostasProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onClear?: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

function FilterPopoverApostas({
  trigger,
  open,
  onOpenChange,
  onClose,
  onClear,
  children,
  footer,
  maxWidth = '480px',
}: FilterPopoverApostasProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const maxWidthStyle = `min(75vw, ${maxWidth})`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {trigger && <PopoverTrigger asChild>{trigger}</PopoverTrigger>}
      <PopoverContent
        align="end"
        className={cn(
          "w-auto max-w-none rounded-lg border border-gray-200 bg-background-card p-3 shadow-lg overflow-visible dark:border-border/30",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
        )}
        style={{ width: 'auto', minWidth: 240, maxWidth: maxWidthStyle }}
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
        <div className="mt-2 flex flex-col gap-2">
          <div className="max-h-[75vh] space-y-2 overflow-y-auto pr-0">{children}</div>
          {footer && <div className="border-t border-gray-200 pt-3 dark:border-border/20">{footer}</div>}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(FilterPopoverApostas);
