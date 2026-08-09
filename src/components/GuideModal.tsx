import Modal from './Modal';
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
  const FEATURES = [
    {
      icon: LayoutGrid,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
      title: '1. Dasbor & Ringkasan Keuangan',
      desc: 'Menampilkan Total Saldo Gabungan dari seluruh dompet, Ringkasan Pemasukan & Pengeluaran bulan ini, Grafik Lingkaran Pengeluaran per Kategori, serta Indikator Batas Anggaran Keuangan.',
    },
    {
      icon: Wallet,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: '2. Manajemen Dompet (Wallets)',
      desc: 'Kelola berbagai akun keuangan (Kas Tunai, Rekening Bank, E-Wallet). Anda dapat menambah dompet baru, mengedit saldo, serta melakukan Transfer Uang antar dompet tanpa mengubah status pemasukan/pengeluaran luar.',
    },
    {
      icon: PlusCircle,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
      title: '3. Pencatatan Transaksi Cepat (+)',
      desc: 'Gunakan tombol melayang (+) di bagian tengah bawah/atas untuk mencatat transaksi secara instan. Tentukan tipe (Pengeluaran / Pemasukan), nominal, dompet sumber, kategori, tanggal, serta catatan transaksi.',
    },
    {
      icon: PiggyBank,
      color: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
      title: '4. Target Tabungan (Savings Goals)',
      desc: 'Tetapkan target dana impian Anda (mis. Tabungan Darurat, Beli Laptop, Liburan). Anda dapat menyetor (deposit) atau menarik (withdraw) dana khusus tabungan dengan bilah persentase progres yang jelas.',
    },
    {
      icon: Tag,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: '5. Kategori Kustom (Categories)',
      desc: 'Atur kategori pengeluaran dan pemasukan sesuai gaya hidup Anda. Dilengkapi ikon kustom dan palet warna yang mempermudah analisis visual pengeluaran bulanan.',
    },
    {
      icon: History,
      color: 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]',
      title: '6. Riwayat & Filter Lanjutan',
      desc: 'Cari riwayat transaksi berdasarkan nama, kata kunci, rentang tanggal khusus (Kalender), bulan, serta filter kategori. Anda juga bisa mengunduh laporan dalam format file CSV (Excel).',
    },
    {
      icon: Coins,
      color: 'bg-[var(--color-warn-soft)] text-[var(--color-warn)]',
      title: '7. Kurs Real-Time & Multi-Mata Uang',
      desc: 'Sistem kurs nilai tukar mata uang otomatis diperbarui di latar belakang saat terhubung ke internet. Mendukung berbagai mata uang internasional (IDR, USD, EUR, SGD, JPY, MYR, dll).',
    },
    {
      icon: Database,
      color: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
      title: '8. Cadangkan & Pulihkan Data (Backup JSON)',
      desc: 'Amankan seluruh riwayat keuangan Anda dengan fitur Cadangkan Data (JSON). Data cadangan dapat diunggah kembali kapan saja di perangkat lain tanpa khawatir data terhapus.',
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Panduan & Cara Penggunaan">
      <div className="flex flex-col gap-6">
        {/* Banner Selamat Datang */}
        <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)] p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary-strong)] shadow-sm">
            <BookOpen size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-ink)]">Selamat Datang di Cakumu!</h4>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Cakumu adalah aplikasi pencatatan keuangan pribadi yang fleksibel, aman, dan dapat digunakan secara offline. Berikut panduan fungsi dari seluruh fitur yang tersedia.
            </p>
          </div>
        </div>

        {/* List Fitur & Cara Pakai */}
        <div className="flex flex-col gap-4">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Fungsi & Fitur Utama</h5>
          
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
            Tips Penggunaan Cepat
          </h5>
          <ul className="flex flex-col gap-1.5 text-xs text-[var(--color-ink-soft)] list-disc pl-4 leading-relaxed">
            <li>Gunakan tombol <strong>(+)</strong> mengambang di bar navigasi untuk menambah transaksi harian tercepat.</li>
            <li>Lakukan <strong>Cadangkan Data (JSON)</strong> secara berkala di menu Pengaturan agar catatan keuangan Anda selalu aman.</li>
            <li>Pengubahan jenis mata uang akan otomatis mengkonversi tampilan total saldo sesuai kurs real-time terbaru.</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
