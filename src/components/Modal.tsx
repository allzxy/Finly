import { useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

let activeModalCount = 0;

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
  const [isExpanded, setIsExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    activeModalCount++;
    if (activeModalCount === 1) {
      document.body.style.overflow = 'hidden';
    }

    // Reset scroll position to top whenever modal opens
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }

    return () => {
      activeModalCount = Math.max(0, activeModalCount - 1);
      if (activeModalCount === 0) {
        document.body.style.overflow = '';
      }
    };
  }, [open]);

  const handleClose = () => {
    setIsExpanded(false);
    onClose();
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    // Swipe Up -> Expand
    if (deltaY < -40 && !isExpanded) {
      setIsExpanded(true);
      touchStartY.current = null;
    }
    // Swipe Down -> Collapse or Close
    else if (deltaY > 50) {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        onClose();
      }
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
  };

  if (!open) return null;

  return createPortal(
    <div className={`fixed inset-0 flex items-center justify-center p-2.5 sm:p-4 md:p-6 ${nested ? 'z-[110]' : 'z-[100]'}`}>
      {/* 100% Fullscreen Edge-to-Edge Frosted Glass Backdrop */}
      <div 
        className={`animate-fade fixed inset-0 transition-opacity ${nested ? 'bg-black/45 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-md'}`} 
        onClick={handleClose} 
      />

      {/* Centered Modal Dialog Card - 100% Adaptive to Screen Size */}
      <div 
        className={`animate-modal-pop relative z-10 flex flex-col rounded-[20px] sm:rounded-[28px] border border-[var(--color-border)]/80 bg-[var(--color-surface)] p-3.5 sm:p-5 md:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.32)] transition-all duration-300 ease-out ${
          nested 
            ? 'w-[calc(100%-1rem)] max-w-[390px] sm:max-w-[420px] max-h-[80dvh]' 
            : isExpanded 
              ? 'w-[calc(100%-1rem)] max-w-[94vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90dvh]' 
              : 'w-[calc(100%-1rem)] max-w-[420px] sm:max-w-md md:max-w-lg max-h-[84dvh]'
        }`}
      >
        {/* Interactive Top Handle Bar */}
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          title={isExpanded ? 'Kecilkan ukuran modal' : 'Perluas ukuran modal'}
          aria-label={isExpanded ? 'Kecilkan ukuran modal' : 'Perluas ukuran modal'}
          className="-mt-1 mb-1.5 flex w-full cursor-pointer flex-col items-center justify-center py-1 group touch-none"
        >
          <div className="flex items-center gap-1 text-[var(--color-muted)] transition-all group-hover:text-[var(--color-primary)]">
            <div className="h-1.5 w-12 rounded-full bg-[var(--color-border)]/90 transition-all group-hover:bg-[var(--color-primary)] group-hover:w-16" />
            {isExpanded ? (
              <ChevronDown size={14} className="shrink-0 text-[var(--color-muted)] opacity-80" />
            ) : (
              <ChevronUp size={14} className="shrink-0 text-[var(--color-muted)] opacity-80" />
            )}
          </div>
        </button>
        
        <div className="mb-2.5 flex shrink-0 items-center justify-between sm:mb-4">
          <h3 className="font-bold tracking-tight text-base sm:text-lg lg:text-xl text-[var(--color-ink)]">{title}</h3>
          <button
            onClick={handleClose}
            aria-label="Tutup modal"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-alt)] text-[var(--color-muted)] transition hover:bg-[var(--color-border)] hover:text-[var(--color-ink)] active:scale-95"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto pr-0.5 pb-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
