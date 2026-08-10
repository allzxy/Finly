<div align="center">

  <h1>💰 Finly — Sahabat Keuangan Pribadimu</h1>

  <p>
    <b>Aplikasi Pelacak & Pencatat Keuangan Pribadi Modern, Ringan, Sangat Cepat, & Offline-First.</b>
  </p>

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-7.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-4.2-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://github.com/allzxy/Finly/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="License" /></a>
  </p>

  <p>
    <a href="#-fitur-unggulan">Fitur Utama</a> •
    <a href="#-teknologi-utama">Teknologi</a> •
    <a href="#-panduan-instalasi">Panduan Instalasi</a> •
    <a href="#-struktur-proyek">Struktur Proyek</a> •
    <a href="#-lisensi">Lisensi</a>
  </p>

  ---

</div>

## 📌 Sekilas Tentang Finly

**Finly** (*Finance + Friendly*) adalah aplikasi web pencatatan keuangan pribadi modern berdesain *frosted glassmorphism* yang dirancang untuk kecepatan tinggi, fleksibilitas multi-dompet, dan privasi penuh. Seluruh data keuangan Anda tersimpan 100% secara lokal di perangkat Anda (*Offline-First*).

---

## ✨ Fitur Unggulan

- 📊 **Dasbor & Nisbah Anggaran Bulanan**: Monitoring total saldo gabungan, grafik transaksi harian, diagram lingkaran kategori pengeluaran, serta indikator kesehatan nisbah pengeluaran bulanan (*Budget Health Bar*).
- 💳 **Manajemen Multi-Dompet**: Kelola akun kas tunai, rekening bank, e-wallet, dan tabungan khusus secara terpisah. Mendukung fitur **Transfer Uang** antar dompet tanpa merusak alur pemasukan/pengeluaran luar.
- 🎯 **Target Tabungan (*Savings Goals*)**: Tetapkan impian tabungan dengan persentase progres real-time. Menabung hanya mengalokasikan saldo tabungan tanpa mempengaruhi saldo nyata di dasbor.
- ⏱️ **Pencatatan Jam Real-Time Otomatis**: Setiap transaksi pengeluaran atau pemasukan secara otomatis menyimpan jam & menit real-time (`HH:mm`) di latar belakang dan menampilkannya dengan presisi di riwayat.
- 🌐 **Kurs Real-Time & Multi-Mata Uang**: Konversi otomatis total saldo ke berbagai mata uang internasional (IDR, USD, EUR, SGD, JPY, MYR, dll) dengan pembaruan kurs latar belakang saat terhubung ke internet.
- 📊 **Cadangkan & Pulihkan Format Excel (.xlsx)**: Fitur ekspor & impor cadangan data murni berformat **Microsoft Excel (.xlsx)** multi-sheet yang dapat langsung dibuka, diedit, atau dicetak di PC/HP.
- 📱 **Dukungan Progressive Web App (PWA)**: Siap diinstall langsung ke Layar Utama (*Home Screen*) HP atau Desktop Anda sebagai aplikasi mandiri.
- 🎨 **Desain Glassmorphism & GPU Accelerated Animations**: Tampilan antarmuka *modern dark/light mode*, modal bottom sheet bergaya iOS (`rounded-[32px]`), serta transisi halaman berakselerasi GPU (`0.22s translate3d`).

---

## 🛠️ Teknologi Utama

Aplikasi ini dibangun menggunakan *tech stack* web modern untuk performa maksimal:

- **Core**: [React 19](https://react.dev/), [TypeScript 5.9](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Vanilla HSL CSS Variables
- **Icons**: [Lucide React](https://lucide.dev/)
- **Excel Engine**: [SheetJS (XLSX)](https://sheetjs.com/)
- **Routing**: [React Router v7 (HashRouter)](https://reactrouter.com/)

---

## 🚀 Panduan Instalasi

### Prasyarat
- [Node.js](https://nodejs.org/) v18.0.0 atau yang lebih baru
- [npm](https://www.npmjs.com/) v9.0.0 atau yang lebih baru

### Langkah Instalasi Lokal

1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/allzxy/Finly.git
   cd Finly
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka browser dan akses `http://localhost:5173`.

4. **Kompilasi Produksi (*Build*)**:
   ```bash
   npm run build
   ```
   Hasil kompilasi produksi siap di-deploy dan berada di folder `dist/`.

---

## 📁 Struktur Proyek

```text
Finly/
├── public/
│   ├── favicon.svg
│   └── manifest.webmanifest
├── src/
│   ├── components/       # Komponen UI (Modal, Navbar, Chart, Cards, List)
│   ├── context/          # Context State (Finance, Theme, Language, Toast)
│   ├── lib/              # Utility, Seed, Exchange Rates, Excel Engine, Types
│   ├── pages/            # Halaman (Dashboard, Wallets, Savings, Categories, History, Settings)
│   ├── App.tsx           # Entrypoint Aplikasi & Routing
│   ├── index.css         # Design System, Glassmorphism, & Animations
│   └── main.tsx          # React DOM Renderer
├── index.html            # File Template HTML Utama
├── package.json          # Manifest Dependensi Proyek
├── tsconfig.json         # Konfigurasi TypeScript
└── vite.config.ts        # Konfigurasi Vite Build Tool
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **Lisensi MIT** — lihat file [LICENSE](file:///c:/Users/DKV%20SMK%20AL-HUDA/Documents/Cakumu/LICENSE) untuk rincian selengkapnya.

---

<div align="center">
  <sub>Dikembangkan dengan ❤️ untuk kemudahan pengelolaan keuangan pribadi.</sub>
</div>
