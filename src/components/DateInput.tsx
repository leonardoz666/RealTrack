import { useState, useRef, useEffect } from 'react';
import DatePicker from './DatePicker';
import { cn } from './ui/utils';

const FILTER_CONTEXT_SELECTOR = '[data-filter-context="true"], [class*="filter"]';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export default function DateInput({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  className = '',
  style,
  onFocus,
  onBlur,
}: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verificar se está dentro de um filtro
  const [isInFilter, setIsInFilter] = useState(false);

  useEffect(() => {
    const checkFilterContext = () => {
      if (containerRef.current) {
        const filterParent = containerRef.current.closest(FILTER_CONTEXT_SELECTOR);
        setIsInFilter(!!filterParent);
      }
    };
    
    checkFilterContext();
    // Re-verificar apenas quando o componente for montado ou quando isOpen mudar
    if (isOpen) {
      checkFilterContext();
    }
  }, [isOpen]);

  // Fechar quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const formatDisplayValue = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const handleInputClick = () => {
    setIsOpen(true);
  };

  const handleDateChange = (newValue: string) => {
    onChange(newValue);
  };

  const handlePickerClose = () => {
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input
        type="text"
        value={formatDisplayValue(value)}
        placeholder={placeholder}
        readOnly
        onClick={handleInputClick}
        className={cn(
          'w-full cursor-pointer rounded-2xl border border-[#14b8a6]/30 bg-gradient-to-br from-[#0f3a35] to-[#0a2a26] px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted transition hover:border-[#14b8a6]/50 focus-visible:border-[#14b8a6]/60 focus-visible:ring-2 focus-visible:ring-[#14b8a6]/30 focus-visible:shadow-[0_0_15px_rgba(20,184,166,0.2)]',
          className
        )}
        style={style}
        onFocus={onFocus}
        onBlur={onBlur}
      />
      {isOpen && (
        <DatePicker
          value={value}
          onChange={handleDateChange}
          onClose={handlePickerClose}
          alignLeft={isInFilter}
        />
      )}
    </div>
  );
}
