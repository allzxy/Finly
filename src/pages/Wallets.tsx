import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import WalletCard from '../components/WalletCard';
import WalletFormModal from '../components/WalletFormModal';
import WalletFundModal from '../components/WalletFundModal';
import ConfirmModal from '../components/ConfirmModal';
import Topbar from '../components/Topbar';
import { formatMoney } from '../lib/currencies';
import { Plus } from 'lucide-react';
import type { Wallet } from '../lib/types';

export default function Wallets() {
  const { wallets, currency, deleteWallet, toDisplay } = useFinance();
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [funding, setFunding] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);

  // Hanya ambil dompet asli (bukan tabungan)
  const realWallets = wallets.filter((w) => w.type !== 'savings');
  const totalBalance = toDisplay(realWallets.reduce((s, w) => s + w.balance, 0));

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (w: Wallet) => {
    setEditing(w);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <Topbar
        title={t('wallets.title')}
        subtitle={t('wallets.subtitle')}
      />

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{t('wallets.totalAll')}</p>
          <p className="font-bold tracking-tight mt-1 truncate text-2xl text-[var(--color-ink)] sm:text-3xl">{formatMoney(totalBalance, currency)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{t('wallets.inCurrency', { currency: currency.label })}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)]"
        >
          <Plus size={15} /> {t('wallets.new')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 sm:gap-4">
        {realWallets.map((w) => (
          <WalletCard key={w.id} wallet={w} wallets={wallets} onDelete={() => setDeleting(w)} onEdit={openEdit} onFund={setFunding} />
        ))}
      </div>

      <WalletFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} mode="wallets" />
      <WalletFundModal open={!!funding} onClose={() => setFunding(null)} wallet={funding} />

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteWallet(deleting.id)}
        title={t('wallets.delete')}
        description={t('wallets.deleteDesc', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}