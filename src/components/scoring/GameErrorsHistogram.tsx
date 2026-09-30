'use client';

import React from 'react';
import type { GameErrorEntry } from '@/core/scoring/set-summary-stats';

interface Props {
  gameErrors: GameErrorEntry[];
  player1Name: string;
  player2Name: string;
}

export function GameErrorsHistogram({ gameErrors, player1Name, player2Name }: Props) {
  if (!gameErrors || gameErrors.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-telemetry-text-muted">
        Nenhum registro de erros disponível neste set.
      </div>
    );
  }

  // Encontrar o maior número de erros em um único game para normalizar a escala do gráfico
  const maxErrors = Math.max(
    1,
    ...gameErrors.map(g => Math.max(g.p1Errors.total, g.p2Errors.total))
  );

  const chartHeight = 90; // altura do gráfico em px
  const barWidth = 10;
  const gapBetweenPlayers = 3;
  const gameSlotWidth = barWidth * 2 + gapBetweenPlayers + 16;
  const svgWidth = Math.max(300, gameErrors.length * gameSlotWidth + 24);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-telemetry-text-primary tracking-wide">
          Erros por Game (Oscilação)
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-telemetry-blue inline-block" />
            <span className="text-telemetry-text-muted font-medium truncate max-w-[80px]">{player1Name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-telemetry-error inline-block" />
            <span className="text-telemetry-text-muted font-medium truncate max-w-[80px]">{player2Name}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
        <svg
          viewBox={`0 0 ${svgWidth} ${chartHeight + 35}`}
          className="w-full min-w-[300px] h-[130px] overflow-visible"
        >
          {/* Linhas de grade guia */}
          <line
            x1={0}
            y1={chartHeight}
            x2={svgWidth}
            y2={chartHeight}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={chartHeight / 2}
            x2={svgWidth}
            y2={chartHeight / 2}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          {gameErrors.map((game, idx) => {
            const slotCenterX = 16 + idx * gameSlotWidth + gameSlotWidth / 2;
            const p1X = slotCenterX - gapBetweenPlayers / 2 - barWidth;
            const p2X = slotCenterX + gapBetweenPlayers / 2;

            // Altura proporcional
            const p1TotalH = (game.p1Errors.total / maxErrors) * (chartHeight - 15);
            const p2TotalH = (game.p2Errors.total / maxErrors) * (chartHeight - 15);

            const p1Y = chartHeight - p1TotalH;
            const p2Y = chartHeight - p2TotalH;

            const isP1Serving = game.server === 'player1';

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
          })}
        </svg>
      </div>
      <div className="flex items-center justify-between text-[10px] text-telemetry-text-muted mt-0.5 px-1">
        <span>• Ponto amarelo indica quem sacou no game</span>
        <span>Escala máx: {maxErrors} erros/game</span>
      </div>
    </div>
  );
}
