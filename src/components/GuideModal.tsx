import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import { 
  LayoutGrid, 
  Wallet, 
  PlusCircle, 
  PiggyBank, 
  Tag, 
  History, 
  Coins, 
  Database, 
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function GuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, language } = useLanguage();

  const isEn = language === 'en';

  const FEATURES = [
    {
      icon: LayoutGrid,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
      title: isEn ? '1. Dashboard & Financial Summary' : '1. Dasbor & Ringkasan Keuangan',
      desc: isEn 
        ? 'Displays Combined Total Balance across all wallets, Income & Expense summary for this month, Category Spending Donut Chart, and Budget Limit Indicators.'
        : 'Menampilkan Total Saldo Gabungan dari seluruh dompet, Ringkasan Pemasukan & Pengeluaran bulan ini, Grafik Lingkaran Pengeluaran per Kategori, serta Indikator Batas Anggaran Keuangan.',
    },
    {
      icon: Wallet,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: isEn ? '2. Wallet Management' : '2. Manajemen Dompet (Wallets)',
      desc: isEn
        ? 'Manage cash, bank accounts, and digital wallets. Add new wallets, adjust balances, and transfer funds between wallets.'
        : 'Kelola berbagai akun keuangan (Kas Tunai, Rekening Bank, E-Wallet). Anda dapat menambah dompet baru, mengedit saldo, serta melakukan Transfer Uang antar dompet.',
    },
    {
      icon: PlusCircle,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
      title: isEn ? '3. Quick Transaction Entry (+)' : '3. Pencatatan Transaksi Cepat (+)',
      desc: isEn
        ? 'Use the floating (+) button to quickly record transactions with type, amount, source wallet, category, date, and notes.'
        : 'Gunakan tombol melayang (+) di bagian tengah bawah/atas untuk mencatat transaksi secara instan. Tentukan tipe (Pengeluaran / Pemasukan), nominal, dompet sumber, kategori, tanggal, serta catatan.',
    },
    {
      icon: PiggyBank,
      color: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
      title: isEn ? '4. Savings Goals' : '4. Target Tabungan (Savings Goals)',
      desc: isEn
        ? 'Set savings targets for your dream goals and deposit or withdraw funds with a clear progress bar.'
        : 'Tetapkan target dana impian Anda (mis. Tabungan Darurat, Beli Laptop, Liburan). Anda dapat menyetor atau menarik dana khusus tabungan dengan bilah persentase progres yang jelas.',
    },
    {
      icon: Tag,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: isEn ? '5. Custom Categories' : '5. Kategori Kustom (Categories)',
      desc: isEn
        ? 'Organize income and expense categories to fit your lifestyle with custom icons, colors, and monthly limits.'
        : 'Atur kategori pengeluaran dan pemasukan sesuai gaya hidup Anda. Dilengkapi ikon kustom dan palet warna yang mempermudah analisis visual pengeluaran bulanan.',
    },
    {
      icon: History,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
      title: isEn ? '6. History & Advanced Filters' : '6. Riwayat & Filter Lanjutan',
      desc: isEn
        ? 'Filter transactions by keyword, date range, month, and categories.'
        : 'Cari riwayat transaksi berdasarkan nama, kata kunci, rentang tanggal khusus (Kalender), bulan, serta filter kategori.',
    },
    {
      icon: Coins,
      color: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
      title: isEn ? '7. Real-Time Rates & Multi-Currency' : '7. Kurs Real-Time & Multi-Mata Uang',
      desc: isEn
        ? 'Automatic live exchange rates update when connected online. Supports international currencies (IDR, USD, EUR, SGD, JPY, MYR, etc).'
        : 'Sistem kurs nilai tukar mata uang otomatis diperbarui di latar belakang saat terhubung ke internet. Mendukung berbagai mata uang internasional (IDR, USD, EUR, SGD, JPY, MYR, dll).',
    },
    {
      icon: Database,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: isEn ? '8. Backup & Restore Data (Excel .xlsx)' : '8. Cadangkan & Pulihkan Data (Backup Excel .xlsx)',
      desc: isEn
        ? 'Secure your financial history with Excel (.xlsx) data backup, which can be restored anytime on any device.'
        : 'Amankan seluruh riwayat keuangan Anda dengan fitur Cadangkan Data (Excel .xlsx). Data cadangan dapat diunggah kembali kapan saja di perangkat lain tanpa khawatir data terhapus.',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('guide.modalTitle')}>
      <div className="flex flex-col gap-6">
        {/* Banner Selamat Datang */}
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary-strong)] shadow-sm">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-ink)]">
              {isEn ? 'Welcome to Finly!' : 'Selamat Datang di Finly!'}
            </h4>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              {isEn
                ? 'Finly is a light, fast, and offline-friendly personal finance tracker. Here is a guide to all available features.'
                : 'Finly adalah aplikasi pencatatan keuangan pribadi yang fleksibel, aman, dan dapat digunakan secara offline. Berikut panduan fungsi dari seluruh fitur yang tersedia.'}
            </p>
          </div>
        </div>

        {/* List Fitur & Cara Pakai */}
        <div className="flex flex-col gap-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
            {isEn ? 'Main Functions & Features' : 'Fungsi & Fitur Utama'}
          </h5>
          
          <div className="flex flex-col gap-3">
            {FEATURES.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-3.5 rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-surface)] p-3.5 shadow-sm transition hover:border-[var(--color-primary)]/40"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h6 className="text-xs font-bold text-[var(--color-ink)]">{item.title}</h6>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Penggunaan Cepat */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
          <h5 className="mb-2 text-xs font-bold text-[var(--color-ink)] flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[var(--color-primary)]" />
            {isEn ? 'Quick Tips' : 'Tips Penggunaan Cepat'}
          </h5>
          <ul className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-soft)] list-disc pl-4 leading-relaxed">
            <li>{isEn ? 'Use the floating (+) button in the navbar for quick daily transaction entries.' : 'Gunakan tombol (+) mengambang di bar navigasi untuk menambah transaksi harian tercepat.'}</li>
            <li>{isEn ? 'Regularly backup data to Excel (.xlsx) from Settings to keep your records safe.' : 'Lakukan Cadangkan Data (Excel .xlsx) secara berkala di menu Pengaturan agar catatan keuangan Anda selalu aman.'}</li>
            <li>{isEn ? 'Changing the display currency automatically converts your balances with live rates.' : 'Pengubahan jenis mata uang akan otomatis mengkonversi tampilan total saldo sesuai kurs real-time terbaru.'}</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
