import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_LABELS } from '../lib/i18n';
import Topbar from '../components/Topbar';
import CurrencyModal from '../components/CurrencyModal';
import LanguageModal from '../components/LanguageModal';
import AboutModal from '../components/AboutModal';
import GuideModal from '../components/GuideModal';
import BackupModal from '../components/BackupModal';
import { Coins, ChevronRight, Radio, WifiOff, Languages, Info, BookOpen, Database } from 'lucide-react';

export default function Settings() {
  const { currency, liveRates } = useFinance();
  const { language, t } = useLanguage();
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLanguage, setShowLanguage] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const isEn = language === 'en';

  return (
    <div className="flex flex-col gap-6">
      <Topbar title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {/* 1. Panduan & Cara Penggunaan */}
        <div className="rounded-2xl border border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/20 p-5 shadow-[var(--shadow-flat)] transition hover:border-[var(--color-primary)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
              <BookOpen size={16} />
            </div>
            <h3 className="text-sm font-bold text-[var(--color-ink)]">
              {isEn ? 'User Guide & Tutorial' : 'Panduan & Cara Penggunaan'}
            </h3>
          </div>
          <p className="mb-3.5 text-xs text-[var(--color-ink-soft)] leading-relaxed">
            {isEn
              ? 'Learn all functions and features of Finly (Dashboard, Wallets, Savings, Transactions, Exchange Rates, etc).'
              : 'Pelajari fungsi lengkap dari setiap fitur Finly (Dasbor, Dompet, Tabungan, Transaksi, Kurs, dll).'}
          </p>
          <button
            onClick={() => setShowGuide(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-[var(--color-primary-contrast)] shadow-sm transition transform hover:scale-[1.01] active:scale-95"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={14} />
              <span>{isEn ? 'Open User Guide' : 'Buka Panduan Penggunaan'}</span>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>

        {/* 2. Cadangan & Pulihkan Data */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Database size={16} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('settings.backup.title')}</h3>
          </div>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">{t('settings.backup.desc')}</p>
          <button
            onClick={() => setShowBackup(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-left transition hover:border-[var(--color-accent)]/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Database size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{t('backup.title')}</span>
              <span className="block truncate text-xs text-[var(--color-muted)]">{t('backup.exportDesc')}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* 3. Mata Uang */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Coins size={15} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('settings.currency.title')}</h3>
          </div>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">{t('settings.currency.desc')}</p>
          <div
            className={`mb-3 flex items-center gap-1.5 text-[11px] font-medium ${
              liveRates.isLive ? 'text-[var(--color-primary)]' : 'text-[var(--color-warn)]'
            }`}
          >
            {liveRates.isLive ? <Radio size={11} /> : <WifiOff size={11} />}
            {liveRates.isLive ? t('currency.liveOnShort') : t('currency.liveOffShort')}
          </div>
          <button
            onClick={() => setShowCurrency(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-left transition hover:border-[var(--color-primary)]/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-base font-semibold text-[var(--color-primary-strong)]">
              {currency.symbol}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{currency.code}</span>
              <span className="block truncate text-xs text-[var(--color-muted)]">{currency.label}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* 4. Bahasa */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Languages size={15} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('settings.language.title')}</h3>
          </div>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">{t('settings.language.desc')}</p>
          <button
            onClick={() => setShowLanguage(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-left transition hover:border-[var(--color-primary)]/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
              <Languages size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{LANGUAGE_LABELS[language].native}</span>
              <span className="block truncate text-xs text-[var(--color-muted)]">{LANGUAGE_LABELS[language].label}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)]" />
          </button>
        </div>

        {/* 5. Tentang Aplikasi */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-flat)]">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-warn-soft)] text-[var(--color-warn)]">
              <Info size={15} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{t('settings.about.title')}</h3>
          </div>
          <p className="mb-3 text-xs text-[var(--color-ink-soft)]">{t('settings.about.desc')}</p>
          <button
            onClick={() => setShowAbout(true)}
            className="flex w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-left transition hover:border-[var(--color-primary)]/40"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-warn-soft)] text-[var(--color-warn)]">
              <Info size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--color-ink)]">{t('about.appName')}</span>
              <span className="block truncate text-xs text-[var(--color-muted)]">{t('about.tagline')}</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-[var(--color-muted)]" />
          </button>
        </div>
      </div>

      <GuideModal open={showGuide} onClose={() => setShowGuide(false)} />
      <BackupModal open={showBackup} onClose={() => setShowBackup(false)} />
      <CurrencyModal open={showCurrency} onClose={() => setShowCurrency(false)} />
      <LanguageModal open={showLanguage} onClose={() => setShowLanguage(false)} />
      <AboutModal open={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
