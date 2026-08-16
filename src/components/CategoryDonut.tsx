import { useState } from 'react';

interface Segment {
  id: string;
  name?: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  centerLabel: string;
  centerValue: string;
}

const SIZE = 120;
const CENTER = SIZE / 2;
const RADIUS = 44;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryDonut({ segments, centerLabel, centerValue }: Props) {
  const [hovered, setHovered] = useState<Segment | null>(null);

  const validSegments = segments.filter((s) => s.value > 0);
  const validTotal = validSegments.reduce((s, seg) => s + seg.value, 0);

  const cumulatives: number[] = [];
  let currentCum = 0;
  for (const seg of validSegments) {
    cumulatives.push(currentCum);
    currentCum += seg.value;
  }

  const arcs = validSegments.map((seg, i) => {
    const fraction = validTotal > 0 ? seg.value / validTotal : 0;
    // Pastikan setiap kategori meskipun kecil (misal pengeluaran sedikit) tetap terlihat nyata di lingkaran donat
    const minLength = validSegments.length > 1 ? 3.5 : CIRCUMFERENCE;
    const rawLength = fraction * CIRCUMFERENCE;
    const length = Math.max(minLength, rawLength - (validSegments.length > 1 ? 1.5 : 0));
    const offset = -(cumulatives[i] / validTotal) * CIRCUMFERENCE;
    const pct = validTotal > 0 ? ((seg.value / validTotal) * 100) : 0;
    const pctText = pct >= 1 ? `${Math.round(pct)}%` : `${pct.toFixed(1)}%`;
    return { ...seg, length, offset, fraction, pct, pctText };
  });

  const displayLabel = hovered?.name || centerLabel;
  const displayValue = hovered
    ? `${validTotal > 0 ? ((hovered.value / validTotal) * 100 >= 1 ? `${Math.round((hovered.value / validTotal) * 100)}%` : `${((hovered.value / validTotal) * 100).toFixed(1)}%`) : '0%'}`
    : centerValue;

  return (
    <div className="relative mx-auto h-32 w-32 shrink-0 sm:h-36 sm:w-36">
      <svg role="img" aria-label="Diagram Lingkaran Pembagian Kategori" viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90 overflow-visible">
        {/* Background Circle */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={STROKE}
        />

        {/* Real-time Category Slices */}
        {arcs.map((arc, i) => {
          const isHovered = hovered?.id === arc.id;
          return (
            <circle
              key={arc.id}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={isHovered ? STROKE + 3 : STROKE}
              strokeLinecap="butt"
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
              strokeDashoffset={arc.offset}
              onMouseEnter={() => setHovered(arc)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer transition-all duration-200"
              style={{
                filter: isHovered ? 'drop-shadow(0 0 4px rgba(0,0,0,0.25))' : 'none',
                animationDelay: `${i * 50}ms`,
              }}
            />
          );
        })}
      </svg>

      {/* Donut Center Info */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="max-w-[85%] truncate text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          {displayLabel}
        </span>
        <span className="mt-0.5 max-w-[90%] truncate px-1 text-sm font-bold text-[var(--color-ink)] sm:text-base">
          {displayValue}
        </span>
      </div>
    </div>
  );
}
