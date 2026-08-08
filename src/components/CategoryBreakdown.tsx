import { useMemo } from 'react';
import type { Transaction, Category } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { CATEGORY_ICONS } from '../lib/icons';
import CategoryDonut from './CategoryDonut';
import { PieChart as PieIcon, ChevronRight } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onManage?: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CategoryBreakdown({ transactions, categories, onManage }: Props) {
  const { currency, toDisplay } = useFinance();
  const { t } = useLanguage();

  const data = useMemo(() => {
    const totals = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount));

    return Array.from(totals.entries())
      .map(([categoryId, value]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          name: cat && !cat.system && categoryId ? cat.name : t('categories.expense'),
          value,
          color: cat?.color ?? 'var(--color-warn)',
          icon: cat?.icon,
          limit: cat?.monthlyLimit,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, t]);

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const topEntry = data[0];

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <PieIcon size={15} />
          </div>
          <h3 className="truncate text-sm font-semibold text-[var(--color-ink)]">{t('categories.expenseBreakdown')}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onManage && (
            <button
              onClick={onManage}
              aria-label={t('categories.manage')}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-primary)]"
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">{t('categories.emptyRange')}</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <CategoryDonut
              segments={data.map((d) => ({ id: d.categoryId, value: d.value, color: d.color }))}
              centerLabel={t('categories.total')}
              centerValue={formatMoney(toDisplay(total), currency, { compact: true })}
            />
            {topEntry && (
              <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-[var(--color-surface-alt)] px-3.5 py-3 text-center sm:text-left">
                <span className="text-xl">💡</span>
                <p className="min-w-0 text-xs leading-snug text-[var(--color-ink-soft)]">
                  {t('categories.topSpend', { name: topEntry.name, pct: total > 0 ? Math.round((topEntry.value / total) * 100) : 0 })}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {data.slice(0, 7).map((entry, i) => {
              const Icon = entry.icon ? CATEGORY_ICONS[entry.icon] : undefined;
              const hasLimit = !!entry.limit;
              const pct = hasLimit ? Math.min(100, (entry.value / (entry.limit ?? 1)) * 100) : total > 0 ? (entry.value / total) * 100 : 0;
              const overLimit = hasLimit && entry.value > (entry.limit ?? 0);
              const barColor = overLimit ? 'var(--color-warn)' : entry.color;
              return (
                <div key={entry.categoryId} className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${entry.color}1f`, color: entry.color }}>
                    {Icon ? <Icon size={14} /> : null}
                    {i < 3 && <span className="absolute -bottom-1 -right-1 text-[11px] leading-none">{MEDALS[i]}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium text-[var(--color-ink)]">{entry.name}</span>
                      <span className={`ml-2 shrink-0 ${overLimit ? 'font-semibold text-[var(--color-warn)]' : 'text-[var(--color-muted)]'}`}>
                        {formatMoney(toDisplay(entry.value), currency)}
                        {hasLimit ? ` / ${formatMoney(toDisplay(entry.limit ?? 0), currency, { compact: true })}` : ''}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                      <div className="animate-grow h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, animationDelay: `${i * 40}ms` }} />
                    </div>
                    {overLimit && <p className="mt-1 text-[10px] font-medium text-[var(--color-warn)]">{t('categories.overLimit')}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
