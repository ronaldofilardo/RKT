import { buildMatchPayload } from '../build-match-payload.logic';

const base = {
  sportType: 'TENNIS',
  format: 'BEST_OF_3',
  courtType: 'CLAY',
  player1Id: 'p1',
  player2Id: 'p2',
  matchType: 'SINGLES' as const,
  nickname: '',
  visibility: 'PLAYERS_ONLY',
  openForAnnotation: false,
  anotadorEmail: '',
  date: '',
  time: '',
  venueId: '',
  publicMatchCode: '',
  tournamentName: '',
  clubName: '',
  category: '',
  roundName: '',
  bracketType: '',
  temperature: '',
  humidity: '',
  tags: '',
  details: '',
  ctId: '',
  clubNameMatch: '',
};

describe('buildMatchPayload — isPublicTemplate', () => {
  it('envia isPublicTemplate=false por padrão', () => {
    expect(buildMatchPayload(base).isPublicTemplate).toBe(false);
  });

  it('envia isPublicTemplate=true quando marcado como público', () => {
    const payload = buildMatchPayload({ ...base, visibility: 'PUBLIC', isPublicTemplate: true });
    expect(payload).toMatchObject({ visibility: 'PUBLIC', isPublicTemplate: true });
  });

  it('mantém overrides explícitos (fluxo de duplicata)', () => {
    const payload = buildMatchPayload(base, { force: true });
    expect(payload).toMatchObject({ isPublicTemplate: false, force: true });
  });
});
