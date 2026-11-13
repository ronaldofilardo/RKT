import type { RadarAxis } from './advanced-stats-radar-axes';
import { hexWithAlpha } from './advanced-stats-radar-axes';
import { R, SIZE, polarToXY, polygonPoints } from './advanced-stats-radar-geometry';
import { RadarGrid, RadarAxisLabels } from './advanced-stats-radar-decor';

// ---------------------------------------------------------------------------
// Radar SVG — recebe as cores derivadas do contexto
// ---------------------------------------------------------------------------
interface RadarSVGProps {
  axes: RadarAxis[];
  p1Hex: string;
  p2Hex: string;
}

export function RadarSVG({ axes, p1Hex, p2Hex }: RadarSVGProps) {
  const n = axes.length;
  const angles = axes.map((_, i) => (360 / n) * i);

  const p1pts = polygonPoints(axes.map((a) => a.p1Value), R);
  const p2pts = polygonPoints(axes.map((a) => a.p2Value), R);

  return (
    <svg
      role="img"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: SIZE, margin: '0 auto', display: 'block', overflow: 'visible' }}
      aria-label="Radar de desempenho"
    >
      {/* Grade, % labels e spokes */}
      <RadarGrid n={n} angles={angles} />

      {/* P2 polygon */}
      <polygon
        points={p2pts}
        fill={hexWithAlpha(p2Hex, 0.15)}
        stroke={p2Hex}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      {/* P1 polygon */}
      <polygon
        points={p1pts}
        fill={hexWithAlpha(p1Hex, 0.18)}
        stroke={p1Hex}
        strokeWidth={2}
        strokeLinejoin="round"
      />

      {/* P1 dots */}
      {axes.map((a, i) => {
        const { x, y } = polarToXY(angles[i], (a.p1Value / 100) * R);
        return <circle key={i} cx={x} cy={y} r={3} fill={p1Hex} />;
      })}

      {/* P2 dots */}
      {axes.map((a, i) => {
        const { x, y } = polarToXY(angles[i], (a.p2Value / 100) * R);
        return <circle key={i} cx={x} cy={y} r={3} fill={p2Hex} />;
      })}

      {/* Axis labels */}
      <RadarAxisLabels axes={axes} />
    </svg>
  );
}
