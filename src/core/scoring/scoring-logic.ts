import type { ScoringState, HistoryEntry, TimelinePoint } from './types';
import { GAME_POINTS } from './point-utils';

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

export function isBreakPoint(state: ScoringState): boolean {
  if (!state || state.isFinished) return false;
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[sets.length - 1];
  // Tiebreak não tem "quebra de saque" no sentido clássico de game — cada
  // ponto do tiebreak é servido alternadamente, então o conceito de break
  // point não se aplica.
  if (set?.isTiebreak) return false;

  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
  const server = state.server;
  const receiver = server === 'player1' ? 'player2' : 'player1';

  // Break point é sobre o placar de PONTOS dentro do game atual — não
  // sobre quantos games já foram vencidos no set. Usar o placar de games
  // (como a versão anterior fazia) resulta em falso-positivo constante:
  // no início de qualquer set/game, ambos têm 0 games, e "receiverGames
  // >= serverGames" (0 >= 0) é sempre verdadeiro.
  if (game.isDeuce) {
    return game.advantage === receiver;
  }

  const receiverPoints = receiver === 'player1' ? game.player1 : game.player2;
  const serverPoints = server === 'player1' ? game.player1 : game.player2;
  return receiverPoints >= 3 && serverPoints <= 2;
}

export function isGameBall(state: ScoringState): boolean {
  if (!state) return false;
  const game = state.currentGame ?? { player1: 0, player2: 0, isDeuce: false };
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[sets.length - 1];
  if (set?.isTiebreak && set.tiebreakScore) {
    const p1 = set.tiebreakScore.player1;
    const p2 = set.tiebreakScore.player2;
    return (p1 >= 9 && p1 - p2 === 1) || (p2 >= 9 && p2 - p1 === 1);
  }
  if (game.isDeuce) return false;
  return (game.player1 >= 3 && game.player2 <= 2) || (game.player2 >= 3 && game.player1 <= 2);
}

export function isSetBall(state: ScoringState, setNumber: number): boolean {
  if (!state) return false;
  const sets = Array.isArray(state.sets) ? state.sets : [];
  const set = sets[setNumber - 1];
  if (!set) return false;
  return (set.player1 >= 5 && set.player2 <= 4) || (set.player2 >= 5 && set.player1 <= 4);
}

export function enrichPointsFromHistory(
  history: HistoryEntry[],
  player1Id: string,
  _player2Id: string,
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  for (let i = 0; i < history.length; i++) {
    const entry = history[i];
    const rawState = entry?.stateBefore;
    const stateBefore: ScoringState =
      rawState && typeof rawState === 'object' && 'state' in rawState && (rawState as any).state
        ? (rawState as any).state
        : rawState;
    const pt = entry.point;

    const winner: 'PLAYER_1' | 'PLAYER_2' =
      pt.winnerId === player1Id ? 'PLAYER_1' : 'PLAYER_2';

    const sets = Array.isArray(stateBefore?.sets) ? stateBefore.sets : [];
    const setNumber = sets.length > 0 ? sets.length : 1;
    const currentSet = sets.length > 0 ? sets[sets.length - 1] : undefined;
    const isTiebreak = currentSet?.isTiebreak ?? false;

    const tiebreakScore = isTiebreak ? currentSet?.tiebreakScore : undefined;

    const gamesScore = isTiebreak && tiebreakScore
      ? { player1: tiebreakScore.player1, player2: tiebreakScore.player2 }
      : {
          player1: currentSet?.player1 ?? 0,
          player2: currentSet?.player2 ?? 0,
        };

    const currentGame = stateBefore?.currentGame ?? { player1: 0, player2: 0, isDeuce: false, advantage: null };
    const gameScore = isTiebreak && tiebreakScore
      ? { player1: tiebreakScore.player1, player2: tiebreakScore.player2 }
      : {
          player1: currentGame.player1,
          player2: currentGame.player2,
        };

    const bp = stateBefore ? isBreakPoint(stateBefore) : false;
    const gb = stateBefore ? isGameBall(stateBefore) : false;
    const sb = stateBefore ? isSetBall(stateBefore, setNumber) : false;

    const isServeFinish = pt.type === 'ACE' || pt.type === 'DOUBLE_FAULT';
    const isDevolucao = pt.rallyDetails?.situacao === 'devolucao';
    const rallyLength = pt.rallyLength ?? (isServeFinish ? 1 : isDevolucao ? 2 : 0);

    // firstFault representa o erro do 1o saque independente de como o
    // ponto terminou (dupla falta, ace no 2o saque, ou rally comum após
    // acerto do 2o saque) — a única condição é ter sido registrado.
    const firstFault = pt.firstFaultDetail ? pt.firstFaultDetail : undefined;

    const firstServeOutcome: 'ace' | 'out' | 'net' | null =
      pt.type === 'ACE' && pt.isFirstServe
        ? 'ace'
        : pt.firstFaultDetail?.errorType === 'out'
          ? 'out'
          : pt.firstFaultDetail?.errorType === 'net'
            ? 'net'
            : null;

    const secondServeOutcome: 'ace' | 'out' | 'net' | null =
      pt.type === 'ACE' && pt.isSecondServe
        ? 'ace'
        : pt.type === 'DOUBLE_FAULT'
          ? (pt.rallyDetails?.subtipo2 as 'out' | 'net' | undefined) ?? null
          : pt.isSecondServe
            ? null
            : null;

    points.push({
      pointNumber: i + 1,
      winner,
      type: pt.type,
      server: stateBefore?.server ?? 'player1',
      isFirstServe: pt.isFirstServe,
      isSecondServe: pt.isSecondServe,
      gameScore,
      gamesScore,
      setNumber,
      isBreakPoint: bp,
      isGameBall: gb,
      isSetBall: sb,
      rallyLength,
      rallyDetails: pt.rallyDetails ?? null,
      // `note` só é populada a partir do rallyDetails do ponto atual.
      // NÃO herdamos nota de iterações anteriores — o spread do estado do
      // engine pode carregar rallyDetails residual de pontos passados, e
      // usar pt.rallyDetails?.note sem verificação causaria "vazamento" da
      // observação de um ponto para o seguinte sem anotação.
      note: pt.rallyDetails != null ? pt.rallyDetails.note : undefined,
      pointDetails: pt,
      isTiebreak,
      gameIsDeuce: currentGame?.isDeuce ?? false,
      gameAdvantage: currentGame?.advantage ?? null,
      firstFault,
      firstServeOutcome,
      secondServeOutcome,
    });
  }

  return points;
}
