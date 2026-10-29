import { toSpectatorView } from '../spectator-projection';

describe('toSpectatorView (projeção segura e proteção a menores)', () => {
  const baseMatch = {
    id: 'm1',
    state: 'IN_PROGRESS',
    format: 'BEST_OF_3',
    matchType: 'SINGLES' as const,
  };

  const adultPlayer = {
    id: 'p-adult',
    name: 'Carlos Alberto',
    birthDate: new Date('1990-01-01'),
  };

  const minorPlayer = {
    id: 'p-minor',
    name: 'Gabriel Silva',
    birthDate: new Date('2015-05-10'), // Menor de idade
  };

  const score = {
    sets: [{ player1: 6, player2: 4 }],
    currentGame: { player1: '40', player2: '30' },
    serverSide: 'side1' as const,
  };

  it('preserva nomes completos para adultos', () => {
    const view = toSpectatorView({
      match: baseMatch,
      player1: adultPlayer,
      player2: { id: 'p2', name: 'Rafael Souza', birthDate: new Date('1992-02-02') },
      score,
      points: [],
      nowDate: new Date('2026-10-29'),
    });

    expect(view.match.sides[0].members[0].name).toBe('Carlos Alberto');
    expect(view.match.sides[1].members[0].name).toBe('Rafael Souza');
  });

  it('mascara o nome do atleta menor para acompanhantes gerais (sem vínculo legal)', () => {
    const view = toSpectatorView({
      match: baseMatch,
      player1: adultPlayer,
      player2: minorPlayer,
      score,
      points: [],
      guardianPlayerIds: [], // Espectador NÃO é responsável legal
      nowDate: new Date('2026-10-29'),
    });

    expect(view.match.sides[1].members[0].name).toBe('G***');
  });

  it('não mascara o nome do atleta menor para seu responsável legal', () => {
    const view = toSpectatorView({
      match: baseMatch,
      player1: adultPlayer,
      player2: minorPlayer,
      score,
      points: [],
      guardianPlayerIds: ['p-minor'], // Espectador É responsável legal
      nowDate: new Date('2026-10-29'),
    });

    expect(view.match.sides[1].members[0].name).toBe('Gabriel Silva');
  });

  it('suporta duplas com formatação combinada do lado', () => {
    const view = toSpectatorView({
      match: { ...baseMatch, matchType: 'DOUBLES' },
      player1: adultPlayer,
      player2: { id: 'p2', name: 'Rafael Souza', birthDate: new Date('1992-02-02') },
      player1Partner: { id: 'p1b', name: 'Marcos Gomes', birthDate: new Date('1988-08-08') },
      player2Partner: { id: 'p2b', name: 'Felipe Dias', birthDate: new Date('1995-05-05') },
      score,
      points: [],
      nowDate: new Date('2026-10-29'),
    });

    expect(view.match.sides[0].label).toBe('Carlos Alberto / Marcos Gomes');
    expect(view.match.sides[1].label).toBe('Rafael Souza / Felipe Dias');
  });
});
