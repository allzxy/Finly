import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import SummaryCards from '../components/SummaryCards';
import DailyChart from '../components/DailyChart';
import CategoryBreakdown from '../components/CategoryBreakdown';
import TransactionList from '../components/TransactionList';
import MonthFilter from '../components/MonthFilter';
import Topbar from '../components/Topbar';

function prevMonthKey(month: string) {
  const [y, m] = month.split('-').map(Number);
  const date = new Date(y, m - 2, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function pctDelta(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / prior) * 100;
}

export default function Dashboard() {
  const { transactions, categories, wallets, selectedMonth, setSelectedMonth } = useFinance();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthTx = useMemo(() => transactions.filter((tx) => tx.date.slice(0, 7) === selectedMonth), [transactions, selectedMonth]);
  const scopedTx = useMemo(() => (selectedDate ? monthTx.filter((tx) => tx.date === selectedDate) : monthTx), [monthTx, selectedDate]);
  const priorScopeTx = useMemo(() => {
    if (selectedDate) {
      const day = selectedDate.slice(8, 10);
      const priorDate = `${prevMonthKey(selectedMonth)}-${day}`;
      return transactions.filter((tx) => tx.date === priorDate);
    }
    return transactions.filter((tx) => tx.date.slice(0, 7) === prevMonthKey(selectedMonth));
  }, [transactions, selectedMonth, selectedDate]);

  // PERBAIKAN 1: Filter Pemasukan Murni
  // Hanya menjumlahkan type 'income' yang TIDAK memiliki linkedWalletId (bukan tabungan/transfer)
  const income = scopedTx
    .filter((tx) => tx.type === 'income' && !tx.linkedWalletId)
    .reduce((s, tx) => s + tx.amount, 0);
  
  // PERBAIKAN 2: Filter Pengeluaran Murni
  const spending = scopedTx
    .filter((tx) => tx.type === 'expense' && !tx.linkedWalletId)
    .reduce((s, tx) => s + tx.amount, 0);
  
  const balance = wallets.filter((w) => w.type !== 'savings').reduce((s, w) => s + w.balance, 0);

  const priorIncome = priorScopeTx
    .filter((tx) => tx.type === 'income' && !tx.linkedWalletId)
    .reduce((s, tx) => s + tx.amount, 0);
    
  const priorSpending = priorScopeTx
    .filter((tx) => tx.type === 'expense' && !tx.linkedWalletId)
    .reduce((s, tx) => s + tx.amount, 0);

  const handleMonthChange = (month: string) => { setSelectedMonth(month); setSelectedDate(null); };

  const recentTx = useMemo(() => {
    if (selectedDate || scopedTx.length > 0) return scopedTx;
    return transactions;
  }, [selectedDate, scopedTx, transactions]);

  return (
    <div className="flex flex-col gap-6">
      <Topbar title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthFilter value={selectedMonth} onChange={handleMonthChange} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        {selectedDate && (
          <button onClick={() => setSelectedDate(null)} className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary)]/20">
            {t('dashboard.dateChip', { day: selectedDate.slice(8, 10) })}
          </button>
        )}
      </div>
      
      {/* SummaryCards kini hanya menerima angka murni (tanpa distorsi dari uang tabungan) */}
      <SummaryCards 
        income={income} 
        spending={spending} 
        balance={balance} 
        incomeDelta={pctDelta(income, priorIncome)} 
        spendingDelta={pctDelta(spending, priorSpending)} 
        scopeLabel={selectedDate ? t('summary.scopeDate', { day: selectedDate.slice(8, 10) }) : t('summary.scopeMonth')} 
      />
      
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3"><DailyChart transactions={monthTx} month={selectedMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate} /></div>
        <div className="xl:col-span-2"><CategoryBreakdown transactions={scopedTx} categories={categories} onManage={() => navigate('/categories')} /></div>
      </div>
      
      {/* TransactionList menerima recentTx untuk menampilkan riwayat transaksi terbaru */}
      <TransactionList transactions={recentTx} preview />
    </div>
  );
}