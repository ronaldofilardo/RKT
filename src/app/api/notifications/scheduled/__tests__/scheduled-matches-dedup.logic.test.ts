import {
  getMatchSlotKey,
  buildDismissedKeys,
  isMatchDismissed,
  deduplicateFeedItems,
} from '../scheduled-matches-dedup.logic';

describe('scheduled-matches-dedup.logic', () => {
  it('gera chave canônica de slot independentemente da ordem dos jogadores', () => {
    const k1 = getMatchSlotKey({ player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z' });
    const k2 = getMatchSlotKey({ player1Name: 'SonMy', player2Name: 'Juca Balas', scheduledAt: new Date('2026-11-19T15:45:00.000Z') });
    expect(k1).toBe('juca balas::sonmy::2026-11-19T15:45');
    expect(k1).toBe(k2);
  });

  it('deduplica partidas repetidas do mesmo confronto/horário priorizando o criador mais relevante', () => {
    const items = [
      {
        id: '1', createdAt: '2026-11-12T10:00:00Z',
        payload: { matchId: 'm1', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z', createdByName: 'SonMy', creatorRole: 'Atleta' },
      },
      {
        id: '2', createdAt: '2026-11-12T11:00:00Z',
        payload: { matchId: 'm2', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z', createdByName: 'Ronaldo', creatorRole: 'Gestor (CT RKT)' },
      },
      {
        id: '3', createdAt: '2026-11-12T12:00:00Z',
        payload: { matchId: 'm3', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z', createdByName: 'Carter Coach', creatorRole: 'Treinador (CT RKT)' },
      },
    ];

    const result = deduplicateFeedItems(items);
    expect(result).toHaveLength(1);
    expect(result[0].payload.createdByName).toBe('Ronaldo');
    expect(result[0].payload.creatorRole).toBe('Gestor (CT RKT)');
  });

  it('mantém partidas em datas diferentes como registros distintos', () => {
    const items = [
      { id: '1', createdAt: '2026-11-12T10:00:00Z', payload: { matchId: 'm1', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z' } },
      { id: '2', createdAt: '2026-11-12T11:00:00Z', payload: { matchId: 'm2', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-26T15:45:00.000Z' } },
    ];
    expect(deduplicateFeedItems(items)).toHaveLength(2);
  });

  it('reconhece partida dispensada tanto por ID quanto por slot', () => {
    const dismissed = buildDismissedKeys([
      { payload: { matchId: 'm-orig', player1Name: 'Juca Balas', player2Name: 'SonMy', scheduledAt: '2026-11-19T15:45:00.000Z' } },
    ]);
    expect(isMatchDismissed({ id: 'm-orig' }, dismissed)).toBe(true);
    expect(isMatchDismissed({ id: 'm-other', sourceMatchId: 'm-orig' }, dismissed)).toBe(true);
    expect(isMatchDismissed({
      id: 'm-clone', player1: { name: 'SonMy' }, player2: { name: 'Juca Balas' }, scheduledAt: new Date('2026-11-19T15:45:00.000Z'),
    }, dismissed)).toBe(true);
  });
});
