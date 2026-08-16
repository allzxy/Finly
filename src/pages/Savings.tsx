import { lazy, Suspense, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import WalletCard from '../components/WalletCard';
import Topbar from '../components/Topbar';
import { formatMoney } from '../lib/currencies';
import { Plus } from 'lucide-react';
import type { Wallet } from '../lib/types';

const WalletFormModal = lazy(() => import('../components/WalletFormModal'));
const WalletFundModal = lazy(() => import('../components/WalletFundModal'));
const ConfirmModal = lazy(() => import('../components/ConfirmModal'));

export default function Savings() {
  const { wallets, currency, deleteWallet, toDisplay } = useFinance();
  const { t } = useLanguage();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [funding, setFunding] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);

  // Hanya ambil dompet tabungan (savings)
  const savingsWallets = wallets.filter((w) => w.type === 'savings');
  const totalSaved = toDisplay(savingsWallets.reduce((s, w) => s + w.balance, 0));

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
        title={t('savings.title')}
        subtitle={t('savings.subtitle')}
      />

      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-flat)] sm:flex-row sm:items-center sm:p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">{t('savings.totalSaved')}</p>
          <p className="font-bold tracking-tight mt-1 truncate text-2xl text-[var(--color-ink)] sm:text-3xl">{formatMoney(totalSaved, currency)}</p>
          <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{t('wallets.inCurrency', { currency: currency.label })}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)]"
        >
          <Plus size={15} /> {t('savings.new')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 sm:gap-4">
        {savingsWallets.map((w) => (
          <WalletCard key={w.id} wallet={w} wallets={wallets} onDelete={() => setDeleting(w)} onEdit={openEdit} onFund={setFunding} />
        ))}
      </div>

      <Suspense fallback={null}>
        {formOpen && (
          <WalletFormModal open={formOpen} onClose={() => setFormOpen(false)} editing={editing} mode="savings" />
        )}
        {funding && (
          <WalletFundModal open={!!funding} onClose={() => setFunding(null)} wallet={funding} />
        )}
        {deleting && (
          <ConfirmModal
            open={!!deleting}
            onClose={() => setDeleting(null)}
            onConfirm={() => deleting && deleteWallet(deleting.id)}
            title={t('wallets.delete')}
            description={t('wallets.deleteDesc', { name: deleting?.name ?? '' })}
            confirmLabel={t('common.delete')}
          />
        )}
      </Suspense>
    </div>
  );
}