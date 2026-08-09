import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open,
  onClose,
  title,
  children,
  nested = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Set true for modals opened from within another modal (e.g. select pickers) so they stack on top. */
  nested?: boolean;
}) {
  if (!open) return null;
  return (
    <div className={`fixed inset-0 flex items-end justify-center sm:items-center sm:p-4 ${nested ? 'z-[70]' : 'z-[60]'}`}>
      {/* Frosted Glass Backdrop Fade */}
      <div 
        className="animate-fade absolute inset-0 bg-black/55 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Sheet / Dialog Card */}
      <div className="animate-modal-pop relative flex max-h-[88vh] w-full flex-col rounded-t-[32px] sm:rounded-[28px] border border-[var(--color-border)]/80 bg-[var(--color-surface)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)] sm:max-h-[85vh] sm:max-w-md sm:p-6 transition-all">
        <div className="mx-auto mb-3.5 h-1.5 w-12 shrink-0 rounded-full bg-[var(--color-border)]/80 sm:hidden" />
        
        <div className="mb-4 flex shrink-0 items-center justify-between sm:mb-5">
          <h3 className="font-bold tracking-tight text-lg text-[var(--color-ink)] sm:text-xl">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-muted)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-ink)] active:scale-95"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-1">{children}</div>
      </div>
    </div>
  );
}
