import type { Category, Transaction, Wallet } from './types';

export const DEFAULT_WALLETS: Wallet[] = [
  { id: 'w-cash', name: 'Wallet Cash', type: 'cash', balance: 420, color: '#c9a84c' },
  { id: 'w-checking', name: 'Everyday Checking', type: 'bank', balance: 3840.5, color: '#3c6ea5', institution: 'Horizon Bank' },
  { id: 'w-savings', name: 'Home Down Payment', type: 'savings', balance: 12250, color: '#1f7a5c', goalAmount: 30000 },
  { id: 'w-digital', name: 'Digital Wallet', type: 'digital', balance: 615.2, color: '#8a5fc9' },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c-salary', name: 'Gaji', icon: 'Landmark', color: '#1f7a5c', type: 'income' },
  { id: 'c-freelance', name: 'Pekerjaan Sampingan', icon: 'Laptop', color: '#3c6ea5', type: 'income' },
  { id: 'c-gift', name: 'Hadiah', icon: 'Gift', color: '#c9a84c', type: 'income' },
  { id: 'c-groceries', name: 'Belanja Bulanan', icon: 'ShoppingCart', color: '#c1704a', type: 'expense' },
  { id: 'c-dining', name: 'Makan-makan', icon: 'UtensilsCrossed', color: '#b5523e', type: 'expense' },
  { id: 'c-transport', name: 'Transportasi', icon: 'Bus', color: '#8a5fc9', type: 'expense' },
  { id: 'c-housing', name: 'Tempat Tinggal', icon: 'Home', color: '#3c6ea5', type: 'expense' },
  { id: 'c-utilities', name: 'Tagihan & Utilitas', icon: 'Plug', color: '#4d8fa6', type: 'expense' },
  { id: 'c-health', name: 'Kesehatan', icon: 'HeartPulse', color: '#c1465f', type: 'expense' },
  { id: 'c-entertainment', name: 'Hiburan', icon: 'Clapperboard', color: '#c9a84c', type: 'expense' },
  { id: 'c-shopping', name: 'Belanja', icon: 'ShoppingBag', color: '#d1834f', type: 'expense' },
  { id: 'c-subscriptions', name: 'Langganan', icon: 'Repeat', color: '#6a7a4f', type: 'expense' },
  // Kategori sistem: dipakai otomatis saat isi saldo / transfer antar dompet, disembunyikan dari halaman Kategori.
  { id: 'c-topup-in', name: 'Menabung', icon: 'ArrowDownToLine', color: '#1f7a5c', type: 'income', system: true },
  { id: 'c-topup-out', name: 'Transfer Dompet', icon: 'ArrowUpFromLine', color: '#c1704a', type: 'expense', system: true },
];

function d(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: d(1), description: 'Monthly salary', categoryId: 'c-salary', walletId: 'w-checking', type: 'income', amount: 4200 },
  { id: 't2', date: d(2), description: 'Whole Foods run', categoryId: 'c-groceries', walletId: 'w-checking', type: 'expense', amount: 86.4 },
  { id: 't3', date: d(2), description: 'Metro pass', categoryId: 'c-transport', walletId: 'w-cash', type: 'expense', amount: 45 },
  { id: 't4', date: d(3), description: 'Ramen with friends', categoryId: 'c-dining', walletId: 'w-digital', type: 'expense', amount: 32.5 },
  { id: 't5', date: d(4), description: 'Rent', categoryId: 'c-housing', walletId: 'w-checking', type: 'expense', amount: 1450 },
  { id: 't6', date: d(5), description: 'Electricity bill', categoryId: 'c-utilities', walletId: 'w-checking', type: 'expense', amount: 78.2 },
  { id: 't7', date: d(6), description: 'Logo design gig', categoryId: 'c-freelance', walletId: 'w-digital', type: 'income', amount: 650 },
  { id: 't8', date: d(7), description: 'Movie night', categoryId: 'c-entertainment', walletId: 'w-cash', type: 'expense', amount: 28 },
  { id: 't9', date: d(8), description: 'Pharmacy', categoryId: 'c-health', walletId: 'w-checking', type: 'expense', amount: 54.9 },
  { id: 't10', date: d(9), description: 'New sneakers', categoryId: 'c-shopping', walletId: 'w-digital', type: 'expense', amount: 120 },
  { id: 't11', date: d(10), description: 'Streaming bundle', categoryId: 'c-subscriptions', walletId: 'w-checking', type: 'expense', amount: 24.99 },
  { id: 't12', date: d(11), description: 'Farmers market', categoryId: 'c-groceries', walletId: 'w-cash', type: 'expense', amount: 41.3 },
  { id: 't13', date: d(12), description: 'Birthday gift received', categoryId: 'c-gift', walletId: 'w-cash', type: 'income', amount: 100 },
  { id: 't14', date: d(13), description: 'Taxi ride', categoryId: 'c-transport', walletId: 'w-digital', type: 'expense', amount: 22.5 },
  { id: 't15', date: d(15), description: 'Sushi dinner', categoryId: 'c-dining', walletId: 'w-checking', type: 'expense', amount: 68 },
  { id: 't16', date: d(17), description: 'Gas bill', categoryId: 'c-utilities', walletId: 'w-checking', type: 'expense', amount: 41.75 },
  { id: 't17', date: d(19), description: 'Concert tickets', categoryId: 'c-entertainment', walletId: 'w-digital', type: 'expense', amount: 95 },
  { id: 't18', date: d(21), description: 'Grocery restock', categoryId: 'c-groceries', walletId: 'w-checking', type: 'expense', amount: 102.15 },
  { id: 't19', date: d(24), description: 'Side project payout', categoryId: 'c-freelance', walletId: 'w-checking', type: 'income', amount: 480 },
  { id: 't20', date: d(27), description: 'Coffee subscription', categoryId: 'c-subscriptions', walletId: 'w-digital', type: 'expense', amount: 18 },
  { id: 't21', date: d(33), description: 'Salary', categoryId: 'c-salary', walletId: 'w-checking', type: 'income', amount: 4200 },
  { id: 't22', date: d(35), description: 'Rent', categoryId: 'c-housing', walletId: 'w-checking', type: 'expense', amount: 1450 },
  { id: 't23', date: d(38), description: 'Groceries', categoryId: 'c-groceries', walletId: 'w-cash', type: 'expense', amount: 76.4 },
  { id: 't24', date: d(41), description: 'Dinner out', categoryId: 'c-dining', walletId: 'w-digital', type: 'expense', amount: 54 },
  { id: 't25', date: d(45), description: 'Utilities', categoryId: 'c-utilities', walletId: 'w-checking', type: 'expense', amount: 64.3 },
  { id: 't26', date: d(50), description: 'Freelance retainer', categoryId: 'c-freelance', walletId: 'w-digital', type: 'income', amount: 900 },
  { id: 't27', date: d(55), description: 'New headphones', categoryId: 'c-shopping', walletId: 'w-checking', type: 'expense', amount: 149 },
  { id: 't28', date: d(60), description: 'Salary', categoryId: 'c-salary', walletId: 'w-checking', type: 'income', amount: 4100 },
  { id: 't29', date: d(63), description: 'Rent', categoryId: 'c-housing', walletId: 'w-checking', type: 'expense', amount: 1450 },
  { id: 't30', date: d(66), description: 'Groceries', categoryId: 'c-groceries', walletId: 'w-cash', type: 'expense', amount: 92.6 },
];
