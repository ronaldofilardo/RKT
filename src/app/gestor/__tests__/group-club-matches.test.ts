import {
  filterByAnnotator,
  groupClubMatches,
  listAnnotators,
} from '../group-club-matches.logic';
import type { ClubMatchItem } from '../types';

const item = (over: Partial<ClubMatchItem>): ClubMatchItem => ({
  id: 'm1',
  format: 'BEST_OF_3',
  state: 'SCHEDULED',
  createdAt: '2026-11-09T10:00:00.000Z',
  startedAt: null,
  finishedAt: null,
  createdByUserId: 'u1',
  player1: { id: 'p1', name: 'A' },
  player2: { id: 'p2', name: 'B' },
  createdByUser: { id: 'u1', name: 'Treinador Um', email: 't1@x.com' },
  ...over,
});

describe('groupClubMatches', () => {
  it('agrupa derivadas por template e deixa privadas no final', () => {
    const matches = [
      item({ id: 'd1', sourceMatchId: 'tpl-1', sourceMatch: { id: 'tpl-1', scheduledAt: null, format: 'BEST_OF_3', player1: { name: 'A' }, player2: { name: 'B' } } }),
      item({ id: 'priv-1' }),
      item({ id: 'd2', sourceMatchId: 'tpl-1', sourceMatch: { id: 'tpl-1', scheduledAt: null, format: 'BEST_OF_3', player1: { name: 'A' }, player2: { name: 'B' } }, createdByUserId: 'u2' }),
    ];

    const groups = groupClubMatches(matches);

    expect(groups.map((g) => g.key)).toEqual(['tpl-1', 'private']);
    expect(groups[0].matches.map((m) => m.id)).toEqual(['d1', 'd2']);
    expect(groups[0].source?.id).toBe('tpl-1');
    expect(groups[1].matches.map((m) => m.id)).toEqual(['priv-1']);
  });

  it('retorna grupo vazio sem partidas', () => {
    expect(groupClubMatches([])).toEqual([]);
  });
});

describe('listAnnotators', () => {
  it('lista membros únicos que criaram partidas', () => {
    const matches = [
      item({ id: 'm1', createdByUserId: 'u1', createdByUser: { id: 'u1', name: 'Bruno', email: 'b@x.com' } }),
      item({ id: 'm2', createdByUserId: 'u1', createdByUser: { id: 'u1', name: 'Bruno', email: 'b@x.com' } }),
      item({ id: 'm3', createdByUserId: 'u2', createdByUser: { id: 'u2', name: 'Ana', email: 'a@x.com' } }),
    ];

    expect(listAnnotators(matches)).toEqual([
      { id: 'u2', name: 'Ana' },
      { id: 'u1', name: 'Bruno' },
    ]);
  });

  it('ignora partidas sem criador', () => {
    expect(listAnnotators([item({ createdByUserId: null, createdByUser: null })])).toEqual([]);
  });
});

describe('filterByAnnotator', () => {
  const matches = [
    item({ id: 'm1', createdByUserId: 'u1' }),
    item({ id: 'm2', createdByUserId: 'u2' }),
  ];

  it('filtra pelo membro selecionado', () => {
    expect(filterByAnnotator(matches, 'u2').map((m) => m.id)).toEqual(['m2']);
  });

  it('sem seleção retorna todas', () => {
    expect(filterByAnnotator(matches, null)).toHaveLength(2);
  });
});
