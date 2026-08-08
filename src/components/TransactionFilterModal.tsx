import { useMemo } from 'react';
import Modal from './Modal';
import SelectField from './SelectField';
import DateField from './DateField';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORY_ICONS } from '../lib/icons';
import type { TransactionType } from '../lib/types';

export interface TransactionFilters {
  date: string;
  type: 'all' | TransactionType;
  categoryId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: TransactionFilters;
  onChange: (filters: TransactionFilters) => void;
}

export default function TransactionFilterModal({ open, onClose, filters, onChange }: Props) {
  const { categories } = useFinance();
  const { t } = useLanguage();

  const relevantCategories = useMemo(
    () => categories.filter((c) => filters.type === 'all' || c.type === filters.type),
    [categories, filters.type]
  );

  const update = (patch: Partial<TransactionFilters>) => onChange({ ...filters, ...patch });

  const reset = () => onChange({ date: '', type: 'all', categoryId: 'all' });

  const isFiltered = filters.date !== '' || filters.type !== 'all' || filters.categoryId !== 'all';

  return (
    <Modal open={open} onClose={onClose} title={t('filter.title')}>
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('filter.date')}</label>
          <DateField
            value={filters.date}
            onChange={(d) => update({ date: d })}
            placeholder={t('filter.allDates')}
            allowClear
            nested
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">{t('filter.type')}</label>
          <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 text-xs font-medium">
            {(['all', 'income', 'expense'] as const).map((typeOpt) => (
              <button
                key={typeOpt}
                type="button"
                onClick={() => update({ type: typeOpt, categoryId: 'all' })}
                className={`flex-1 rounded-full py-2 transition ${
                  filters.type === typeOpt
                    ? typeOpt === 'income'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm'
                      : typeOpt === 'expense'
                      ? 'bg-[var(--color-warn)] text-[var(--color-warn-contrast)] shadow-sm'
                      : 'bg-[var(--color-neutral)] text-[var(--color-neutral-contrast)] shadow-sm'
                    : 'text-[var(--color-ink-soft)]'
                }`}
              >
                {typeOpt === 'all' ? t('common.all') : typeOpt === 'income' ? t('categories.income') : t('categories.expense')}
              </button>
            ))}
          </div>
        </div>

        <SelectField
          label={t('filter.category')}
          modalTitle={t('filter.category')}
          nested
          value={filters.categoryId}
          onChange={(v) => update({ categoryId: v })}
          options={[
            { value: 'all', label: t('filter.allCategories') },
            ...relevantCategories.map((c) => ({
              value: c.id,
              label: c.name,
              icon: CATEGORY_ICONS[c.icon],
              color: c.color,
            })),
          ]}
        />

        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={!isFiltered}
            className="flex-1 rounded-xl bg-[var(--color-surface-alt)] py-2.5 text-sm font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-border)] disabled:opacity-40"
          >
            {t('filter.reset')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)]"
          >
            {t('filter.apply')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function categoryIconFor(icon?: string) {
  return icon ? CATEGORY_ICONS[icon] : undefined;
}