import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getYear, getMonth, setYear, setMonth, isAfter, isBefore } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const parseYMD = (s?: string | null) => {
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length < 3) return null;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return new Date(y, m - 1, d);
};

interface DateRangePickerProps {
  start?: string;
  end?: string;
  onChange: (start: string | '', end: string | '') => void;
  onClose?: () => void;
  alignLeft?: boolean;
}

export default function DateRangePicker({ start, end, onChange, onClose, alignLeft = false }: DateRangePickerProps) {
  const initialDate = parseYMD(start) ?? new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [tempStart, setTempStart] = useState<Date | null>(() => parseYMD(start));
  const [tempEnd, setTempEnd] = useState<Date | null>(() => parseYMD(end));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const formatISO = (d: Date) => format(d, 'yyyy-MM-dd');

  const withinRange = (d: Date) => {
    if (tempStart && tempEnd) {
      return (isAfter(d, tempStart) || isSameDay(d, tempStart)) && (isBefore(d, tempEnd) || isSameDay(d, tempEnd));
    }
    if (tempStart && hoverDate) {
      const a = tempStart;
      const b = hoverDate;
      const startD = isBefore(a, b) ? a : b;
      const endD = isAfter(a, b) ? a : b;
      return (isAfter(d, startD) || isSameDay(d, startD)) && (isBefore(d, endD) || isSameDay(d, endD));
    }
    return false;
  };

  const handleDayClick = (day: Date) => {
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(day);
      setTempEnd(null);
      onChange(formatISO(day), '');
      return;
    }

    // tempStart exists and tempEnd is null => set end
    const startDate = tempStart;
    if (isBefore(day, startDate)) {
      // swap
      setTempEnd(startDate);
      setTempStart(day);
      onChange(formatISO(day), formatISO(startDate));
    } else {
      setTempEnd(day);
      onChange(formatISO(startDate), formatISO(day));
    }
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onChange('', '');
  };

  const handleToday = () => {
    const today = new Date();
    setTempStart(today);
    setTempEnd(null);
    setCurrentMonth(today);
    onChange(formatISO(today), '');
  };

  const handleOK = () => {
    if (onClose) onClose();
  };

  const currentYear = currentMonth.getFullYear();
  // Limitar opções de ano entre 2025 e 2030
  const years = [2025, 2026, 2027, 2028, 2029, 2030];

  const handleYearSelect = (year: number) => setCurrentMonth(setYear(currentMonth, year));

  const isSelectedStart = (d: Date) => tempStart && isSameDay(d, tempStart);
  const isSelectedEnd = (d: Date) => tempEnd && isSameDay(d, tempEnd);

  return (
    <div
      className={`absolute z-[1000] w-[320px] max-w-[90vw] overflow-hidden rounded-lg border border-skin-border text-skin-text shadow-[0_12px_30px_rgba(0,0,0,0.18)] ${alignLeft ? 'right-full top-1/2 mr-2 -translate-y-1/2 transform' : 'left-0 top-full mt-2'}`}
      style={{ backgroundColor: '#042620' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-full flex-1 p-2" style={{ backgroundColor: '#042620' }}>
        <div className="mb-2 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5">
            <button type="button" onClick={goToPreviousMonth} className="rounded-md p-1 text-foreground-muted hover:text-foreground transition" aria-label="Mês anterior"><ChevronLeft size={16} /></button>

            <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
              <select value={getMonth(currentMonth)} onChange={(e) => handleMonthSelect(Number(e.target.value))} className="dark-select appearance-none bg-transparent px-1 py-0.5 outline-none text-foreground">
                {monthNames.map((month, index) => (
                  <option key={month} value={index} className="bg-transparent text-foreground">{month}</option>
                ))}
              </select>

              <select value={currentMonth.getFullYear()} onChange={(e) => handleYearSelect(Number(e.target.value))} className="dark-select appearance-none bg-transparent px-1 py-0.5 outline-none text-foreground">
                {years.map((year) => (
                  <option key={year} value={year} className="bg-transparent text-foreground">{year}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={goToNextMonth} className="rounded-md p-1 text-foreground-muted hover:text-foreground transition" aria-label="Próximo mês"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {weekDays.map((day) => (
            <div key={day} className="py-0.5 text-center text-[0.55rem] font-semibold uppercase tracking-[0.3px] text-skin-muted">{day}</div>
          ))}
        </div>

        <div className="mb-2 grid flex-1 grid-cols-7 gap-1">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isStart = isSelectedStart(day);
            const isEnd = isSelectedEnd(day);
            const inRange = withinRange(day);

            const base = 'h-8 rounded-md text-[0.7rem] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-emerald';
            const classes = [
              base,
              isStart || isEnd ? 'bg-bank text-white font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.1)]' : inRange ? 'bg-bank-light/40 text-white' : isSameDay(day, new Date()) ? 'bg-bank-light text-skin-text font-semibold' : isCurrentMonth ? 'text-skin-text hover:bg-bank-light/60' : 'text-skin-muted',
            ].join(' ');

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                type="button"
                onMouseEnter={() => setHoverDate(day)}
                onMouseLeave={() => setHoverDate(null)}
                onClick={() => handleDayClick(day)}
                className={classes}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-skin-border/60 pt-2">
          <button type="button" onClick={handleClear} className="rounded-md px-2 py-1 text-[0.7rem] font-semibold text-brand-emerald transition hover:text-brand-hover">Limpar</button>
          <div className="flex gap-1">
            <button type="button" onClick={handleToday} className="rounded-md px-2 py-1 text-[0.7rem] font-semibold text-brand-emerald transition hover:text-brand-hover">Hoje</button>
            <button type="button" onClick={() => onClose && onClose()} className="rounded-md px-3 py-1 text-[0.7rem] font-semibold text-brand-emerald transition hover:text-brand-hover">Cancelar</button>
            <button type="button" onClick={handleOK} className="rounded-md bg-bank px-3 py-1 text-[0.7rem] font-semibold text-white shadow-bank transition hover:bg-bank-dark hover:shadow-bank-strong">OK</button>
          </div>
        </div>
      </div>
    </div>
  );
}
