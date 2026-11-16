import { randomizeMinorPlayerName, DEFAULT_SPECTATOR_SALT } from '../minor-name-randomizer';

describe('randomizeMinorPlayerName', () => {
  it('gera formato estável "Atleta #XXXX" com 4 caracteres hexadecimais em maiúsculas', () => {
    const name = randomizeMinorPlayerName('match-1', 'player-minor-1');
    expect(name).toMatch(/^Atleta #[0-9A-F]{4}$/);
  });

  it('é determinístico para o mesmo matchId e playerId', () => {
    const res1 = randomizeMinorPlayerName('match-1', 'player-minor-1');
    const res2 = randomizeMinorPlayerName('match-1', 'player-minor-1');
    expect(res1).toBe(res2);
  });

  it('gera pseudônimos distintos para atletas diferentes na mesma partida', () => {
    const res1 = randomizeMinorPlayerName('match-1', 'player-minor-1');
    const res2 = randomizeMinorPlayerName('match-1', 'player-minor-2');
    expect(res1).not.toBe(res2);
  });

  it('gera pseudônimos distintos para o mesmo atleta em partidas diferentes', () => {
    const res1 = randomizeMinorPlayerName('match-1', 'player-minor-1');
    const res2 = randomizeMinorPlayerName('match-2', 'player-minor-1');
    expect(res1).not.toBe(res2);
  });

  it('permite customizar o salt de espectador', () => {
    const resDefault = randomizeMinorPlayerName('match-1', 'player-1', DEFAULT_SPECTATOR_SALT);
    const resCustom = randomizeMinorPlayerName('match-1', 'player-1', 'CUSTOM_SALT');
    expect(resDefault).not.toBe(resCustom);
  });
});
