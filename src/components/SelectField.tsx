import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Modal from './Modal';
import { useLanguage } from '../context/LanguageContext';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: LucideIcon;
  badge?: string;
  color?: string;
}

interface Props {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  modalTitle: string;
  disabled?: boolean;
  compact?: boolean;
  nested?: boolean;
}

const isValidIcon = (icon: any) => !!icon && (typeof icon === 'function' || typeof icon === 'object');

export default function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  modalTitle,
  disabled = false,
  compact = false,
  nested = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const selected = options.find((o) => o.value === value);
  const SelectedIcon = isValidIcon(selected?.icon) ? selected?.icon : null;
  const finalPlaceholder = placeholder || t('select.placeholder');

  return (
    <div className="min-w-0">
      {label && <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">{label}</label>}
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={`flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] text-left text-[var(--color-ink)] outline-none transition hover:border-[var(--color-primary)]/40 focus:border-[var(--color-primary)] disabled:opacity-40 ${
          compact ? 'px-2 py-2.5 text-[11px] font-medium' : 'px-3.5 py-2.5 text-sm'
        }`}
      >
        {SelectedIcon ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: selected?.color ? `${selected.color}20` : 'var(--color-surface-alt)', color: selected?.color }}
          >
            <SelectedIcon size={13} />
          </span>
        ) : selected?.badge ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-alt)] text-[11px] font-semibold">
            {selected.badge}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selected ? selected.label : finalPlaceholder}</span>
        <ChevronDown size={15} className="shrink-0 text-[var(--color-muted)]" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} nested={nested}>
        <div className="flex flex-col gap-1">
          {options.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">{t('select.empty')}</p>
          ) : (
            options.map((opt) => {
              const OptIcon = isValidIcon(opt.icon) ? opt.icon : null;
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    isSelected
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]'
                      : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-alt)]'
                  }`}
                >
                  {OptIcon ? (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: opt.color ? `${opt.color}20` : 'var(--color-surface-alt)', color: opt.color }}
                    >
                      <OptIcon size={15} />
                    </span>
                  ) : opt.badge ? (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-alt)] text-sm font-semibold">
                      {opt.badge}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{opt.label}</span>
                    {opt.sublabel && <span className="block truncate text-xs text-[var(--color-muted)]">{opt.sublabel}</span>}
                  </span>
                  {isSelected && <Check size={16} className="shrink-0 text-[var(--color-primary)]" />}
                </button>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
