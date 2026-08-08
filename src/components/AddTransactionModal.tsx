import { useEffect, useState } from 'react';
import Modal from './Modal';
import DateField from './DateField';
import SelectField from './SelectField';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORY_ICONS, WALLET_ICONS } from '../lib/icons';
import type { Transaction, TransactionType } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Transaction | null;
}

export default function AddTransactionModal({ open, onClose, editing }: Props) {
  const { categories, wallets, currency, addTransaction, updateTransaction, fromDisplay, toDisplay } = useFinance();
  const { t } = useLanguage();
  
  // PERBAIKAN 1: Filter dompet untuk menyingkirkan dompet 'savings' (tabungan)
  const activeWallets = wallets.filter((w) => w.type !== 'savings');

  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  // PERBAIKAN 2: Pastikan nilai awal default mengambil dari dompet yang nyata
  const [walletId, setWalletId] = useState(activeWallets[0]?.id ?? '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredCategories = categories.filter((c) => c.type === type && (!c.system || c.id === editing?.categoryId));
  const isEditing = !!editing;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmount(String(Number(toDisplay(editing.amount).toFixed(2))));
      setCategoryId(editing.categoryId);
      setWalletId(editing.walletId);
      setDate(editing.date);
    } else {
      setType('expense');
      setDescription('');
      setAmount('');
      setCategoryId('');
      // PERBAIKAN 3: Reset juga harus diarahkan ke dompet nyata, bukan tabungan
      setWalletId(activeWallets[0]?.id ?? '');
      setDate(new Date().toISOString().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, toDisplay]); // Menghapus dompet dari dependensi agar tidak memicu render berulang

  const reset = () => {
    setDescription('');
    setAmount('');
    setCategoryId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || !parsedAmount || parsedAmount <= 0 || !walletId) return;
    
    const finalCategory =
      categoryId && categories.some((c) => c.id === categoryId && c.type === type)
        ? categoryId
        : '';

    if (isEditing && editing) {
      updateTransaction(editing.id, {
        date,
        description: description.trim(),
        categoryId: finalCategory,
        walletId,
        type,
        amount: fromDisplay(parsedAmount),
      });
    } else {
      addTransaction({
        date,
        description: description.trim(),
        categoryId: finalCategory,
        walletId,
        type,
        amount: fromDisplay(parsedAmount),
      });
    }
    reset();
    onClose();
  };

  const handleAmountChange = (val: string) => {
    let s = val.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const p = s.split('.');
    setAmount(p.length > 2 ? p[0] + '.' + p.slice(1).join('') : s);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('addTx.titleEdit') : t('addTx.titleAdd')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 text-sm font-medium">
          {(['expense', 'income'] as const).map((txType) => (
            <button
              key={txType}
              type="button"
              onClick={() => {
                setType(txType);
                setCategoryId('');
              }}
              className={`flex-1 rounded-full py-2 transition ${
                type === txType
                  ? txType === 'income'
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm'
                    : 'bg-[var(--color-warn)] text-[var(--color-warn-contrast)] shadow-sm'
                  : 'text-[var(--color-ink-soft)]'
              }`}
            >
              {txType === 'income' ? t('addTx.income') : t('addTx.expense')}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('addTx.description')}</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('addTx.descriptionPlaceholder')}
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('addTx.amount')} ({currency.symbol})</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>

        <DateField value={date} onChange={setDate} />

        <SelectField
          label={t('addTx.category')}
          modalTitle={t('filter.category')}
          value={categoryId}
          onChange={setCategoryId}
          placeholder={type === 'income' ? t('categories.income') : t('categories.expense')}
          options={[
            {
              value: '',
              label: type === 'income' ? t('categories.income') : t('categories.expense'),
              color: type === 'income' ? '#1f7a5c' : '#c1704a',
            },
            ...filteredCategories.map((c) => ({
              value: c.id,
              label: c.name,
              icon: CATEGORY_ICONS[c.icon],
              color: c.color,
            })),
          ]}
        />

        <SelectField
          label={t('addTx.wallet')}
          modalTitle={t('addTx.wallet')}
          value={walletId || activeWallets[0]?.id || ''} // Fallback ke dompet nyata
          onChange={setWalletId}
          // PERBAIKAN 4: Render opsi pilihan hanya dari dompet nyata
          options={activeWallets.map((w) => ({
            value: w.id,
            label: w.name,
            icon: WALLET_ICONS[w.type],
            color: w.color,
          }))}
        />

        <button
          type="submit"
          className="mt-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)]"
        >
          {isEditing ? t('common.saveChanges') : t('addTx.save')}
        </button>
      </form>
    </Modal>
  );
}