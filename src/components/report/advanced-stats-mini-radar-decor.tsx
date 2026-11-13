import type { RadarAxisData } from './advanced-stats-set-lens-axes';

// ---------------------------------------------------------------------------
// Mini-Radar SVG Compacto (220x220) — decoração: anéis, eixos e rótulos
// ---------------------------------------------------------------------------
interface MiniRadarDecorProps {
  axes: RadarAxisData[];
  numAxes: number;
  cx: number;
  cy: number;
  r: number;
}

export function MiniRadarDecor({ axes, numAxes, cx, cy, r }: MiniRadarDecorProps) {
  const rings = [0.25, 0.5, 0.75, 1.0];

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const radius = r + 18;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  };

  return (
    <>
      {/* Anéis concêntricos */}
      {rings.map((pct) => {
        const ringPoints = Array.from({ length: numAxes }, (_, i) => {
          const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
          const radius = pct * r;
          return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={pct}
            points={ringPoints}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={pct === 1.0 ? 1 : 0.6}
          />
        );
      })}

      {/* Eixos radiais */}
      {axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
        const endX = cx + r * Math.cos(angle);
        const endY = cy + r * Math.sin(angle);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={endX}
            y2={endY}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Rótulos dos eixos */}
      {axes.map((axis, i) => {
        const { x, y } = getLabelCoordinates(i);
        const isLeft = x < cx - 6;
        const isRight = x > cx + 6;
        const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

        return (
          <g key={i}>
            <text
              x={x}
              y={y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fontSize={8.5}
              fontWeight="bold"
              fill="rgba(255,255,255,0.85)"
            >
              {axis.label}
            </text>
          </g>
        );
      })}
    </>
  );
}
