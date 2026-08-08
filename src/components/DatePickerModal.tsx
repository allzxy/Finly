import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (date: string) => void;
  nested?: boolean;
  allowClear?: boolean;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateKey(y: number, m: number, d: number) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function parseValue(value: string): Date {
  if (value) {
    const [y, m, d] = value.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  return new Date();
}

export default function DatePickerModal({ open, onClose, value, onChange, nested = false, allowClear = false }: Props) {
  const { t, locale } = useLanguage();
  const [viewYear, setViewYear] = useState(() => parseValue(value).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parseValue(value).getMonth());

  useEffect(() => {
    if (open) {
      const d = parseValue(value);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [open, value]);

  const WEEKDAY_LABELS = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => new Date(2024, 0, i + 7).toLocaleDateString(locale, { weekday: 'short' }));
  }, [locale]);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const monthLabel = firstOfMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const today = new Date();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const shiftMonth = (dir: 1 | -1) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; } else if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const selectDay = (d: number) => {
    onChange(toDateKey(viewYear, viewMonth, d));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('date.pick')} nested={nested}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]" aria-label={t('date.prevMonth')}><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold capitalize text-[var(--color-ink)]">{monthLabel}</span>
          <button type="button" onClick={() => shiftMonth(1)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]" aria-label={t('date.nextMonth')}><ChevronRight size={16} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[var(--color-muted)]">
          {WEEKDAY_LABELS.map((w, i) => <span key={i}>{w}</span>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <span key={`empty-${i}`} />;
            const dateKey = toDateKey(viewYear, viewMonth, d);
            const isSelected = dateKey === value;
            const isToday = dateKey === todayKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => selectDay(d)}
                className={`aspect-square rounded-lg text-sm font-medium transition ${isSelected ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]' : isToday ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]' : 'text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]'}`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-1 flex gap-2">
          {allowClear && (
            <button type="button" onClick={() => { onChange(''); onClose(); }} className="flex-1 rounded-xl bg-[var(--color-surface-alt)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-border)]">
              {t('filter.allDates')}
            </button>
          )}
          <button type="button" onClick={() => { onChange(todayKey); onClose(); }} className={`rounded-xl py-2.5 text-sm font-medium transition ${allowClear ? 'flex-1 bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] hover:bg-[var(--color-primary)]/20' : 'flex-1 bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:bg-[var(--color-border)]'}`}>
            {t('common.today')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
