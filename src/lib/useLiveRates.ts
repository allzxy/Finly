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

  const refresh = useCallback(async () => {
    // Only attempt background fetch if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    setStatus('loading');
    setError(null);
    try {
      const fresh = await fetchLiveRates();
      setSnapshot(fresh);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError((err as Error).message || 'Gagal memuat kurs terbaru.');
    }
  }, []);

  useEffect(() => {
    const cached = getInitialRates();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      if (!isCacheFresh(cached)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void refresh();
      } else {
        setSnapshot(cached);
        setStatus('success');
      }
    } else {
      setSnapshot(cached);
      setStatus('success');
    }

    // Auto update when browser/device connects to internet
    const handleOnline = () => {
      void refresh();
    };

    window.addEventListener('online', handleOnline);
    const interval = setInterval(() => {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        void refresh();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      window.removeEventListener('online', handleOnline);
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
    refresh,
  };
}
