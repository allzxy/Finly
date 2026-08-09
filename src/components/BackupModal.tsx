import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { useFinance } from '../context/FinanceContext';
import { useToast } from '../context/ToastContext';
import { Download, Upload, AlertTriangle, Database, CheckCircle2, RefreshCw } from 'lucide-react';

export default function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { exportData, importData, resetAllData } = useFinance();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    try {
      const dataStr = exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `cakumu-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Cadangan data berhasil diunduh (JSON)', 'success');
    } catch {
      showToast('Gagal mengunduh cadangan data', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = importData(content);
        if (success) {
          showToast('Data keuangan berhasil dipulihkan!', 'success');
          onClose();
        } else {
          showToast('Format file JSON cadangan tidak valid!', 'error');
        }
      } catch {
        showToast('Gagal membaca file cadangan', 'error');
      }
    };
    reader.readAsText(file);

    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAllData();
    showToast('Seluruh data berhasil direset ke awal', 'info');
    setConfirmReset(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { setConfirmReset(false); onClose(); }} title="Cadangkan & Pulihkan Data">
      <div className="flex flex-col gap-6">
        {/* Banner Info */}
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-surface-alt)] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Database size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--color-ink)]">Penyimpanan Aman & Lokal</h4>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              Seluruh transaksi, dompet, dan tabungan Anda tersimpan secara lokal. Unduh file cadangan secara berkala agar data Anda selalu aman.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Unduh Cadangan */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-soft)]/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
                <Download size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--color-ink)]">Cadangkan Data (Export JSON)</span>
                <span className="block text-[11px] text-[var(--color-muted)]">Simpan semua catatan ke file JSON</span>
              </div>
            </div>
            <CheckCircle2 size={16} className="text-[var(--color-primary)]" />
          </button>

          {/* Pulihkan Data */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-soft)]/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Upload size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--color-ink)]">Pulihkan Data (Import JSON)</span>
                <span className="block text-[11px] text-[var(--color-muted)]">Unggah file cadangan JSON dari perangkat</span>
              </div>
            </div>
            <Upload size={16} className="text-[var(--color-accent)]" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Zona Bahaya Reset Data */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="rounded-2xl border border-[var(--color-warn-soft)] bg-[var(--color-warn-soft)]/30 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 text-[var(--color-warn)] mt-0.5" />
              <div className="flex-1">
                <h5 className="text-xs font-bold text-[var(--color-warn)]">Reset Seluruh Data</h5>
                <p className="mt-1 text-[11px] text-[var(--color-ink-soft)] leading-relaxed">
                  Menghapus seluruh catatan dompet, transaksi, dan tabungan untuk memulai dari awal.
                </p>

                <button
                  type="button"
                  onClick={handleReset}
                  className={`mt-3 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    confirmReset
                      ? 'bg-[var(--color-warn)] text-white shadow-sm animate-pulse'
                      : 'border border-[var(--color-warn)] text-[var(--color-warn)] hover:bg-[var(--color-warn-soft)]'
                  }`}
                >
                  <RefreshCw size={13} className={confirmReset ? 'animate-spin' : ''} />
                  <span>{confirmReset ? 'Klik Sekali Lagi untuk Konfirmasi Reset!' : 'Reset Data Keuangan'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
