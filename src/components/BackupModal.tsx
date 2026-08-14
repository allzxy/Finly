import React, { useRef, useState } from 'react';
import Modal from './Modal';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Download, Upload, AlertTriangle, CheckCircle2, RefreshCw, FileSpreadsheet } from 'lucide-react';

export default function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { exportExcelBuffer, importExcelBuffer, importData, resetAllData } = useFinance();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleExport = () => {
    try {
      const buffer = exportExcelBuffer();
      const blob = new Blob([buffer as unknown as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `finly-backup-${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast(t('backup.exportSuccess'), 'success');
    } catch (err) {
      console.error('Export Excel Error:', err);
      showToast(t('backup.exportError'), 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const success = importExcelBuffer(buffer);
          if (success) {
            showToast(t('backup.importSuccessExcel'), 'success');
            onClose();
          } else {
            showToast(t('backup.importErrorExcel'), 'error');
          }
        } catch {
          showToast(t('backup.importReadErrorExcel'), 'error');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Fallback untuk cadangan JSON lama
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const success = importData(content);
          if (success) {
            showToast(t('backup.importSuccessJson'), 'success');
            onClose();
          } else {
            showToast(t('backup.importErrorJson'), 'error');
          }
        } catch {
          showToast(t('backup.importReadErrorJson'), 'error');
        }
      };
      reader.readAsText(file);
    }

    if (e.target) e.target.value = '';
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetAllData();
    showToast(t('backup.resetSuccess'), 'info');
    setConfirmReset(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={() => { setConfirmReset(false); onClose(); }} title={t('backup.title')}>
      <div className="flex flex-col gap-6">
        {/* Banner Info */}
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--color-surface-alt)] p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[var(--color-ink)]">{t('backup.formatTitle')}</h4>
            <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
              {t('backup.formatDesc')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {/* Unduh Cadangan Excel */}
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary-soft)]/20 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
                <Download size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--color-ink)]">{t('backup.exportTitle')}</span>
                <span className="block text-[11px] text-[var(--color-muted)]">{t('backup.exportDesc')}</span>
              </div>
            </div>
            <CheckCircle2 size={16} className="text-[var(--color-primary)]" />
          </button>

          {/* Pulihkan Data Excel */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left shadow-sm transition hover:border-[var(--color-accent)]/40 hover:bg-[var(--color-accent-soft)]/20 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                <Upload size={18} />
              </div>
              <div>
                <span className="block text-xs font-bold text-[var(--color-ink)]">{t('backup.importTitle')}</span>
                <span className="block text-[11px] text-[var(--color-muted)]">{t('backup.importDesc')}</span>
              </div>
            </div>
            <Upload size={16} className="text-[var(--color-accent)]" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/json"
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
                <h5 className="text-xs font-bold text-[var(--color-warn)]">{t('backup.resetTitle')}</h5>
                <p className="mt-1 text-[11px] text-[var(--color-ink-soft)] leading-relaxed">
                  {t('backup.resetDesc')}
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
                  <span>{confirmReset ? t('backup.resetConfirmBtn') : t('backup.resetBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
