import type { ScoringState, HistoryEntry, TimelinePoint } from './types';
import { GAME_POINTS } from './point-utils';
import { unwrapStateEnvelope } from './state-envelope';
import { derivePointSnapshot, deriveServeOutcomes } from './point-context';

// Predicados de contexto de ponto migrados para `point-context.ts` (fonte
// canônica). Re-exportados aqui para manter a API pública existente.
export { isBreakPoint, isGameBall, isSetBall } from './point-context';

export function getGameScoreLabel(
  p1: number, p2: number,
  isDeuce?: boolean, advantage?: string | null, isTiebreak?: boolean,
): string {
  if (isTiebreak || p1 >= 4 || p2 >= 4) return `${p1}x${p2}`;
  if (isDeuce) {
    if (advantage === 'player1') return 'ADx40';
    if (advantage === 'player2') return '40xAD';
    return '40x40';
  }
  return `${GAME_POINTS[p1] ?? p1}x${GAME_POINTS[p2] ?? p2}`;
}

export function enrichPointsFromHistory(
  history: HistoryEntry[],
  player1Id: string,
  _player2Id: string,
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const stateBefore: ScoringState = unwrapStateEnvelope(entry?.stateBefore);
    const pt = entry.point;

    const snapshot = derivePointSnapshot(stateBefore);
    const serve = deriveServeOutcomes(pt);

    points.push({
      pointNumber: i + 1,
      winner: pt.winnerId === player1Id ? 'PLAYER_1' : 'PLAYER_2',
      type: pt.type,
      server: snapshot.server,
      isFirstServe: pt.isFirstServe,
      isSecondServe: pt.isSecondServe,
      gameScore: snapshot.gameScore,
      gamesScore: snapshot.gamesScore,
      setNumber: snapshot.setNumber,
      isBreakPoint: snapshot.isBreakPoint,
      isGameBall: snapshot.isGameBall,
      isSetBall: snapshot.isSetBall,
      rallyLength: serve.rallyLength,
      rallyDetails: pt.rallyDetails ?? null,
      // `note` só é populada a partir do rallyDetails do ponto atual.
      // NÃO herdamos nota de iterações anteriores — o spread do estado do
      // engine pode carregar rallyDetails residual de pontos passados, e
      // usar pt.rallyDetails?.note sem verificação causaria "vazamento" da
      // observação de um ponto para o seguinte sem anotação.
      note: pt.rallyDetails != null ? pt.rallyDetails.note : undefined,
      pointDetails: pt,
      isTiebreak: snapshot.isTiebreak,
      gameIsDeuce: snapshot.gameIsDeuce,
      gameAdvantage: snapshot.gameAdvantage,
      firstFault: serve.firstFault,
      firstServeOutcome: serve.firstServeOutcome,
      secondServeOutcome: serve.secondServeOutcome,
    });
  }

  return points;
}
