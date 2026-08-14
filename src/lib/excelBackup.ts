import * as XLSX from 'xlsx';
import type { Wallet, Category, Transaction } from './types';
import { DEFAULT_CATEGORIES } from './seed';
import { CURRENCIES } from './currencies';
import { getCategoryName, type Language } from './i18n';

export interface BackupData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currencyCode: string;
  language?: string;
  theme?: string;
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
  const categoryLookup = new Map<string, string>();
  // Pre-populate lookup with default system & predefined categories localized
  DEFAULT_CATEGORIES.forEach((c) => categoryLookup.set(c.id, getCategoryName(c, activeLang)));
  data.categories.forEach((c) => categoryLookup.set(c.id, getCategoryName(c, activeLang)));

  const walletLookup = new Map<string, string>();
  data.wallets.forEach((w) => walletLookup.set(w.id, w.name));

  // Calculate Summary Totals
  const totalBalance = data.wallets
    .filter((w) => w.type !== 'savings')
    .reduce((sum, w) => sum + (w.balance || 0), 0);

  const savingsWallets = data.wallets.filter((w) => w.type === 'savings');
  const totalSavings = savingsWallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const totalSavingsGoal = savingsWallets.reduce((sum, w) => sum + (w.goalAmount || 0), 0);
  const overallSavingsPct = totalSavingsGoal > 0 ? Math.min(100, Math.round((totalSavings / totalSavingsGoal) * 100)) : 0;

  const totalIncome = data.transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = data.transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalCategoryBudgetLimit = data.categories
    .filter((c) => c.type === 'expense' && typeof c.monthlyLimit === 'number')
    .reduce((sum, c) => sum + (c.monthlyLimit || 0), 0);

  // Calculate monthly spending per category for current month
  const nowMonthKey = new Date().toISOString().slice(0, 7);
  const categorySpentMap = new Map<string, number>();

  data.transactions
    .filter((t) => !t.linkedWalletId && t.date && t.date.slice(0, 7) === nowMonthKey)
    .forEach((t) => {
      categorySpentMap.set(t.categoryId, (categorySpentMap.get(t.categoryId) || 0) + (t.amount || 0));
    });

  // 1. Sheet Ringkasan (Dinamis Sesuai Bahasa Aplikasi: ID / EN)
  const summaryRows = isEn
    ? [
        { Description: 'Backup Created Date', Value: new Date().toLocaleString('en-US') },
        { Description: 'Total Main Balance (Cash + Bank + E-Wallet)', Value: formatCurrencyDisplay(totalBalance, data.currencyCode) },
        { Description: 'Total Accumulated Savings', Value: formatCurrencyDisplay(totalSavings, data.currencyCode) },
        { Description: 'Total Savings Goal', Value: formatCurrencyDisplay(totalSavingsGoal, data.currencyCode) },
        { Description: 'Overall Savings Progress', Value: `${overallSavingsPct}%` },
        { Description: 'Total Accumulated Income', Value: formatCurrencyDisplay(totalIncome, data.currencyCode) },
        { Description: 'Total Accumulated Expense', Value: formatCurrencyDisplay(totalExpense, data.currencyCode) },
        { Description: 'Total Monthly Expense Budget Limit', Value: formatCurrencyDisplay(totalCategoryBudgetLimit, data.currencyCode) },
        { Description: 'Total Wallets / Accounts', Value: data.wallets.length },
        { Description: 'Total Active Savings Targets', Value: savingsWallets.length },
        { Description: 'Total Categories', Value: data.categories.length },
        { Description: 'Total Transaction History Records', Value: data.transactions.length },
        { Description: 'Base Currency', Value: data.currencyCode },
        { Description: 'Backup Version', Value: '1.8' },
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
        { Keterangan: 'Jumlah Target Tabungan Active', Nilai: savingsWallets.length },
        { Keterangan: 'Jumlah Kategori Keuangan', Nilai: data.categories.length },
        { Keterangan: 'Jumlah Total Catatan Transaksi', Nilai: data.transactions.length },
        { Keterangan: 'Mata Uang Utama Aplikasi', Nilai: data.currencyCode },
        { Keterangan: 'Versi Format Cadangan', Nilai: '1.8' },
      ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

  // 2. Sheet Transaksi (Dengan Kategori fallback & Pemisah Dompet Sumber/Tujuan)
  const txRows = data.transactions.map((t) => {
    const txTypeLabel = t.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran');

    // Smart Category Fallback Resolution
    let resolvedCategory = categoryLookup.get(t.categoryId);
    if (!resolvedCategory || !resolvedCategory.trim() || resolvedCategory === 'Isi Saldo' || resolvedCategory === 'Savings Deposit') {
      if (t.linkedWalletId || (t.description && (t.description.toLowerCase().includes('isi saldo') || t.description.toLowerCase().includes('tabungan')))) {
        resolvedCategory = t.type === 'income' ? (isEn ? 'Savings' : 'Menabung') : (isEn ? 'Wallet Transfer' : 'Transfer Dompet');
      } else {
        resolvedCategory = isEn ? 'General' : 'Umum';
      }
    }

    // Smart Wallet & Destination Resolution (Clear source vs destination wallet display!)
    let sourceWalletName = walletLookup.get(t.walletId) || t.walletId || (isEn ? 'Wallet' : 'Dompet');
    let targetWalletName = t.linkedWalletId ? (walletLookup.get(t.linkedWalletId) || t.linkedWalletId) : '';

    // For savings deposit transactions, money flows from real bank wallet (t.linkedWalletId) to savings goal (t.walletId)
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
          'Formatted Amount': formatCurrencyDisplay(t.amount, data.currencyCode),
          Amount: t.amount,
          Category: resolvedCategory,
          'Wallet / Account': walletAccountDisplay,
          'Destination Wallet': targetWalletName || '-',
          'Notes / Description': t.description,
          'Transaction Code': t.id,
          'Category Code': t.categoryId || '',
          'Wallet Code': t.walletId,
          'Linked Wallet Code': t.linkedWalletId ?? '',
        }
      : {
          'Tanggal Transaksi': t.date,
          'Waktu (Jam:Menit)': t.time ?? '',
          'Jenis Transaksi': txTypeLabel,
          'Nominal Transaksi': formatCurrencyDisplay(t.amount, data.currencyCode),
          'Angka Nominal': t.amount,
          Kategori: resolvedCategory,
          'Dompet / Akun': walletAccountDisplay,
          'Dompet Tujuan': targetWalletName || '-',
          'Catatan / Keterangan': t.description,
          'Kode Transaksi': t.id,
          'Kode Kategori': t.categoryId || '',
          'Kode Dompet': t.walletId,
          'Kode Dompet Sumber': t.linkedWalletId ?? '',
        };
  });

  const txSheet = XLSX.utils.json_to_sheet(txRows);

  // 3. Sheet Dompet & Tabungan (Bilingual: ID / EN)
  const walletRows = data.wallets.map((w) => {
    const isSavings = w.type === 'savings';
    const goal = w.goalAmount || 0;
    const pct = isSavings && goal > 0 ? Math.min(100, Math.round(((w.balance || 0) / goal) * 100)) : 0;
    const pctLabel = isSavings && goal > 0 ? `${pct}%` : '-';

    let walletTypeLabel = 'Kas Tunai';
    if (isEn) {
      walletTypeLabel = isSavings ? 'Savings Goal' : w.type === 'cash' ? 'Cash' : w.type === 'bank' ? 'Bank Account' : 'Digital Wallet';
    } else {
      walletTypeLabel = isSavings ? 'Tabungan Impian' : w.type === 'cash' ? 'Kas Tunai' : w.type === 'bank' ? 'Rekening Bank' : 'E-Wallet Digital';
    }

    return isEn
      ? {
          'Wallet / Savings Name': w.name,
          'Account Type': walletTypeLabel,
          'Formatted Balance': formatCurrencyDisplay(w.balance, data.currencyCode),
          Balance: w.balance,
          'Formatted Goal': goal > 0 ? formatCurrencyDisplay(goal, data.currencyCode) : '-',
          'Goal Amount': goal,
          'Savings Progress': pctLabel,
          'Progress Rate': pct,
          'Bank / Provider Name': w.institution ?? '',
          'Wallet Code': w.id,
          'Color Code': w.color,
          'Linked Wallet Code': w.linkedWalletId ?? '',
        }
      : {
          'Nama Dompet / Tabungan': w.name,
          'Jenis Akun': walletTypeLabel,
          'Saldo Saat Ini': formatCurrencyDisplay(w.balance, data.currencyCode),
          'Angka Saldo': w.balance,
          'Target Tabungan': goal > 0 ? formatCurrencyDisplay(goal, data.currencyCode) : '-',
          'Angka Target': goal,
          'Persentase Terkumpul': pctLabel,
          'Angka Persen': pct,
          'Nama Bank / Provider': w.institution ?? '',
          'Kode Dompet': w.id,
          'Kode Warna': w.color,
          'Kode Dompet Sumber': w.linkedWalletId ?? '',
        };
  });
  const walletSheet = XLSX.utils.json_to_sheet(walletRows);

  // 4. Sheet Kategori (Bilingual: ID / EN + Total Transaksi Bulan Ini)
  const categoryRows = data.categories.map((c) => {
    const catTypeLabel = c.type === 'income' ? (isEn ? 'Income' : 'Pemasukan') : (isEn ? 'Expense' : 'Pengeluaran');
    const spentThisMonth = categorySpentMap.get(c.id) || 0;
    const catNameLocalized = getCategoryName(c, activeLang);

    return isEn
      ? {
          'Category Name': catNameLocalized,
          'Category Type': catTypeLabel,
          'Spent / Received This Month': formatCurrencyDisplay(spentThisMonth, data.currencyCode),
          'Raw Spent This Month': spentThisMonth,
          'Monthly Budget Limit': c.monthlyLimit ? formatCurrencyDisplay(c.monthlyLimit, data.currencyCode) : '-',
          'Raw Limit Amount': c.monthlyLimit ?? 0,
          'Icon Name': c.icon,
          'Color Code': c.color,
          'System Default': c.system ? 'Yes' : 'No',
          'Category Code': c.id,
        }
      : {
          'Nama Kategori': catNameLocalized,
          'Jenis Kategori': catTypeLabel,
          'Pengeluaran / Pemasukan Bulan Ini': formatCurrencyDisplay(spentThisMonth, data.currencyCode),
          'Angka Bulan Ini': spentThisMonth,
          'Batas Anggaran Bulanan': c.monthlyLimit ? formatCurrencyDisplay(c.monthlyLimit, data.currencyCode) : '-',
          'Angka Batas Anggaran': c.monthlyLimit ?? 0,
          'Nama Ikon': c.icon,
          'Kode Warna': c.color,
          'Kategori Bawaan Sistem': c.system ? 'Ya' : 'Tidak',
          'Kode Kategori': c.id,
        };
  });
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);

  // 5. Sheet Pengaturan (Bilingual: ID / EN)
  const settingRows = isEn
    ? [
        {
          'Base Currency': data.currencyCode,
          'App Language': data.language || 'en',
          'Display Mode': data.theme || 'dark',
          'Backup Version': '1.8',
        },
      ]
    : [
        {
          'Mata Uang Utama': data.currencyCode,
          'Bahasa Aplikasi': data.language || 'id',
          'Mode Tampilan': data.theme || 'dark',
          'Versi Cadangan': '1.8',
        },
      ];
  const settingSheet = XLSX.utils.json_to_sheet(settingRows);

  // Apply cell number formatting (.z) so numeric cells format as currency in Excel
  applyExcelFormats(txSheet, data.currencyCode);
  applyExcelFormats(walletSheet, data.currencyCode);
  applyExcelFormats(categorySheet, data.currencyCode);

  // Auto-fit column widths for clear, readable columns in Excel
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

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

