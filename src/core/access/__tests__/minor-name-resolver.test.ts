import { resolvePlayerDisplayName } from '../minor-name-resolver';

describe('resolvePlayerDisplayName', () => {
  const now = new Date('2026-11-15T12:00:00Z');
  const adultBirth = new Date('2000-01-01'); // 26 anos em 2026
  const minorBirth = new Date('2012-05-10'); // 14 anos em 2026

  it('retorna nome real para atleta adulto mesmo para visualizador externo', () => {
    const name = resolvePlayerDisplayName({
      player: { id: 'p-adult', name: 'Carlos Silva', birthDate: adultBirth },
      matchId: 'match-1',
      isDirectlyInvolved: false,
      now,
    });
    expect(name).toBe('Carlos Silva');
  });

  it('trata atleta sem data de nascimento como menor para proteção (fail-closed)', () => {
    const name = resolvePlayerDisplayName({
      player: { id: 'p-nobirth', name: 'Atleta Sem Data', birthDate: null },
      matchId: 'match-1',
      isDirectlyInvolved: false,
      now,
    });
    expect(name).toMatch(/^Atleta #[0-9A-F]{4}$/);
  });

  it('retorna nome real para atleta menor quando visualizador é diretamente envolvido', () => {
    const name = resolvePlayerDisplayName({
      player: { id: 'p-minor', name: 'Lucas Menor', birthDate: minorBirth },
      matchId: 'match-1',
      isDirectlyInvolved: true,
      now,
    });
    expect(name).toBe('Lucas Menor');
  });

  it('retorna nome randomizado "Atleta #XXXX" para atleta menor quando visualizador NÃO é envolvido', () => {
    const name = resolvePlayerDisplayName({
      player: { id: 'p-minor', name: 'Lucas Menor', birthDate: minorBirth },
      matchId: 'match-1',
      isDirectlyInvolved: false,
      now,
    });
    expect(name).toMatch(/^Atleta #[0-9A-F]{4}$/);
    expect(name).not.toBe('Lucas Menor');
  });

  it('mantém o mesmo nome randomizado de forma estável para a mesma partida', () => {
    const call1 = resolvePlayerDisplayName({
      player: { id: 'p-minor', name: 'Lucas Menor', birthDate: minorBirth },
      matchId: 'match-abc',
      isDirectlyInvolved: false,
      now,
    });
    const call2 = resolvePlayerDisplayName({
      player: { id: 'p-minor', name: 'Lucas Menor', birthDate: minorBirth },
      matchId: 'match-abc',
      isDirectlyInvolved: false,
      now,
    });
    expect(call1).toBe(call2);
  });
});
