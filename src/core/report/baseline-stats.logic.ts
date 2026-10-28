import type { TimelinePoint } from '@/core/scoring/types';
import type { BaselineStats } from './report-analysis-matrix.types';
import { resolvePointRallyCategory } from './pressure-shot-stats';

function isBaselinePoint(p: TimelinePoint): boolean {
  if (p.type === 'ACE' || p.type === 'DOUBLE_FAULT' || p.type === 'FAULT_FIRST') return false;
  return p.rallyDetails?.situacao === 'fundo' || (!p.rallyDetails?.situacao && Boolean(p.rallyDetails));
}

function calcPct(n: number, d: number): number {
  return d > 0 ? (n / d) * 100 : 0;
}

export function computeBaselineStats(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2'): BaselineStats {
  const basePoints = points.filter(isBaselinePoint);

  let winners = 0;
  let unforcedErrors = 0;
  let forcedErrors = 0;

  let shortTotal = 0;
  let shortWon = 0;
  let medTotal = 0;
  let medWon = 0;
  let longTotal = 0;
  let longWon = 0;

  for (const p of basePoints) {
    const isWin = p.winner === player;
    const cat = resolvePointRallyCategory(p);

    if (cat === 'short') {
      shortTotal++;
      if (isWin) shortWon++;
    } else if (cat === 'medium') {
      medTotal++;
      if (isWin) medWon++;
    } else if (cat === 'long') {
      longTotal++;
      if (isWin) longWon++;
    }

    if (isWin) {
      if (p.type === 'WINNER' || p.rallyDetails?.tipo === 'winner') winners++;
    } else {
      const isUnforced = p.type === 'UNFORCED_ERROR' || p.rallyDetails?.tipo === 'erro_nao_forcado';
      const isForced = p.type === 'FORCED_ERROR' || p.rallyDetails?.tipo === 'erro_forcado';
      if (isUnforced) unforcedErrors++;
      else if (isForced) forcedErrors++;
    }
  }

  const total = winners + unforcedErrors + forcedErrors;
  const successPct = calcPct(winners, total);

  return {
    winners,
    unforcedErrors,
    forcedErrors,
    total,
    successPct,
    shortRallyWon: shortWon,
    shortRallyTotal: shortTotal,
    mediumRallyWon: medWon,
    mediumRallyTotal: medTotal,
    longRallyWon: longWon,
    longRallyTotal: longTotal,
  };
}
