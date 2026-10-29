import { buildSpectatorDetailChips } from '../spectator-point-detail.logic';
import type { SpectatorPoint } from '@/core/spectate';

const base: SpectatorPoint = {
  id: 'p1',
  seq: 1,
  setNumber: 1,
  gameNumber: 1,
  scoreAfter: '15-0',
  winnerSide: 'side1',
  type: 'WINNER',
};

describe('buildSpectatorDetailChips', () => {
  it('retorna vazio sem detalhes registrados', () => {
    expect(buildSpectatorDetailChips(base)).toEqual([]);
  });

  it('monta a cascata com as abreviações da timeline', () => {
    const chips = buildSpectatorDetailChips({
      ...base,
      details: { situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin', direcao: 'cruzada', duracao: 'opcao_2' },
    });
    expect(chips.map((c) => c.text)).toEqual(['FQ', 'W', 'FH', 'Top', 'X', '5-8']);
    expect(chips.find((c) => c.text === 'W')?.tone).toBe('green');
  });

  it('usa o formato compacto de ace', () => {
    const chips = buildSpectatorDetailChips({
      ...base,
      type: 'ACE',
      details: { efeito: 'flat', direcao: 'centro', isSecondServe: false },
    });
    expect(chips).toEqual([{ text: '1º ACE-FLA-CEN', tone: 'green' }]);
  });

  it('usa o formato compacto de dupla falta', () => {
    const chips = buildSpectatorDetailChips({
      ...base,
      type: 'DOUBLE_FAULT',
      details: { efeito: 'slice', direcao: 'paralela', firstFault: { serveEffect: 'flat', direction: 'centro' } },
    });
    expect(chips[0].text).toContain('DF:');
    expect(chips[0].tone).toBe('red');
  });
});
