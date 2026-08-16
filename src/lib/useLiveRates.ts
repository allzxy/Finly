import { useCallback, useEffect, useState } from 'react';
import { fetchLiveRates, getInitialRates, isCacheFresh, type RatesSnapshot } from './exchangeRates';

export interface LiveRatesState {
  rates: Record<string, number>;
  isLive: boolean;
  sourceDate: string | null;
  fetchedAt: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  refresh: () => Promise<void>;
}

/** Provides real-world exchange rates, auto-updated in background when online, with graceful offline fallback. */
export function useLiveRates(): LiveRatesState {
  const [snapshot, setSnapshot] = useState<RatesSnapshot>(getInitialRates);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    // Only attempt background fetch if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    if (!silent) setStatus('loading');
    setError(null);
    try {
      const fresh = await fetchLiveRates();
      setSnapshot(fresh);
      setStatus('success');
    } catch (err) {
      if (!silent) setStatus('error');
      setError((err as Error).message || 'Gagal memuat kurs terbaru.');
    }
  }, []);

  useEffect(() => {
    const cached = getInitialRates();
    setSnapshot(cached);

    // If online, immediately refresh rates in the background to ensure latest rates
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      void refresh(!isCacheFresh(cached));
    }

    // Auto update when browser/device reconnects to internet
    const handleOnline = () => {
      void refresh(false);
    };

    // Auto update when tab gains focus or becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && typeof navigator !== 'undefined' && navigator.onLine) {
        void refresh(true);
      }
    };

    const handleFocus = () => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void refresh(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic auto-update every 15 minutes when online
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void refresh(true);
      }
    }, 15 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [refresh]);

  return {
    rates: snapshot.rates,
    isLive: snapshot.isLive,
    sourceDate: snapshot.sourceDate,
    fetchedAt: snapshot.fetchedAt,
    status,
    error,
    refresh: () => refresh(false),
  };
}
