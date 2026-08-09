import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Wallet, PiggyBank, Tag, History, Settings, Leaf, Plus, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from './ThemeToggle';
import AddTransactionModal from './AddTransactionModal';

export default function FloatingNavbar() {
  const { t } = useLanguage();
  const location = useLocation();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreMenuRefDesktop = useRef<HTMLDivElement>(null);
  const moreMenuRefMobile = useRef<HTMLDivElement>(null);

  const PRIMARY_NAV_ITEMS = [
    { to: '/', label: t('nav.dashboard'), icon: LayoutGrid, end: true },
    { to: '/wallets', label: t('nav.wallets'), icon: Wallet, end: false },
    { to: '/history', label: t('nav.history'), icon: History, end: false },
  ];

  const MORE_NAV_ITEMS = [
    { to: '/savings', label: t('nav.savings'), icon: PiggyBank },
    { to: '/categories', label: t('nav.categories'), icon: Tag },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  const isMoreActive = MORE_NAV_ITEMS.some((item) => location.pathname === item.to);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isOutsideDesktop = !moreMenuRefDesktop.current || !moreMenuRefDesktop.current.contains(target);
      const isOutsideMobile = !moreMenuRefMobile.current || !moreMenuRefMobile.current.contains(target);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [moreOpen]);

  return (
    <>
      {/* 0A. AMBIENT GRADIENT-MASKED BLUR (HEADER BOTTOM ZONE) */}
      <div 
        className="fixed top-0 inset-x-0 z-30 pointer-events-none h-20 md:h-24 bg-gradient-to-b from-[var(--color-bg)]/90 via-[var(--color-bg)]/40 to-transparent backdrop-blur-md transition-all duration-300"
        style={{
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        }}
      />

      {/* 0B. AMBIENT GRADIENT-MASKED BLUR (NAVBAR TOP ZONE - MOBILE ONLY) */}
      <div 
        className="fixed bottom-0 inset-x-0 z-30 pointer-events-none h-24 md:hidden bg-gradient-to-t from-[var(--color-bg)]/90 via-[var(--color-bg)]/40 to-transparent backdrop-blur-md transition-all duration-300"
        style={{
          maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
        }}
      />

      {/* 1. DESKTOP & TABLET FLOATING NAVBAR (Top Floating Pill Bar) */}
      <header className="glass-pill fixed top-4 left-1/2 z-40 hidden -translate-x-1/2 md:flex items-center justify-between gap-4 w-[calc(100%-2.5rem)] max-w-[960px] rounded-full border border-[var(--color-border)]/80 px-4 py-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.12)] transition-all duration-300">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0 pl-1 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-[var(--color-primary-contrast)] shadow-sm transition transform group-hover:scale-105">
            <Leaf size={18} strokeWidth={2.4} />
          </div>
          <span className="font-bold tracking-tight text-base text-[var(--color-ink)]">Cakumu</span>
        </NavLink>

        {/* Nav Links Pill Group */}
        <nav className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)]/60 bg-[var(--color-surface-glass-alt)] p-1">
          {PRIMARY_NAV_ITEMS.map((item) => (
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

          {/* Menu Dropdown "Lainnya" */}
          <div ref={moreMenuRefDesktop} className="relative">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isMoreActive || moreOpen
                  ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm scale-[1.02]'
                  : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
              }`}
            >
              <MoreHorizontal size={15} strokeWidth={2} />
              <span>Lainnya</span>
            </button>

            {moreOpen && (
              <div className="glass-panel animate-rise absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-2xl border border-[var(--color-border)]/80 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.18)]">
                {MORE_NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] font-semibold'
                          : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]'
                      }`
                    }
                  >
                    <item.icon size={15} strokeWidth={2} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Actions: Standalone Floating Plus Button & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setAddModalOpen(true)}
            title={t('topbar.addTransaction')}
            aria-label={t('topbar.addTransaction')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[0_4px_14px_rgba(31,122,92,0.35)] transition transform hover:scale-105 active:scale-95"
          >
            <Plus size={20} strokeWidth={2.6} />
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* 2. MOBILE FLOATING TOP HEADER */}
      <header className="glass-panel fixed top-3 left-1/2 z-40 flex md:hidden items-center justify-between gap-2 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl border border-[var(--color-border)]/80 px-3.5 py-2 shadow-[0_8px_25px_rgba(0,0,0,0.1)] transition-all duration-300">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-contrast)]">
            <Leaf size={16} strokeWidth={2.4} />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--color-ink)]">Cakumu</span>
        </NavLink>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* 3. MOBILE FLOATING BOTTOM NAVBAR (Perfectly Aligned 4-Column + Floating Center Button) */}
      <nav className="glass-pill fixed bottom-3 left-1/2 z-40 flex md:hidden items-center justify-between w-[calc(100%-1.5rem)] max-w-[420px] -translate-x-1/2 rounded-full border border-[var(--color-border)]/80 px-3 py-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition-all duration-300">
        {/* Kolom 1 & 2: Dasbor & Dompet */}
        {PRIMARY_NAV_ITEMS.slice(0, 2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-center transition-all active:scale-95 duration-150 ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold scale-105'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full transition ${isActive ? 'bg-[var(--color-primary-soft)]' : ''}`}>
                  <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Floating Centered Action Button (+ Icon Only) */}
        <div className="shrink-0 flex items-center justify-center px-1">
          <button
            onClick={() => {
              setMoreOpen(false);
              setAddModalOpen(true);
            }}
            title={t('topbar.addTransaction')}
            aria-label={t('topbar.addTransaction')}
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] text-[var(--color-primary-contrast)] shadow-[0_6px_20px_rgba(31,122,92,0.45)] ring-4 ring-[var(--color-bg)] transition active:scale-90 hover:scale-105"
          >
            <Plus size={22} strokeWidth={2.6} />
          </button>
        </div>

        {/* Kolom 3: Riwayat */}
        {PRIMARY_NAV_ITEMS.slice(2).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1 text-center transition-all active:scale-95 duration-150 ${
                isActive
                  ? 'text-[var(--color-primary)] font-bold scale-105'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex h-7 w-7 items-center justify-center rounded-full transition ${isActive ? 'bg-[var(--color-primary-soft)]' : ''}`}>
                  <item.icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
                </div>
                <span className="text-[10px] font-medium leading-none mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Kolom 4: Mobile Dropdown "Lainnya" */}
        <div ref={moreMenuRefMobile} className="flex-1 flex flex-col items-center justify-center relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-full py-1 text-center transition-all active:scale-95 duration-150 w-full ${
              isMoreActive || moreOpen
                ? 'text-[var(--color-primary)] font-bold scale-105'
                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            <div className={`flex h-7 w-7 items-center justify-center rounded-full transition ${isMoreActive || moreOpen ? 'bg-[var(--color-primary-soft)]' : ''}`}>
              <MoreHorizontal size={18} strokeWidth={isMoreActive || moreOpen ? 2.4 : 1.8} />
            </div>
            <span className="text-[10px] font-medium leading-none mt-0.5">Lainnya</span>
          </button>

          {moreOpen && (
            <div className="glass-panel animate-rise absolute bottom-16 right-0 z-50 w-44 overflow-hidden rounded-2xl border border-[var(--color-border)]/80 p-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.2)]">
              {MORE_NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                      isActive
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] font-semibold'
                        : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-ink)]'
                    }`
                  }
                >
                  <item.icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Modal Quick Add Transaction */}
      <AddTransactionModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </>
  );
}
