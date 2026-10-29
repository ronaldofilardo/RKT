import { formatSpectatorGame } from '../game-display';

describe('formatSpectatorGame', () => {
  it('converte índices do engine em 0/15/30/40', () => {
    expect(formatSpectatorGame({ player1: 0, player2: 1 })).toEqual({ player1: '0', player2: '15' });
    expect(formatSpectatorGame({ player1: 2, player2: 3 })).toEqual({ player1: '30', player2: '40' });
  });

  it('mantém strings já formatadas', () => {
    expect(formatSpectatorGame({ player1: '15', player2: '40' })).toEqual({ player1: '15', player2: '40' });
  });

  it('trata deuce e vantagem', () => {
    expect(formatSpectatorGame({ player1: 3, player2: 3, isDeuce: true })).toEqual({ player1: '40', player2: '40' });
    expect(formatSpectatorGame({ player1: 3, player2: 3, advantage: 'player2' })).toEqual({ player1: '40', player2: 'AD' });
  });

  it('exibe contagem crua no tie-break', () => {
    expect(formatSpectatorGame({ player1: 0, player2: 0 }, { player1: 5, player2: 4 })).toEqual({ player1: '5', player2: '4' });
  });

  it('assume 0-0 quando o estado não existe', () => {
    expect(formatSpectatorGame(undefined)).toEqual({ player1: '0', player2: '0' });
  });
});
