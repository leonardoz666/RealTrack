import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DateRangePicker from './DateRangePicker';
import { cn } from './ui/utils';

const FILTER_CONTEXT_SELECTOR = '[data-filter-context="true"], [class*="filter"]';

interface DateRangeInputProps {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

const formatDisplay = (start: string, end: string) => {
  if (!start && !end) return '';
  const toDisplay = (s: string) => {
    if (!s) return '';
    const parts = s.split('-');
    if (parts.length < 3) return '';
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  };
  if (start && end) return `${toDisplay(start)} — ${toDisplay(end)}`;
  if (start) return `${toDisplay(start)} — `;
  return ` — ${toDisplay(end)}`;
};

export default function DateRangeInput({ start, end, onChange, placeholder = 'dd/mm/aaaa — dd/mm/aaaa', className = '', style }: DateRangeInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInFilter, setIsInFilter] = useState(false);

  useEffect(() => {
    const checkFilterContext = () => {
      if (containerRef.current) {
        const filterParent = containerRef.current.closest(FILTER_CONTEXT_SELECTOR);
        setIsInFilter(!!filterParent);
      }
    };
    checkFilterContext();
    if (isOpen) checkFilterContext();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const node = event.target as Node | null;
      const isInIgnored = (n: Node | null): boolean => {
        let cur: Node | null = n;
        while (cur) {
          if (cur instanceof Element && cur.hasAttribute('data-ignore-click-outside')) return true;
          cur = cur.parentNode;
        }
        return false;
      };

      if (containerRef.current && !containerRef.current.contains(event.target as Node) && !isInIgnored(node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);
  useEffect(() => {
    if (!isOpen) {
      setPortalStyle(null);
      return;
    }
    const updatePosition = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pickerWidth = Math.min(360, window.innerWidth * 0.9);
      let left = rect.left;
      if (left + pickerWidth > window.innerWidth - 8) {
        left = Math.max(8, window.innerWidth - pickerWidth - 8);
      }
      let top = rect.bottom + 8;
      const pickerHeightEstimate = 320;
      if (top + pickerHeightEstimate > window.innerHeight - 8) {
        top = Math.max(8, rect.top - pickerHeightEstimate - 8);
      }
      setPortalStyle({ position: 'absolute', left: Math.round(left), top: Math.round(top), zIndex: 1000 });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handlePickerChange = (s: string, e: string) => {
    onChange(s, e);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={formatDisplay(start, end)}
        placeholder={placeholder}
        readOnly
        onClick={() => setIsOpen(true)}
        className={cn('w-full cursor-pointer rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted transition focus-visible:border-brand-emerald focus-visible:ring-2 focus-visible:ring-brand-emerald/30', className)}
        style={style}
      />

      {isOpen && portalStyle && createPortal(
        <div style={portalStyle} data-ignore-click-outside="true">
          <DateRangePicker start={start} end={end} onChange={handlePickerChange} onClose={() => setIsOpen(false)} />
        </div>,
        document.body
      )}
    </div>
  );
}
