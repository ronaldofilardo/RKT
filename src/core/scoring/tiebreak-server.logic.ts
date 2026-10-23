import type { ScoringEngineConfig, ScoringState, SetScore } from './types';

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

/**
 * Determina se o tiebreak atual é um Match Tiebreak (mínimo 10 pontos)
 * em vez do tiebreak comum de 7 pontos.
 */
export function isMatchTiebreakFormat(config: ScoringEngineConfig, setsLength: number): boolean {
  return (
    config.format === 'MATCH_TB_10' ||
    (config.format === 'BEST_OF_5' && setsLength === 5) ||
    (config.format === 'BEST_OF_3_MATCH_TB' && setsLength === 3) ||
    (config.format === 'BEST_OF_3_NO_AD' && setsLength === 3) ||
    (config.format === 'SHORT_SET_2V2_NO_AD' && setsLength === 3)
  );
}

/** O vencedor indicado já atingiu o mínimo com 2 pontos de vantagem? */
export function hasTiebreakBeenWon(
  tb: { player1: number; player2: number },
  winner: 'player1' | 'player2',
  tbMin: number,
): boolean {
  const w = tb[winner];
  const l = winner === 'player1' ? tb.player2 : tb.player1;
  return w >= tbMin && w - l >= 2;
}
