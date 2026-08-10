import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled React Error:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('cakumu-data-empty-v1');
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg,#f5f4f0)] px-4 py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-warn-soft,#f3e0d5)] text-[var(--color-warn,#c1704a)] shadow-md">
            <AlertTriangle size={32} />
          </div>
          <h2 className="mt-6 text-xl font-bold tracking-tight text-[var(--color-ink,#1e241f)] sm:text-2xl">
            Terjadi Kesalahan Tampilan
          </h2>
          <p className="mt-2 max-w-md text-xs text-[var(--color-ink-soft,#545e54)] sm:text-sm">
            Aplikasi mengalami kesalahan tak terduga saat memuat data. Tekan tombol di bawah untuk memulihkan tampilan secara instan.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary,#1f7a5c)] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-primary-strong,#145842)] active:scale-95"
            >
              <RefreshCw size={16} /> Muat Ulang Halaman
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border,#e2ddd0)] bg-[var(--color-surface,#ffffff)] px-5 py-3 text-sm font-semibold text-[var(--color-ink,#1e241f)] transition hover:bg-[var(--color-surface-alt,#edf0ea)] active:scale-95"
            >
              Reset Cache & Muat Ulang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
