import { toPoolPlayerView, visiblePoolNickname } from '../pool';

const now = new Date('2026-11-09T12:00:00Z');
const adult = new Date('1995-05-10');
const minor = new Date('2014-05-10');

describe('visiblePoolNickname', () => {
  it('expõe nickname de adulto com opt-in', () => {
    expect(visiblePoolNickname({ id: 'p1', name: 'João', nickname: 'joao', poolVisible: true }, false))
      .toBe('joao');
  });

  it('oculta nickname sem opt-in', () => {
    expect(visiblePoolNickname({ id: 'p1', name: 'João', nickname: 'joao', poolVisible: false }, false))
      .toBeNull();
  });

  it('oculta nickname de menor mesmo com opt-in', () => {
    expect(visiblePoolNickname({ id: 'p1', name: 'João', nickname: 'joao', poolVisible: true }, true))
      .toBeNull();
  });
});

describe('toPoolPlayerView', () => {
  it('inclui nickname apenas para adulto com opt-in', () => {
    const view = toPoolPlayerView(
      { id: 'p1', name: 'João Silva', birthDate: adult, athleteCode: 'AB12', nickname: 'joao', poolVisible: true },
      now,
    );

    expect(view).toMatchObject({ id: 'p1', name: 'João Silva', nickname: 'joao', minor: false });
  });

  it('mantém mascaramento de menores e omite nickname', () => {
    const view = toPoolPlayerView(
      { id: 'p2', name: 'Pedro Souza', birthDate: minor, nickname: 'pedro', poolVisible: true },
      now,
    );

    expect(view.minor).toBe(true);
    expect(view.name).toBe('P***');
    expect(view.nickname).toBeNull();
  });
});
