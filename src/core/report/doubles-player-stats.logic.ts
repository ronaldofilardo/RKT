import type { TimelinePoint } from '@/core/scoring/types';
import { isFirstServePoint } from './serve-stats';

export interface DoublesPlayerMetrics {
  playerId: string;
  playerName: string;
  team: 'PLAYER_1' | 'PLAYER_2';
  servicePoints: number;
  firstServesIn: number;
  aces: number;
  doubleFaults: number;
  servicePointsWon: number;
  winners: number;
  unforcedErrors: number;
  forcedErrors: number;
  netPointsWon: number;
  deuceSidePointsWon: number;
  adSidePointsWon: number;
}

export function computeDoublesPlayerStats(
  points: TimelinePoint[],
  player: { id: string; name: string },
  team: 'PLAYER_1' | 'PLAYER_2',
): DoublesPlayerMetrics {
  let servicePoints = 0;
  let firstServesIn = 0;
  let aces = 0;
  let doubleFaults = 0;
  let servicePointsWon = 0;
  let winners = 0;
  let unforcedErrors = 0;
  let forcedErrors = 0;
  let netPointsWon = 0;
  let deuceSidePointsWon = 0;
  let adSidePointsWon = 0;

  for (const p of points) {
    const isTeamWin = p.winner === team;

    if (p.serverId === player.id) {
      servicePoints++;
      if (p.type === 'ACE') aces++;
      if (p.type === 'DOUBLE_FAULT') doubleFaults++;
      if (isFirstServePoint(p)) firstServesIn++;
      if (isTeamWin) servicePointsWon++;
    }

    if (p.hitterId === player.id) {
      if (isTeamWin && (p.type === 'WINNER' || p.rallyDetails?.tipo === 'winner')) {
        winners++;
      } else if (!isTeamWin) {
        if (p.type === 'UNFORCED_ERROR' || p.rallyDetails?.tipo === 'erro_nao_forcado') {
          unforcedErrors++;
        } else if (p.type === 'FORCED_ERROR' || p.rallyDetails?.tipo === 'erro_forcado') {
          forcedErrors++;
        }
      }

      const isNet =
        p.rallyDetails?.situacao === 'rede' ||
        p.rallyDetails?.golpe === 'vfh' ||
        p.rallyDetails?.golpe === 'vbh' ||
        p.rallyDetails?.golpe === 'smash' ||
        p.rallyDetails?.golpe === 'approach_fh' ||
        p.rallyDetails?.golpe === 'approach_bh';
      if (isNet && isTeamWin) netPointsWon++;
    }

    if (isTeamWin && p.courtSide) {
      if (p.courtSide === 'deuce') deuceSidePointsWon++;
      else if (p.courtSide === 'ad') adSidePointsWon++;
    }
  }

  return {
    playerId: player.id,
    playerName: player.name,
    team,
    servicePoints,
    firstServesIn,
    aces,
    doubleFaults,
    servicePointsWon,
    winners,
    unforcedErrors,
    forcedErrors,
    netPointsWon,
    deuceSidePointsWon,
    adSidePointsWon,
  };
}
