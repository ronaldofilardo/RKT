import { createMatchService, MatchService } from '../matchService.di';
import { ValidationError } from '@/lib/errors';
import type { IMatchRepository } from '@/infrastructure/ports/match.repository.port';
import type { IUnitOfWork } from '@/infrastructure/ports/uow.port';

describe('MatchService DI - Regressoes Reais', () => {
  const mockRepo = {
    list: jest.fn().mockResolvedValue([{ id: 'm1' }]),
    findById: jest.fn(),
  } as unknown as IMatchRepository;

  const mockUow = {
    withTransaction: jest.fn(),
  } as unknown as IUnitOfWork;

  it('deve instanciar MatchService e delegar listMatches para o repositorio injetado', async () => {
    const service = createMatchService({
      matchRepository: mockRepo,
      unitOfWork: mockUow,
    });

    expect(service).toBeInstanceOf(MatchService);
    const result = await service.listMatches();
    expect(mockRepo.list).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'm1' }]);
  });

  it('deve lancar ValidationError se player1Id === player2Id na criacao via DI', async () => {
    const service = createMatchService({
      matchRepository: mockRepo,
      unitOfWork: mockUow,
    });

    await expect(
      service.createMatch({
        player1Id: 'player-x',
        player2Id: 'player-x',
        format: 'BEST_OF_3',
        sportType: 'TENNIS',
      })
    ).rejects.toThrow(ValidationError);
  });
});
