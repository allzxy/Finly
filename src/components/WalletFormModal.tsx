import { useEffect, useState, useMemo } from 'react';
import Modal from './Modal';
import SelectField from './SelectField';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import type { Wallet, WalletType } from '../lib/types';
import { Wallet as WalletIcon, CreditCard, PiggyBank, Smartphone } from 'lucide-react';

const PALETTE = ['#1f7a5c', '#3c6ea5', '#c9a84c', '#8a5fc9', '#c1704a', '#4d8fa6', '#b5523e', '#6a7a4f'];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Wallet | null;
  mode?: 'wallets' | 'savings' | 'all';
}

export default function WalletFormModal({ open, onClose, editing, mode = 'all' }: Props) {
  const { wallets, currency, addWallet, updateWallet, toDisplay, fromDisplay } = useFinance();
  const { t } = useLanguage();
  const isEditing = !!editing;

  // Render opsi berdasarkan halaman ('wallets' menyembunyikan tabungan, 'savings' hanya tabungan)
  const TYPE_OPTIONS = useMemo(() => {
    const options = [
      { value: 'cash' as WalletType, label: t('wallets.type.cash'), icon: WalletIcon },
      { value: 'bank' as WalletType, label: t('wallets.type.bank'), icon: CreditCard },
      { value: 'savings' as WalletType, label: t('wallets.type.savings'), icon: PiggyBank },
      { value: 'digital' as WalletType, label: t('wallets.type.digital'), icon: Smartphone },
    ];
    if (mode === 'wallets') return options.filter((o) => o.value !== 'savings');
    if (mode === 'savings') return options.filter((o) => o.value === 'savings');
    return options;
  }, [t, mode]);

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>(mode === 'savings' ? 'savings' : 'cash');
  const [balance, setBalance] = useState('');
  const [goal, setGoal] = useState('');
  const [institution, setInstitution] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editing.name);
      setType(editing.type);
      setBalance(String(toDisplay(editing.balance)));
      setGoal(editing.goalAmount ? String(toDisplay(editing.goalAmount)) : '');
      setInstitution(editing.institution ?? '');
    } else {
      setName('');
      setType(mode === 'savings' ? 'savings' : 'cash');
      setBalance('');
      setGoal('');
      setInstitution('');
    }
  }, [open, editing, mode, toDisplay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && editing) {
      updateWallet(editing.id, {
        name: name.trim(),
        type,
        goalAmount: type === 'savings' && goal ? fromDisplay(parseFloat(goal)) : undefined,
        institution: institution.trim() || undefined,
      });
    } else {
      addWallet({
        name: name.trim(),
        type,
        balance: fromDisplay(parseFloat(balance) || 0),
        color: PALETTE[wallets.length % PALETTE.length],
        goalAmount: type === 'savings' && goal ? fromDisplay(parseFloat(goal)) : undefined,
        institution: institution.trim() || undefined,
      });
    }
    onClose();
  };

  const handleNumberChange = (val: string, setter: (v: string) => void) => {
    const s = val.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const p = s.split('.');
    setter(p.length > 2 ? p[0] + '.' + p.slice(1).join('') : s);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('wallets.edit') : mode === 'savings' ? t('savings.new') : t('wallets.new')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-1">
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('wallets.name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('wallets.namePlaceholder')}
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Tampilkan Pilihan Tipe hanya jika opsi > 1 */}
        {TYPE_OPTIONS.length > 1 && (
          <SelectField
            label={t('wallets.type')}
            modalTitle={t('wallets.type')}
            nested
            value={type}
            onChange={(v) => setType(v as WalletType)}
            options={TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label, icon: opt.icon }))}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Untuk tabungan baru, jadikan input Jumlah Target Tabungan sebagai yang utama */}
          {type === 'savings' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                {t('wallets.targetAmount')} ({currency.symbol})
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={goal}
                onChange={(e) => handleNumberChange(e.target.value, setGoal)}
                placeholder="0.00"
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
              {type === 'savings' ? t('wallets.collected') : t('wallets.startingBalance')} ({currency.symbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={balance}
              onChange={(e) => handleNumberChange(e.target.value, setBalance)}
              placeholder="0.00"
              disabled={isEditing || type === 'savings'}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)] disabled:opacity-50"
            />
            {isEditing ? (
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">{t('wallets.editHint')}</p>
            ) : type === 'savings' ? (
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">{t('wallets.savingsHint')}</p>
            ) : null}
          </div>

          {type === 'bank' && (
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('wallets.bankName')}</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={t('wallets.bankNamePlaceholder')}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)] active:scale-[0.98]"
        >
          {isEditing ? t('common.saveChanges') : mode === 'savings' ? t('savings.new') : t('wallets.create')}
        </button>
      </form>
    </Modal>
  );
}