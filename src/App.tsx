import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom'; 
import { FinanceProvider } from './context/FinanceContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import FloatingNavbar from './components/FloatingNavbar';
import PageTransition from './components/PageTransition';

// Lazy load pages to maximize initial render speed (LCP/FCP) on low-end devices
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Wallets = lazy(() => import('./pages/Wallets'));
const Savings = lazy(() => import('./pages/Savings'));
const Categories = lazy(() => import('./pages/Categories'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));

function PageFallback() {
  return (
    <div className="w-full flex flex-col gap-5 animate-pulse pt-2">
      <div className="h-10 w-48 rounded-2xl bg-[var(--color-surface-alt)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl bg-[var(--color-surface-alt)]" />
        <div className="h-28 rounded-2xl bg-[var(--color-surface-alt)]" />
        <div className="h-28 rounded-2xl bg-[var(--color-surface-alt)]" />
        <div className="h-28 rounded-2xl bg-[var(--color-surface-alt)]" />
      </div>
      <div className="h-64 rounded-2xl bg-[var(--color-surface-alt)] mt-2" />
    </div>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] overflow-x-hidden">
      <FloatingNavbar />

      <main className="w-full max-w-7xl mx-auto px-3 pt-18 pb-24 sm:px-6 lg:px-8 lg:pt-24 lg:pb-12">
        <PageTransition>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </PageTransition>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <FinanceProvider>
            <HashRouter> 
              <AppShell />
            </HashRouter>
          </FinanceProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}