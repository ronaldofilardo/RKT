import type { GameErrorEntry } from '@/core/scoring/set-summary-stats';

export interface HistogramLayout {
  maxErrors: number;
  chartHeight: number;
  barWidth: number;
  gapBetweenPlayers: number;
  gameSlotWidth: number;
  svgWidth: number;
}

/** Escala e dimensões do gráfico de erros por game. */
export function computeHistogramLayout(gameErrors: GameErrorEntry[]): HistogramLayout {
  const maxErrors = Math.max(
    1,
    ...gameErrors.map(g => Math.max(g.p1Errors.total, g.p2Errors.total))
  );
  const chartHeight = 90;
  const barWidth = 10;
  const gapBetweenPlayers = 3;
  const gameSlotWidth = barWidth * 2 + gapBetweenPlayers + 16;
  const svgWidth = Math.max(300, gameErrors.length * gameSlotWidth + 24);
  return { maxErrors, chartHeight, barWidth, gapBetweenPlayers, gameSlotWidth, svgWidth };
}

export interface GameSlotMetrics {
  slotCenterX: number;
  p1X: number;
  p2X: number;
  p1TotalH: number;
  p2TotalH: number;
  p1Y: number;
  p2Y: number;
  isP1Serving: boolean;
}

/** Posição e alturas das barras de um game no slot do gráfico. */
export function computeGameSlot(
  game: GameErrorEntry,
  idx: number,
  layout: HistogramLayout
): GameSlotMetrics {
  const { maxErrors, chartHeight, barWidth, gapBetweenPlayers, gameSlotWidth } = layout;
  const slotCenterX = 16 + idx * gameSlotWidth + gameSlotWidth / 2;
  const p1X = slotCenterX - gapBetweenPlayers / 2 - barWidth;
  const p2X = slotCenterX + gapBetweenPlayers / 2;
  const p1TotalH = (game.p1Errors.total / maxErrors) * (chartHeight - 15);
  const p2TotalH = (game.p2Errors.total / maxErrors) * (chartHeight - 15);
  return {
    slotCenterX,
    p1X,
    p2X,
    p1TotalH,
    p2TotalH,
    p1Y: chartHeight - p1TotalH,
    p2Y: chartHeight - p2TotalH,
    isP1Serving: game.server === 'player1',
  };
}
