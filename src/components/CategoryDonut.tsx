interface Segment {
  id: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  centerLabel: string;
  centerValue: string;
}

const SIZE = 100;
const CENTER = SIZE / 2;
const RADIUS = 38;
const STROKE = 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategoryDonut({ segments, centerLabel, centerValue }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const gap = segments.length > 1 ? 2.2 : 0;

  const cumulatives: number[] = [];
  let currentCum = 0;
  for (const seg of segments) {
    cumulatives.push(currentCum);
    currentCum += seg.value;
  }

  const arcs = segments.map((seg, i) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const length = Math.max(0, fraction * CIRCUMFERENCE - gap);
    const offset = -(cumulatives[i] / total) * CIRCUMFERENCE;
    return { ...seg, length, offset, fraction };
  });

  return (
    <div className="relative mx-auto h-32 w-32 shrink-0 sm:h-36 sm:w-36">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={STROKE}
        />
        {arcs.map((arc, i) => (
          <circle
            key={arc.id}
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${arc.length} ${CIRCUMFERENCE}`}
            strokeDashoffset={arc.offset}
            className="animate-rise transition-all duration-500"
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">{centerLabel}</span>
        <span className="mt-0.5 truncate px-2 text-sm font-bold text-[var(--color-ink)] sm:text-base">{centerValue}</span>
      </div>
    </div>
  );
}
