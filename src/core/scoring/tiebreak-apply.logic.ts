import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { completeSetWithTiebreak } from './set-completion';
import { advanceServeIndex } from './doubles';
import { computeServerForNextSetAfterTiebreak, isMatchTiebreakFormat, hasTiebreakBeenWon } from './tiebreak-server.logic';

export function applyTiebreakPoint(
  state: ScoringState,
  winner: 'player1' | 'player2',
  config: ScoringEngineConfig,
): ScoringState {
  const currentSetIndex = state.sets.length - 1;
  const currentSet = state.sets[currentSetIndex];
  const tb = currentSet?.tiebreakScore ?? { player1: 0, player2: 0 };
  const newTb = { ...tb };

  if (winner === 'player1') newTb.player1++;
  else newTb.player2++;

  const total = newTb.player1 + newTb.player2;
  // Sacador do PRÓXIMO PONTO do tiebreak, caso ele continue (alternância
  // 1-depois-2-2-2 dentro do próprio tiebreak). Usado só enquanto o
  // tiebreak segue em andamento — NÃO deve ser usado para decidir quem
  // saca o set seguinte quando o tiebreak termina (ver newSetServer abaixo).
  const newServer = total % 2 === 0
    ? state.server
    : (state.server === 'player1' ? 'player2' : 'player1');

  const isMatchTb = isMatchTiebreakFormat(config, state.sets.length);
  const tbMin = isMatchTb ? 10 : 7;

  if (hasTiebreakBeenWon(newTb, winner, tbMin)) {
    const t = newTb.player1 + newTb.player2 - 1;
    const b = Math.floor((t + 1) / 2);
    const s0: 'player1' | 'player2' = (b % 2 === 0)
      ? state.server
      : (state.server === 'player1' ? 'player2' : 'player1');
    advanceServeIndex(state, s0);

    // Em Match Tiebreak não há set seguinte — o "próximo sacador" é só o
    // alternador corrente. No tiebreak comum, ancora em initialServerId.
    const nextSetServer = isMatchTb
      ? newServer
      : computeServerForNextSetAfterTiebreak(state, config, currentSetIndex, currentSet, winner);
    return completeSetWithTiebreak(winner, newTb, nextSetServer, state, config);
  }

  const newSet: SetScore = { ...currentSet, tiebreakScore: newTb };
  const newSets = [...state.sets];
  newSets[currentSetIndex] = newSet;

  return {
    ...state,
    sets: newSets,
    currentGame: createEmptyGame(),
    server: newServer,
  };
}
