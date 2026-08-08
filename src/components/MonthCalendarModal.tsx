import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (month: string) => void;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  nested?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseValue(value: string): { year: number; month: number } {
  const [y, m] = value.split('-').map(Number);
  if (y && m) return { year: y, month: m - 1 };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export default function MonthCalendarModal({ open, onClose, value, onChange, selectedDate, onSelectDate, nested = false }: Props) {
  const { t, locale } = useLanguage();
  const [viewYear, setViewYear] = useState(() => parseValue(value).year);
  const [viewMonth, setViewMonth] = useState(() => parseValue(value).month);

  useEffect(() => {
    if (open) {
      const v = parseValue(value);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewYear(v.year);
      setViewMonth(v.month);
    }
  }, [open, value]);

  const WEEKDAY_LABELS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => new Date(2024, 0, i + 7).toLocaleDateString(locale, { weekday: 'short' }));
  }, [locale]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const monthKey = `${viewYear}-${pad(viewMonth + 1)}`;

  const now = new Date();
  const isCurrentMonthView = viewYear === now.getFullYear() && viewMonth === now.getMonth();
  const todayDate = now.getDate();

  const isSelectedMonthView = monthKey === value;
  const selectedDay = selectedDate && selectedDate.slice(0, 7) === monthKey ? parseInt(selectedDate.slice(8, 10), 10) : null;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shiftMonth = (dir: 1 | -1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const pickDay = (d: number) => {
    const dateKey = `${monthKey}-${pad(d)}`;
    onChange(monthKey);
    onSelectDate(selectedDate === dateKey ? null : dateKey);
    onClose();
  };

  const confirmWholeMonth = (y: number, m: number) => {
    onChange(`${y}-${pad(m + 1)}`);
    onSelectDate(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('date.pick')} nested={nested}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]" aria-label={t('date.prevMonth')}>
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => confirmWholeMonth(viewYear, viewMonth)} className={`rounded-lg px-3 py-1 text-sm font-semibold capitalize transition hover:bg-[var(--color-surface-alt)] ${isSelectedMonthView && selectedDay === null ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink)]'}`}>
            {monthLabel}
          </button>
          <button type="button" onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]" aria-label={t('date.nextMonth')}>
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--color-muted)]">
          {WEEKDAY_LABELS.map((w, i) => <span key={i}>{w}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={`empty-${i}`} />;
            const isToday = isCurrentMonthView && d === todayDate;
            const isSelected = selectedDay === d;
            return (
              <button key={d} type="button" onClick={() => pickDay(d)} className={`aspect-square rounded-lg text-sm font-medium transition ${isSelected ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]' : isToday ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]'}`}>
                {d}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-[var(--color-muted)]">
          {t('date.tapHint')}
        </p>

        <button type="button" onClick={() => confirmWholeMonth(now.getFullYear(), now.getMonth())} className="mt-1 rounded-xl bg-[var(--color-surface-alt)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-border)]">
          {t('date.thisMonth')}
        </button>
      </div>
    </Modal>
  );
}