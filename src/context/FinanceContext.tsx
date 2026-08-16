import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Category, Transaction, TransactionType, Wallet } from '../lib/types';
import { CURRENCIES, BASE_CURRENCY_CODE, convertAmount, EXCHANGE_RATES } from '../lib/currencies';
import { useLiveRates, type LiveRatesState } from '../lib/useLiveRates';
import { useLanguage } from './LanguageContext';
import { DEFAULT_CATEGORIES } from '../lib/seed';
import { getCategoryName } from '../lib/i18n';
import { exportToExcelBuffer, importFromExcelBuffer } from '../lib/excelBackup';

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
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  exportExcelBuffer: () => Uint8Array;
  importExcelBuffer: (buffer: ArrayBuffer) => boolean;
  resetAllData: () => void;
  tCategory: (cat: Category | string | null | undefined, fallbackType?: TransactionType) => string;
}

const STORAGE_KEY = 'finly-data-v1';
const STORAGE_KEYS = [
  'finly-data-v1',
  'cakumu-data-empty-v1',
  'cakumu-data-v1',
  'cakumu-data',
  'cakumu_data',
  'cakumu_storage',
  'cakumu-storage',
];

function sanitizeCategories(categories: Category[]): Category[] {
  let list = Array.isArray(categories) && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const existingIds = new Set(list.map((c) => c && c.id));
  const missingDefaults = DEFAULT_CATEGORIES.filter((c) => !existingIds.has(c.id));
  if (missingDefaults.length > 0) {
    list = [...missingDefaults, ...list];
  }
  return list;
}

function sanitizeTransactions(transactions: Transaction[], categories: Category[]): Transaction[] {
  if (!Array.isArray(transactions)) return [];
  const validCatIds = new Set(categories.map((c) => c && c.id));
  const fallbackExpenseCat = categories.find((c) => c && c.type === 'expense' && !c.system)?.id ?? 'c-shopping';
  const fallbackIncomeCat = categories.find((c) => c && c.type === 'income' && !c.system)?.id ?? 'c-salary';

  return transactions.map((tr) => {
    if (!tr || typeof tr !== 'object') return tr;

    let catId = tr.categoryId;
    if (tr.type === 'expense' && catId === 'c-topup-in' && !tr.linkedWalletId) {
      catId = fallbackExpenseCat;
    }
    if (catId && !validCatIds.has(catId)) {
      catId = tr.type === 'income' ? fallbackIncomeCat : fallbackExpenseCat;
    }
    return { ...tr, categoryId: catId };
  });
}

function reconcileWalletBalances(wallets: Wallet[]): Wallet[] {
  if (!Array.isArray(wallets)) return [];
  return wallets.map((w) => {
    if (!w || typeof w !== 'object') return w;
    const isNaNBal = typeof w.balance !== 'number' || isNaN(w.balance);
    return {
      ...w,
      balance: isNaNBal ? 0 : w.balance,
      goalAmount: typeof w.goalAmount === 'number' ? w.goalAmount : undefined,
    };
  });
}

