import { MoreVertical, Trash2, Pencil, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import type { Wallet } from '../lib/types';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatMoney } from '../lib/currencies';
import { WALLET_ICONS } from '../lib/icons';

interface Props {
  wallet: Wallet;
  wallets: Wallet[];
  onDelete: (id: string) => void;
  onEdit: (wallet: Wallet) => void;
  onFund: (wallet: Wallet) => void;
}

export default function WalletCard({ wallet, wallets, onDelete, onEdit, onFund }: Props) {
  const { currency, toDisplay } = useFinance();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = WALLET_ICONS[wallet.type];
  const progress = wallet.goalAmount ? Math.min(100, (wallet.balance / wallet.goalAmount) * 100) : null;
  const linkedWallet = wallet.type === 'savings' && wallet.linkedWalletId ? wallets.find((w) => w.id === wallet.linkedWalletId) : undefined;

  return (
    <div className="animate-rise relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11"
            style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
          >
            <Icon size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{wallet.name}</p>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {t(`wallets.type.${wallet.type}` as Parameters<typeof t>[0])}{wallet.institution ? ` · ${wallet.institution}` : ''}
            </p>
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--color-muted)] transition hover:bg-[var(--color-surface-alt)]" aria-label={t('wallets.menu')}>
            <MoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-flat)]">
                <button onClick={() => { onEdit(wallet); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[var(--color-ink-soft)] transition hover:bg-[var(--color-surface-alt)]">
                  <Pencil size={13} /> {t('common.edit')}
                </button>
                <button onClick={() => { onDelete(wallet.id); setMenuOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-[var(--color-warn)] transition hover:bg-[var(--color-warn-soft)]">
                  <Trash2 size={13} /> {t('common.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="font-bold tracking-tight mt-4 truncate text-xl text-[var(--color-ink)] sm:mt-5 sm:text-2xl">{formatMoney(toDisplay(wallet.balance), currency)}</p>

      {progress !== null && wallet.type === 'savings' ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)]">
            <span>{t('wallets.goalProgress')}</span>
            <span>{formatMoney(toDisplay(wallet.goalAmount ?? 0), currency, { compact: true })}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%`, backgroundColor: wallet.color }} />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-[var(--color-muted)] font-medium">
              {wallet.goalAmount && wallet.goalAmount > wallet.balance
                ? `Sisa ${formatMoney(toDisplay(wallet.goalAmount - wallet.balance), currency, { compact: true })} lagi (${(((wallet.goalAmount - wallet.balance) / wallet.goalAmount) * 100).toFixed(0)}%)`
                : 'Target Terkumpul! 🎉'}
            </span>
            <span className="font-semibold shrink-0 ml-1" style={{ color: wallet.color }}>
              {progress.toFixed(0)}%
            </span>
          </div>
        </div>
      ) : progress !== null ? (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)]">
            <span>{t('wallets.goalProgress')}</span>
            <span>{formatMoney(toDisplay(wallet.goalAmount ?? 0), currency, { compact: true })}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-alt)]">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%`, backgroundColor: wallet.color }} />
          </div>
          <p className="mt-1 text-right text-[11px] font-medium" style={{ color: wallet.color }}>
            {t('wallets.reached', { pct: progress.toFixed(0) })}
          </p>
        </div>
      ) : null}

      {linkedWallet && (
        <p className="mt-2 truncate text-[11px] text-[var(--color-muted)]">
          {t('wallets.savedAt')} <span className="font-medium text-[var(--color-ink-soft)]">{linkedWallet.name}</span>
        </p>
      )}

      <button onClick={() => onFund(wallet)} className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border)] py-2 text-xs font-semibold text-[var(--color-ink-soft)] transition hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]">
        <PlusCircle size={13} /> {wallet.type === 'savings' ? t('wallets.addSavings') : t('wallets.topUp')}
      </button>
    </div>
  );
}