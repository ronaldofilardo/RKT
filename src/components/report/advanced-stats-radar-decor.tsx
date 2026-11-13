import type { RadarAxis } from './advanced-stats-radar-axes';
import { CX, CY, R, LEVELS, polarToXY } from './advanced-stats-radar-geometry';

// ---------------------------------------------------------------------------
// Decoração do radar SVG: grade (anéis + eixos) e rótulos dos eixos
// ---------------------------------------------------------------------------
interface RadarGridProps {
  n: number;
  angles: number[];
}

export function RadarGrid({ n, angles }: RadarGridProps) {
  const levels = Array.from({ length: LEVELS }, (_, i) => ((i + 1) / LEVELS) * R);

  return (
    <>
      {/* Grid */}
      {levels.map((r, li) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const { x, y } = polarToXY(angles[i], r);
          return `${x},${y}`;
        }).join(' ');
        return (
          <polygon
            key={li}
            points={pts}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={li === LEVELS - 1 ? 1.2 : 0.7}
          />
        );
      })}

      {/* % labels no primeiro eixo */}
      {levels.map((r, li) => {
        const { x, y } = polarToXY(0, r);
        return (
          <text key={li} x={x + 3} y={y} fontSize={7} fill="rgba(255,255,255,0.3)" dominantBaseline="middle">
            {((li + 1) / LEVELS) * 100}
          </text>
        );
      })}

      {/* Spokes */}
      {angles.map((angle, i) => {
        const { x, y } = polarToXY(angle, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />;
      })}
    </>
  );
}

interface RadarAxisLabelsProps {
  axes: RadarAxis[];
}

export function RadarAxisLabels({ axes }: RadarAxisLabelsProps) {
  const n = axes.length;
  const labels = axes.map((axis, i) => {
    const angle = (360 / n) * i;
    const { x, y } = polarToXY(angle, R + 22);
    let anchor: 'middle' | 'start' | 'end';
    if (angle < 20 || angle > 340) anchor = 'middle';
    else if (angle <= 180) anchor = 'start';
    else anchor = 'end';
    return { label: axis.label, sublabel: axis.sublabel, x, y, anchor };
  });

  return (
    <>
      {labels.map((l, i) => (
        <g key={i}>
          <text x={l.x} y={l.y - 4} textAnchor={l.anchor} fontSize={9} fontWeight="bold" fill="rgba(255,255,255,0.85)">
            {l.label}
          </text>
          {l.sublabel && (
            <text x={l.x} y={l.y + 7} textAnchor={l.anchor} fontSize={7.5} fill="rgba(255,255,255,0.4)">
              {l.sublabel}
            </text>
          )}
        </g>
      ))}
    </>
  );
}
