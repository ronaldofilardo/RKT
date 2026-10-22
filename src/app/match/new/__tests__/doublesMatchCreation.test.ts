import { buildMatchPayload } from '../build-match-payload.logic';

describe('Doubles Match Creation Unit Tests', () => {
  const baseFields = {
    sportType: 'TENNIS',
    format: 'BEST_OF_3',
    courtType: 'CLAY',
    nickname: '',
    visibility: 'PLAYERS_ONLY',
    openForAnnotation: false,
    anotadorEmail: '',
    date: '2026-10-22',
    time: '10:00',
    venueId: '',
    publicMatchCode: '',
    tournamentName: 'Torneio Aberto',
    clubName: 'Clube Central',
    category: 'ADULTO',
    roundName: 'Final',
    bracketType: '',
    temperature: '25',
    humidity: '60',
    tags: '',
    details: '',
  };

  it('buildMatchPayload constrói payload de simples por padrão', () => {
    const payload = buildMatchPayload({
      ...baseFields,
      player1Id: 'p1',
      player2Id: 'p2',
    });

    expect(payload.matchType).toBe('SINGLES');
    expect(payload.player1Id).toBe('p1');
    expect(payload.player2Id).toBe('p2');
    expect(payload.player1PartnerId).toBeNull();
    expect(payload.player2PartnerId).toBeNull();
    expect(payload.doublesSetup).toBeNull();
  });

  it('buildMatchPayload constrói payload de duplas quando matchType=DOUBLES', () => {
    const doublesSetup = {
      serveOrder: {
        player1: ['p1', 'p1_partner'],
        player2: ['p2', 'p2_partner'],
      },
      receiveDeuce: {
        player1: 'p1',
        player2: 'p2',
      },
    };

    const payload = buildMatchPayload({
      ...baseFields,
      matchType: 'DOUBLES',
      player1Id: 'p1',
      player2Id: 'p2',
      player1PartnerId: 'p1_partner',
      player2PartnerId: 'p2_partner',
      doublesSetup,
    });

    expect(payload.matchType).toBe('DOUBLES');
    expect(payload.player1Id).toBe('p1');
    expect(payload.player2Id).toBe('p2');
    expect(payload.player1PartnerId).toBe('p1_partner');
    expect(payload.player2PartnerId).toBe('p2_partner');
    expect(payload.doublesSetup).toEqual(doublesSetup);
  });
});
