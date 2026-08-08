import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Transaction } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { CATEGORY_ICONS } from '../lib/icons';
import { Receipt, Trash2, ListFilter, MoreVertical, Pencil, X, ChevronRight, Trash } from 'lucide-react';
import AddTransactionModal from './AddTransactionModal';
import TransactionFilterModal, { type TransactionFilters } from './TransactionFilterModal';
import ConfirmModal from './ConfirmModal';

function formatDateChip(dateStr: string, locale: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  transactions: Transaction[];
  preview?: boolean;
}

export default function TransactionList({ transactions, preview = false }: Props) {
  const { categories, currency, deleteTransaction, clearAllTransactions, toDisplay } = useFinance();
  const { t, locale } = useLanguage();

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({ date: '', type: 'all', categoryId: 'all' });
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const filtered = useMemo(() => {
    if (preview) return transactions;
    return transactions.filter((tx) => {
      if (filters.date && tx.date !== filters.date) return false;
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      if (filters.categoryId !== 'all' && tx.categoryId !== filters.categoryId) return false;
      return true;
    });
  }, [transactions, filters, preview]);

  const sortedAll = [...filtered].sort((a, b) => (a.date < b.date ? 1 : -1));
  const sorted = preview ? sortedAll.slice(0, 5) : sortedAll;

  const activeChips = useMemo(() => {
    const chips: { key: keyof TransactionFilters; label: string }[] = [];
    if (filters.date) chips.push({ key: 'date', label: formatDateChip(filters.date, locale) });
    if (filters.type !== 'all') chips.push({ key: 'type', label: filters.type === 'income' ? t('categories.income') : t('categories.expense') });
    if (filters.categoryId !== 'all') {
      const cat = categories.find((c) => c.id === filters.categoryId);
      chips.push({ key: 'categoryId', label: cat?.name ?? t('addTx.category') });
    }
    return chips;
  }, [filters, categories, t, locale]);

  const clearChip = (key: keyof TransactionFilters) => {
    if (key === 'date') setFilters((f) => ({ ...f, date: '' }));
    else if (key === 'type') setFilters((f) => ({ ...f, type: 'all', categoryId: 'all' }));
    else setFilters((f) => ({ ...f, categoryId: 'all' }));
  };

  const isFiltered = activeChips.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5">
      <div className="mb-3 flex items-center gap-2 sm:mb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]"><Receipt size={15} /></div>
        <h3 className="truncate text-sm font-semibold text-[var(--color-ink)]">{t('tx.title')}</h3>
        {!preview && <span className="ml-auto shrink-0 text-xs text-[var(--color-muted)]">{t('tx.count', { n: sorted.length })}</span>}

        {preview ? (
          <Link to="/history" className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]" aria-label={t('tx.viewAll')}><ChevronRight size={16} /></Link>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5">
            {transactions.length > 0 && <button onClick={() => setConfirmClearOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-warn-soft)] hover:text-[var(--color-warn)]" aria-label={t('tx.clearAll')}><Trash size={15} /></button>}
            <button onClick={() => setFilterModalOpen(true)} className={`relative flex h-8 w-8 items-center justify-center rounded-lg transition ${isFiltered ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-alt)]'}`} aria-label={t('tx.filter')}><ListFilter size={16} />{isFiltered && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-[var(--color-primary-contrast)]">{activeChips.length}</span>}</button>
          </div>
        )}
      </div>

      {!preview && isFiltered && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {activeChips.map((chip) => <button key={chip.key} onClick={() => clearChip(chip.key)} className="flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] py-1 pl-3 pr-1.5 text-[11px] font-medium text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)]/20">{chip.label}<span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/60"><X size={10} /></span></button>)}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="py-10 text-center text-sm text-[var(--color-muted)]">{isFiltered ? t('tx.emptyFiltered') : t('tx.empty')}</p>
      ) : (
        /* PERBAIKAN BUG: max-h dan overflow-y-auto dihapus agar menu bisa melayang bebas tanpa terpotong batas kontainer */
        <div className="flex flex-col gap-1">
          {sorted.map((tx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const Icon = cat?.icon ? CATEGORY_ICONS[cat.icon] : undefined;
            const dateObj = new Date(tx.date + 'T00:00:00');
            const categoryLabel = cat && !cat.system ? cat.name : (tx.type === 'income' ? t('categories.income') : t('categories.expense'));
            return (
              <div key={tx.id} className="group flex items-center gap-2.5 rounded-xl px-1.5 py-2.5 transition hover:bg-[var(--color-surface-alt)] sm:gap-3 sm:px-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9" style={{ backgroundColor: `${cat?.color ?? '#999'}20`, color: cat?.color ?? '#999' }}>{Icon ? <Icon size={14} /> : null}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-[var(--color-ink)] sm:text-sm">{tx.description}</p>
                  <p className="truncate text-[11px] text-[var(--color-muted)] sm:text-xs">{categoryLabel} · {dateObj.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                </div>
                <p className={`shrink-0 text-right text-[13px] font-semibold sm:text-sm ${tx.type === 'income' ? 'text-[var(--color-primary)]' : 'text-[var(--color-ink)]'}`}>{tx.type === 'income' ? '+' : '−'}{formatMoney(toDisplay(tx.amount), currency)}</p>
                <div className="relative shrink-0">
                  <button onClick={() => setMenuOpenId(menuOpenId === tx.id ? null : tx.id)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)] ${menuOpenId === tx.id ? 'bg-[var(--color-surface-alt)] text-[var(--color-ink)]' : 'sm:opacity-0 sm:group-hover:opacity-100'}`} aria-label={t('tx.menu')}><MoreVertical size={15} /></button>
                  {menuOpenId === tx.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                      <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-flat)]">
                        <button onClick={() => { setEditingTx(tx); setMenuOpenId(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]"><Pencil size={13} /> {t('common.edit')}</button>
                        <button onClick={() => { deleteTransaction(tx.id); setMenuOpenId(null); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[var(--color-warn)] transition hover:bg-[var(--color-warn-soft)]"><Trash2 size={13} /> {t('common.delete')}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TransactionFilterModal open={filterModalOpen} onClose={() => setFilterModalOpen(false)} filters={filters} onChange={setFilters} />
      <AddTransactionModal open={!!editingTx} onClose={() => setEditingTx(null)} editing={editingTx} />
      <ConfirmModal open={confirmClearOpen} onClose={() => setConfirmClearOpen(false)} onConfirm={clearAllTransactions} title={t('tx.clearAllTitle')} description={t('tx.clearAllDesc')} confirmLabel={t('tx.clearAllConfirm')} />
    </div>
  );
}
