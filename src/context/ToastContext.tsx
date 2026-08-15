import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'warn';

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev.slice(-2), { id, text, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container Floating Top-Right / Center Top */}
      <div className="fixed top-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none w-[calc(100%-2rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 w-full rounded-2xl border border-[var(--color-border)]/80 bg-[var(--color-surface)]/90 px-4 py-3 shadow-[0_12px_35px_rgba(0,0,0,0.18)] backdrop-blur-2xl animate-rise transition-all"
          >
            {t.type === 'success' && <CheckCircle2 size={18} className="shrink-0 text-[var(--color-primary)]" />}
            {t.type === 'error' && <AlertCircle size={18} className="shrink-0 text-[var(--color-warn)]" />}
            {(t.type === 'warning' || t.type === 'warn') && <AlertTriangle size={18} className="shrink-0 text-[#f59e0b]" />}
            {t.type === 'info' && <Info size={18} className="shrink-0 text-[var(--color-accent)]" />}

            <span className="flex-1 text-xs font-semibold text-[var(--color-ink)] leading-snug">{t.text}</span>

            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-ink)] transition p-1"
              aria-label="Tutup notifikasi"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
