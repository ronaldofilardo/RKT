/**
 * Regressão (2026-09-22): sacador do 1º game do set seguinte após um set
 * decidido por tiebreak comum (ex.: 7-6).
 *
 * Regra oficial (ITF, confirmada em múltiplas fontes): quem sacou o
 * PRIMEIRO PONTO do tiebreak passa a RECEBER no primeiro game do set
 * seguinte — ou seja, o saque TROCA, independente do placar final do
 * tiebreak.
 *
 * Bug anterior: o motor (processTiebreakPoint em tiebreak.ts) calculava o
 * sacador do set seguinte como se a alternância de pontos DENTRO do
 * tiebreak (1-depois-2-2-2...) simplesmente continuasse — isso sempre
 * devolvia o MESMO jogador que sacou o ponto 1 do tiebreak, quando o
 * correto é o oposto.
 */

import { ScoringEngine } from '@/core/scoring/engine';

function winGame(engine: ScoringEngine, winner: 'p1' | 'p2') {
  for (let i = 0; i < 4; i++) {
    engine.applyPoint({ winnerId: winner, type: 'WINNER' } as any);
  }
}

function playToSixAll(engine: ScoringEngine) {
  for (let g = 0; g < 12; g++) {
    winGame(engine, g % 2 === 0 ? 'p1' : 'p2');
  }
}

describe('Regressão: sacador do set seguinte após tiebreak comum (ITF)', () => {
  it('Set 1 termina 7-6 com player1 sacando o ponto 1 do TB → Set 2 deve começar com player2 sacando', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    playToSixAll(engine);
    const tFirst = engine.getState().server;
    expect(tFirst).toBe('player1'); // pré-condição: 12 games (par) → mesmo sacador do game 1

    // Tiebreak: player1 vence 7-0 (qualquer placar final deveria dar o mesmo resultado).
    for (let i = 0; i < 7; i++) {
      engine.applyPoint({ winnerId: 'p1', type: 'WINNER' } as any);
    }

    const state = engine.getState();
    expect(state.sets[0]).toMatchObject({ player1: 7, player2: 6, isTiebreak: false });
    // REGRA ITF: oposto de quem sacou o ponto 1 do tiebreak.
    expect(state.server).toBe('player2');
  });

  it('Set 1 termina 7-6 com player1 sacando o TB, mas o placar final é apertado (9-7) — resultado não depende do placar final', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    playToSixAll(engine);
    expect(engine.getState().server).toBe('player1');

    // 9-7 no tiebreak (troca de pontos até fechar com vantagem de 2).
    const order: Array<'p1' | 'p2'> = ['p1', 'p2', 'p1', 'p2', 'p1', 'p2', 'p1', 'p2', 'p1', 'p1', 'p1', 'p1', 'p1', 'p1', 'p1', 'p2'];
    // Simplesmente força p1 a vencer 9-7 jogando pontos até o placar bater.
    const tb = { p1: 0, p2: 0 };
    let turn = 0;
    while (!(tb.p1 >= 7 && tb.p1 - tb.p2 >= 2)) {
      const winner = turn < order.length ? order[turn] : 'p1';
      engine.applyPoint({ winnerId: winner, type: 'WINNER' } as any);
      if (winner === 'p1') tb.p1++; else tb.p2++;
      turn++;
    }

    const state = engine.getState();
    expect(state.sets[0].player1).toBe(7);
    expect(state.sets[0].player2).toBe(6);
    expect(state.server).toBe('player2'); // mesmo resultado da 1ª simulação (7-0)
  });

  it('2º set decidido por tiebreak: continua respeitando a alternância acumulada desde o início da partida', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    // Set 1: 6-3 (9 games, ímpar) — sem tiebreak. Sequência escolhida para
    // não fechar o set antes do 9º game (evita 6-2/6-1 por vitória antecipada).
    const set1Order: Array<'p1' | 'p2'> = ['p1', 'p2', 'p1', 'p2', 'p1', 'p2', 'p1', 'p1', 'p1'];
    for (const winner of set1Order) {
      winGame(engine, winner);
    }
    expect(engine.getState().sets[0]).toMatchObject({ player1: 6, player2: 3 });
    // 9 games (ímpar) → sacador do Set 2 Game 1 já troca para player2.
    const tFirstSet2 = engine.getState().server;
    expect(tFirstSet2).toBe('player2');

    // Set 2 vai a 6-6 e o tiebreak é vencido por quem estiver sacando o
    // ponto 1 dele (tFirstSet2 = player2, após mais 12 games, par, mantém).
    playToSixAll(engine);
    expect(engine.getState().server).toBe('player2');

    for (let i = 0; i < 7; i++) {
      engine.applyPoint({ winnerId: 'p2', type: 'WINNER' } as any);
    }

    const state = engine.getState();
    expect(state.sets[1]).toMatchObject({ player1: 6, player2: 7 });
    // Regra ITF: oposto de quem sacou o ponto 1 do tiebreak do Set 2 (player2) → player1.
    expect(state.server).toBe('player1');
  });
});