function parseFlexibleNumber(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val * 100) / 100;
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  const cleaned = str.replace(/[^0-9.,-]/g, '');
  if (!cleaned) return 0;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  if (cleaned.includes(',') && !cleaned.includes('.')) {
    const parts = cleaned.split(',');
    if (parts[parts.length - 1].length === 3) {
      const parsed = parseFloat(cleaned.replace(/,/g, ''));
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }
    const parsed = parseFloat(cleaned.replace(',', '.'));
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  if (cleaned.includes('.') && !cleaned.includes(',')) {
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1)) {
      const parsed = parseFloat(cleaned.replace(/\./g, ''));
      return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
    }
  }

  const num = Number(cleaned);
  if (!isNaN(num)) return Math.round(num * 100) / 100;
  const fallback = parseFloat(cleaned);
  return isNaN(fallback) ? 0 : Math.round(fallback * 100) / 100;
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
      const wBalance = parseFlexibleNumber(
        r['Angka Saldo'] ?? r['Balance'] ?? r['Saldo Saat Ini'] ?? r['Formatted Balance'] ?? r.Saldo ?? r.FormatSaldo ?? r.balance ?? 0
      );
      const wGoal = r['Angka Target'] || r['Goal Amount'] || r['Target Tabungan'] || r['Formatted Goal'] || r.GoalAmount || r.FormatTarget
        ? parseFlexibleNumber(r['Angka Target'] || r['Goal Amount'] || r['Target Tabungan'] || r['Formatted Goal'] || r.GoalAmount || r.FormatTarget)
        : undefined;

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
        ? categoryRows.map((r, idx) => ({
            id: String(r['Kode Kategori'] || r['Category Code'] || r.ID || r.id || `c-${idx}`),
            name: String(r['Nama Kategori'] || r['Category Name'] || r.Nama || r.name || 'Kategori'),
            type:
              String(r['Jenis Kategori'] || r['Category Type'] || r.Tipe || r.type).toLowerCase().includes('masuk') ||
              String(r['Jenis Kategori'] || r['Category Type'] || r.Tipe || r.type).toLowerCase().includes('income')
                ? 'income'
                : 'expense',
            icon: String(r['Nama Ikon'] || r['Icon Name'] || r.Ikon || r.icon || 'Tag'),
            color: String(r['Kode Warna'] || r['Color Code'] || r.Warna || r.color || '#1f7a5c'),
            monthlyLimit:
              r['Angka Batas Anggaran'] || r['Raw Limit Amount'] || r['Batas Anggaran Bulanan'] || r['Monthly Budget Limit'] || r.MonthlyLimit || r.FormatLimit
                ? parseFlexibleNumber(r['Angka Batas Anggaran'] || r['Raw Limit Amount'] || r['Batas Anggaran Bulanan'] || r['Monthly Budget Limit'] || r.MonthlyLimit || r.FormatLimit)
                : undefined,
            system:
              String(r['Kategori Bawaan Sistem'] || r['System Default'] || r.System || r.system).toLowerCase() === 'ya' ||
              String(r['Kategori Bawaan Sistem'] || r['System Default'] || r.System || r.system).toLowerCase() === 'yes' ||
              r['Kategori Bawaan Sistem'] === true ||
              r.system === true,
          }))
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

    // Parse Transaksi (Seluruh Riwayat Tanpa Batasan)
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
          // Extract source wallet if formatted as "Source ➔ Destination"
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
        const amountVal = r['Angka Nominal'] ?? r.Amount ?? r.Jumlah ?? r['Nominal Transaksi'] ?? r['Formatted Amount'] ?? r.FormatNominal ?? r.amount ?? 0;
        const descVal = r['Catatan / Keterangan'] || r['Notes / Description'] || r.Deskripsi || r.description || 'Transaksi';

        return {
          id: String(r['Kode Transaksi'] || r['Transaction Code'] || r.ID || r.id || `t-${idx}`),
          date: parseExcelDate(dateVal),
          time: timeVal ? String(timeVal) : undefined,
          description: String(descVal),
          categoryId: catId,
          walletId: wId,
          type: typeVal.toLowerCase().includes('masuk') || typeVal.toLowerCase().includes('income') ? 'income' : 'expense',
          amount: parseFlexibleNumber(amountVal),
          linkedWalletId: linkedWId || undefined,
        };
      });

    // Parse Pengaturan (Mata Uang, Bahasa, Tema)
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
