import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Wallet, PiggyBank, Tag, History, Settings, Leaf, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import AddTransactionModal from './AddTransactionModal';

export default function FloatingNavbar() {
  const { t } = useLanguage();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const NAV_ITEMS = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutGrid, end: true },
    { to: '/wallets', label: t('nav.wallets'), icon: Wallet, end: false },
    { to: '/savings', label: t('nav.savings'), icon: PiggyBank, end: false },
    { to: '/categories', label: t('nav.categories'), icon: Tag, end: false },
    { to: '/history', label: t('nav.history'), icon: History, end: false },
    { to: '/settings', label: t('nav.settings'), icon: Settings, end: false },
  ];

  return (
    <>
      {/* 1. DESKTOP & TABLET FLOATING NAVBAR (Top Floating Pill) */}
      <header className="fixed top-4 left-1/2 z-40 hidden -translate-x-1/2 md:flex items-center justify-between gap-4 w-[calc(100%-2.5rem)] max-w-[1020px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/85 px-4 py-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0 pl-1 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[var(--color-primary-contrast)] shadow-sm transition transform group-hover:scale-105">
            <Leaf size={18} strokeWidth={2.4} />
          </div>
          <span className="font-bold tracking-tight text-base text-[var(--color-ink)]">Cakumu</span>
        </NavLink>

        {/* Nav Links Pill Group */}
        <nav className="flex items-center gap-1 rounded-full border border-[var(--color-border)]/60 bg-[var(--color-surface-alt)]/60 p-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm scale-[1.02]'
                    : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              <item.icon size={15} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-primary-contrast)] shadow-sm transition hover:bg-[var(--color-primary-strong)] active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('common.add')}</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* 2. MOBILE FLOATING TOP HEADER */}
      <header className="fixed top-3 left-1/2 z-40 flex md:hidden items-center justify-between gap-2 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-3.5 py-2.5 shadow-[0_6px_25px_rgb(0,0,0,0.08)] backdrop-blur-xl">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)]">
            <Leaf size={16} strokeWidth={2.4} />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--color-ink)]">Cakumu</span>
        </NavLink>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex h-9 items-center gap-1 rounded-xl bg-[var(--color-primary)] px-3 text-xs font-semibold text-[var(--color-primary-contrast)] shadow-sm active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>{t('common.add')}</span>
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* 3. MOBILE FLOATING BOTTOM NAVBAR */}
      <nav className="fixed bottom-3 left-1/2 z-40 flex md:hidden items-center justify-around w-[calc(100%-1.5rem)] max-w-[440px] -translate-x-1/2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-2 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 px-2.5 transition-all ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold scale-105'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full transition ${isActive ? 'bg-[var(--color-primary-soft)]' : ''}`}>
                  <item.icon size={17} strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span className="text-[10px] leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Modal Quick Add Transaction */}
      <AddTransactionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
