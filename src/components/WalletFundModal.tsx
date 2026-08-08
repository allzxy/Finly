import { useEffect, useState } from 'react';
import Modal from './Modal';
import SelectField from './SelectField';
import DateField from './DateField';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { WALLET_ICONS } from '../lib/icons';
import type { Wallet } from '../lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}

export default function WalletFundModal({ open, onClose, wallet }: Props) {
  const { wallets, currency, fromDisplay, topUpWallet, transferBetweenWallets, addToSavings } = useFinance();
  const { t } = useLanguage();
  const isSavings = wallet?.type === 'savings';

  const realWallets = wallets.filter((w) => w.type !== 'savings' && w.id !== wallet?.id);
  const otherWallets = wallets.filter((w) => w.id !== wallet?.id);

  const [source, setSource] = useState<'external' | string>('external');
  const [targetWalletId, setTargetWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().slice(0, 10));
    setSource('external');
    
    const defaultTarget = wallet?.linkedWalletId ?? wallets.find(w => w.type !== 'savings' && w.id !== wallet?.id)?.id ?? '';
    setTargetWalletId(defaultTarget);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, wallet?.id]); 

  if (!wallet) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return;
    const baseAmount = fromDisplay(parsed);

    if (isSavings) {
      if (!targetWalletId) return;
      addToSavings(wallet.id, targetWalletId, baseAmount, date, note.trim() || undefined);
    } else if (source === 'external') {
      topUpWallet(wallet.id, baseAmount, date, note.trim() || undefined);
    } else {
      transferBetweenWallets(source, wallet.id, baseAmount, date, note.trim() || undefined);
    }
    onClose();
  };

  // FUNGSI PEMBERSIH INPUT (Ubah koma jadi titik, hapus huruf/minus)
  const handleAmountChange = (val: string) => {
    const s = val.replace(/,/g, '.').replace(/[^\d.]/g, '');
    const p = s.split('.');
    setAmount(p.length > 2 ? p[0] + '.' + p.slice(1).join('') : s);
  };

  const sourceOptions = [
    { value: 'external', label: t('walletFund.external'), badge: '+' },
    ...otherWallets.map((w) => ({
      value: w.id,
      label: w.name,
      icon: WALLET_ICONS[w.type],
      color: w.color,
    })),
  ];

  const targetOptions = realWallets.map((w) => ({
    value: w.id,
    label: w.name,
    icon: WALLET_ICONS[w.type],
    color: w.color,
  }));

  return (
    <Modal open={open} onClose={onClose} title={isSavings ? t('walletFund.savingsTitle') : t('walletFund.topUpTitle')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {isSavings ? (
          <>
            <div className="rounded-xl bg-[var(--color-surface-alt)] px-3.5 py-2.5 text-xs text-[var(--color-ink-soft)]">
              {t('walletFund.savingsNote', { name: `<span class="font-semibold text-[var(--color-ink)]">${wallet.name}</span>` }).split('<span').map((part, i) => {
                 if (i === 0) return part;
                 const text = part.substring(part.indexOf('>') + 1, part.indexOf('</span'));
                 const after = part.substring(part.indexOf('</span') + 7);
                 return <span key={i}><span className="font-semibold text-[var(--color-ink)]">{text}</span>{after}</span>;
              })}
            </div>

            {targetOptions.length === 0 ? (
              <p className="rounded-xl bg-[var(--color-warn-soft)] px-3.5 py-2.5 text-xs text-[var(--color-warn)]">
                {t('walletFund.needRealWallet')}
              </p>
            ) : (
              <SelectField label={t('walletFund.storeAt')} modalTitle={t('walletFund.storeAt')} nested value={targetWalletId} onChange={setTargetWalletId} options={targetOptions} />
            )}
          </>
        ) : (
          <>
            <div className="rounded-xl bg-[var(--color-surface-alt)] px-3.5 py-2.5 text-xs text-[var(--color-ink-soft)]">
              {t('walletFund.topUpNote', { name: `<span class="font-semibold text-[var(--color-ink)]">${wallet.name}</span>` }).split('<span').map((part, i) => {
                 if (i === 0) return part;
                 const text = part.substring(part.indexOf('>') + 1, part.indexOf('</span'));
                 const after = part.substring(part.indexOf('</span') + 7);
                 return <span key={i}><span className="font-semibold text-[var(--color-ink)]">{text}</span>{after}</span>;
              })}
            </div>

            <SelectField label={t('walletFund.source')} modalTitle={t('walletFund.source')} nested value={source} onChange={setSource} options={sourceOptions} />
          </>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('walletFund.amount')} ({currency.symbol})</label>
          <input 
            type="text" 
            inputMode="decimal"
            value={amount} 
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="0.00" 
            required 
            autoFocus 
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]" 
          />
        </div>

        <DateField value={date} onChange={setDate} nested />

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{t('walletFund.note')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={isSavings ? t('walletFund.notePlaceholderSavings') : t('walletFund.notePlaceholderTopup')} className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]" />
        </div>

        {isSavings ? (
          targetWalletId && (
            <p className="text-[11px] text-[var(--color-muted)]">
              {t('walletFund.willIncrease', { name: wallets.find((w) => w.id === targetWalletId)?.name ?? '' })}
            </p>
          )
        ) : (
          source !== 'external' && (
            <p className="text-[11px] text-[var(--color-muted)]">
              {t('walletFund.willDecrease', { name: wallets.find((w) => w.id === source)?.name ?? '' })}
            </p>
          )
        )}

        <button type="submit" disabled={isSavings && targetOptions.length === 0} className="mt-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)] disabled:opacity-50">
          {isSavings ? t('walletFund.saveSavings') : t('walletFund.saveTopup')}
        </button>
      </form>
    </Modal>
  );
}