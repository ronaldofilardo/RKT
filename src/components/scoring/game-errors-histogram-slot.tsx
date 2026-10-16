import type { GameErrorEntry } from '@/core/scoring/set-summary-stats';
import type { HistogramLayout, GameSlotMetrics } from './game-errors-histogram.logic';

interface GameErrorsSlotProps {
  game: GameErrorEntry;
  metrics: GameSlotMetrics;
  layout: HistogramLayout;
}

export function GameErrorsSlot({ game, metrics, layout }: GameErrorsSlotProps) {
  const { slotCenterX, p1X, p2X, p1TotalH, p2TotalH, p1Y, p2Y, isP1Serving } = metrics;
  const { chartHeight, barWidth } = layout;

  return (
    <g key={game.gameIndex} className="transition-opacity hover:opacity-90">
      {/* Marcador do Game */}
      <text
        x={slotCenterX}
        y={chartHeight + 14}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={10}
        fontWeight="600"
      >
        G{game.gameIndex}
      </text>

      {/* Placar após o game */}
      <text
        x={slotCenterX}
        y={chartHeight + 26}
        textAnchor="middle"
        fill="#64748b"
        fontSize={8.5}
      >
        {game.scoreLabel}
      </text>

      {/* Indicador sutil de quem sacou */}
      <circle
        cx={isP1Serving ? p1X + barWidth / 2 : p2X + barWidth / 2}
        cy={chartHeight + 4}
        r={1.8}
        fill="#eab308"
      />

      {/* Barra Player 1 */}
      {game.p1Errors.total > 0 ? (
        <>
          <rect
            x={p1X}
            y={p1Y}
            width={barWidth}
            height={Math.max(2, p1TotalH)}
            rx={2}
            className="fill-telemetry-blue"
          />
          <text
            x={p1X + barWidth / 2}
            y={p1Y - 3}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize={8.5}
            fontWeight="bold"
          >
            {game.p1Errors.total}
          </text>
        </>
      ) : (
        <circle cx={p1X + barWidth / 2} cy={chartHeight - 2} r={1.5} fill="#475569" />
      )}

      {/* Barra Player 2 */}
      {game.p2Errors.total > 0 ? (
        <>
          <rect
            x={p2X}
            y={p2Y}
            width={barWidth}
            height={Math.max(2, p2TotalH)}
            rx={2}
            className="fill-telemetry-error"
          />
          <text
            x={p2X + barWidth / 2}
            y={p2Y - 3}
            textAnchor="middle"
            fill="#f87171"
            fontSize={8.5}
            fontWeight="bold"
          >
            {game.p2Errors.total}
          </text>
        </>
      ) : (
        <circle cx={p2X + barWidth / 2} cy={chartHeight - 2} r={1.5} fill="#475569" />
      )}
    </g>
  );
}
