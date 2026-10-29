import {
  floatingSpectatorReducer as reduce,
  initialFloatingSpectatorState as init,
  MAX_FLOATING_SPECTATORS,
  type FloatingSpectatorState,
} from '../floating-spectator.logic';

const open = (s: FloatingSpectatorState, id: string, title?: string) =>
  reduce(s, { type: 'OPEN', matchId: id, title });

describe('floatingSpectatorReducer', () => {
  it('abre uma janela, com foco e título', () => {
    const s = open(init, 'm1', 'Ana × Bia');
    expect(s.items).toEqual([{ matchId: 'm1', title: 'Ana × Bia', minimized: false }]);
    expect(s.focusedId).toBe('m1');
  });

  it('limita a 3 janelas e sinaliza limitReached sem alterar a lista', () => {
    let s = init;
    ['a', 'b', 'c'].forEach((id) => { s = open(s, id); });
    const blocked = open(s, 'd');
    expect(MAX_FLOATING_SPECTATORS).toBe(3);
    expect(blocked.items).toHaveLength(3);
    expect(blocked.limitReached).toBe(true);
    expect(reduce(blocked, { type: 'DISMISS_LIMIT' }).limitReached).toBe(false);
  });

  it('reabrir uma partida já aberta não duplica: restaura e foca', () => {
    let s = open(init, 'a');
    s = open(s, 'b');
    s = reduce(s, { type: 'TOGGLE_MINIMIZE', matchId: 'a' });
    s = open(s, 'a');
    expect(s.items).toHaveLength(2);
    expect(s.items.find((i) => i.matchId === 'a')?.minimized).toBe(false);
    expect(s.focusedId).toBe('a');
  });

  it('reabrir com o limite cheio funciona se a partida já está aberta', () => {
    let s = init;
    ['a', 'b', 'c'].forEach((id) => { s = open(s, id); });
    s = open(s, 'a');
    expect(s.limitReached).toBe(false);
  });

  it('minimizar/expandir alterna e foca ao expandir', () => {
    let s = open(init, 'a');
    s = reduce(s, { type: 'TOGGLE_MINIMIZE', matchId: 'a' });
    expect(s.items[0].minimized).toBe(true);
    s = reduce(s, { type: 'TOGGLE_MINIMIZE', matchId: 'a' });
    expect(s.items[0].minimized).toBe(false);
    expect(s.focusedId).toBe('a');
  });

  it('fechar a janela focada move o foco para a última restante', () => {
    let s = open(open(init, 'a'), 'b');
    s = reduce(s, { type: 'CLOSE', matchId: 'b' });
    expect(s.items.map((i) => i.matchId)).toEqual(['a']);
    expect(s.focusedId).toBe('a');
    s = reduce(s, { type: 'CLOSE', matchId: 'a' });
    expect(s.focusedId).toBeNull();
  });

  it('fechar libera espaço no limite', () => {
    let s = init;
    ['a', 'b', 'c'].forEach((id) => { s = open(s, id); });
    s = open(s, 'd');
    s = reduce(s, { type: 'CLOSE', matchId: 'a' });
    expect(s.limitReached).toBe(false);
    expect(open(s, 'd').items).toHaveLength(3);
  });

  it('FOCUS ignora ids inexistentes', () => {
    const s = open(init, 'a');
    expect(reduce(s, { type: 'FOCUS', matchId: 'zzz' })).toBe(s);
  });
});
