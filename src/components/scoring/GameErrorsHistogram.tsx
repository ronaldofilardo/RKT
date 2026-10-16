'use client';

import React from 'react';
import type { GameErrorEntry } from '@/core/scoring/set-summary-stats';
import { computeHistogramLayout, computeGameSlot } from './game-errors-histogram.logic';
import { GameErrorsSlot } from './game-errors-histogram-slot';
import { HistogramHeader, HistogramFooter } from './game-errors-histogram-legend';

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

  const layout = computeHistogramLayout(gameErrors);
  const { maxErrors, chartHeight, svgWidth } = layout;

  return (
    <div className="w-full">
      <HistogramHeader player1Name={player1Name} player2Name={player2Name} />

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

          {gameErrors.map((game, idx) => (
            <GameErrorsSlot
              key={game.gameIndex}
              game={game}
              metrics={computeGameSlot(game, idx, layout)}
              layout={layout}
            />
          ))}
        </svg>
      </div>
      <HistogramFooter maxErrors={maxErrors} />
    </div>
  );
}
