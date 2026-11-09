import {
  filterPoolMatches,
  formatPoolDate,
  poolFormatLabel,
  type PublicPoolMatch,
} from '../public-match-pool.logic';

const match = (over: Partial<PublicPoolMatch> = {}): PublicPoolMatch => ({
  id: 'm1',
  format: 'BEST_OF_3',
  matchType: 'SINGLES',
  sportType: 'TENNIS',
  courtType: 'CLAY',
  scheduledAt: '2026-11-09T10:00:00.000Z',
  tournamentName: 'Copa RKT',
  clubName: 'CT Central',
  category: 'ADULTO',
  round: 'quartas',
  ctId: null,
  annotationCount: 0,
  player1: { id: 'p1', name: 'João Silva', nickname: 'joao' },
  player2: { id: 'p2', name: 'Pedro Souza', nickname: null },
  ...over,
});

describe('filterPoolMatches', () => {
  const matches = [
    match(),
    match({
      id: 'm2',
      tournamentName: 'Liga Infantil',
      clubName: 'CT Norte',
      round: 'final',
      player1: { id: 'p3', name: 'Ana' },
    }),
  ];

  it('retorna tudo quando o termo é vazio', () => {
    expect(filterPoolMatches(matches, '  ')).toHaveLength(2);
  });

  it('busca por nome e nickname do atleta', () => {
    expect(filterPoolMatches(matches, 'joao').map((m) => m.id)).toEqual(['m1']);
    expect(filterPoolMatches(matches, 'Ana').map((m) => m.id)).toEqual(['m2']);
  });

  it('busca por torneio, clube, categoria e rodada', () => {
    expect(filterPoolMatches(matches, 'central').map((m) => m.id)).toEqual(['m1']);
    expect(filterPoolMatches(matches, 'norte').map((m) => m.id)).toEqual(['m2']);
    expect(filterPoolMatches(matches, 'quartas').map((m) => m.id)).toEqual(['m1']);
  });

  it('não encontra termos ausentes', () => {
    expect(filterPoolMatches(matches, 'inexistente')).toEqual([]);
  });
});

describe('formatPoolDate', () => {
  it('mostra placeholder quando não há data', () => {
    expect(formatPoolDate(null)).toBe('Data a definir');
    expect(formatPoolDate('invalid')).toBe('Data a definir');
  });

  it('formata data válida em pt-BR', () => {
    expect(formatPoolDate('2026-11-09T10:00:00.000Z')).toMatch(/2026/);
  });
});

describe('poolFormatLabel', () => {
  it('traduz formatos conhecidos e preserva desconhecidos', () => {
    expect(poolFormatLabel('BEST_OF_3')).toBe('Melhor de 3');
    expect(poolFormatLabel('CUSTOM')).toBe('CUSTOM');
  });
});
