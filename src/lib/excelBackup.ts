import * as XLSX from 'xlsx';
import type { Wallet, Category, Transaction } from './types';
import { DEFAULT_CATEGORIES } from './seed';

export interface BackupData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currencyCode: string;
}

export function exportToExcelBuffer(data: BackupData): Uint8Array {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Transaksi
  const txRows = data.transactions.map((t) => ({
    ID: t.id,
    Tanggal: t.date,
    Jam: t.time ?? '',
    Tipe: t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Jumlah: t.amount,
    CategoryID: t.categoryId,
    WalletID: t.walletId,
    Deskripsi: t.description,
    LinkedWalletID: t.linkedWalletId ?? '',
  }));
  const txSheet = XLSX.utils.json_to_sheet(txRows.length > 0 ? txRows : [
    { ID: '', Tanggal: '', Jam: '', Tipe: '', Jumlah: 0, CategoryID: '', WalletID: '', Deskripsi: '', LinkedWalletID: '' }
  ]);

  // 2. Sheet Dompet
  const walletRows = data.wallets.map((w) => ({
    ID: w.id,
    Nama: w.name,
    Tipe: w.type,
    Saldo: w.balance,
    Warna: w.color,
    GoalAmount: w.goalAmount ?? 0,
    Institution: w.institution ?? '',
    LinkedWalletID: w.linkedWalletId ?? '',
  }));
  const walletSheet = XLSX.utils.json_to_sheet(walletRows);

  // 3. Sheet Kategori
  const categoryRows = data.categories.map((c) => ({
    ID: c.id,
    Nama: c.name,
    Tipe: c.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    Ikon: c.icon,
    Warna: c.color,
    MonthlyLimit: c.monthlyLimit ?? 0,
    System: c.system ? 'Ya' : 'Tidak',
  }));
  const categorySheet = XLSX.utils.json_to_sheet(categoryRows);

  // 4. Sheet Pengaturan
  const settingRows = [
    { MataUang: data.currencyCode, Versi: '1.0' }
  ];
  const settingSheet = XLSX.utils.json_to_sheet(settingRows);

  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');
  XLSX.utils.book_append_sheet(wb, walletSheet, 'Dompet');
  XLSX.utils.book_append_sheet(wb, categorySheet, 'Kategori');
  XLSX.utils.book_append_sheet(wb, settingSheet, 'Pengaturan');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as unknown as Uint8Array;
}

export function importFromExcelBuffer(buffer: ArrayBuffer): BackupData | null {
  try {
    const wb = XLSX.read(buffer, { type: 'array' });
    
    // Parse Dompet
    const walletSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('dompet') || s.toLowerCase().includes('wallet'));
    const walletRows = walletSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[walletSheetName]) : [];
    
    const wallets: Wallet[] = walletRows.map((r, idx) => ({
      id: String(r.ID || r.id || `w-${idx}`),
      name: String(r.Nama || r.name || 'Dompet'),
      type: (['cash', 'bank', 'savings', 'digital'].includes(String(r.Tipe || r.type)) ? String(r.Tipe || r.type) : 'cash') as Wallet['type'],
      balance: Number(r.Saldo ?? r.balance ?? 0),
      color: String(r.Warna || r.color || '#1f7a5c'),
      goalAmount: r.GoalAmount ? Number(r.GoalAmount) : undefined,
      institution: r.Institution ? String(r.Institution) : undefined,
      linkedWalletId: r.LinkedWalletID ? String(r.LinkedWalletID) : undefined,
    }));

    // Parse Kategori
    const categorySheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('kategori') || s.toLowerCase().includes('category'));
    const categoryRows = categorySheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[categorySheetName]) : [];
    
    const categories: Category[] = categoryRows.length > 0 
      ? categoryRows.map((r, idx) => ({
          id: String(r.ID || r.id || `c-${idx}`),
          name: String(r.Nama || r.name || 'Kategori'),
          type: String(r.Tipe || r.type).toLowerCase().includes('masuk') || String(r.Tipe || r.type) === 'income' ? 'income' : 'expense',
          icon: String(r.Ikon || r.icon || 'Tag'),
          color: String(r.Warna || r.color || '#1f7a5c'),
          monthlyLimit: r.MonthlyLimit ? Number(r.MonthlyLimit) : undefined,
          system: String(r.System || r.system).toLowerCase() === 'ya' || r.system === true,
        }))
      : DEFAULT_CATEGORIES;

    // Parse Transaksi
    const txSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('transaksi') || s.toLowerCase().includes('transaction'));
    const txRows = txSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[txSheetName]) : [];
    
    const transactions: Transaction[] = txRows
      .filter((r) => r.Tanggal || r.date)
      .map((r, idx) => ({
        id: String(r.ID || r.id || `t-${idx}`),
        date: String(r.Tanggal || r.date).slice(0, 10),
        time: r.Jam || r.time ? String(r.Jam || r.time) : undefined,
        description: String(r.Deskripsi || r.description || 'Transaksi'),
        categoryId: String(r.CategoryID || r.categoryId || ''),
        walletId: String(r.WalletID || r.walletId || wallets[0]?.id || ''),
        type: String(r.Tipe || r.type).toLowerCase().includes('masuk') || String(r.Tipe || r.type) === 'income' ? 'income' : 'expense',
        amount: Number(r.Jumlah ?? r.amount ?? 0),
        linkedWalletId: r.LinkedWalletID ? String(r.LinkedWalletID) : undefined,
      }));

    // Parse Pengaturan
    const settingSheetName = wb.SheetNames.find((s) => s.toLowerCase().includes('pengaturan') || s.toLowerCase().includes('setting'));
    const settingRows = settingSheetName ? XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[settingSheetName]) : [];
    const currencyCode = settingRows[0]?.MataUang || settingRows[0]?.currencyCode ? String(settingRows[0].MataUang || settingRows[0].currencyCode) : 'IDR';

    return {
      wallets,
      categories,
      transactions,
      currencyCode,
    };
  } catch {
    return null;
  }
}
