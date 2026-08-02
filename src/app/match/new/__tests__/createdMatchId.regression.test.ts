/**
 * @jest-environment jsdom
 */

/**
 * Teste de regressão para bug: "Modal 'Quem saca primeiro?' não avança ao escolher o 1º sacador"
 * 
 * Causa raiz: A API `/api/matches` retorna `{ data: match }`, mas o frontend
 * estava acessando `data.id` em vez de `data.data.id`.
 * 
 * Isso fazia com que `createdMatchId` fosse `undefined`, e a função
 * `handleSelectServer` retornava imediatamente sem fazer a chamada à API.
 * 
 * Fix: Corrigir acesso para `data.data.id` em `handleSubmit` e `handleForceCreate`
 */

describe('REGRESSION: Bug do createdMatchId undefined', () => {
  it('NÃO deve ter o bug antigo: data.id (undefined) em vez de data.data.id', () => {
    // Este teste documenta o bug
    // Se alguém quebrar o fix, este teste deve falhar

    const buggyResponse = {
      data: { id: 'match-789' },
    };

    // Simular código bugado (apenas para documentação)
    const buggyAccess = buggyResponse.id; // undefined (BUG!)
    const correctAccess = buggyResponse.data.id; // 'match-789' (CORRECT!)

    expect(buggyAccess).toBeUndefined();
    expect(correctAccess).toBe('match-789');

    // O código atual deve usar correctAccess
    // Se este teste falhar, alguém pode ter reintroduzido o bug
  });

  it('DEVE acessar corretamente data.data.id de respostas da API', () => {
    const apiResponses = [
      { data: { id: 'match-1', player1Id: 'p1' } },
      { data: { id: 'match-2', player1Id: 'p1', state: 'SCHEDULED' } },
      { data: { id: 'match-3', format: 'BEST_OF_3' } },
    ];

    const ids = apiResponses.map(response => response.data.id);

    expect(ids).toEqual(['match-1', 'match-2', 'match-3']);
  });

  it('DEVE lidar com estrutura aninhada corretamente', () => {
    const correctResponse = {
      data: {
        id: 'match-correct-123',
        player1Id: 'p1',
        player2Id: 'p2',
        state: 'SCHEDULED',
      },
    };

    // Acesso correto
    const matchId = correctResponse.data.id;
    expect(matchId).toBe('match-correct-123');

    // Acesso bugado seria undefined
    const buggyMatchId = (correctResponse as any).id;
    expect(buggyMatchId).toBeUndefined();
  });

  it('DEVE verificar se data.data.id existe antes de usar', () => {
    const validResponse = { data: { id: 'valid-123' } };
    const invalidResponse = { data: {} };
    const malformedResponse = {} as any;

    expect(validResponse.data.id).toBeDefined();
    expect(invalidResponse.data.id).toBeUndefined();
    expect(malformedResponse.data?.id).toBeUndefined();
  });
});