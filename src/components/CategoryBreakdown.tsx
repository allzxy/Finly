import { useMemo } from 'react';
import type { Transaction, Category } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { CATEGORY_ICONS } from '../lib/icons';
import CategoryDonut from './CategoryDonut';
import { PieChart as PieIcon, ChevronRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onManage?: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CategoryBreakdown({ transactions, categories, onManage }: Props) {
  const { currency, toDisplay } = useFinance();
  const { t } = useLanguage();

  const { data, totalExpense, totalIncome } = useMemo(() => {
    const expenseTotals = new Map<string, number>();
    const incomeTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      if (tx.linkedWalletId) return; // skip internal wallet transfers/topups
      if (tx.type === 'expense') {
        expenseTotals.set(tx.categoryId, (expenseTotals.get(tx.categoryId) ?? 0) + tx.amount);
      } else if (tx.type === 'income') {
        incomeTotals.set(tx.categoryId, (incomeTotals.get(tx.categoryId) ?? 0) + tx.amount);
      }
    });

    let sumExp = 0;
    let sumInc = 0;

    const expenseList = Array.from(expenseTotals.entries()).map(([categoryId, value]) => {
      sumExp += value;
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        type: 'expense' as const,
        name: cat && !cat.system && categoryId ? cat.name : t('categories.expense'),
        value,
        color: cat?.color ?? 'var(--color-warn)',
        icon: cat?.icon,
        limit: cat?.monthlyLimit,
      };
    });

    const incomeList = Array.from(incomeTotals.entries()).map(([categoryId, value]) => {
      sumInc += value;
      const cat = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        type: 'income' as const,
        name: cat && !cat.system && categoryId ? cat.name : t('categories.income'),
        value,
        color: cat?.color ?? 'var(--color-primary)',
        icon: cat?.icon,
        limit: undefined,
      };
    });

    // Combine both and sort by highest value
    const combined = [...expenseList, ...incomeList].sort((a, b) => b.value - a.value);

    return { data: combined, totalExpense: sumExp, totalIncome: sumInc };
  }, [transactions, categories, t]);

  const grandTotal = totalExpense + totalIncome;
  const topExpense = data.find((d) => d.type === 'expense');
  const topIncome = data.find((d) => d.type === 'income');

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
            <PieIcon size={15} />
          </div>
          <h3 className="truncate text-sm font-semibold text-[var(--color-ink)]">{t('categories.allocationTitle')}</h3>
        </div>

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

      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--color-muted)]">{t('categories.emptyRange')}</p>
      ) : (
        <>
          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <CategoryDonut
              segments={data.map((d) => ({
                id: `${d.type}-${d.categoryId}`,
                value: d.value,
                color: d.type === 'income' ? 'var(--color-primary)' : d.color,
              }))}
              centerLabel={totalExpense > 0 ? t('categories.expense') : t('categories.totalInLabel')}
              centerValue={formatMoney(toDisplay(totalExpense > 0 ? totalExpense : totalIncome), currency, { compact: true })}
            />

            <div className="flex flex-1 flex-col gap-2 w-full">
              {topExpense && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--color-warn-soft)]/60 px-3 py-2 text-xs">
                  <ArrowDownLeft size={16} className="shrink-0 text-[var(--color-warn)]" />
                  <p className="min-w-0 truncate text-[var(--color-ink-soft)]">
                    {t('categories.topExpenseLabel', { name: topExpense.name })} ({formatMoney(toDisplay(topExpense.value), currency, { compact: true })})
                  </p>
                </div>
              )}
              {topIncome && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--color-primary-soft)]/60 px-3 py-2 text-xs">
                  <ArrowUpRight size={16} className="shrink-0 text-[var(--color-primary-strong)]" />
                  <p className="min-w-0 truncate text-[var(--color-ink-soft)]">
                    {t('categories.topIncomeLabel', { name: topIncome.name })} ({formatMoney(toDisplay(topIncome.value), currency, { compact: true })})
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {data.slice(0, 7).map((entry, i) => {
              const Icon = entry.icon ? CATEGORY_ICONS[entry.icon] : undefined;
              const hasLimit = entry.type === 'expense' && !!entry.limit;
              const pct = hasLimit
                ? Math.min(100, (entry.value / (entry.limit ?? 1)) * 100)
                : grandTotal > 0
                ? (entry.value / grandTotal) * 100
                : 0;
              const overLimit = hasLimit && entry.value > (entry.limit ?? 0);
              const barColor = entry.type === 'income' ? 'var(--color-primary)' : overLimit ? 'var(--color-warn)' : entry.color;

              return (
                <div key={`${entry.type}-${entry.categoryId}`} className="flex items-center gap-3">
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${barColor}1f`, color: barColor }}
                  >
                    {Icon ? <Icon size={14} /> : null}
                    {i < 3 && <span className="absolute -bottom-1 -right-1 text-[11px] leading-none">{MEDALS[i]}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-medium text-[var(--color-ink)]">{entry.name}</span>
                        <span
                          className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            entry.type === 'income'
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                              : 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]'
                          }`}
                        >
                          {entry.type === 'income' ? t('categories.tagIn') : t('categories.tagOut')}
                        </span>
                      </div>
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
