import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface DropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  searchable?: boolean;
  useWrapperClass?: boolean;
}

export default function DropdownSelect({ options, value, onChange, placeholder = 'Selecione...', className = '', searchable = false, useWrapperClass = false }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target instanceof Node && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selected = options.find((o) => o.value === value);

  const [filterText, setFilterText] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const filteredOptions = filterText
    ? options.filter((o) => o.label.toLowerCase().includes(filterText.toLowerCase()))
    : options;

  useEffect(() => {
    if (open) {
      // focus search input when opening if it's present
      setTimeout(() => searchInputRef.current?.focus(), 0);
    } else {
      setFilterText('');
    }
  }, [open]);

  const updateFade = useCallback(() => {
    const el = menuRef.current;
    if (!el) return;
    const hasScroll = el.scrollHeight > el.clientHeight + 1;
    const atTop = el.scrollTop <= 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    setShowTopFade(hasScroll && !atTop);
    setShowBottomFade(hasScroll && !atBottom);
  }, []);

  // when opening, compute bounding rect for portal positioning
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const maxMenuWidth = 240; // compact horizontal size for filter menus
      const menuWidth = Math.min(Math.max(rect.width, 180), maxMenuWidth);
      let left = rect.left + window.scrollX;
      // if menu would overflow right edge, shift it left
      if (rect.left + menuWidth > window.innerWidth) {
        left = Math.max(12 + window.scrollX, window.innerWidth - menuWidth + window.scrollX);
      }

      setMenuStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY,
        left,
        width: menuWidth,
        maxWidth: maxMenuWidth,
        zIndex: 9999
      });
    } else {
      setMenuStyle(null);
    }
  }, [open]);

  // monitor resize/option changes to update fades
  useEffect(() => {
    if (!open) return;
    updateFade();
    const el = menuRef.current;
    const ro = new ResizeObserver(() => updateFade());
    if (el) ro.observe(el);
    window.addEventListener('resize', updateFade);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateFade);
    };
  }, [open, filteredOptions, updateFade]);

  const defaultButtonClass = 'w-full inline-flex items-center justify-between rounded-lg border border-border/30 bg-background px-3 py-2 text-sm text-foreground';
  const buttonClass = useWrapperClass ? defaultButtonClass : (className ? `inline-flex items-center justify-between ${className}` : defaultButtonClass);

  return (
    <div className={`relative inline-block text-left ${useWrapperClass ? className : ''}`} ref={ref} data-ignore-click-outside>
      <button
        ref={buttonRef}
        type="button"
        className={buttonClass}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown size={16} className="ml-2" />
      </button>

      {open && menuStyle && createPortal(
        <div style={menuStyle} className="relative group" data-ignore-click-outside>
          <ul
            ref={menuRef}
            role="listbox"
            data-ignore-click-outside
            style={{ maxHeight: '20rem' }}
            onScroll={updateFade}
            className="max-h-80 overflow-auto thin-scrollbar rounded-md border border-border/30 bg-background p-1 text-sm shadow-lg"
          >
          {searchable ? (
            <li className="px-2 pb-1 flex justify-start">
              <input
                ref={searchInputRef}
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full max-w-[220px] rounded-md border border-border/30 bg-background px-2 py-1 text-sm text-foreground placeholder:text-foreground/50 outline-none"
                aria-label="Pesquisar"
                data-ignore-click-outside
              />
            </li>
          ) : null}

          {filteredOptions.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`cursor-pointer rounded px-2 py-2 hover:bg-white/5 ${opt.value === value ? 'font-semibold' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
          </ul>

          {showTopFade ? (
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 h-4 rounded-t-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.18), transparent)' }}
            />
          ) : null}

          {showBottomFade ? (
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 h-4 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.18), transparent)' }}
            />
          ) : null}

        </div>,
        document.body
      )}
    </div>
  );
}
