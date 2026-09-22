import type { ScoringEngineConfig, ScoringState, SetScore } from './types';
import { createEmptyGame } from './engine.state';
import { completeSetWithTiebreak } from './set-completion';
import { isFinalSet, getGamesToTiebreak } from './format-rules';

/**
 * BUG FIX (2026-09-22): sacador do 1º game do set seguinte após um set
 * decidido por tiebreak comum (ex.: 7-6).
 *
 * Regra oficial (ITF): quem sacou o PRIMEIRO PONTO do tiebreak passa a
 * RECEBER no primeiro game do set seguinte — ou seja, o saque troca,
 * independente do placar final do tiebreak. Isso equivale a tratar o
 * tiebreak como "mais 1 game" na contagem total de games da partida para
 * fins de alternância (o placar final do set, ex. 7-6 = 13 games, já
 * reflete exatamente essa contagem).
 *
 * Antes deste fix, o código calculava o sacador do PRÓXIMO PONTO do
 * tiebreak (como se ele fosse continuar) e usava esse mesmo valor como
 * sacador do set seguinte — o que está errado: sempre devolvia o MESMO
 * jogador que sacou o ponto 1 do tiebreak, quando o correto é o OPOSTO.
 * Confirmado por simulação completa no motor real (Set 1 7-6, tiebreak
 * 7-0 com player1 sacando o ponto 1): o motor entregava player1 como
 * sacador do Set 2, quando o correto é player2.
 *
 * Esta função ancora o cálculo em `config.initialServerId` (quem sacou o
 * game 1 de TODA a partida — valor fixo e imutável), em vez do sacador
 * "ao vivo" (que já foi rotacionado pelo próprio tiebreak e não serve
 * mais como referência confiável nesse momento).
 */
export function computeServerForNextSetAfterTiebreak(
  state: ScoringState,
  config: ScoringEngineConfig,
  currentSetIndex: number,
  currentSet: SetScore,
  tiebreakWinner: 'player1' | 'player2',
): 'player1' | 'player2' {
  const initialServer: 'player1' | 'player2' =
    config.initialServerId === config.player1Id ? 'player1' : 'player2';

  const priorSetsGames = state.sets
    .slice(0, currentSetIndex)
    .reduce((sum, s) => sum + s.player1 + s.player2, 0);

  // Placar final do set que acabou de ser decidido pelo tiebreak (ex.: 7-6).
  // Já inclui o tiebreak como o "13º game" — não é preciso somar mais nada.
  const finishedSetP1Games = currentSet.player1 + (tiebreakWinner === 'player1' ? 1 : 0);
  const finishedSetP2Games = currentSet.player2 + (tiebreakWinner === 'player2' ? 1 : 0);

  const totalGamesInMatch = priorSetsGames + finishedSetP1Games + finishedSetP2Games;

  if (totalGamesInMatch % 2 === 0) return initialServer;
  return initialServer === 'player1' ? 'player2' : 'player1';
}

export function processTiebreakPoint(
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

  const isMatchTb = config.format === 'MATCH_TB_10' ||
    (config.format === 'BEST_OF_5' && state.sets.length === 5) ||
    (config.format === 'BEST_OF_3_MATCH_TB' && state.sets.length === 3) ||
    (config.format === 'BEST_OF_3_NO_AD' && state.sets.length === 3) ||
    (config.format === 'SHORT_SET_2V2_NO_AD' && state.sets.length === 3);
  const tbMin = isMatchTb ? 10 : 7;

  if (newTb.player1 >= tbMin && newTb.player1 - newTb.player2 >= 2) {
    const nextSetServer = isMatchTb
      ? newServer
      : computeServerForNextSetAfterTiebreak(state, config, currentSetIndex, currentSet, 'player1');
    return completeSetWithTiebreak('player1', newTb, nextSetServer, state, config);
  }
  if (newTb.player2 >= tbMin && newTb.player2 - newTb.player1 >= 2) {
    const nextSetServer = isMatchTb
      ? newServer
      : computeServerForNextSetAfterTiebreak(state, config, currentSetIndex, currentSet, 'player2');
    return completeSetWithTiebreak('player2', newTb, nextSetServer, state, config);
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

export function shouldStartTiebreak(set: SetScore, state: ScoringState, config: ScoringEngineConfig): boolean {
  const isFinalSet_ = isFinalSet(config);

  if (config.format === 'SHORT_SET_2V2_NO_AD') return set.player1 === 4 && set.player2 === 4;

  if (isFinalSet_) {
    const games = getGamesToTiebreak(config);
    return set.player1 === games && set.player2 === games;
  }

  if (config.format === 'BEST_OF_5') {
    // 5º set decisivo (2x2 em sets): joga games normais até 6x6, e SÓ ENTÃO
    // inicia o tie-break — que processTiebreakPoint trata como Match Tiebreak
    // de 10 pontos por já checar state.sets.length === 5. Antes retornava
    // false aqui, o que impedia o tie-break de começar em 6x6 no 5º set,
    // deixando o set seguir por vantagem indefinidamente (regra errada).
    return set.player1 === 6 && set.player2 === 6;
  }

  if (config.format === 'BEST_OF_3') {
    // BEST_OF_3 (com vantagem, sem Match Tiebreak) usa tie-break normal em
    // TODOS os sets, incluindo o 3º/decisivo — não há MT para substituí-lo.
    return set.player1 === 6 && set.player2 === 6;
  }

  if (config.format === 'BEST_OF_3_MATCH_TB' || config.format === 'BEST_OF_3_NO_AD') {
    const setsWon = state.setsWon;
    if (state.sets.length >= 2 && setsWon.player1 === 1 && setsWon.player2 === 1) {
      return false;
    }
    return set.player1 === 6 && set.player2 === 6;
  }

  return set.player1 === 6 && set.player2 === 6;
}