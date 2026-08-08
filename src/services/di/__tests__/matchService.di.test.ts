/**
 * Match service - DI test example.
 * Demonstrates how to use mock interfaces instead of jest.mock('@/lib/prisma').
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 * @see docs/REFACTOR_QUEUE.md F3
 */

import { jest } from '@jest/globals';
import { MatchService, createMatchService } from '../matchService.di';
import type { IMatchRepository } from '@/infrastructure/ports/match.repository.port';
import type { IUnitOfWork } from '@/infrastructure/ports/uow.port';

describe('MatchService (DI-based)', () => {
  let mockMatchRepository: jest.Mocked<IMatchRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;
  let matchService: MatchService;

  beforeEach(() => {
    mockMatchRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      findAbandonedSessionSnapshot: jest.fn(),
      create: jest.fn(),
      findFirstForUpdate: jest.fn(),
      findFirstWithPlayers: jest.fn(),
      update: jest.fn(),
      updateWithVersion: jest.fn(),
      hardDeleteCascade: jest.fn(),
      softDelete: jest.fn(),
      findMatchForSession: jest.fn(),
    } as unknown as jest.Mocked<IMatchRepository>;

    mockUnitOfWork = {
      withTransaction: jest.fn((work) => work({} as any)),
    } as unknown as jest.Mocked<IUnitOfWork>;

    matchService = createMatchService({
      matchRepository: mockMatchRepository,
      unitOfWork: mockUnitOfWork,
    });
  });

  describe('updateMatch', () => {
    it('should use transaction via UnitOfWork', async () => {
      const mockMatch = { id: 'match-1', state: 'SCHEDULED' };
      mockMatchRepository.findById.mockResolvedValue(mockMatch as any);
      mockMatchRepository.update.mockResolvedValue({ ...mockMatch, nickname: 'New Name' } as any);

      await matchService.updateMatch('match-1', { nickname: 'New Name' });

      expect(mockUnitOfWork.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockMatchRepository.findById).toHaveBeenCalledWith('match-1');
      expect(mockMatchRepository.update).toHaveBeenCalled();
    });

    it('should return null when match not found', async () => {
      mockMatchRepository.findById.mockResolvedValue(null);

      const result = await matchService.updateMatch('nonexistent', { nickname: 'Test' });

      expect(result).toBeNull();
      expect(mockMatchRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('finishMatch', () => {
    it('should use transaction via UnitOfWork', async () => {
      const mockMatch = {
        id: 'match-1',
        format: 'STANDARD',
        player1Id: 'p1',
        player2Id: 'p2',
        state: 'IN_PROGRESS',
        scoreState: null,
      };
      mockMatchRepository.findFirstWithPlayers.mockResolvedValue(mockMatch as any);
      mockMatchRepository.update.mockResolvedValue({ ...mockMatch, state: 'FINISHED' } as any);

      await matchService.finishMatch('match-1', { state: {}, history: [] }, { reason: 'COMPLETED' });

      expect(mockUnitOfWork.withTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('transitionMatchState', () => {
    it('should use transaction via UnitOfWork', async () => {
      const mockMatch = {
        id: 'match-1',
        format: 'STANDARD',
        player1Id: 'p1',
        player2Id: 'p2',
        state: 'SCHEDULED',
        scoreState: null,
      };
      mockMatchRepository.findFirstWithPlayers.mockResolvedValue(mockMatch as any);
      mockMatchRepository.updateWithVersion.mockResolvedValue({ ...mockMatch, state: 'IN_PROGRESS' } as any);

      await matchService.transitionMatchState('match-1', 'IN_PROGRESS');

      expect(mockUnitOfWork.withTransaction).toHaveBeenCalledTimes(1);
      expect(mockMatchRepository.updateWithVersion).toHaveBeenCalled();
    });
  });
});
