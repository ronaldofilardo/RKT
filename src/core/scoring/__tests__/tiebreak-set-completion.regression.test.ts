import { ScoringEngine } from '../engine';

describe('Regression: Completed tiebreak sets must not accumulate next set games', () => {
  it('deve finalizar set em 7-6 quando tiebreak termina e iniciar novo set sem vazar games para o anterior (evitando 8-6)', () => {
    const engine = new ScoringEngine({
      format: 'BEST_OF_3',
      player1Id: 'p1',
      player2Id: 'p2',
      initialServerId: 'p1',
    });

    // Simula o set chegando em 6-6
    for (let i = 0; i < 6; i++) {
      // P1 ganha um game
      for (let j = 0; j < 4; j++) {
        engine.applyPoint({ winnerId: 'p1', serverId: i % 2 === 0 ? 'p1' : 'p2' });
      }
      // P2 ganha um game
      for (let j = 0; j < 4; j++) {
        engine.applyPoint({ winnerId: 'p2', serverId: (i + 1) % 2 === 0 ? 'p1' : 'p2' });
      }
    }

    // Tiebreak: P1 vence 7-2
    for (let i = 0; i < 5; i++) engine.applyPoint({ winnerId: 'p1', serverId: 'p1' });
    for (let i = 0; i < 2; i++) engine.applyPoint({ winnerId: 'p2', serverId: 'p2' });
    for (let i = 0; i < 2; i++) engine.applyPoint({ winnerId: 'p1', serverId: 'p1' });

    const stateAfterTiebreak = engine.getState();
    expect(stateAfterTiebreak.sets[0].player1).toBe(7);
    expect(stateAfterTiebreak.sets[0].player2).toBe(6);
    expect(stateAfterTiebreak.sets.length).toBe(1);

    // Agora o bug real: P1 ganha mais um game no SEGUNDO set
    for (let i = 0; i < 4; i++) {
      engine.applyPoint({ winnerId: 'p1', serverId: 'p2' });
    }

    const finalState = engine.getState();
    
    // O primeiro set deve continuar 7-6, NÃO pode virar 8-6
    expect(finalState.sets[0].player1).toBe(7);
    expect(finalState.sets[0].player2).toBe(6);
    
    // E o segundo set deve ser criado com 1-0 para P1
    expect(finalState.sets.length).toBe(2);
    expect(finalState.sets[1].player1).toBe(1);
    expect(finalState.sets[1].player2).toBe(0);
  });
});
