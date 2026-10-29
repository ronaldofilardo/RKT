import { extractSpectatorPointDetails } from '../../../services/spectator-feed.point-details';

describe('extractSpectatorPointDetails', () => {
  it('retorna null quando o anotador não registrou detalhes', () => {
    expect(extractSpectatorPointDetails(null)).toBeNull();
    expect(extractSpectatorPointDetails({ note: 'segredo' })).toBeNull();
  });

  it('projeta só a lista-branca e nunca vaza observações', () => {
    const d = extractSpectatorPointDetails({
      note: 'nota privada',
      hitterId: 'abc',
      rallyDetails: {
        situacao: 'fundo',
        tipo: 'winner',
        golpe: 'fh',
        efeito: 'topspin',
        direcao: 'cruzada',
        duracao: 'opcao_2',
        note: 'nota dentro do rally',
      },
    });
    expect(d).toMatchObject({ situacao: 'fundo', tipo: 'winner', golpe: 'fh', efeito: 'topspin', direcao: 'cruzada', duracao: 'opcao_2' });
    expect(JSON.stringify(d)).not.toContain('nota');
    expect(JSON.stringify(d)).not.toContain('abc');
  });
});
