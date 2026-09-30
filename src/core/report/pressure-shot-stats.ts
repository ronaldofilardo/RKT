import type { TimelinePoint } from '@/core/scoring/types';
import { isServer, type PressureStats, type ShotAnalysis, type StrokeSideStats } from './types';

function countTiebreaks(points: TimelinePoint[], winner: 'PLAYER_1' | 'PLAYER_2'): { played: number; won: number } {
  const tiebreaks = points.filter(p => p.isTiebreak);
  const tiebreakSets = new Set(tiebreaks.map(p => p.setNumber));
  const played = tiebreakSets.size;
  let won = 0;
  for (const setNum of tiebreakSets) {
    const setPoints = tiebreaks.filter(p => p.setNumber === setNum);
    const lastPoint = setPoints[setPoints.length - 1];
    if (lastPoint && lastPoint.winner === winner) {
      won++;
    }
  }
  return { played, won };
}

function calcPercentage(won: number, total: number): number {
  return total > 0 ? (won / total) * 100 : 0;
}

function computeBreakPointPressure(points: TimelinePoint[], playerIndex: 1 | 2, winner: 'PLAYER_1' | 'PLAYER_2') {
  let saved = 0;
  let faced = 0;
  let converted = 0;
  let opps = 0;
  for (const p of points) {
    if (p.isBreakPoint) {
      if (isServer(p, playerIndex)) {
        faced++;
        if (p.winner === winner) saved++;
      } else {
        opps++;
        if (p.winner === winner) converted++;
      }
    }
  }
  return { saved, faced, converted, opps };
}

export function computePressureStats(points: TimelinePoint[], playerIndex: 1 | 2): PressureStats {
  const winner = `PLAYER_${playerIndex}` as const;

  const bp = computeBreakPointPressure(points, playerIndex, winner);

  const gamePointsWon = points.filter(p => (p.isGameBall || p.gameIsDeuce) && p.winner === winner).length;
  const gamePointsTotal = points.filter(p => p.isGameBall || p.gameIsDeuce).length;
  const gamePointsWonPct = calcPercentage(gamePointsWon, gamePointsTotal);

  const setPointsWon = points.filter(p => p.isSetBall && p.winner === winner).length;
  const setPointsTotal = points.filter(p => p.isSetBall).length;
  const setPointsWonPct = calcPercentage(setPointsWon, setPointsTotal);

  const { played: tiebreaksPlayed, won: tiebreaksWon } = countTiebreaks(points, winner);
  const totalPointsWon = points.filter(p => p.winner === winner).length;

  return {
    breakPointsSaved: bp.saved,
    breakPointsFaced: bp.faced,
    breakPointsConverted: bp.converted,
    breakPointOpportunities: bp.opps,
    gamePointsWon,
    gamePointsTotal,
    gamePointsWonPct,
    setPointsWon,
    setPointsTotal,
    setPointsWonPct,
    tiebreaksPlayed,
    tiebreaksWon,
    totalPointsWon,
  };
}

export interface PointShotDetails {
  executor: 'PLAYER_1' | 'PLAYER_2';
  outcome: 'winner' | 'unforced_error' | 'forced_error';
  stroke?: string;
  strokeSide?: 'forehand' | 'backhand';
  situacao?: string;
}

/**
 * Atribui a autoria de golpes e desfechos de pontos (Fundo, Rede, Passada)
 * de acordo com o plano estabelecido em REFACTOR_QUEUE.md:
 * - Em fundo e devolução: o golpe é de quem errou (em caso de erro) ou de quem venceu (winner).
 * - Vencedor do ponto: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 * - Vencedor > rede: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 * - Vencedor > passada: winner pertence ao vencedor; EF/ENF pertencem ao adversário.
 */
export function getPointShotDetails(p: TimelinePoint): PointShotDetails | null {
  const tipo = p.rallyDetails?.tipo ?? (
    p.type === 'WINNER' ? 'winner' :
    p.type === 'UNFORCED_ERROR' ? 'erro_nao_forcado' :
    p.type === 'FORCED_ERROR' ? 'erro_forcado' :
    undefined
  );

  if (!tipo) return null;

  const stroke = p.stroke || p.rallyDetails?.golpe || undefined;
  const situacao = p.rallyDetails?.situacao || undefined;

  let strokeSide: 'forehand' | 'backhand' | undefined;
  if (stroke === 'fh' || stroke === 'vfh') {
    strokeSide = 'forehand';
  } else if (stroke === 'bh' || stroke === 'vbh') {
    strokeSide = 'backhand';
  }

  // Winner: executado pelo vencedor do ponto
  if (tipo === 'winner') {
    return {
      executor: p.winner,
      outcome: 'winner',
      stroke,
      strokeSide,
      situacao,
    };
  }

  // Erros (Forçado ou Não Forçado): executado pelo adversário do vencedor do ponto
  const errorExecutor = p.winner === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
  const outcome = tipo === 'erro_forcado' ? 'forced_error' : 'unforced_error';

  return {
    executor: errorExecutor,
    outcome,
    stroke,
    strokeSide,
    situacao,
  };
}

