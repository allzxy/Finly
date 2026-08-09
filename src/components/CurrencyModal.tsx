import Modal from './Modal';
import { useFinance } from '../context/FinanceContext';
import { CURRENCIES } from '../lib/currencies';
import { Check, RefreshCw, Radio, WifiOff } from 'lucide-react';

export default function CurrencyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currencyCode, setCurrencyCode, liveRates } = useFinance();

  const fetchedTime = new Date(liveRates.fetchedAt).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal open={open} onClose={onClose} title="Mata Uang">
      <div className="flex flex-col gap-5">
        <div
          className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs ${
            liveRates.isLive
              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
              : 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]'
          }`}
        >
          {liveRates.status === 'loading' ? (
            <RefreshCw size={13} className="shrink-0 animate-spin" />
          ) : liveRates.isLive ? (
            <Radio size={13} className="shrink-0" />
          ) : (
            <WifiOff size={13} className="shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">
            {liveRates.status === 'loading'
              ? 'Memuat kurs real-time…'
              : liveRates.isLive
              ? `Kurs real-time · diperbarui ${fetchedTime}`
              : 'Kurs referensi offline (belum tersambung internet)'}
          </span>
          <button
            type="button"
            onClick={() => liveRates.refresh()}
            disabled={liveRates.status === 'loading'}
            className="shrink-0 rounded-full p-1 transition hover:bg-black/5 disabled:opacity-50"
            aria-label="Segarkan kurs"
          >
            <RefreshCw size={13} className={liveRates.status === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">Pilih mata uang tampilan</p>
          <div className="flex flex-col gap-1">
            {CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => setCurrencyCode(c.code)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  currencyCode === c.code
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-alt)]'
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-alt)] text-sm font-semibold">
                  {c.symbol}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{c.code}</span>
                  <span className="block truncate text-xs text-[var(--color-muted)]">{c.label}</span>
                </span>
                {currencyCode === c.code && <Check size={16} className="shrink-0 text-[var(--color-primary)]" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
