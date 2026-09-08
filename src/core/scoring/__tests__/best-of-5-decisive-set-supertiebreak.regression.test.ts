/**
 * Teste de regressão — bug reportado via print da tela de pontuação ao vivo:
 * o 5º set (decisivo, 2x2 em sets) de partidas BEST_OF_5 chegava a 6x6 em
 * games e o tie-break de 10 pontos (regra Grand Slam) não iniciava.
 *
 * Causa raiz: `shouldStartTiebreak` (tiebreak.ts) retornava `false` sempre
 * que setsWon estava 2x2, achando que o Match Tiebreak seria iniciado por
 * outra rota (como acontece em BEST_OF_3_MATCH_TB) — mas para BEST_OF_5 não
 * existe essa outra rota: o 5º set precisa jogar games normais até 6x6 e,
 * exatamente aí, iniciar o tie-break (que processTiebreakPoint já trata
 * corretamente como MT de 10 pontos, pois checa state.sets.length === 5).
 */
import { ScoringEngine } from '../engine';

const P1 = 'p1';
const P2 = 'p2';
const config = {
  format: 'BEST_OF_5' as const,
  player1Id: P1,
  player2Id: P2,
  initialServerId: P1,
};

function winGame(engine: ScoringEngine, winner: 'p1' | 'p2') {
  const id = winner === 'p1' ? P1 : P2;
  for (let i = 0; i < 4; i++) {
    engine.applyPoint({ winnerId: id, type: 'WINNER', serverId: id });
  }
}

function winGames(engine: ScoringEngine, winner: 'p1' | 'p2', n: number) {
  for (let i = 0; i < n; i++) winGame(engine, winner);
}

function winPoint(engine: ScoringEngine, winner: 'p1' | 'p2') {
  const id = winner === 'p1' ? P1 : P2;
  engine.applyPoint({ winnerId: id, type: 'WINNER', serverId: id });
}

describe('BEST_OF_5 — 5º set decisivo em 6x6 deve iniciar o super tie-break de 10 pontos', () => {
  it('inicia o tie-break assim que o 5º set chega a 6x6 (games normais até lá)', () => {
    const engine = new ScoringEngine(config);

    // Sets 1-4 fecham 2x2
    winGames(engine, 'p1', 6);
    winGames(engine, 'p2', 6);
    winGames(engine, 'p1', 6);
    winGames(engine, 'p2', 6);

    // 5º set: sobe em games normais até 5x5 (cenário do print)
    winGames(engine, 'p1', 5);
    winGames(engine, 'p2', 5);

    let state = engine.getState();
    expect(state.sets[4]).toMatchObject({ player1: 5, player2: 5, isTiebreak: false });

    // Mais um game cada -> 6x6: ANTES desse fix, o set continuava em jogo
    // normal (vantagem) em vez de virar tie-break.
    winGame(engine, 'p1');
    winGame(engine, 'p2');

    state = engine.getState();
    expect(state.sets[4]).toMatchObject({ player1: 6, player2: 6, isTiebreak: true, tiebreakScore: { player1: 0, player2: 0 } });
  });

  it('super tie-break termina com 10 pontos e vantagem de 2, placar do set registrado como 7-6', () => {
    const engine = new ScoringEngine(config);

    winGames(engine, 'p1', 6);
    winGames(engine, 'p2', 6);
    winGames(engine, 'p1', 6);
    winGames(engine, 'p2', 6);
    // 5º set sobe até 6x6 (games alternados para não fechar o set antes)
    winGames(engine, 'p1', 5);
    winGames(engine, 'p2', 5);
    winGame(engine, 'p1');
    winGame(engine, 'p2');

    // Tie-break: p1 abre 9-8 e depois fecha 10-8
    for (let i = 0; i < 9; i++) winPoint(engine, 'p1');
    for (let i = 0; i < 8; i++) winPoint(engine, 'p2');
    // 9-8, ainda não pode terminar (diff < 2 mesmo com p1>=10? não, p1=9 ainda)
    let state = engine.getState();
    expect(state.isFinished).toBe(false);

    winPoint(engine, 'p1'); // 10-8, diff=2 -> fecha

    state = engine.getState();
    expect(state.isFinished).toBe(true);
    expect(state.winner).toBe('player1');
    expect(state.sets[4]).toMatchObject({
      player1: 7,
      player2: 6,
      tiebreakScore: { player1: 10, player2: 8 },
    });
  });
});
