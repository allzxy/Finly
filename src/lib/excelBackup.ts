import * as XLSX from 'xlsx';
import type { Wallet, Category, Transaction } from './types';
import { DEFAULT_CATEGORIES } from './seed';
import { CURRENCIES, BASE_CURRENCY_CODE, convertAmount, EXCHANGE_RATES } from './currencies';
import { getCategoryName, type Language } from './i18n';

export interface BackupData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currencyCode: string;
  language?: string;
  theme?: string;
  exportedAt?: string;
  version?: string;
}

export function formatCurrencyDisplay(amount: number, currencyCode: string): string {
  const curr = CURRENCIES.find((c) => c.code === currencyCode) || {
    code: 'IDR',
    symbol: 'Rp',
    locale: 'id-ID',
  };
  const isZeroDecimal = currencyCode === 'IDR' || currencyCode === 'JPY';
  try {
    return new Intl.NumberFormat(curr.locale, {
      style: 'currency',
      currency: curr.code,
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch {
    return `${curr.symbol} ${amount.toLocaleString('id-ID')}`;
  }
}

function applyExcelFormats(sheet: XLSX.WorkSheet, currencyCode: string) {
  const isZeroDecimal = currencyCode === 'IDR' || currencyCode === 'JPY';
  const curr = CURRENCIES.find((c) => c.code === currencyCode) || { symbol: 'Rp' };
  const numFmt = isZeroDecimal ? `"${curr.symbol} "#,##0` : `"${curr.symbol} "#,##0.00`;

  Object.keys(sheet).forEach((key) => {
    if (key.startsWith('!')) return;
    const cell = sheet[key];
    if (cell && cell.t === 'n' && typeof cell.v === 'number') {
      cell.z = numFmt;
    }
  });
}

function autofitColumns(sheet: XLSX.WorkSheet, minWidth = 14) {
  if (!sheet || !sheet['!ref']) return;

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const colWidths: { wch: number }[] = [];

  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = minWidth;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[cellAddress];
      if (cell && cell.v !== undefined && cell.v !== null) {
        const strVal = String(cell.v);
        const lines = strVal.split('\n');
        for (const line of lines) {
          if (line.length > maxLen) {
            maxLen = line.length;
          }
        }
      }
    }
    colWidths[C] = { wch: Math.min(Math.max(maxLen + 4, minWidth), 60) };
  }

  sheet['!cols'] = colWidths;
}

export function exportToExcelBuffer(data: BackupData): Uint8Array {
  const wb = XLSX.utils.book_new();
  const isEn = data.language === 'en';
  const activeLang = (data.language as Language) || 'id';

  const toDisp = (val: number) => {
    const converted = convertAmount(val, BASE_CURRENCY_CODE, data.currencyCode, EXCHANGE_RATES);
    const isZeroDecimal = data.currencyCode === 'IDR' || data.currencyCode === 'JPY';
    return isZeroDecimal ? Math.round(converted) : Math.round(converted * 100) / 100;
  };

  const categoryLookup = new Map<string, string>();
  DEFAULT_CATEGORIES.forEach((c) => categoryLookup.set(c.id, getCategoryName(c, activeLang)));
  data.categories.forEach((c) => categoryLookup.set(c.id, getCategoryName(c, activeLang)));

  const walletLookup = new Map<string, string>();
  data.wallets.forEach((w) => walletLookup.set(w.id, w.name));

  // Summary Totals (in display currency)
  const totalBalanceBase = data.wallets
    .filter((w) => w.type !== 'savings')
    .reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalBalance = toDisp(totalBalanceBase);

  const savingsWallets = data.wallets.filter((w) => w.type === 'savings');
  const totalSavings = toDisp(savingsWallets.reduce((sum, w) => sum + (w.balance || 0), 0));
  const totalSavingsGoal = toDisp(savingsWallets.reduce((sum, w) => sum + (w.goalAmount || 0), 0));
  const overallSavingsPct = totalSavingsGoal > 0 ? Math.min(100, Math.round((totalSavings / totalSavingsGoal) * 100)) : 0;

  const totalIncome = toDisp(
    data.transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0)
  );
  const totalExpense = toDisp(
    data.transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0)
  );
  const totalCategoryBudgetLimit = toDisp(
    data.categories.filter((c) => c.type === 'expense' && c.monthlyLimit).reduce((sum, c) => sum + (c.monthlyLimit || 0), 0)
  );

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const categorySpentMap = new Map<string, number>();
  data.transactions
    .filter((t) => t.date.startsWith(currentMonthPrefix))
    .forEach((t) => {
      const cur = categorySpentMap.get(t.categoryId) || 0;
      categorySpentMap.set(t.categoryId, cur + toDisp(t.amount || 0));
    });

  // 1. Sheet Ringkasan Eksekutif
  const summaryRows = isEn
    ? [
        { Description: 'Backup Generated At', Value: new Date().toLocaleString('en-US') },
        { Description: 'Total Main Balance (Cash + Bank + Digital)', Value: formatCurrencyDisplay(totalBalance, data.currencyCode) },
        { Description: 'Total Savings Accumulated', Value: formatCurrencyDisplay(totalSavings, data.currencyCode) },
        { Description: 'Total Savings Goals Target', Value: formatCurrencyDisplay(totalSavingsGoal, data.currencyCode) },
        { Description: 'Overall Savings Progress Rate', Value: `${overallSavingsPct}%` },
        { Description: 'Total Accumulated Income', Value: formatCurrencyDisplay(totalIncome, data.currencyCode) },
        { Description: 'Total Accumulated Expense', Value: formatCurrencyDisplay(totalExpense, data.currencyCode) },
        { Description: 'Total Monthly Expense Budget Limit', Value: formatCurrencyDisplay(totalCategoryBudgetLimit, data.currencyCode) },
        { Description: 'Total Wallets / Accounts', Value: data.wallets.length },
        { Description: 'Total Active Savings Targets', Value: savingsWallets.length },
        { Description: 'Total Categories', Value: data.categories.length },
        { Description: 'Total Transaction History Records', Value: data.transactions.length },
        { Description: 'Base Currency', Value: data.currencyCode },
        { Description: 'Backup Version', Value: '2.0 (Lossless Dual-Layer)' },
      ]
    : [
        { Keterangan: 'Waktu Cadangan Dibuat', Nilai: new Date().toLocaleString('id-ID') },
        { Keterangan: 'Total Saldo Utama (Kas + Bank + E-Wallet)', Nilai: formatCurrencyDisplay(totalBalance, data.currencyCode) },
        { Keterangan: 'Total Terkumpul Tabungan Impian', Nilai: formatCurrencyDisplay(totalSavings, data.currencyCode) },
        { Keterangan: 'Total Target Tabungan Impian', Nilai: formatCurrencyDisplay(totalSavingsGoal, data.currencyCode) },
        { Keterangan: 'Persentase Progres Tabungan Keseluruhan', Nilai: `${overallSavingsPct}%` },
        { Keterangan: 'Total Akumulasi Seluruh Pemasukan', Nilai: formatCurrencyDisplay(totalIncome, data.currencyCode) },
        { Keterangan: 'Total Akumulasi Seluruh Pengeluaran', Nilai: formatCurrencyDisplay(totalExpense, data.currencyCode) },
        { Keterangan: 'Total Batas Anggaran Pengeluaran Bulanan', Nilai: formatCurrencyDisplay(totalCategoryBudgetLimit, data.currencyCode) },
        { Keterangan: 'Jumlah Dompet / Akun Keuangan', Nilai: data.wallets.length },
        { Keterangan: 'Jumlah Target Tabungan Aktif', Nilai: savingsWallets.length },
        { Keterangan: 'Jumlah Kategori Keuangan', Nilai: data.categories.length },
        { Keterangan: 'Jumlah Total Catatan Transaksi', Nilai: data.transactions.length },
        { Keterangan: 'Mata Uang Utama Aplikasi', Nilai: data.currencyCode },
        { Keterangan: 'Versi Format Cadangan', Nilai: '2.0 (Lossless Dual-Layer)' },
      ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  // 2. Sheet Riwayat Transaksi
  const txRows = data.transactions.map((t) => {
    const txTypeLabel = t.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran');
    const dispAmount = toDisp(t.amount);

    let resolvedCategory = categoryLookup.get(t.categoryId);
    const isSavingsTarget = data.wallets.some((w) => w.id === (t.type === 'income' ? t.walletId : t.linkedWalletId) && w.type === 'savings');

    if (!resolvedCategory || !resolvedCategory.trim() || resolvedCategory === 'Transfer Dompet' || resolvedCategory === 'Wallet Transfer') {
      if (isSavingsTarget) {
        resolvedCategory = isEn ? 'Savings' : 'Menabung';
      } else if (t.linkedWalletId) {
        if (t.type === 'income') {
          const fromWName = walletLookup.get(t.linkedWalletId) || (isEn ? 'Wallet' : 'Dompet');
          resolvedCategory = isEn ? `Transfer from ${fromWName}` : `Transfer dari ${fromWName}`;
        } else {
          const toWName = walletLookup.get(t.linkedWalletId) || (isEn ? 'Wallet' : 'Dompet');
          resolvedCategory = isEn ? `Transfer to ${toWName}` : `Transfer ke ${toWName}`;
        }
      } else if (t.categoryId === 'c-topup-in' || (t.description && (t.description.toLowerCase().includes('isi saldo') || t.description.toLowerCase().includes('topup') || t.description.toLowerCase().includes('top-up')))) {
        resolvedCategory = isEn ? 'Top-Up' : 'Isi Saldo';
      } else {
        resolvedCategory = t.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran');
      }
    }

    let sourceWalletName = walletLookup.get(t.walletId) || t.walletId || (isEn ? 'Wallet' : 'Dompet');
    let targetWalletName = t.linkedWalletId ? (walletLookup.get(t.linkedWalletId) || t.linkedWalletId) : '';

    if (t.type === 'income' && t.linkedWalletId) {
      sourceWalletName = walletLookup.get(t.linkedWalletId) || t.linkedWalletId;
      targetWalletName = walletLookup.get(t.walletId) || t.walletId;
    }

    const walletAccountDisplay = targetWalletName ? `${sourceWalletName} ➔ ${targetWalletName}` : sourceWalletName;

    return isEn
      ? {
          'Transaction Date': t.date,
          'Time (HH:mm)': t.time ?? '',
          'Transaction Type': txTypeLabel,
          'Formatted Amount': formatCurrencyDisplay(dispAmount, data.currencyCode),
          Amount: dispAmount,
          Category: resolvedCategory,
          'Wallet / Account': walletAccountDisplay,
          'Destination Wallet': targetWalletName || '-',
          'Notes / Description': t.description,
          'Transaction Code': t.id,
          'Category Code': t.categoryId || '',
          'Wallet Code': t.walletId,
          'Linked Wallet Code': t.linkedWalletId ?? '',
          'Base Exact Amount': t.amount,
        }
      : {
          'Tanggal Transaksi': t.date,
          'Waktu (Jam:Menit)': t.time ?? '',
          'Jenis Transaksi': txTypeLabel,
          'Nominal Transaksi': formatCurrencyDisplay(dispAmount, data.currencyCode),
          'Angka Nominal': dispAmount,
          Kategori: resolvedCategory,
          'Dompet / Akun': walletAccountDisplay,
          'Dompet Tujuan': targetWalletName || '-',
          'Catatan / Keterangan': t.description,
          'Kode Transaksi': t.id,
          'Kode Kategori': t.categoryId || '',
          'Kode Dompet': t.walletId,
          'Kode Dompet Sumber': t.linkedWalletId ?? '',
          'Nominal Baku (Base)': t.amount,
        };
  });
  const txSheet = XLSX.utils.json_to_sheet(txRows);

  // 3. Sheet Dompet & Tabungan
  const walletRows = data.wallets.map((w) => {
    const isSavings = w.type === 'savings';
    const dispBalance = toDisp(w.balance);
    const dispGoal = typeof w.goalAmount === 'number' ? toDisp(w.goalAmount) : 0;
    const pct = isSavings && dispGoal > 0 ? Math.min(100, Math.round((dispBalance / dispGoal) * 100)) : 0;
    const pctLabel = isSavings && dispGoal > 0 ? `${pct}%` : '-';

    let walletTypeLabel = 'Kas Tunai';
    if (isEn) {
      walletTypeLabel = isSavings ? 'Savings Goal' : w.type === 'cash' ? 'Cash' : w.type === 'bank' ? 'Bank Account' : 'Digital Wallet';
    } else {
      walletTypeLabel = isSavings ? 'Target Tabungan' : w.type === 'cash' ? 'Kas Tunai' : w.type === 'bank' ? 'Akun Bank' : 'Dompet Digital (E-Wallet)';
    }

    return isEn
      ? {
          'Wallet / Savings Name': w.name,
          'Account Type': walletTypeLabel,
          'Current Balance': formatCurrencyDisplay(dispBalance, data.currencyCode),
          Balance: dispBalance,
          'Formatted Goal': dispGoal > 0 ? formatCurrencyDisplay(dispGoal, data.currencyCode) : '-',
          'Goal Amount': dispGoal > 0 ? dispGoal : 0,
          'Savings Progress': pctLabel,
          'Progress Rate': pct,
          'Bank / Provider Name': w.institution ?? '',
          'Wallet Code': w.id,
          'Color Code': w.color,
          'Linked Wallet Code': w.linkedWalletId ?? '',
          'Base Exact Balance': w.balance,
          'Base Exact Goal': w.goalAmount ?? 0,
        }
      : {
          'Nama Dompet / Tabungan': w.name,
          'Jenis Akun': walletTypeLabel,
          'Saldo Saat Ini': formatCurrencyDisplay(dispBalance, data.currencyCode),
          'Angka Saldo': dispBalance,
          'Target Tabungan': dispGoal > 0 ? formatCurrencyDisplay(dispGoal, data.currencyCode) : '-',
          'Angka Target': dispGoal > 0 ? dispGoal : 0,
          'Persentase Terkumpul': pctLabel,
          'Angka Persen': pct,
          'Nama Bank / Provider': w.institution ?? '',
          'Kode Dompet': w.id,
          'Kode Warna': w.color,
          'Kode Dompet Sumber': w.linkedWalletId ?? '',
          'Saldo Baku (Base)': w.balance,
          'Target Baku (Base)': w.goalAmount ?? 0,
        };
  });
  const walletSheet = XLSX.utils.json_to_sheet(walletRows);

  // 4. Sheet Kategori
  const categoryRows = data.categories.map((c) => {
    const catTypeLabel = c.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran');
    const spentThisMonth = categorySpentMap.get(c.id) || 0;
    const catNameLocalized = getCategoryName(c, activeLang);
    const dispLimit = typeof c.monthlyLimit === 'number' ? toDisp(c.monthlyLimit) : 0;

    return isEn
      ? {
          'Category Name': catNameLocalized,
          'Category Type': catTypeLabel,
          'Spent / Received This Month': formatCurrencyDisplay(spentThisMonth, data.currencyCode),
          'Raw Spent This Month': spentThisMonth,
          'Monthly Budget Limit': dispLimit > 0 ? formatCurrencyDisplay(dispLimit, data.currencyCode) : '-',
          'Raw Limit Amount': dispLimit,
          'Icon Name': c.icon,
          'Color Code': c.color,
          'System Default': c.system ? 'Yes' : 'No',
          'Category Code': c.id,
          'Base Exact Limit': c.monthlyLimit ?? 0,
          'Original Name': c.name,
          'Translation ID': c.translations?.id ?? '',
          'Translation EN': c.translations?.en ?? '',
        }
      : {
          'Nama Kategori': catNameLocalized,
          'Jenis Kategori': catTypeLabel,
          'Pengeluaran / Pemasukan Bulan Ini': formatCurrencyDisplay(spentThisMonth, data.currencyCode),
          'Angka Bulan Ini': spentThisMonth,
          'Batas Anggaran Bulanan': dispLimit > 0 ? formatCurrencyDisplay(dispLimit, data.currencyCode) : '-',
          'Angka Batas Anggaran': dispLimit,
          'Nama Ikon': c.icon,
          'Kode Warna': c.color,
          'Kategori Bawaan Sistem': c.system ? 'Ya' : 'Tidak',
          'Kode Kategori': c.id,
          'Batas Baku (Base)': c.monthlyLimit ?? 0,
          'Nama Asli': c.name,
          'Terjemahan ID': c.translations?.id ?? '',
          'Terjemahan EN': c.translations?.en ?? '',
        };
  });
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);

  // 5. Sheet Pengaturan
  const settingRows = isEn
    ? [
        {
          'Base Currency': data.currencyCode,
          'App Language': data.language || 'en',
          'Display Mode': data.theme || 'dark',
          'Backup Version': '2.0',
        },
      ]
    : [
        {
          'Mata Uang Utama': data.currencyCode,
          'Bahasa Aplikasi': data.language || 'id',
          'Mode Tampilan': data.theme || 'dark',
          'Versi Cadangan': '2.0',
        },
      ];
  const settingSheet = XLSX.utils.json_to_sheet(settingRows);

  // 6. DEDICATED LOSSLESS RAW DATA SHEET (Layer 1: 100% Exact Bit-Level Preservation)
  const rawMetaPayload = [
    {
      _KEY: 'FINLY_LOSSLESS_BACKUP_V2',
      _EXPORTED_AT: new Date().toISOString(),
      _PAYLOAD: JSON.stringify({
        wallets: data.wallets,
        categories: data.categories,
        transactions: data.transactions,
        currencyCode: data.currencyCode,
        language: data.language,
        theme: data.theme,
        version: '2.0',
      }),
    },
  ];
  const rawMetaSheet = XLSX.utils.json_to_sheet(rawMetaPayload);

  // Apply cell number formatting (.z)
  applyExcelFormats(txSheet, data.currencyCode);
  applyExcelFormats(walletSheet, data.currencyCode);
  applyExcelFormats(categorySheet, data.currencyCode);

  // Auto-fit column widths
  autofitColumns(summarySheet, 32);
  autofitColumns(txSheet, 18);
  autofitColumns(walletSheet, 16);
  autofitColumns(categorySheet, 16);
  autofitColumns(settingSheet, 16);

  const summarySheetName = isEn ? 'Executive Summary' : 'Ringkasan Keuangan';
  const txSheetName = isEn ? 'Transactions' : 'Riwayat Transaksi';
  const walletSheetName = isEn ? 'Wallets & Savings' : 'Dompet & Tabungan';
  const categorySheetName = isEn ? 'Categories' : 'Kategori Keuangan';
  const settingSheetName = isEn ? 'App Settings' : 'Pengaturan Aplikasi';

  XLSX.utils.book_append_sheet(wb, summarySheet, summarySheetName);
  XLSX.utils.book_append_sheet(wb, txSheet, txSheetName);
  XLSX.utils.book_append_sheet(wb, walletSheet, walletSheetName);
  XLSX.utils.book_append_sheet(wb, categorySheet, categorySheetName);
  XLSX.utils.book_append_sheet(wb, settingSheet, settingSheetName);
  XLSX.utils.book_append_sheet(wb, rawMetaSheet, '_FINLY_RAW_DATA_');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

