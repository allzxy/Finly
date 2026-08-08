import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Category, Transaction, Wallet } from '../lib/types';
import { CURRENCIES, BASE_CURRENCY_CODE, convertAmount } from '../lib/currencies';
import { useLiveRates, type LiveRatesState } from '../lib/useLiveRates';
import { useLanguage } from './LanguageContext';
import { DEFAULT_CATEGORIES } from '../lib/seed';

interface FinanceState {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currencyCode: string;
  selectedMonth: string;
}

interface FinanceContextValue extends FinanceState {
  currency: typeof CURRENCIES[number];
  toDisplay: (amount: number) => number;
  setCurrencyCode: (code: string) => void;
  setSelectedMonth: (month: string) => void;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, patch: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  clearAllTransactions: () => void;
  addWallet: (w: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, patch: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  topUpWallet: (walletId: string, amount: number, date: string, note?: string) => void;
  transferBetweenWallets: (fromWalletId: string, toWalletId: string, amount: number, date: string, note?: string) => void;
  addToSavings: (savingsWalletId: string, targetWalletId: string, amount: number, date: string, note?: string) => void;
  addCategory: (c: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id' | 'type'>>) => void;
  deleteCategory: (id: string) => void;
  availableMonths: string[];
  fromDisplay: (amount: number) => number;
  liveRates: LiveRatesState;
}

const STORAGE_KEY = 'cakumu-data-empty-v1';

function loadInitial(): FinanceState {
  const initialCategories = DEFAULT_CATEGORIES;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        let categories: Category[] = parsed.categories ?? initialCategories;
        
        // Memulihkan kategori standar jika data lokal sebelumnya hanya berisi kategori sistem
        const hasNonSystem = categories.some((c) => !c.system);
        if (!hasNonSystem) {
          const nonSystemDefaults = DEFAULT_CATEGORIES.filter((c) => !c.system);
          categories = [...nonSystemDefaults, ...categories];
        }

        // Membersihkan transaksi pengeluaran yang secara tidak sengaja ter-assign ke kategori 'c-topup-in' (Isi Saldo)
        const fallbackExpenseCat = categories.find((c) => c.type === 'expense' && !c.system)?.id ?? 'c-shopping';
        const transactions: Transaction[] = (parsed.transactions ?? []).map((tr: Transaction) => {
          if (tr.type === 'expense' && tr.categoryId === 'c-topup-in' && !tr.linkedWalletId) {
            return { ...tr, categoryId: fallbackExpenseCat };
          }
          return tr;
        });

        return {
          wallets: parsed.wallets ?? [],
          categories,
          transactions,
          currencyCode: parsed.currencyCode ?? 'IDR',
          selectedMonth: currentMonthKey(),
        };
      }
    } catch {}
  }
  return {
    wallets: [],
    categories: initialCategories,
    transactions: [],
    currencyCode: 'IDR',
    selectedMonth: currentMonthKey(),
  };
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(loadInitial);
  const { t } = useLanguage();

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          wallets: state.wallets,
          categories: state.categories,
          transactions: state.transactions,
          currencyCode: state.currencyCode,
          selectedMonth: state.selectedMonth,
        })
      );
    } catch {}
  }, [state.wallets, state.categories, state.transactions, state.currencyCode, state.selectedMonth]);

  const liveRates = useLiveRates();

  const currency = useMemo(() => CURRENCIES.find((c) => c.code === state.currencyCode) ?? CURRENCIES[0], [state.currencyCode]);

  const toDisplay = useCallback(
    (amount: number) => convertAmount(amount, BASE_CURRENCY_CODE, state.currencyCode, liveRates.rates),
    [state.currencyCode, liveRates.rates]
  );

  const fromDisplay = useCallback(
    (amount: number) => convertAmount(amount, state.currencyCode, BASE_CURRENCY_CODE, liveRates.rates),
    [state.currencyCode, liveRates.rates]
  );

  const setCurrencyCode = useCallback((code: string) => {
    setState((s) => ({ ...s, currencyCode: code }));
  }, []);

  const setSelectedMonth = useCallback((month: string) => {
    setState((s) => ({ ...s, selectedMonth: month }));
  }, []);

  const addTransaction = useCallback((tTx: Omit<Transaction, 'id'>) => {
    setState((s) => {
      const tx: Transaction = { ...tTx, id: uid('t') };
      const wallets = s.wallets.map((w) =>
        w.id === tx.walletId
          ? { ...w, balance: w.balance + (tx.type === 'income' ? tx.amount : -tx.amount) }
          : w
      );
      const txMonth = tx.date.slice(0, 7);
      return { ...s, transactions: [tx, ...s.transactions], wallets, selectedMonth: txMonth };
    });
  }, []);

  const updateTransaction = useCallback((id: string, patch: Omit<Transaction, 'id'>) => {
    setState((s) => {
      const old = s.transactions.find((tr) => tr.id === id);
      if (!old) return s;

      let wallets = s.wallets.map((w) => {
        let bal = w.balance;
        
        // 1. Kembalikan efek transaksi lama HANYA pada dompet utama
        if (w.id === old.walletId) {
          bal -= (old.type === 'income' ? old.amount : -old.amount);
        }

        // 2. Terapkan efek transaksi baru HANYA pada dompet utama
        if (w.id === patch.walletId) {
          bal += (patch.type === 'income' ? patch.amount : -patch.amount);
        }

        return { ...w, balance: bal };
      });

      const transactions = s.transactions.map((tr) => (tr.id === id ? { ...old, ...patch, id } : tr));
      return { ...s, transactions, wallets };
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setState((s) => {
      const tx = s.transactions.find((tr) => tr.id === id);
      if (!tx) return s;
      
      const wallets = s.wallets.map((w) => {
        let bal = w.balance;
        
        // Kurangi saldo HANYA di dompet tempat transaksi berada
        if (w.id === tx.walletId) {
          bal -= (tx.type === 'income' ? tx.amount : -tx.amount);
        }
        
        return { ...w, balance: bal };
      });

      return { ...s, transactions: s.transactions.filter((tr) => tr.id !== id), wallets };
    });
  }, []);

  const clearAllTransactions = useCallback(() => {
    setState((s) => {
      const wallets = s.wallets.map((w) => {
        const delta = s.transactions
          .filter((tr) => tr.walletId === w.id)
          .reduce((sum, tr) => sum + (tr.type === 'income' ? tr.amount : -tr.amount), 0);

        return { ...w, balance: w.balance - delta };
      });
      return { ...s, transactions: [], wallets };
    });
  }, []);

  const addWallet = useCallback((w: Omit<Wallet, 'id'>) => {
    setState((s) => ({ ...s, wallets: [...s.wallets, { ...w, id: uid('w') }] }));
  }, []);

  const updateWallet = useCallback((id: string, patch: Partial<Wallet>) => {
    setState((s) => ({ ...s, wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  }, []);

  const deleteWallet = useCallback((id: string) => {
    setState((s) => ({ ...s, wallets: s.wallets.filter((w) => w.id !== id) }));
  }, []);

  const topUpWallet = useCallback((walletId: string, amount: number, date: string, note?: string) => {
    if (amount <= 0) return;
    setState((s) => {
      const topupCategory = s.categories.find((c) => c.id === 'c-topup-in')?.id ?? s.categories.find((c) => c.type === 'income')?.id ?? '';
      const tx: Transaction = {
        id: uid('t'),
        date,
        description: note?.trim() || t('tx.defaultTopup'),
        categoryId: topupCategory,
        walletId,
        type: 'income',
        amount,
      };
      const wallets = s.wallets.map((w) => (w.id === walletId ? { ...w, balance: w.balance + amount } : w));
      const txMonth = date.slice(0, 7);
      return { ...s, transactions: [tx, ...s.transactions], wallets, selectedMonth: txMonth };
    });
  }, [t]);

  const transferBetweenWallets = useCallback(
    (fromWalletId: string, toWalletId: string, amount: number, date: string, note?: string) => {
      if (amount <= 0 || fromWalletId === toWalletId) return;
      setState((s) => {
        const fromWallet = s.wallets.find((w) => w.id === fromWalletId);
        const toWallet = s.wallets.find((w) => w.id === toWalletId);
        if (!fromWallet || !toWallet) return s;

        const outCategory = s.categories.find((c) => c.id === 'c-topup-out')?.id ?? s.categories.find((c) => c.type === 'expense')?.id ?? '';
        const inCategory = s.categories.find((c) => c.id === 'c-topup-in')?.id ?? s.categories.find((c) => c.type === 'income')?.id ?? '';
        const label = note?.trim() || t('tx.defaultTransferOut', { name: toWallet.name });
        const labelIn = note?.trim() || t('tx.defaultTransferIn', { name: fromWallet.name });

        const outTx: Transaction = {
          id: uid('t'),
          date,
          description: label,
          categoryId: outCategory,
          walletId: fromWalletId,
          type: 'expense',
          amount,
        };
        const inTx: Transaction = {
          id: uid('t'),
          date,
          description: labelIn,
          categoryId: inCategory,
          walletId: toWalletId,
          type: 'income',
          amount,
        };

        const wallets = s.wallets.map((w) => {
          if (w.id === fromWalletId) return { ...w, balance: w.balance - amount };
          if (w.id === toWalletId) return { ...w, balance: w.balance + amount };
          return w;
        });
        const txMonth = date.slice(0, 7);

        return { ...s, transactions: [inTx, outTx, ...s.transactions], wallets, selectedMonth: txMonth };
      });
    },
    [t]
  );

  const addToSavings = useCallback(
    (savingsWalletId: string, targetWalletId: string, amount: number, date: string, note?: string) => {
      if (amount <= 0 || !targetWalletId) return;
      setState((s) => {
        const savingsWallet = s.wallets.find((w) => w.id === savingsWalletId);
        const targetWallet = s.wallets.find((w) => w.id === targetWalletId);
        if (!savingsWallet || !targetWallet) return s;

        const category = s.categories.find((c) => c.id === 'c-topup-in')?.id ?? s.categories.find((c) => c.type === 'income')?.id ?? '';
        const tx: Transaction = {
          id: uid('t'),
          date,
          description: note?.trim() || t('tx.defaultSavings', { name: savingsWallet.name, target: targetWallet.name }),
          categoryId: category,
          
          // PERBAIKAN: Transaksi ini HANYA dicatat ke riwayat dompet tabungan
          // agar tidak terdeteksi sebagai "Pemasukan" pada dompet nyata di dasbor.
          walletId: savingsWalletId, 
          type: 'income',
          amount,
          
          // Menyimpan jejak bahwa tabungan ini terikat dengan dompet nyata
          linkedWalletId: targetWalletId, 
        };

        const wallets = s.wallets.map((w) => {
          // PERBAIKAN: Saldo hanya bertambah di dompet tabungan. 
          // Saldo dompet nyata dibiarkan (tidak ikut ditambah) agar tidak double counting.
          if (w.id === savingsWalletId) return { ...w, balance: w.balance + amount, linkedWalletId: targetWalletId };
          return w;
        });
        const txMonth = date.slice(0, 7);

        return { ...s, transactions: [tx, ...s.transactions], wallets, selectedMonth: txMonth };
      });
    },
    [t]
  );

  const addCategory = useCallback((c: Omit<Category, 'id'>) => {
    setState((s) => ({ ...s, categories: [...s.categories, { ...c, id: uid('c') }] }));
  }, []);

  const updateCategory = useCallback((id: string, patch: Partial<Omit<Category, 'id' | 'type'>>) => {
    setState((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setState((s) => {
      const fallback = s.categories.find((c) => c.id !== id);
      if (!fallback) return s;
      return {
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        transactions: s.transactions.map((tr) =>
          tr.categoryId === id ? { ...tr, categoryId: fallback.id } : tr
        ),
      };
    });
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    state.transactions.forEach((tr) => set.add(tr.date.slice(0, 7)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [state.transactions]);

  const value: FinanceContextValue = {
    ...state,
    currency,
    toDisplay,
    fromDisplay,
    setCurrencyCode,
    setSelectedMonth,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    clearAllTransactions,
    addWallet,
    updateWallet,
    deleteWallet,
    topUpWallet,
    transferBetweenWallets,
    addToSavings,
    addCategory,
    updateCategory,
    deleteCategory,
    availableMonths,
    liveRates,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}