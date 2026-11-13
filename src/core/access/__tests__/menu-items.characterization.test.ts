import { TREINADOR, OPERACAO } from '../menu-items';

describe('Characterization — menu-items baseline', () => {
  it('menu TREINADOR contém apenas itens canônicos e não contém Avisos nem Mural', () => {
    const labels = TREINADOR.map((i) => i.label);
    expect(labels).toEqual([
      'Início',
      'Histórico',
      'Partidas Anotadas',
      'Ao Vivo',
      'Meus Atletas',
      'Solicitações',
      'Relatórios',
      'Partidas Públicas',
      'Nova Partida',
    ]);
    expect(labels).not.toContain('Avisos');
    expect(labels).not.toContain('Mural');
  });

  it('menu OPERACAO não contém item de Avisos nem Mural', () => {
    const labels = OPERACAO.map((i) => i.label);
    expect(labels).not.toContain('Avisos');
    expect(labels).not.toContain('Mural');
  });
});

