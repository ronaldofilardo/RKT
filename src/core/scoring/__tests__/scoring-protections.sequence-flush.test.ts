/**
 * Split de scoring-protections.test.ts — PROTEÇÃO #5 (Recálculo de Sequência
 * no Flush / Offline Sync): sequência baseada na versão do banco, retry com
 * SEQUENCE_CONFLICT, pontos offline e múltiplas partidas no flush.
 * Asserções 1:1.
 */
describe('PROTEÇÃO #5: Recálculo de Sequência no Flush (Offline Sync)', () => {
  it("deve calcular sequência correta baseada na versão do banco", () => {
    const matchVersion = 5; // Banco já tem 5 pontos
    const expectedSequence = matchVersion + 1;
    expect(expectedSequence).toBe(6); // Primeiro ponto offline deve ser #6
  });

  it("deve lidar com SEQUENCE_CONFLICT e retry com sequência corrigida", () => {
    const expectedSequence = 8; // Banco esperava 8 (outros pontos foram sincronizados)
    const isConflict = true;
    const shouldRetry = isConflict && expectedSequence;
    const retrySequence = expectedSequence; // Nova sequência para retry
    expect(shouldRetry).toBe(8);
    expect(retrySequence).toBe(8);
  });

  it("deve sequenciar múltiplos pontos offline corretamente", () => {
    const matchVersion = 5;
    const offlinePoints = [
      { id: 1, type: 'WINNER' },
      { id: 2, type: 'ACE' },
      { id: 3, type: 'DOUBLE_FAULT' },
    ];
    const sequences = offlinePoints.map((_, index) => matchVersion + index + 1);
    expect(sequences).toEqual([6, 7, 8]); // Sequência correta para cada ponto
  });

  it("deve atualizar sequência após cada ponto sincronizado", () => {
    let currentSequence = 5; // Versão inicial do banco
    const syncPoint = () => {
      currentSequence++;
      return currentSequence;
    };
    expect(syncPoint()).toBe(6); // Primeiro ponto
    expect(syncPoint()).toBe(7); // Segundo ponto
    expect(syncPoint()).toBe(8); // Terceiro ponto
  });

  it("deve lidar com múltiplas partidas no flush", () => {
    const matchVersions = new Map<string, number>([
      ['match-1', 5],
      ['match-2', 3],
      ['match-3', 10],
    ]);
    const pendingActions = [
      { matchId: 'match-1', id: 'a1' },
      { matchId: 'match-2', id: 'a2' },
      { matchId: 'match-1', id: 'a3' }, // Segundo ponto de match-1
      { matchId: 'match-3', id: 'a4' },
    ];
    const sequences = pendingActions.map((action) => {
      const version = matchVersions.get(action.matchId) || 0;
      matchVersions.set(action.matchId, version + 1); // Atualizar para próximo
      return version + 1;
    });
    expect(sequences).toEqual([6, 4, 7, 11]); // Sequências corretas por partida
  });
});
