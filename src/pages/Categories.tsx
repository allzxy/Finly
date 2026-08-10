import { useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import Topbar from '../components/Topbar';
import CategoryFormModal from '../components/CategoryFormModal';
import ConfirmModal from '../components/ConfirmModal';
import { formatMoney } from '../lib/currencies';
import { CATEGORY_ICONS } from '../lib/icons';
import type { Category, TransactionType } from '../lib/types';
import { Plus, Pencil, Trash2, Wallet2 } from 'lucide-react';

export default function Categories() {
  const { categories, transactions, selectedMonth, deleteCategory, currency, toDisplay } = useFinance();
  const { t } = useLanguage();
  const [tab, setTab] = useState<TransactionType>('expense');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const list = categories.filter((c) => c.type === tab && !c.system);

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((tx) => tx.type === 'expense' && tx.date.slice(0, 7) === selectedMonth)
      .forEach((tx) => map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount));
    return map;
  }, [transactions, selectedMonth]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <Topbar title={t('categories.title')} subtitle={t('categories.subtitle')} />

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5">
        <div className="mb-4 flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 text-sm font-medium">
          {(['expense', 'income'] as const).map((txType) => (
            <button
              key={txType}
              onClick={() => setTab(txType)}
              className={`flex-1 rounded-full py-2 transition ${
                tab === txType
                  ? txType === 'income'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm'
                    : 'bg-[var(--color-warn)] text-[var(--color-warn-contrast)] shadow-sm'
                  : 'text-[var(--color-ink-soft)]'
              }`}
            >
              {txType === 'income' ? t('categories.income') : t('categories.expense')}
            </button>
          ))}
        </div>

        <button
          onClick={openCreate}
          className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
        >
          <Plus size={15} /> {t('categories.new')}
        </button>

        {list.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted)]">
            {t('categories.empty', { type: tab === 'income' ? t('categories.income').toLowerCase() : t('categories.expense').toLowerCase() })}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {list.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon];
              const spent = spentByCategory.get(c.id) ?? 0;
              const hasLimit = tab === 'expense' && !!c.monthlyLimit;
              const pct = hasLimit ? Math.min(100, (spent / (c.monthlyLimit ?? 1)) * 100) : 0;
              const overLimit = hasLimit && spent > (c.monthlyLimit ?? 0);

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-[var(--color-border)] px-3 py-3 transition hover:bg-[var(--color-surface-alt)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${c.color}20`, color: c.color }}
                    >
                      {Icon ? <Icon size={17} /> : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{c.name}</p>
                      {hasLimit ? (
                        <p className={`truncate text-xs ${overLimit ? 'font-medium text-[var(--color-warn)]' : 'text-[var(--color-muted)]'}`}>
                          {formatMoney(toDisplay(spent), currency, { compact: true })} / {formatMoney(toDisplay(c.monthlyLimit ?? 0), currency, { compact: true })} {t('categories.thisMonth')}
                        </p>
                      ) : (
                        <p className="truncate text-xs text-[var(--color-muted)]">
                          {tab === 'expense' ? t('categories.noLimit') : t('categories.incomeCategory')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => openEdit(c)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                      aria-label={t('categories.edit')}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeleting(c)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-warn-soft)] hover:text-[var(--color-warn)]"
                      aria-label={t('categories.delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {hasLimit && (
                    <div className="mt-2.5 pl-[52px]">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: overLimit ? 'var(--color-warn)' : c.color }}
                        />
                      </div>
                      {overLimit && (
                        <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-[var(--color-warn)]">
                          <Wallet2 size={11} /> {t('categories.overLimit')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CategoryFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} defaultType={tab} />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteCategory(deleting.id)}
        title={t('categories.delete')}
        description={t('categories.deleteDesc', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
