import { useMemo } from 'react';
import type { Transaction, Category } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { CATEGORY_ICONS } from '../lib/icons';
import CategoryDonut from './CategoryDonut';
import { PieChart as PieIcon, ChevronRight, ArrowUpRight, ArrowDownLeft, PiggyBank } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onManage?: () => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function CategoryBreakdown({ transactions, categories, onManage }: Props) {
  const { currency, wallets, toDisplay, tCategory } = useFinance();
  const { t } = useLanguage();

  const { data, totalExpense, totalIncome, totalSavings } = useMemo(() => {
    const expenseTotals = new Map<string, number>();
    const incomeTotals = new Map<string, number>();
    const savingsTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      // Skip internal transfers between two real wallets
      if (tx.type === 'expense' && tx.linkedWalletId) return;

      const targetW = wallets.find((w) => w.id === tx.walletId);
      const linkedW = tx.linkedWalletId ? wallets.find((w) => w.id === tx.linkedWalletId) : undefined;

      // Ignore transactions from deleted wallets
      if (!targetW) return;

      const isSavings = targetW.type === 'savings' || linkedW?.type === 'savings';

      if (isSavings) {
        savingsTotals.set(tx.categoryId, (savingsTotals.get(tx.categoryId) ?? 0) + tx.amount);
      } else if (tx.type === 'expense') {
        expenseTotals.set(tx.categoryId, (expenseTotals.get(tx.categoryId) ?? 0) + tx.amount);
      } else if (tx.type === 'income') {
        incomeTotals.set(tx.categoryId, (incomeTotals.get(tx.categoryId) ?? 0) + tx.amount);
      }
    });

    let sumExp = 0;
    let sumInc = 0;
    let sumSav = 0;

    const expenseList = Array.from(expenseTotals.entries())
      .filter(([_, value]) => value > 0)
      .map(([categoryId, value]) => {
        sumExp += value;
        const cat = categories.find((c) => c.id === categoryId);
        return {
          categoryId: categoryId || 'c-unassigned-exp',
          type: 'expense' as const,
          name: cat ? tCategory(cat) : t('categories.expense'),
          value,
          color: cat?.color ?? 'var(--color-warn)',
          icon: cat?.icon,
          limit: cat?.monthlyLimit,
        };
      });

    const incomeList = Array.from(incomeTotals.entries())
      .filter(([_, value]) => value > 0)
      .map(([categoryId, value]) => {
        sumInc += value;
        const cat = categories.find((c) => c.id === categoryId);
        const isTopUp = categoryId === 'c-topup-in';
        const color = isTopUp ? '#0d9488' : cat?.color ?? '#1f7a5c';
        return {
          categoryId: categoryId || 'c-unassigned-inc',
          type: 'income' as const,
          name: isTopUp ? tCategory('c-topup-in') : cat ? tCategory(cat) : t('categories.income'),
          value,
          color,
          icon: cat?.icon,
          limit: undefined,
        };
      });

    const savingsList = Array.from(savingsTotals.entries())
      .filter(([_, value]) => value > 0 && wallets.some((w) => w.type === 'savings'))
      .map(([categoryId, value]) => {
        sumSav += value;
        const cat = categories.find((c) => c.id === categoryId);
        const isSystemTopup = !cat || cat.id === 'c-topup-in' || cat.id === 'c-savings-in' || cat.system;
        return {
          categoryId,
          type: 'savings' as const,
          name: isSystemTopup ? tCategory('c-savings-in') : tCategory(cat),
          value,
          color: cat?.color ?? '#8a5fc9',
          icon: cat?.icon ?? 'PiggyBank',
          limit: undefined,
        };
      });

    // Combine all and sort by highest value
    const combined = [...expenseList, ...incomeList, ...savingsList].sort((a, b) => b.value - a.value);

    return { data: combined, totalExpense: sumExp, totalIncome: sumInc, totalSavings: sumSav };
  }, [transactions, categories, wallets, tCategory]);

  const totalSavingsGoal = useMemo(() => {
    return wallets.filter((w) => w.type === 'savings').reduce((s, w) => s + (w.goalAmount || 0), 0);
  }, [wallets]);

  const grandTotal = totalExpense + totalIncome + totalSavings;
  const topExpense = data.find((d) => d.type === 'expense' && d.value > 0);
  const topIncome = data.find((d) => d.type === 'income' && d.value > 0);
  const topSavings = data.find((d) => d.type === 'savings' && d.value > 0);

  const topSavingsPct = topSavings
    ? (totalSavingsGoal > 0 ? Math.min(100, (topSavings.value / totalSavingsGoal) * 100) : (grandTotal > 0 ? (topSavings.value / grandTotal) * 100 : 0))
    : 0;

  const latestCenterInfo = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        label: totalExpense > 0 ? t('categories.expense') : t('categories.totalInLabel'),
        value: formatMoney(toDisplay(totalExpense > 0 ? totalExpense : totalIncome), currency, { compact: true }),
      };
    }

    const sorted = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      if (a.time && b.time && a.time !== b.time) return b.time.localeCompare(a.time);
      return b.id.localeCompare(a.id);
    });

    const tx = sorted[0];
    const targetW = wallets.find((w) => w.id === tx.walletId);
    const linkedW = tx.linkedWalletId ? wallets.find((w) => w.id === tx.linkedWalletId) : undefined;
    const isSavings = targetW?.type === 'savings' || linkedW?.type === 'savings';

    let label = '';
    let prefix = '';

    if (isSavings) {
      label = tCategory('c-savings-in');
      prefix = '';
    } else if (tx.categoryId === 'c-topup-in') {
      label = tCategory('c-topup-in');
      prefix = '+';
    } else if (tx.linkedWalletId) {
      label = 'Transfer';
      prefix = tx.type === 'income' ? '+' : '-';
    } else {
      const cat = categories.find((c) => c.id === tx.categoryId);
      label = cat ? tCategory(cat) : (tx.type === 'income' ? t('categories.income') : t('categories.expense'));
      prefix = tx.type === 'income' ? '+' : '-';
    }

    const formattedAmount = formatMoney(toDisplay(tx.amount), currency, { compact: true });
    const value = `${prefix}${formattedAmount}`;

    return { label, value };
  }, [transactions, categories, wallets, totalExpense, totalIncome, currency, toDisplay, tCategory, t]);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5 overflow-hidden w-full min-w-0">
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
          <div className="mb-4 flex flex-col items-center gap-3 sm:flex-row xl:flex-col 2xl:flex-row sm:gap-5 w-full min-w-0">
            <CategoryDonut
              segments={data.map((d) => ({
                id: `${d.type}-${d.categoryId}`,
                name: d.name,
                value: d.value,
                color: d.color,
              }))}
              centerLabel={latestCenterInfo.label}
              centerValue={latestCenterInfo.value}
            />

            <div className="flex flex-1 flex-col gap-2 w-full min-w-0 overflow-hidden">
              {topExpense && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--color-warn-soft)]/60 px-3 py-2 text-xs overflow-hidden">
                  <ArrowDownLeft size={16} className="shrink-0 text-[var(--color-warn)]" />
                  <p className="min-w-0 truncate text-[var(--color-ink-soft)]">
                    {t('categories.topExpenseLabel', { name: topExpense.name })} ({formatMoney(toDisplay(topExpense.value), currency, { compact: true })})
                  </p>
                </div>
              )}
              {topIncome && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--color-primary-soft)]/60 px-3 py-2 text-xs overflow-hidden">
                  <ArrowUpRight size={16} className="shrink-0 text-[var(--color-primary-strong)]" />
                  <p className="min-w-0 truncate text-[var(--color-ink-soft)]">
                    {t('categories.topIncomeLabel', { name: topIncome.name })} ({formatMoney(toDisplay(topIncome.value), currency, { compact: true })})
                  </p>
                </div>
              )}
              {topSavings && (
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-[var(--color-accent-soft)]/60 px-3 py-2 text-xs overflow-hidden">
                  <PiggyBank size={16} className="shrink-0 text-[var(--color-accent)]" />
                  <p className="min-w-0 truncate text-[var(--color-ink-soft)]">
                    {t('categories.topSavingsLabel', { name: topSavings.name })} ({formatMoney(toDisplay(topSavings.value), currency, { compact: true })}{topSavingsPct > 0 ? ` · ${topSavingsPct.toFixed(0)}% dari target` : ''})
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

              const savingsGoalPct = entry.type === 'savings' && totalSavingsGoal > 0
                ? Math.min(100, (entry.value / totalSavingsGoal) * 100)
                : 0;

              const overLimit = hasLimit && entry.value > (entry.limit ?? 0);
              const barColor = overLimit ? 'var(--color-warn)' : entry.color;
              const badgeStyle = entry.type === 'income'
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                : entry.type === 'savings'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]';
              const badgeLabel = entry.type === 'income'
                ? t('categories.tagIn')
                : entry.type === 'savings'
                ? t('categories.tagSavings')
                : t('categories.tagOut');

              const displayPctText = entry.type === 'savings'
                ? (totalSavingsGoal > 0 ? ` (${savingsGoalPct.toFixed(0)}% dari target)` : '')
                : '';

              const barWidthPct = entry.type === 'savings' && totalSavingsGoal > 0 ? savingsGoalPct : pct;

              return (
                <div key={`${entry.type}-${entry.categoryId}`} className="flex items-center gap-3">
                  <div
                    className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${barColor}1f`, color: barColor }}
                  >
                    {Icon ? <Icon size={14} /> : <PiggyBank size={14} />}
                    {i < 3 && <span className="absolute -bottom-1 -right-1 text-[11px] leading-none">{MEDALS[i]}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-medium text-[var(--color-ink)]">{entry.name}</span>
                        <span className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${badgeStyle}`}>
                          {badgeLabel}
                        </span>
                      </div>
                      <span className={`ml-2 shrink-0 ${overLimit ? 'font-semibold text-[var(--color-warn)]' : 'text-[var(--color-muted)]'}`}>
                        {formatMoney(toDisplay(entry.value), currency)}
                        {displayPctText}
                        {hasLimit ? ` / ${formatMoney(toDisplay(entry.limit ?? 0), currency, { compact: true })}` : ''}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                      <div className="animate-grow h-full rounded-full" style={{ width: `${Math.min(100, Math.max(2, barWidthPct))}%`, backgroundColor: barColor, animationDelay: `${i * 40}ms` }} />
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
