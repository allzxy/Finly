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

/** Provides real-world exchange rates, auto-refreshed hourly, with graceful offline fallback. */
export function useLiveRates(): LiveRatesState {
  const [snapshot, setSnapshot] = useState<RatesSnapshot>(getInitialRates);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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
    if (!isCacheFresh(cached)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refresh();
    } else {
      setSnapshot(cached);
      setStatus('success');
    }

    const interval = setInterval(refresh, 60 * 60 * 1000); // hourly
    return () => clearInterval(interval);
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
