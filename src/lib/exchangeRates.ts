// Fetches exchange rates from Mid-Market providers (similar to Google).
// Uses a primary API with a CDN-based fallback so the app is extremely robust
// and keeps working even if one service goes down.

import { EXCHANGE_RATES, BASE_CURRENCY_CODE } from './currencies';

// Kita ubah nama cache agar sistem otomatis mereset data lama pengguna
const CACHE_KEY = 'finly-exchange-rates-v2';
const CACHE_TTL_MS = 60 * 60 * 1000; // Cek pembaruan setiap 1 jam

export interface RatesSnapshot {
  base: string;
  rates: Record<string, number>;
  fetchedAt: string; // Kapan aplikasi kita menarik data ini
  sourceDate: string | null; // Kapan penyedia data merilis kurs ini
  isLive: boolean;
}

function staticSnapshot(): RatesSnapshot {
  return {
    base: BASE_CURRENCY_CODE,
    rates: { ...EXCHANGE_RATES },
    fetchedAt: new Date().toISOString(),
    sourceDate: null,
    isLive: false,
  };
}

function loadCached(): RatesSnapshot | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RatesSnapshot;
    if (!parsed.rates || !parsed.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(snapshot: RatesSnapshot) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Abaikan jika browser penuh (incognito/private mode)
  }
}

export function isCacheFresh(snapshot: RatesSnapshot | null): boolean {
  if (!snapshot) return false;
  const age = Date.now() - new Date(snapshot.fetchedAt).getTime();
  return age < CACHE_TTL_MS;
}

/** Mengembalikan kurs cache secara instan (atau fallback statis jika belum ada). */
export function getInitialRates(): RatesSnapshot {
  return loadCached() ?? staticSnapshot();
}

/** 
 * Menarik kurs terbaru dari internet.
 * Menggunakan teknik fallback: Coba API 1, jika gagal otomatis ke API 2.
 */
export async function fetchLiveRates(): Promise<RatesSnapshot> {
  try {
    // API UTAMA: Open ExchangeRate-API (Akurat, Mid-Market Rate mirip Google)
    const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY_CODE}`);
    if (!res.ok) throw new Error('API Utama Gagal');
    
    const data = await res.json();
    if (data.result !== 'success' || !data.rates) throw new Error('Format data API utama tidak dikenali');

    const snapshot: RatesSnapshot = {
      base: BASE_CURRENCY_CODE,
      rates: data.rates,
      fetchedAt: new Date().toISOString(),
      sourceDate: data.time_last_update_utc ?? null,
      isLive: true,
    };
    saveCache(snapshot);
    return snapshot;

  } catch {
    // API CADANGAN: Fawaz Ahmed Currency API (Update stabil via jsDelivr CDN)
    try {
      const fallbackRes = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY_CODE.toLowerCase()}.json`);
      if (!fallbackRes.ok) throw new Error('API Cadangan Gagal');
      
      const fallbackData = await fallbackRes.json();
      const ratesKey = BASE_CURRENCY_CODE.toLowerCase();
      
      if (!fallbackData[ratesKey]) throw new Error('Format data API cadangan tidak dikenali');

      // API cadangan ini menggunakan huruf kecil (idr, eur), kita ubah ke huruf kapital (IDR, EUR)
      const rawRates = fallbackData[ratesKey];
      const upperRates: Record<string, number> = {};
      for (const key in rawRates) {
        upperRates[key.toUpperCase()] = rawRates[key];
      }

      const snapshot: RatesSnapshot = {
        base: BASE_CURRENCY_CODE,
        rates: upperRates,
        fetchedAt: new Date().toISOString(),
        sourceDate: fallbackData.date ?? null,
        isLive: true,
      };
      saveCache(snapshot);
      return snapshot;

    } catch {
      throw new Error('Semua layanan penyedia kurs sedang tidak dapat diakses saat ini. Menggunakan kurs referensi offline.');
    }
  }
}