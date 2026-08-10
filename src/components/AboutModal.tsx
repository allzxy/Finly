import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';
import PocketIcon from './PocketIcon';
import { Sparkles, ShieldCheck, Heart, Tag } from 'lucide-react';

const APP_VERSION = '1.0.0';

export default function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();

  const features = [
    t('about.feature1'),
    t('about.feature2'),
    t('about.feature3'),
    t('about.feature4'),
    t('about.feature5'),
  ];

  return (
    <Modal open={open} onClose={onClose} title={t('about.modalTitle')}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)] px-4 py-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-sm">
            <PocketIcon size={48} />
          </div>
          <div className="min-w-0">
            <p className="font-bold tracking-tight text-lg leading-none text-[var(--color-ink)]">{t('about.appName')}</p>
            <p className="mt-1 truncate text-xs text-[var(--color-ink-soft)]">{t('about.tagline')}</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-semibold text-[var(--color-ink-soft)]">
            {t('about.version')} {APP_VERSION}
          </span>
        </div>

        <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{t('about.description')}</p>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            <Sparkles size={12} /> {t('about.featuresTitle')}
          </p>
          <ul className="flex flex-col gap-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-[var(--color-ink-soft)]">
                <Tag size={13} className="mt-1 shrink-0 text-[var(--color-primary)]" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] px-3.5 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-ink)]">
            <Heart size={13} className="text-[var(--color-warn)]" /> {t('about.madeByTitle')}
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
            <span className="font-semibold text-[var(--color-ink)]">All/Alfan</span> — {t('about.madeByDesc')}
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl bg-[var(--color-surface-alt)] px-3.5 py-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[var(--color-primary)]" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--color-ink)]">{t('about.storageTitle')}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-soft)]">{t('about.storageDesc')}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
