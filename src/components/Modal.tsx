import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './ui/utils';

const SIZE_MAP = {
  sm: 'max-w-md',
  form: 'max-w-xl',
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
}

export default function Modal({ isOpen, title, onClose, children, size = 'md' }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative w-full rounded-3xl border border-[#14b8a6]/30 bg-gradient-to-br from-[#0f3a35] via-[#0d3230] to-[#0a2a26] p-8 shadow-[0_30px_80px_rgba(20,184,166,0.25)] backdrop-blur-3xl animate-slide-up',
          SIZE_MAP[size]
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <header id={titleId} className="flex items-start justify-between gap-4 border-b border-[#14b8a6]/20 pb-4">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">{title}</h3>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#14b8a6]/30 bg-gradient-to-br from-[#0f3a35] to-[#0a2a26] text-white transition hover:border-[#14b8a6]/60 hover:shadow-[0_8px_20px_rgba(20,184,166,0.2)]"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X size={20} />
          </button>
        </header>
        <div className="mt-4 space-y-4 text-foreground">{children}</div>
      </div>
    </div>,
    document.body
  );
}
