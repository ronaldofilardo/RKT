import { createMatch } from '../matchService';
import { ValidationError } from '@/lib/errors';

describe('matchService - Regressoes Reais', () => {
  it('deve rejeitar criacao de partida com jogador 1 e jogador 2 iguais', async () => {
    await expect(
      createMatch({
        player1Id: 'same-player',
        player2Id: 'same-player',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
      })
    ).rejects.toThrow(ValidationError);
  });
});

