export interface Segment {
  label: string;
  value: number;
  color: string;
}

interface Props {
  segments: Segment[];
  centerTop: string;
  centerBottom: string;
}

/** Dependency-free donut chart built from a CSS conic-gradient. */
export function Donut({ segments, centerTop, centerBottom }: Props) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  const stops = segments
    .map((seg) => {
      const start = (acc / total) * 360;
      acc += seg.value;
      const end = (acc / total) * 360;
      return `${seg.color} ${start}deg ${end}deg`;
    })
    .join(", ");

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="center">
          <div>
            <b>{centerTop}</b>
            <span>{centerBottom}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Palette reused for heir segments + swatches. */
export const PALETTE = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#dc2626", "#0891b2", "#db2777", "#65a30d"];
