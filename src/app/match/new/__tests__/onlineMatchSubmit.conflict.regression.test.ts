/**
 * @jest-environment jsdom
 */

/**
 * Teste de regressão para bug: "[MATCHES POST] Error [ConflictError]: CONFLICT"
 * virando um erro genérico não tratado no fluxo de criação de partida.
 *
 * Causa raiz: `submitOnlineMatch` (online-match-submit.helpers.ts) checava
 * `data.code === 'DUPLICATE_MATCH'`, mas a API (`src/app/api/matches/route.ts`)
 * SEMPRE responde 409 com `{ error: 'CONFLICT', message, details }` — o campo
 * `code` e o valor `'DUPLICATE_MATCH'` nunca existiram na resposta real. A
 * condição nunca era verdadeira, então o fluxo de "partida duplicada, deseja
 * continuar mesmo assim?" (modal + handleForceCreate) nunca disparava, e o
 * 409 virava um `Error` genérico não tratado propagado ao usuário/log.
 *
 * Fix: checar `data.error === 'CONFLICT'`.
 *
 * Bug relacionado corrigido junto: `ConflictError` (src/lib/errors.ts)
 * embrulhava o `existing` recebido em `{ message, existing }`, mas o modal
 * de partida duplicada (duplicateInfo em useNewMatchState.ts) espera o
 * formato plano `{ id, playerP1, playerP2 }` — corrigido para `details`
 * guardar `existing` direto, sem wrapper.
 */

import { submitOnlineMatch } from '../online-match-submit.helpers';

function mockFetchOnce(response: { status: number; body: unknown }) {
  (globalThis as any).fetch = jest.fn().mockResolvedValue({
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async () => response.body,
  });
}

describe('REGRESSION: submitOnlineMatch — conflito de partida duplicada (409 CONFLICT)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.setItem('access_token', 'token-teste');
  });

  it('NÃO deve mais checar o contrato antigo/inexistente data.code === "DUPLICATE_MATCH"', async () => {
    // Formato REAL retornado pela API em caso de duplicata (ver route.ts)
    mockFetchOnce({
      status: 409,
      body: {
        error: 'CONFLICT',
        message: 'Partida duplicada',
        details: { id: 'dup-match', playerP1: 'P1', playerP2: 'P2' },
      },
    });

    const result = await submitOnlineMatch({ player1Id: 'p1', player2Id: 'p2' });

    expect(result.duplicate).toBe(true);
    expect(result.data.details).toEqual({ id: 'dup-match', playerP1: 'P1', playerP2: 'P2' });
  });

  it('BUG antigo documentado: uma resposta 409 sem `data.code` nunca seria reconhecida como duplicata', () => {
    const realApiResponseBody = {
      error: 'CONFLICT',
      message: 'Partida duplicada',
      details: { id: 'dup-match', playerP1: 'P1', playerP2: 'P2' },
    } as any;

    // Checagem antiga (buggy)
    const buggyIsDuplicate = realApiResponseBody.code === 'DUPLICATE_MATCH';
    // Checagem corrigida
    const fixedIsDuplicate = realApiResponseBody.error === 'CONFLICT';

    expect(buggyIsDuplicate).toBe(false); // nunca disparava — este era o bug
    expect(fixedIsDuplicate).toBe(true);
  });

  it('uma resposta 409 que NÃO seja CONFLICT continua sendo tratada como erro genérico', async () => {
    mockFetchOnce({
      status: 409,
      body: { error: 'SOME_OTHER_CONFLICT', message: 'Outro tipo de conflito' },
    });

    await expect(submitOnlineMatch({ player1Id: 'p1', player2Id: 'p2' })).rejects.toThrow(
      'Outro tipo de conflito',
    );
  });

  it('uma criação bem-sucedida (201) não é tratada como duplicata', async () => {
    mockFetchOnce({
      status: 201,
      body: { data: { id: 'match-1' } },
    });

    const result = await submitOnlineMatch({ player1Id: 'p1', player2Id: 'p2' });

    expect(result.duplicate).toBe(false);
    expect(result.data.data.id).toBe('match-1');
  });
});
