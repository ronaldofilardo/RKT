import type { ScoringState, PointDetails } from './types';

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
  // resulta em falso-positivo constante: no início de qualquer set/game,
  // ambos têm 0 games, e "receiverGames >= serverGames" é sempre verdadeiro.
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

export interface PointSnapshot {
  setNumber: number;
  isTiebreak: boolean;
  server: 'player1' | 'player2';
  gamesScore: { player1: number; player2: number };
  gameScore: { player1: number; player2: number };
  isBreakPoint: boolean;
  isGameBall: boolean;
  isSetBall: boolean;
  gameIsDeuce: boolean;
  gameAdvantage: 'player1' | 'player2' | null;
}

/**
 * Deriva o contexto de placar de um ponto a partir do estado do engine
 * naquele instante. Função pura extraída de `enrichPointsFromHistory` para
 * reduzir a complexidade ciclomática da reconstrução da timeline.
 */
export function derivePointSnapshot(stateBefore: ScoringState | null): PointSnapshot {
  const sets = Array.isArray(stateBefore?.sets) ? stateBefore.sets : [];
  const setsWon = stateBefore?.setsWon
    ? (stateBefore.setsWon.player1 ?? 0) + (stateBefore.setsWon.player2 ?? 0)
    : 0;
  const isNextSetPending = sets.length > 0 && setsWon >= sets.length;

  const setNumber = isNextSetPending
    ? sets.length + 1
    : sets.length > 0
      ? sets.length
      : 1;

  const currentSet = !isNextSetPending && sets.length > 0 ? sets[sets.length - 1] : undefined;
  const isTiebreak = currentSet?.isTiebreak ?? false;
  const tiebreakScore = isTiebreak ? currentSet?.tiebreakScore : null;

  // Em tiebreak o placar exibido é o próprio placar do tiebreak.
  const scoreOrTiebreak = (fallback: { player1: number; player2: number }) =>
    tiebreakScore
      ? { player1: tiebreakScore.player1, player2: tiebreakScore.player2 }
      : fallback;

  const gamesScore = scoreOrTiebreak({
    player1: currentSet?.player1 ?? 0,
    player2: currentSet?.player2 ?? 0,
  });

  const currentGame = stateBefore?.currentGame ?? {
    player1: 0,
    player2: 0,
    isDeuce: false,
    advantage: null,
  };
  const gameScore = scoreOrTiebreak({
    player1: currentGame.player1,
    player2: currentGame.player2,
  });

  return {
    setNumber,
    isTiebreak,
    server: stateBefore?.server ?? 'player1',
    gamesScore,
    gameScore,
    isBreakPoint: stateBefore ? isBreakPoint(stateBefore) : false,
    isGameBall: stateBefore ? isGameBall(stateBefore) : false,
    isSetBall: stateBefore ? isSetBall(stateBefore, setNumber) : false,
    gameIsDeuce: currentGame.isDeuce ?? false,
    gameAdvantage: currentGame.advantage ?? null,
  };
}

export interface ServeOutcomes {
  rallyLength: number;
  firstFault?: PointDetails['firstFaultDetail'];
  firstServeOutcome: 'ace' | 'out' | 'net' | null;
  secondServeOutcome: 'ace' | 'out' | 'net' | null;
}

/**
 * Deriva o resultado dos saques e o comprimento do rally a partir do ponto
 * registrado. Função pura extraída de `enrichPointsFromHistory`.
 */
export function deriveServeOutcomes(pt: PointDetails): ServeOutcomes {
  const isServeFinish = pt.type === 'ACE' || pt.type === 'DOUBLE_FAULT';
  const isDevolucao = pt.rallyDetails?.situacao === 'devolucao';
  const rallyLength = pt.rallyLength ?? (isServeFinish ? 1 : isDevolucao ? 2 : 0);

  // firstFault representa o erro do 1o saque independente de como o ponto
  // terminou — a única condição é ter sido registrado.
  const firstFault = pt.firstFaultDetail ?? undefined;

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
        : null;

  return { rallyLength, firstFault, firstServeOutcome, secondServeOutcome };
}