function loadInitial(): FinanceState {
  const initialCategories = DEFAULT_CATEGORIES;

  if (typeof window !== 'undefined') {
    try {
      let raw: string | null = null;
      for (const key of STORAGE_KEYS) {
        const item = window.localStorage.getItem(key);
        if (item) {
          raw = item;
          break;
        }
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const rawCategories: Category[] = Array.isArray(parsed.categories) ? parsed.categories : initialCategories;
          const categories = sanitizeCategories(rawCategories);

          const rawTx = Array.isArray(parsed.transactions) ? parsed.transactions : [];
          const transactions = sanitizeTransactions(rawTx, categories);

          const rawWallets = Array.isArray(parsed.wallets) ? parsed.wallets : [];
          const wallets = reconcileWalletBalances(rawWallets);

          return {
            wallets,
            categories,
            transactions,
            currencyCode: typeof parsed.currencyCode === 'string' ? parsed.currencyCode : 'IDR',
            selectedMonth: currentMonthKey(),
          };
        }
      }
    } catch {
      /* ignore storage read error */
    }
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
  const { t, locale, language, setLanguage } = useLanguage();

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
    } catch {
      /* ignore quota errors */
    }
  }, [state.wallets, state.categories, state.transactions, state.currencyCode, state.selectedMonth]);

  // Listen for storage changes across browser tabs / PWA windows on the device
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && STORAGE_KEYS.includes(e.key)) {
        setState(loadInitial());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const liveRates = useLiveRates();

  const currency = useMemo(() => CURRENCIES.find((c) => c.code === state.currencyCode) ?? CURRENCIES[0], [state.currencyCode]);

  const toDisplay = useCallback(
    (amount: number) => {
      const useStaticScale = state.currencyCode === 'IDR' || state.currencyCode === BASE_CURRENCY_CODE;
      const ratesToUse = useStaticScale ? EXCHANGE_RATES : liveRates.rates;
      const val = convertAmount(amount, BASE_CURRENCY_CODE, state.currencyCode, ratesToUse);
      const isZeroDecimal = state.currencyCode === 'IDR' || state.currencyCode === 'JPY';
      return isZeroDecimal ? Math.round(val) : Math.round(val * 100) / 100;
    },
    [state.currencyCode, liveRates.rates]
  );

  const fromDisplay = useCallback(
    (amount: number) => convertAmount(amount, state.currencyCode, BASE_CURRENCY_CODE, EXCHANGE_RATES),
    [state.currencyCode]
  );

  const setCurrencyCode = useCallback((code: string) => {
    setState((s) => ({ ...s, currencyCode: code }));
  }, []);

  const setSelectedMonth = useCallback((month: string) => {
    setState((s) => ({ ...s, selectedMonth: month }));
  }, []);

  const addTransaction = useCallback((tTx: Omit<Transaction, 'id'>) => {
    setState((s) => {
      let targetWId = tTx.walletId;
      const validWallet = s.wallets.find((w) => w.id === targetWId && w.type !== 'savings') || s.wallets.find((w) => w.type !== 'savings') || s.wallets[0];
      if (validWallet) {
        targetWId = validWallet.id;
      }
      const tx: Transaction = { ...tTx, walletId: targetWId, id: uid('t') };
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

      const wallets = s.wallets.map((w) => {
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

      // Cari pasangan transfer jika transaksi ini adalah transfer
      let twinId: string | null = null;
      if (tx.linkedWalletId) {
        const twin = s.transactions.find(
          (tr) =>
            tr.id !== id &&
            tr.date === tx.date &&
            tr.amount === tx.amount &&
            tr.walletId === tx.linkedWalletId &&
            tr.linkedWalletId === tx.walletId
        );
        if (twin) twinId = twin.id;
      }
      
      const wallets = s.wallets.map((w) => {
        let bal = w.balance;
        
        if (w.id === tx.walletId) {
          bal -= (tx.type === 'income' ? tx.amount : -tx.amount);
        }
        if (tx.linkedWalletId && w.id === tx.linkedWalletId) {
          bal += (tx.type === 'income' ? tx.amount : -tx.amount);
        }
        
        // Jamin saldo tidak pernah minus (Math.max 0)
        return { ...w, balance: Math.max(0, bal) };
      });

      return { ...s, transactions: s.transactions.filter((tr) => tr.id !== id && tr.id !== twinId), wallets };
    });
  }, []);

  const clearAllTransactions = useCallback(() => {
    setState((s) => {
      // Pertahankan dompet, kategori, dan tabungan, namun reset saldo/nominalnya kembali ke 0
      const wallets = s.wallets.map((w) => ({ ...w, balance: 0 }));
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
    setState((s) => {
      const wallets = s.wallets.filter((w) => w.id !== id);
      const updatedWallets = wallets.map((w) =>
        w.linkedWalletId === id ? { ...w, linkedWalletId: undefined } : w
      );
      // Hapus seluruh transaksi yang terikat dengan dompet/tabungan yang dihapus
      const transactions = s.transactions.filter(
        (tr) => tr.walletId !== id && tr.linkedWalletId !== id
      );
      return { ...s, wallets: updatedWallets, transactions };
    });
  }, []);

  const topUpWallet = useCallback((walletId: string, amount: number, date: string, note?: string) => {
    if (amount <= 0) return;
    setState((s) => {
      const wallet = s.wallets.find((w) => w.id === walletId);
      const isSavings = wallet?.type === 'savings';
      const topupCategory = isSavings
        ? (s.categories.find((c) => c.id === 'c-savings-in')?.id ?? 'c-savings-in')
        : (s.categories.find((c) => c.id === 'c-topup-in')?.id ?? 'c-topup-in');

      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const tx: Transaction = {
        id: uid('t'),
        date,
        time,
        description: note?.trim() || (isSavings ? (locale.startsWith('id') ? 'Menabung' : 'Savings Deposit') : t('tx.defaultTopup')),
        categoryId: topupCategory,
        walletId,
        type: 'income',
        amount,
      };
      const wallets = s.wallets.map((w) => (w.id === walletId ? { ...w, balance: w.balance + amount } : w));
      const txMonth = date.slice(0, 7);
      return { ...s, transactions: [tx, ...s.transactions], wallets, selectedMonth: txMonth };
    });
  }, [t, locale]);

  const transferBetweenWallets = useCallback(
    (fromWalletId: string, toWalletId: string, amount: number, date: string, note?: string) => {
      if (amount <= 0 || fromWalletId === toWalletId) return;
      setState((s) => {
        const fromWallet = s.wallets.find((w) => w.id === fromWalletId);
        const toWallet = s.wallets.find((w) => w.id === toWalletId);
        if (!fromWallet || !toWallet) return s;

        const outCategory = s.categories.find((c) => c.id === 'c-topup-out')?.id ?? s.categories.find((c) => c.type === 'expense')?.id ?? '';
        const inCategory = s.categories.find((c) => c.id === 'c-topup-in')?.id ?? s.categories.find((c) => c.type === 'income')?.id ?? '';
        const defaultTransferDesc = locale.startsWith('id')
          ? `Transfer dari ${fromWallet.name} ke ${toWallet.name}`
          : `Transfer from ${fromWallet.name} to ${toWallet.name}`;
        const label = note?.trim() || defaultTransferDesc;
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const outTx: Transaction = {
          id: uid('t'),
          date,
          time,
          description: label,
          categoryId: outCategory,
          walletId: fromWalletId,
          type: 'expense',
          amount,
          linkedWalletId: toWalletId,
        };
        const inTx: Transaction = {
          id: uid('t'),
          date,
          time,
          description: label,
          categoryId: inCategory,
          walletId: toWalletId,
          type: 'income',
          amount,
          linkedWalletId: fromWalletId,
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

        const category = s.categories.find((c) => c.id === 'c-savings-in')?.id ?? s.categories.find((c) => c.id === 'c-topup-in')?.id ?? '';
        const now = new Date();
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const tx: Transaction = {
          id: uid('t'),
          date,
          time,
          description: note?.trim() || t('tx.defaultSavings', { name: savingsWallet.name, target: targetWallet.name }),
          categoryId: category,
          
          walletId: savingsWalletId, 
          type: 'income',
          amount,
          
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
      return {
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        transactions: s.transactions.filter((tr) => tr.categoryId !== id),
      };
    });
  }, []);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    state.transactions.forEach((tr) => set.add(tr.date.slice(0, 7)));
    set.add(currentMonthKey());
    return Array.from(set).sort().reverse();
  }, [state.transactions]);

  const exportData = useCallback(() => {
    return JSON.stringify(
      {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        wallets: state.wallets,
        categories: state.categories,
        transactions: state.transactions,
        currencyCode: state.currencyCode,
        language: language,
      },
      null,
      2
    );
  }, [state.wallets, state.categories, state.transactions, state.currencyCode, language]);

  const importData = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return false;
      if (!Array.isArray(parsed.wallets) || !Array.isArray(parsed.categories) || !Array.isArray(parsed.transactions)) {
        return false;
      }

      if (parsed.language === 'id' || parsed.language === 'en') {
        setLanguage(parsed.language);
      }

      const categories = sanitizeCategories(parsed.categories);
      const transactions = sanitizeTransactions(parsed.transactions, categories);
      const wallets = reconcileWalletBalances(parsed.wallets);

      setState({
        wallets,
        categories,
        transactions,
        currencyCode: typeof parsed.currencyCode === 'string' ? parsed.currencyCode : 'IDR',
        selectedMonth: currentMonthKey(),
      });
      return true;
    } catch {
      return false;
    }
  }, [setLanguage]);

  const exportExcelBuffer = useCallback(() => {
    return exportToExcelBuffer({
      wallets: state.wallets,
      categories: state.categories,
      transactions: state.transactions,
      currencyCode: state.currencyCode,
      language: language,
    });
  }, [state.wallets, state.categories, state.transactions, state.currencyCode, language]);

  const importExcelBuffer = useCallback(
    (buffer: ArrayBuffer): boolean => {
      const data = importFromExcelBuffer(buffer);
      if (!data) return false;

      if (data.language === 'id' || data.language === 'en') {
        setLanguage(data.language);
      }

      const categories = sanitizeCategories(data.categories);
      const transactions = sanitizeTransactions(data.transactions, categories);
      const wallets = reconcileWalletBalances(data.wallets);

      setState({
        wallets,
        categories,
        transactions,
        currencyCode: data.currencyCode || 'IDR',
        selectedMonth: currentMonthKey(),
      });
      return true;
    },
    [setLanguage]
  );

  const resetAllData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setState(loadInitial());
  }, []);

  const tCategory = useCallback(
    (cat: Category | string | null | undefined, fallbackType?: TransactionType) => {
      if (typeof cat === 'string') {
        const found = state.categories.find((c) => c.id === cat) || DEFAULT_CATEGORIES.find((c) => c.id === cat);
        return getCategoryName(found || { id: cat, name: cat }, language, fallbackType);
      }
      return getCategoryName(cat, language, fallbackType);
    },
    [state.categories, language]
  );

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
    exportData,
    importData,
    exportExcelBuffer,
    importExcelBuffer,
    resetAllData,
    tCategory,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}