import type { TimelinePoint } from '@/core/scoring/types';
import type { SetResult } from './timeline-set-results-state.logic';

/**
 * Placar de um set encerrado em tiebreak (Bug 2 — o gameScore do último ponto
 * registrado é ANTES do vencedor ser aplicado, então somamos +1 ao vencedor).
 */
export function computeTiebreakSetResult(
  setNum: number,
  setPoints: TimelinePoint[],
  lastPoint: TimelinePoint,
): SetResult {
  const winner = lastPoint.winner;

  // Bug 2 — gameScore agora contém corretamente os pontos do tiebreak
  // (após correção do Bug 1 em point-snapshot.logic.ts). O último ponto
  // registrado é ANTES do vencedor ser aplicado, então somamos +1 ao
  // vencedor para obter o placar final do tiebreak.
  const tbP1 = lastPoint.gameScore.player1 + (winner === 'PLAYER_1' ? 1 : 0);
  const tbP2 = lastPoint.gameScore.player2 + (winner === 'PLAYER_2' ? 1 : 0);
  const tb = { p1: tbP1, p2: tbP2 };

  // Para o placar de games do set, usamos gamesScore (que agora é sempre
  // o placar real de games, independente de tiebreak — Bug 1 corrigido).
  // Buscamos o último ponto ainda em jogo regular (não-tiebreak) para
  // obter os games reais no momento em que o tiebreak foi iniciado.
  const lastRegular = [...setPoints].reverse().find((p) => !p.isTiebreak);
  if (!lastRegular) {
    // Set é 100% tiebreak (ex: MATCH_TB_10 onde games começam em 0x0).
    return {
      setNumber: setNum,
      p1: winner === 'PLAYER_1' ? 1 : 0,
      p2: winner === 'PLAYER_2' ? 1 : 0,
      tiebreak: tb,
    };
  }

  // O tiebreak foi iniciado quando os games chegaram a empate (ex: 6x6 ou 9x9).
  // gamesScore do último ponto regular já contém esse valor. O vencedor do
  // tiebreak recebe +1 game (ex: 7x6 ou 10x9).
  const regWinner = lastRegular.winner;
  const regP1 = lastRegular.gamesScore.player1 + (regWinner === 'PLAYER_1' ? 1 : 0);
  const regP2 = lastRegular.gamesScore.player2 + (regWinner === 'PLAYER_2' ? 1 : 0);
  const baseGames = Math.max(regP1, regP2);
  return {
    setNumber: setNum,
    p1: winner === 'PLAYER_1' ? baseGames + 1 : baseGames,
    p2: winner === 'PLAYER_2' ? baseGames + 1 : baseGames,
    tiebreak: tb,
  };
}
