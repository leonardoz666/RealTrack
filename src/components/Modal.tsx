import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './ui/utils';

const SIZE_MAP = {
  sm: 'max-w-md',
  // Modal 'form' padrão maior para acomodar formulários largos
  form: 'max-w-4xl',
  md: 'max-w-2xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const;

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof SIZE_MAP;
  className?: string;
}

interface ModalPropsExtended extends ModalProps {
  subtitle?: string;
  icon?: ReactNode;
  hideHeader?: boolean;
}

export default function Modal({
  isOpen,
  title,
  onClose,
  children,
  size = 'md',
  subtitle,
  icon,
  className,
  hideHeader = false
}: ModalPropsExtended) {
  const titleId = useId();
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const original = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = original;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-fade dark:bg-black/80"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full rounded-3xl md:rounded-[2.5rem] border border-gray-200 bg-white p-4 md:px-6 md:pt-6 md:pb-4 shadow-xl backdrop-blur-3xl animate-slide-up overflow-hidden dark:border-emerald-700/20 dark:bg-transparent dark:bg-gradient-to-br dark:from-emerald-900/90 dark:to-emerald-950/90 dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]',
          SIZE_MAP[size],
          className
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Glow effect in background */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-100 blur-[100px] dark:bg-brand-emerald/10" />

        {!hideHeader && (
          <header id={titleId} className="relative flex items-center justify-between gap-4 pb-6">
            <div className="flex items-center gap-4">
              {icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:bg-brand-emerald dark:text-white">
                  {icon}
                </div>
              )}
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm font-medium text-emerald-600 dark:text-brand-emerald/80">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-gray-900 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </header>
        )}
        <div className="relative text-foreground">{children}</div>
      </div>
    </div>,
    document.body
  );
}

