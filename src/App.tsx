import { HashRouter, Routes, Route } from 'react-router-dom'; 
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import FloatingNavbar from './components/FloatingNavbar';
import PageTransition from './components/PageTransition';

// 1. PASTIKAN SEMUA HALAMAN DIIMPOR DI SINI (Termasuk Savings)
import Dashboard from './pages/Dashboard';
import Wallets from './pages/Wallets';
import Savings from './pages/Savings'; 
import Categories from './pages/Categories';
import History from './pages/History';
import Settings from './pages/Settings';

function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-x-hidden">
      <FloatingNavbar />

      <main className="mx-auto w-full max-w-[1100px] px-4 pt-20 pb-24 md:pt-28 md:pb-12 sm:px-6 lg:px-10">
        <PageTransition>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wallets" element={<Wallets />} />
            <Route path="/savings" element={<Savings />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </PageTransition>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FinanceProvider>
          <HashRouter> 
            <AppShell />
          </HashRouter>
        </FinanceProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}