function parseFlexibleNumber(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  const cleaned = str.replace(/[^0-9.,-]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }

  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 3) {
      const parsed = parseFloat(cleaned.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  }

  if (cleaned.includes('.') && !cleaned.includes(',')) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1)) {
      const parsed = parseFloat(cleaned.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
  }

  const num = Number(cleaned);
  if (!isNaN(num)) return num;
  const fallback = parseFloat(cleaned);
  return isNaN(fallback) ? 0 : fallback;
}

function parseExcelDate(val: unknown): string {
  if (!val) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  if (typeof val === 'number') {
    const dateObj = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str) return new Date().toISOString().slice(0, 10);

  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return str.slice(0, 10);
}

export function importFromExcelBuffer(buffer: ArrayBuffer): BackupData | null {
  try {
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

    // 1. LAYER 1: FAST PATH FOR 100% BIT-EXACT RESTORATION (_FINLY_RAW_DATA_)
    const rawSheet = wb.Sheets['_FINLY_RAW_DATA_'];
    if (rawSheet) {
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(rawSheet);
      if (rawRows.length > 0 && rawRows[0]._PAYLOAD && typeof rawRows[0]._PAYLOAD === 'string') {
        try {
          const parsed = JSON.parse(rawRows[0]._PAYLOAD);
          if (
            parsed &&
            Array.isArray(parsed.wallets) &&
            Array.isArray(parsed.categories) &&
            Array.isArray(parsed.transactions)
          ) {
            return {
              wallets: parsed.wallets,
              categories: parsed.categories,
              transactions: parsed.transactions,
              currencyCode: typeof parsed.currencyCode === 'string' ? parsed.currencyCode : 'IDR',
              language: typeof parsed.language === 'string' ? parsed.language : undefined,
              theme: typeof parsed.theme === 'string' ? parsed.theme : undefined,
              version: typeof parsed.version === 'string' ? parsed.version : '2.0',
            };
          }
        } catch {
          // Fallback to manual sheet parser below if raw JSON is corrupted
        }
      }
    }

    // 2. LAYER 2: INTELLECTUAL PARSER FOR MANUAL / MODIFIED / THIRD-PARTY EXCEL SHEETS
    // Parse Pengaturan first to determine file currency
    const settingSheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('pengaturan') || s.toLowerCase().includes('setting')
    );
    const settingRows = settingSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[settingSheetName]) : [];
    const currencyCode =
      settingRows[0]?.['Mata Uang Utama'] || settingRows[0]?.['Base Currency'] || settingRows[0]?.MataUang || settingRows[0]?.currencyCode
        ? String(settingRows[0]['Mata Uang Utama'] || settingRows[0]['Base Currency'] || settingRows[0].MataUang || settingRows[0].currencyCode)
        : 'IDR';
    const language = settingRows[0]?.['Bahasa Aplikasi'] || settingRows[0]?.['App Language'] || settingRows[0]?.Bahasa ? String(settingRows[0]['Bahasa Aplikasi'] || settingRows[0]['App Language'] || settingRows[0].Bahasa) : undefined;
    const theme = settingRows[0]?.['Mode Tampilan'] || settingRows[0]?.['Display Mode'] || settingRows[0]?.Tema ? String(settingRows[0]['Mode Tampilan'] || settingRows[0]['Display Mode'] || settingRows[0].Tema) : undefined;

    // Currency normalization helper for visual spreadsheets
    const normalizeToBase = (val: number) => {
      return convertAmount(val, currencyCode, BASE_CURRENCY_CODE, EXCHANGE_RATES);
    };

    // Parse Dompet & Tabungan
    const walletSheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('dompet') || s.toLowerCase().includes('wallet') || s.toLowerCase().includes('tabungan') || s.toLowerCase().includes('savings')
    );
    const walletRows = walletSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[walletSheetName]) : [];

    const wallets: Wallet[] = walletRows.map((r, idx) => {
      const rawType = String(r['Jenis Akun'] || r['Account Type'] || r.Tipe || r.type || '').toLowerCase();
      let type: Wallet['type'] = 'cash';
      if (rawType.includes('tabungan') || rawType.includes('savings')) type = 'savings';
      else if (rawType.includes('bank')) type = 'bank';
      else if (rawType.includes('digital') || rawType.includes('wallet') || rawType.includes('e-wallet')) type = 'digital';

      const wId = String(r['Kode Dompet'] || r['Wallet Code'] || r.ID || r.id || `w-${idx}`);
      const wName = String(r['Nama Dompet / Tabungan'] || r['Wallet / Savings Name'] || r.Nama || r.name || 'Dompet');

      // Check if exact base value is recorded in sheet
      let wBalance: number;
      if (r['Base Exact Balance'] !== undefined || r['Saldo Baku (Base)'] !== undefined) {
        wBalance = parseFlexibleNumber(r['Base Exact Balance'] ?? r['Saldo Baku (Base)']);
      } else {
        const rawDispBal = parseFlexibleNumber(
          r['Angka Saldo'] ?? r['Balance'] ?? r['Saldo Saat Ini'] ?? r['Formatted Balance'] ?? r.Saldo ?? r.FormatSaldo ?? r.balance ?? 0
        );
        wBalance = normalizeToBase(rawDispBal);
      }

      let wGoal: number | undefined;
      if (r['Base Exact Goal'] !== undefined || r['Target Baku (Base)'] !== undefined) {
        const baseGoal = parseFlexibleNumber(r['Base Exact Goal'] ?? r['Target Baku (Base)']);
        wGoal = baseGoal > 0 ? baseGoal : undefined;
      } else {
        const rawGoal = r['Angka Target'] || r['Goal Amount'] || r['Target Tabungan'] || r['Formatted Goal'] || r.GoalAmount || r.FormatTarget;
        if (rawGoal !== undefined && rawGoal !== null && rawGoal !== '-' && rawGoal !== '') {
          const parsedDispGoal = parseFlexibleNumber(rawGoal);
          wGoal = parsedDispGoal > 0 ? normalizeToBase(parsedDispGoal) : undefined;
        }
      }

      return {
        id: wId,
        name: wName,
        type,
        balance: wBalance,
        color: String(r['Kode Warna'] || r['Color Code'] || r.Warna || r.color || '#1f7a5c'),
        goalAmount: wGoal,
        institution: r['Nama Bank / Provider'] || r['Bank / Provider Name'] || r.Institution ? String(r['Nama Bank / Provider'] || r['Bank / Provider Name'] || r.Institution) : undefined,
        linkedWalletId: r['Kode Dompet Sumber'] || r['Linked Wallet Code'] || r.LinkedWalletID ? String(r['Kode Dompet Sumber'] || r['Linked Wallet Code'] || r.LinkedWalletID) : undefined,
      };
    });

    // Parse Kategori
    const categorySheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('kategori') || s.toLowerCase().includes('category') || s.toLowerCase().includes('categories')
    );
    const categoryRows = categorySheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[categorySheetName]) : [];

    const categories: Category[] =
      categoryRows.length > 0
        ? categoryRows.map((r, idx) => {
            const rawName = String(r['Original Name'] || r['Nama Asli'] || r['Nama Kategori'] || r['Category Name'] || r.Nama || r.name || 'Kategori');
            const trId = r['Translation ID'] || r['Terjemahan ID'] ? String(r['Translation ID'] || r['Terjemahan ID']) : undefined;
            const trEn = r['Translation EN'] || r['Terjemahan EN'] ? String(r['Translation EN'] || r['Terjemahan EN']) : undefined;
            const translations = trId || trEn ? { id: trId, en: trEn } : undefined;

            let monthlyLimit: number | undefined;
            if (r['Base Exact Limit'] !== undefined || r['Batas Baku (Base)'] !== undefined) {
              const baseLim = parseFlexibleNumber(r['Base Exact Limit'] ?? r['Batas Baku (Base)']);
              monthlyLimit = baseLim > 0 ? baseLim : undefined;
            } else {
              const rawLim = r['Angka Batas Anggaran'] || r['Raw Limit Amount'] || r['Batas Anggaran Bulanan'] || r['Monthly Budget Limit'] || r.MonthlyLimit || r.FormatLimit;
              if (rawLim !== undefined && rawLim !== null && rawLim !== '-' && rawLim !== '') {
                const parsedDispLim = parseFlexibleNumber(rawLim);
                monthlyLimit = parsedDispLim > 0 ? normalizeToBase(parsedDispLim) : undefined;
              }
            }

            return {
              id: String(r['Kode Kategori'] || r['Category Code'] || r.ID || r.id || `c-${idx}`),
              name: rawName,
              type:
                String(r['Jenis Kategori'] || r['Category Type'] || r.Tipe || r.type).toLowerCase().includes('masuk') ||
                String(r['Jenis Kategori'] || r['Category Type'] || r.Tipe || r.type).toLowerCase().includes('income')
                  ? 'income'
                  : 'expense',
              icon: String(r['Nama Ikon'] || r['Icon Name'] || r.Ikon || r.icon || 'Tag'),
              color: String(r['Kode Warna'] || r['Color Code'] || r.Warna || r.color || '#1f7a5c'),
              monthlyLimit,
              system:
                String(r['Kategori Bawaan Sistem'] || r['System Default'] || r.System || r.system).toLowerCase() === 'ya' ||
                String(r['Kategori Bawaan Sistem'] || r['System Default'] || r.System || r.system).toLowerCase() === 'yes' ||
                r['Kategori Bawaan Sistem'] === true ||
                r.system === true,
              translations,
            };
          })
        : DEFAULT_CATEGORIES;

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => {
      categoryMap.set(c.id, c.id);
      categoryMap.set(c.name.toLowerCase(), c.id);
    });

    const walletMap = new Map<string, string>();
    wallets.forEach((w) => {
      walletMap.set(w.id, w.id);
      walletMap.set(w.name.toLowerCase(), w.id);
    });

    // Parse Transaksi
    const txSheetName = wb.SheetNames.find(
      (s) => s.toLowerCase().includes('transaksi') || s.toLowerCase().includes('transaction') || s.toLowerCase().includes('riwayat')
    );
    const txRows = txSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[txSheetName]) : [];

    const transactions: Transaction[] = txRows
      .filter((r) => r['Tanggal Transaksi'] || r['Transaction Date'] || r.Tanggal || r.date || r['Angka Nominal'] || r.Amount || r.Jumlah || r.amount || r['Nominal Transaksi'] || r['Formatted Amount'])
      .map((r, idx) => {
        let catId = String(r['Kode Kategori'] || r['Category Code'] || r.CategoryID || r.categoryId || '');
        if (!catId && (r.Kategori || r.kategori || r.Category || r.category)) {
          const catName = String(r.Kategori || r.kategori || r.Category || r.category).trim().toLowerCase();
          catId = categoryMap.get(catName) || '';
        }

        let wId = String(r['Kode Dompet'] || r['Wallet Code'] || r.WalletID || r.walletId || '');
        if (!wId && (r['Dompet / Akun'] || r['Wallet / Account'] || r.Dompet || r.dompet || r.Wallet || r.wallet)) {
          const rawWName = String(r['Dompet / Akun'] || r['Wallet / Account'] || r.Dompet || r.dompet || r.Wallet || r.wallet).trim();
          const cleanWName = rawWName.split('➔')[0].trim().toLowerCase();
          wId = walletMap.get(cleanWName) || walletMap.get(rawWName.toLowerCase()) || '';
        }
        if (!wId) {
          wId = wallets[0]?.id || 'w-cash';
        }

        let linkedWId = String(r['Kode Dompet Sumber'] || r['Linked Wallet Code'] || r.LinkedWalletID || '');
        if (!linkedWId && (r['Dompet Tujuan'] || r['Destination Wallet'])) {
          const destName = String(r['Dompet Tujuan'] || r['Destination Wallet']).trim().toLowerCase();
          if (destName !== '-') {
            linkedWId = walletMap.get(destName) || '';
          }
        }

        const dateVal = r['Tanggal Transaksi'] || r['Transaction Date'] || r.Tanggal || r.date;
        const timeVal = r['Waktu (Jam:Menit)'] || r['Time (HH:mm)'] || r.Jam || r.time;
        const typeVal = String(r['Jenis Transaksi'] || r['Transaction Type'] || r.Tipe || r.type);
        const descVal = r['Catatan / Keterangan'] || r['Notes / Description'] || r.Deskripsi || r.description || 'Transaksi';

        let amountVal: number;
        if (r['Base Exact Amount'] !== undefined || r['Nominal Baku (Base)'] !== undefined) {
          amountVal = parseFlexibleNumber(r['Base Exact Amount'] ?? r['Nominal Baku (Base)']);
        } else {
          const rawDispAmount = parseFlexibleNumber(
            r['Angka Nominal'] ?? r.Amount ?? r.Jumlah ?? r['Nominal Transaksi'] ?? r['Formatted Amount'] ?? r.FormatNominal ?? r.amount ?? 0
          );
          amountVal = normalizeToBase(rawDispAmount);
        }

        return {
          id: String(r['Kode Transaksi'] || r['Transaction Code'] || r.ID || r.id || `t-${idx}`),
          date: parseExcelDate(dateVal),
          time: timeVal ? String(timeVal) : undefined,
          description: String(descVal),
          categoryId: catId,
          walletId: wId,
          type: typeVal.toLowerCase().includes('masuk') || typeVal.toLowerCase().includes('income') ? 'income' : 'expense',
          amount: amountVal,
          linkedWalletId: linkedWId || undefined,
        };
      });

    return {
      wallets,
      categories,
      transactions,
      currencyCode,
      language,
      theme,
    };
  } catch {
    return null;
  }
}
