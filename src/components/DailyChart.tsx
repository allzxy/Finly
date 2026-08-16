import { useMemo, useState } from 'react';
import type { Transaction } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { Flame, Sparkles, TrendingDown, TrendingUp, Wallet2 } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  month: string;
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function daysInMonth(month: string) {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function isCurrentMonth(month: string) {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return key === month;
}

function weekdayLabel(month: string, day: number, locale: string) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 1, day);
  return date.toLocaleDateString(locale, { weekday: 'short' });
}

const VB_WIDTH = 600;
const VB_HEIGHT = 180;
const PAD_X = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function DailyChart({ transactions, month, selectedDate, onSelectDate }: Props) {
  const { currency, toDisplay } = useFinance();
  const { t, locale } = useLanguage();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const daily = useMemo(() => {
    const count = daysInMonth(month);
    const byDay = Array.from({ length: count }, () => ({ income: 0, expense: 0 }));
    transactions.forEach((tx) => {
      // Abaikan transaksi transfer internal agar tidak menggelembungkan statistik harian murni
      if (tx.linkedWalletId || tx.categoryId === 'c-topup-in' || tx.categoryId === 'c-topup-out') return;
      const dayNum = parseInt(tx.date.slice(8, 10), 10);
      if (dayNum >= 1 && dayNum <= count) {
        if (tx.type === 'income') byDay[dayNum - 1].income += tx.amount;
        else byDay[dayNum - 1].expense += tx.amount;
      }
    });
    return byDay;
  }, [transactions, month]);

  const points = useMemo(() => daily.map((d, i) => ({ label: `${i + 1}`, ...d })), [daily]);

  const activeIdx = useMemo(() => {
    if (!selectedDate || selectedDate.slice(0, 7) !== month) return null;
    const day = parseInt(selectedDate.slice(8, 10), 10);
    return day >= 1 && day <= points.length ? day - 1 : null;
  }, [selectedDate, month, points.length]);

  const displayIdx = hoverIdx !== null ? hoverIdx : activeIdx;
  const displayPoint = displayIdx !== null ? points[displayIdx] : null;

  const handlePointClick = (i: number) => {
    const dateStr = `${month}-${pad(i + 1)}`;
    onSelectDate(activeIdx === i ? null : dateStr);
  };

  const stats = useMemo(() => {
    const totalIncome = daily.reduce((s, d) => s + d.income, 0);
    const totalExpense = daily.reduce((s, d) => s + d.expense, 0);
    const activeDays = isCurrentMonth(month) ? new Date().getDate() : daily.length;
    const avgDaily = totalExpense / Math.max(1, activeDays);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null;

    let peakIdx = -1;
    let peakValue = 0;
    daily.forEach((d, i) => {
      if (d.expense > peakValue) {
        peakValue = d.expense;
        peakIdx = i;
      }
    });

    let noSpendStreak = 0;
    for (let i = activeDays - 1; i >= 0; i--) {
      if (daily[i] && daily[i].expense === 0) noSpendStreak++;
      else break;
    }

    return { avgDaily, savingsRate, peakDay: peakIdx + 1, peakValue, noSpendStreak, totalIncome, totalExpense };
  }, [daily, month]);

  const insight = useMemo(() => {
    const formattedIncome = formatMoney(toDisplay(stats.totalIncome), currency);
    const formattedExpense = formatMoney(toDisplay(stats.totalExpense), currency);

    if (stats.totalIncome === 0 && stats.totalExpense === 0) {
      return { emoji: '👋', text: t('chart.insight.empty') };
    }
    if (stats.totalIncome === 0 && stats.totalExpense > 0) {
      return { emoji: '💡', text: t('chart.insight.noIncome', { expense: formattedExpense }) };
    }
    if (stats.totalExpense === 0 && stats.totalIncome > 0) {
      return { emoji: '🎉', text: t('chart.insight.noExpense', { income: formattedIncome }) };
    }
    if (stats.noSpendStreak >= 3) {
      return { emoji: '🔥', text: t('chart.insight.streak', { days: stats.noSpendStreak }) };
    }
    if (stats.savingsRate !== null && stats.savingsRate >= 50) {
      return { emoji: '🌟', text: t('chart.insight.excellent', { pct: stats.savingsRate.toFixed(0) }) };
    }
    if (stats.savingsRate !== null && stats.savingsRate >= 20) {
      return { emoji: '👏', text: t('chart.insight.good', { pct: stats.savingsRate.toFixed(0) }) };
    }
    if (stats.savingsRate !== null && stats.savingsRate >= 0) {
      const spendPct = (100 - stats.savingsRate).toFixed(0);
      return { emoji: '📊', text: t('chart.insight.moderate', { pct: spendPct }) };
    }
    return { emoji: '⚠️', text: t('chart.insight.bad') };
  }, [stats, t, toDisplay, currency]);

  const chart = useMemo(() => {
    const n = points.length;
    const innerW = VB_WIDTH - PAD_X * 2;
    const innerH = VB_HEIGHT - PAD_TOP - PAD_BOTTOM;
    const maxVal = Math.max(1, ...points.map((p) => Math.max(p.income, p.expense)));

    const xAt = (i: number) => (n <= 1 ? PAD_X : PAD_X + (i / (n - 1)) * innerW);
    const yAt = (v: number) => PAD_TOP + innerH - (v / maxVal) * innerH;

    const incomePts = points.map((p, i) => ({ x: xAt(i), y: yAt(p.income) }));
    const expensePts = points.map((p, i) => ({ x: xAt(i), y: yAt(p.expense) }));

    const incomeLine = buildSmoothPath(incomePts);
    const expenseLine = buildSmoothPath(expensePts);
    const baseline = PAD_TOP + innerH;
    const incomeArea = `${incomeLine} L ${incomePts[n - 1]?.x ?? PAD_X} ${baseline} L ${incomePts[0]?.x ?? PAD_X} ${baseline} Z`;
    const expenseArea = `${expenseLine} L ${expensePts[n - 1]?.x ?? PAD_X} ${baseline} L ${expensePts[0]?.x ?? PAD_X} ${baseline} Z`;

    return { xAt, yAt, incomeLine, expenseLine, incomeArea, expenseArea, incomePts, expensePts, baseline };
  }, [points]);

  return (
    <div className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-flat)]">
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[var(--color-primary-contrast)]">
            <Sparkles size={15} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('chart.title')}</h3>
        </div>

        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary-soft)] to-[var(--color-accent-soft)] px-3.5 py-3">
          <span className="shrink-0 text-lg">{insight.emoji}</span>
          <p className="text-xs font-medium leading-snug text-[var(--color-ink)]">{insight.text}</p>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-xl bg-[var(--color-surface-alt)] px-2.5 py-2.5 sm:px-3">
            <div className="flex items-center gap-1 text-[var(--color-warn)]">
              <TrendingDown size={12} />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)] sm:text-[10px]">{t('chart.avgDaily')}</span>
            </div>
            <p className="mt-1 truncate text-xs font-bold text-[var(--color-ink)] sm:text-sm">
              {formatMoney(toDisplay(stats.avgDaily), currency, { compact: true })}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-alt)] px-2.5 py-2.5 sm:px-3">
            <div className="flex items-center gap-1 text-[var(--color-accent)]">
              <TrendingUp size={12} />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)] sm:text-[10px]">{t('chart.peakSpend')}</span>
            </div>
            <p className="mt-1 truncate text-xs font-bold text-[var(--color-ink)] sm:text-sm">
              {stats.peakValue > 0 ? `${weekdayLabel(month, stats.peakDay, locale)}, ${stats.peakDay}` : '—'}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-alt)] px-2.5 py-2.5 sm:px-3">
            <div className="flex items-center gap-1 text-[var(--color-primary)]">
              <Wallet2 size={12} />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)] sm:text-[10px]">{t('chart.savingsRate')}</span>
            </div>
            <p className={`mt-1 truncate text-xs font-bold sm:text-sm ${stats.savingsRate === null ? 'text-[var(--color-muted)]' : stats.savingsRate >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-warn)]'}`}>
              {stats.savingsRate === null ? '—' : `${stats.savingsRate.toFixed(0)}%`}
            </p>
          </div>
        </div>

        {stats.noSpendStreak >= 1 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-primary)]/40 px-3.5 py-2">
            <Flame size={14} className="shrink-0 text-[var(--color-warn)]" />
            <p className="text-xs font-medium text-[var(--color-ink-soft)]">
              {t('chart.streak', { days: `<span class="font-bold text-[var(--color-ink)]">${stats.noSpendStreak}</span>` }).split('<span').map((part, i) => {
                 if (i === 0) return part;
                 const text = part.substring(part.indexOf('>') + 1, part.indexOf('</span'));
                 const after = part.substring(part.indexOf('</span') + 7);
                 return <span key={i}><span className="font-bold text-[var(--color-ink)]">{text}</span>{after}</span>;
              })}
            </p>
          </div>
        )}

        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">{t('chart.trend')}</span>
          <div className="flex items-center gap-2.5 text-[10px] text-[var(--color-muted)] sm:gap-3 sm:text-[11px]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" /> {t('chart.income')}</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--color-warn)]" /> {t('chart.expense')}</span>
          </div>
        </div>

        <div className="mb-2 flex min-h-[1.75rem] items-center rounded-lg bg-[var(--color-bg)] px-2.5 text-[11px] font-medium leading-snug text-[var(--color-ink-soft)] sm:text-xs">
          {displayPoint
            ? t('chart.synced', {
                date: `${weekdayLabel(month, Number(displayPoint.label), locale)}, ${displayPoint.label}`,
                in: formatMoney(toDisplay(displayPoint.income), currency),
                out: formatMoney(toDisplay(displayPoint.expense), currency),
                extra: activeIdx === displayIdx ? t('chart.syncExtra') : ''
              })
            : t('chart.syncHint')}
        </div>

        <div className="relative h-40 w-full sm:h-44">
          <svg role="img" aria-label="Grafik Tren Arus Keuangan Harian" viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="income-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="expense-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-warn)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--color-warn)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1={PAD_X} x2={VB_WIDTH - PAD_X} y1={PAD_TOP + (VB_HEIGHT - PAD_TOP - PAD_BOTTOM) * f} y2={PAD_TOP + (VB_HEIGHT - PAD_TOP - PAD_BOTTOM) * f} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
            ))}
            {displayIdx !== null && (
              <line x1={chart.xAt(displayIdx)} x2={chart.xAt(displayIdx)} y1={PAD_TOP} y2={chart.baseline} stroke="var(--color-ink-soft)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            )}
            <path d={chart.expenseArea} fill="url(#expense-fill)" className="animate-fade" />
            <path d={chart.incomeArea} fill="url(#income-fill)" className="animate-fade" />
            <path d={chart.expenseLine} fill="none" stroke="var(--color-warn)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className="animate-draw-line" />
            <path d={chart.incomeLine} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" pathLength={1} className="animate-draw-line" style={{ animationDelay: '80ms' }} />
            {chart.incomePts.map((p, i) => <circle key={`inc-${i}`} cx={p.x} cy={p.y} r={displayIdx === i ? 5 : 2.5} fill="var(--color-surface)" stroke="var(--color-primary)" strokeWidth="2" opacity={displayIdx !== null && displayIdx !== i ? 0.4 : 1} className="transition-all duration-150" />)}
            {chart.expensePts.map((p, i) => <circle key={`exp-${i}`} cx={p.x} cy={p.y} r={displayIdx === i ? 5 : 2.5} fill="var(--color-surface)" stroke="var(--color-warn)" strokeWidth="2" opacity={displayIdx !== null && displayIdx !== i ? 0.4 : 1} className="transition-all duration-150" />)}
            {points.map((_, i) => <rect key={`hit-${i}`} x={chart.xAt(i) - VB_WIDTH / points.length / 2} y={0} width={VB_WIDTH / points.length} height={VB_HEIGHT} fill="transparent" onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)} onClick={() => handlePointClick(i)} className="cursor-pointer" />)}
          </svg>
        </div>
        <div className="relative mt-1.5 h-3 text-[9px] text-[var(--color-muted)] sm:text-[10px]">
          {points.map((p, i) => {
            if (i !== 0 && (i + 1) % 5 !== 0) return null;
            const leftPct = (chart.xAt(i) / VB_WIDTH) * 100;
            return <span key={p.label} className="absolute -translate-x-1/2" style={{ left: `${leftPct}%` }}>{p.label}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
