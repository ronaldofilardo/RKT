import { hexWithAlpha } from './advanced-stats-premium-shared';
import type { RadarAxisData } from './advanced-stats-set-lens-axes';
import { MiniRadarDecor } from './advanced-stats-mini-radar-decor';

// Mini-Radar SVG Compacto (220x220)
export function MiniRadarSvg({
  axes,
  p1ColorHex,
  p2ColorHex,
  player1Name,
  player2Name,
}: {
  axes: RadarAxisData[];
  p1ColorHex: string;
  p2ColorHex: string;
  player1Name: string;
  player2Name: string;
}) {
  const SIZE = 220;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 72;
  const numAxes = axes.length;

  const getCoordinates = (index: number, val: number) => {
    const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
    const r = (val / 100) * R;
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    };
  };

  const p1PolygonPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.p1);
    return `${x},${y}`;
  }).join(' ');

  const p2PolygonPoints = axes.map((axis, i) => {
    const { x, y } = getCoordinates(i, axis.p2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-4 text-xs mb-2">
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p1ColorHex }} />
          <span className="text-telemetry-text-primary truncate max-w-[100px]">{player1Name}</span>
        </span>
        <span className="flex items-center gap-1.5 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p2ColorHex }} />
          <span className="text-telemetry-text-primary truncate max-w-[100px]">{player2Name}</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full max-w-[220px] aspect-square overflow-visible select-none"
        role="img"
        aria-label="Mini-radar de desempenho do set"
      >
        {/* Anéis, eixos radiais e rótulos (abaixo dos polígonos) */}
        <MiniRadarDecor axes={axes} numAxes={numAxes} cx={CX} cy={CY} r={R} />

        {/* Polígono do Jogador 2 (White/Contraste) */}
        <polygon
          points={p2PolygonPoints}
          fill={hexWithAlpha(p2ColorHex, 0.18)}
          stroke={p2ColorHex}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* Polígono do Jogador 1 (Volt/Destaque) */}
        <polygon
          points={p1PolygonPoints}
          fill={hexWithAlpha(p1ColorHex, 0.28)}
          stroke={p1ColorHex}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
