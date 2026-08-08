import { useEffect, useState } from 'react';
import Modal from './Modal';
import { useFinance } from '../context/FinanceContext';
import { CATEGORY_ICONS, CATEGORY_ICON_OPTIONS } from '../lib/icons';
import type { Category, TransactionType } from '../lib/types';

const COLOR_PALETTE = [
  '#1f7a5c', '#3c6ea5', '#c9a84c', '#8a5fc9', '#c1704a', '#4d8fa6',
  '#b5523e', '#6a7a4f', '#c1465f', '#d1834f', '#5f8a6a', '#7a5fc1',
];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Category being edited, or null when creating a new one. */
  editing?: Category | null;
  /** Preselected type when creating a new category (ignored when editing). */
  defaultType?: TransactionType;
}

export default function CategoryFormModal({ open, onClose, editing, defaultType = 'expense' }: Props) {
  const { addCategory, updateCategory, currency, fromDisplay, toDisplay } = useFinance();
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(defaultType);
  const [icon, setIcon] = useState(CATEGORY_ICON_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [limit, setLimit] = useState('');
  const isEditing = !!editing;

  useEffect(() => {
    if (!open) return;
    if (editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editing.name);
      setType(editing.type);
      setIcon(editing.icon);
      setColor(editing.color);
      setLimit(editing.monthlyLimit ? String(Number(toDisplay(editing.monthlyLimit).toFixed(2))) : '');
    } else {
      setName('');
      setType(defaultType);
      setIcon(CATEGORY_ICON_OPTIONS[0]);
      setColor(COLOR_PALETTE[0]);
      setLimit('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const parsedLimit = limit.trim() ? parseFloat(limit) : undefined;
    const monthlyLimit = type === 'expense' && parsedLimit && parsedLimit > 0 ? fromDisplay(parsedLimit) : undefined;

    if (isEditing && editing) {
      updateCategory(editing.id, { name: name.trim(), icon, color, monthlyLimit });
    } else {
      addCategory({ name: name.trim(), icon, color, type, monthlyLimit });
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Ubah Kategori' : 'Kategori Baru'} nested>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {!isEditing && (
          <div className="flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-1 text-sm font-medium">
            {(['expense', 'income'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-full py-2 transition ${
                  type === t
                    ? t === 'income'
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-sm'
                      : 'bg-[var(--color-warn)] text-[var(--color-warn-contrast)] shadow-sm'
                    : 'text-[var(--color-ink-soft)]'
                }`}
              >
                {t === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </button>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Nama kategori</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. Hiburan"
            required
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">Ikon</label>
          <div className="grid grid-cols-6 gap-2">
            {CATEGORY_ICON_OPTIONS.map((iconKey) => {
              const IconComp = CATEGORY_ICONS[iconKey];
              const isSelected = icon === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => setIcon(iconKey)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                      : 'border-[var(--color-border)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                  aria-label={iconKey}
                >
                  <IconComp size={16} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]">Warna</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: 2,
                }}
                aria-label={c}
              >
                {color === c && <span className="h-2 w-2 rounded-full bg-white" />}
              </button>
            ))}
          </div>
        </div>

        {type === 'expense' && (
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
              Batas bulanan opsional ({currency.symbol})
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Kosongkan jika tidak ada batas"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>
        )}

        <button
          type="submit"
          className="mt-1 rounded-xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-[var(--color-primary-contrast)] shadow-[var(--shadow-flat)] transition hover:bg-[var(--color-primary-strong)]"
        >
          {isEditing ? 'Simpan Perubahan' : 'Buat Kategori'}
        </button>
      </form>
    </Modal>
  );
}