interface OutcomeStats {
  winners: number;
  winnersByStroke: Record<string, number>;
  forcedErrors: number;
  forcedErrorsByStroke: Record<string, number>;
  unforcedErrors: number;
  unforcedErrorsByStroke: Record<string, number>;
  backhandStats: StrokeSideStats;
  forehandStats: StrokeSideStats;
}

function updateSideStats(stats: StrokeSideStats, outcome: 'winner' | 'unforced_error' | 'forced_error'): void {
  stats.total++;
  if (outcome === 'winner') stats.winners++;
  else if (outcome === 'unforced_error') stats.unforcedErrors++;
  else if (outcome === 'forced_error') stats.forcedErrors++;
}

function applyLegacyFallback(
  points: TimelinePoint[],
  player: 'PLAYER_1' | 'PLAYER_2',
  current: OutcomeStats,
): OutcomeStats {
  const legacyWinners = points.filter(p => p.winner === player && p.rallyDetails?.tipo === 'winner').length;
  const legacyForced = points.filter(p => p.winner !== player && p.rallyDetails?.tipo === 'erro_forcado').length;
  const legacyUnforced = points.filter(p => p.winner !== player && p.rallyDetails?.tipo === 'erro_nao_forcado').length;

  return {
    ...current,
    winners: Math.max(current.winners, legacyWinners),
    forcedErrors: Math.max(current.forcedErrors, legacyForced),
    unforcedErrors: Math.max(current.unforcedErrors, legacyUnforced),
  };
}

function aggregatePlayerOutcomes(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2'): OutcomeStats {
  const result: OutcomeStats = {
    winners: 0,
    winnersByStroke: {},
    forcedErrors: 0,
    forcedErrorsByStroke: {},
    unforcedErrors: 0,
    unforcedErrorsByStroke: {},
    backhandStats: { winners: 0, unforcedErrors: 0, forcedErrors: 0, total: 0 },
    forehandStats: { winners: 0, unforcedErrors: 0, forcedErrors: 0, total: 0 },
  };

  for (const p of points) {
    const details = getPointShotDetails(p);
    if (!details || details.executor !== player) continue;

    if (details.outcome === 'winner') {
      result.winners++;
      if (details.stroke) {
        result.winnersByStroke[details.stroke] = (result.winnersByStroke[details.stroke] || 0) + 1;
      }
    } else if (details.outcome === 'unforced_error') {
      result.unforcedErrors++;
      if (details.stroke) {
        result.unforcedErrorsByStroke[details.stroke] = (result.unforcedErrorsByStroke[details.stroke] || 0) + 1;
      }
    } else if (details.outcome === 'forced_error') {
      result.forcedErrors++;
      if (details.stroke) {
        result.forcedErrorsByStroke[details.stroke] = (result.forcedErrorsByStroke[details.stroke] || 0) + 1;
      }
    }

    if (details.strokeSide === 'backhand') {
      updateSideStats(result.backhandStats, details.outcome);
    } else if (details.strokeSide === 'forehand') {
      updateSideStats(result.forehandStats, details.outcome);
    }
  }

  return applyLegacyFallback(points, player, result);
}

function computeNetApproaches(points: TimelinePoint[], player: 'PLAYER_1' | 'PLAYER_2') {
  const netApproaches = points.filter(p => p.rallyDetails?.situacao === 'rede').length;
  const netApproachesWon = points.filter(p => p.rallyDetails?.situacao === 'rede' && p.winner === player).length;
  const netApproachPct = calcPercentage(netApproachesWon, netApproaches);

  return { netApproaches, netApproachesWon, netApproachPct };
}

function computeRallyMetrics(points: TimelinePoint[]) {
  const rallyLengths = points.map(p => p.rallyLength).filter(l => l > 0);
  const rallyAvgLength = rallyLengths.length > 0
    ? rallyLengths.reduce((a, b) => a + b, 0) / rallyLengths.length
    : 0;

  const short = rallyLengths.filter(l => l <= 4).length;
  const medium = rallyLengths.filter(l => l >= 5 && l <= 8).length;
  const longRallies = rallyLengths.filter(l => l >= 9).length;

  return {
    rallyLengthDistribution: { short, medium, long: longRallies },
    rallyAvgLength,
  };
}

function countSpecialShots(points: TimelinePoint[]) {
  return {
    lobCount: points.filter(p => p.rallyDetails?.golpe_esp === 'lob').length,
    dropShotCount: points.filter(p => p.rallyDetails?.golpe_esp === 'drop_shot').length,
    smashCount: points.filter(p => p.rallyDetails?.golpe === 'smash').length,
  };
}

export function computeShotAnalysis(points: TimelinePoint[], playerIndex: 1 | 2): ShotAnalysis {
  const player = `PLAYER_${playerIndex}` as const;

  return {
    ...aggregatePlayerOutcomes(points, player),
    ...computeNetApproaches(points, player),
    ...computeRallyMetrics(points),
    ...countSpecialShots(points),
  };
}

