/**
 * Match service - DI-based implementation.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 * @see docs/REFACTOR_QUEUE.md F3
 */

import type { MatchState, CreateMatchInput, MatchFinishReason } from '@/schemas/contracts';
import type { IMatchRepository, MatchListingOptions, TransactionClient } from '@/infrastructure/ports/match.repository.port';
import type { IUnitOfWork } from '@/infrastructure/ports/uow.port';
import { validateFinishMatch, validateTransitionState } from '../matchValidator';
import { ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';
import {
  buildFinishUpdateData,
  buildMatchUpdateData,
  buildMatchUpsertInput,
  sanitizeMatchUpdate,
} from './matchService.di.helpers';

export interface MatchServiceDependencies {
  matchRepository: IMatchRepository;
  unitOfWork: IUnitOfWork;
}

export class MatchService {
  constructor(private readonly deps: MatchServiceDependencies) {}

  async listMatches(options?: MatchListingOptions) {
    return this.deps.matchRepository.list(options);
  }

  async getMatch(id: string) {
    return this.deps.matchRepository.findById(id);
  }

  async findAbandonedSessionSnapshot(matchId: string) {
    return this.deps.matchRepository.findAbandonedSessionSnapshot(matchId);
  }

  async createMatch(data: CreateMatchInput, createdByUserId?: string, tx?: TransactionClient) {
    if (data.player1Id === data.player2Id) {
      throw new ValidationError({ player2Id: ['Jogador 2 deve ser diferente do Jogador 1'] });
    }
    if (!createdByUserId) logger.warn('[createMatch] createdByUserId ausente');
    return this.deps.matchRepository.create(buildMatchUpsertInput(data, createdByUserId), tx);
  }

  async updateMatch(id: string, data: Record<string, unknown>) {
    return this.deps.unitOfWork.withTransaction(async (tx) => {
      const match = await this.deps.matchRepository.findById(id);
      if (!match) return null;

      const sanitized = sanitizeMatchUpdate(data);
      return this.deps.matchRepository.update(
        id,
        buildMatchUpdateData(sanitized) as Prisma.MatchUpdateInput,
        tx,
      );
    });
  }

  async deleteMatch(id: string, options: { type: 'soft' | 'hard'; reason?: string; deletedBy?: string }) {
    return this.deps.unitOfWork.withTransaction(async (tx) => {
      const match = await this.deps.matchRepository.findFirstForUpdate(id);
      if (!match) return { error: 'MATCH_NOT_FOUND' } as const;
      if (match.state === 'FINISHED') return { error: 'CANNOT_DELETE_FINISHED' } as const;

      if (options.type === 'hard') {
        await this.deps.matchRepository.hardDeleteCascade(id, tx as unknown as TransactionClient);
        return { success: true, type: 'hard', stats: { points: match.pointLog.length, annotationSessions: match.annotationSessions.length } } as const;
      }

      await this.deps.matchRepository.softDelete(id, { deletedAt: new Date(), deletedBy: options.deletedBy, finishNote: options.reason });
      return { success: true, type: 'soft', stats: { points: match.pointLog.length, annotationSessions: match.annotationSessions.length } } as const;
    });
  }

  async finishMatch(id: string, scoreState: unknown, options?: { reason?: MatchFinishReason; note?: string; winnerId?: string }) {
    return this.deps.unitOfWork.withTransaction(async (tx) => {
      const match = await this.deps.matchRepository.findFirstWithPlayers(id);
      if (!match) return { error: 'MATCH_NOT_FOUND' } as const;

      const validation = validateFinishMatch({ format: match.format as any, player1Id: match.player1Id, player2Id: match.player2Id, initialServerId: match.initialServerId, scoreState: match.scoreState, state: match.state }, scoreState, options?.reason);
      if (!validation.valid) return { error: validation.error } as const;

      const updateData = buildFinishUpdateData(
        scoreState,
        match.scoreState,
        options?.reason,
        options?.note,
        options?.winnerId,
      );
      return this.deps.matchRepository.update(id, updateData as Prisma.MatchUpdateInput, tx);
    });
  }

  async transitionMatchState(id: string, newState: MatchState, initialServerId?: string, scoreState?: unknown, options?: { allowScoreEdit?: boolean; expectedVersion?: number }) {
    return this.deps.unitOfWork.withTransaction(async (tx) => {
      const match = await this.deps.matchRepository.findFirstWithPlayers(id);
      if (!match) return null;

      const validation = validateTransitionState({ format: match.format as any, player1Id: match.player1Id, player2Id: match.player2Id, initialServerId: match.initialServerId, scoreState: match.scoreState, state: match.state }, newState, scoreState, options);
      if (!validation.valid) return { error: validation.error } as const;

      const expectedVersion = options?.expectedVersion;
      try {
        const prismaData: Record<string, unknown> = { state: newState, version: { increment: 1 } };
        if (newState === 'IN_PROGRESS') prismaData.startedAt = new Date();
        if (newState === 'FINISHED') prismaData.finishedAt = new Date();
        if (initialServerId) prismaData.initialServerId = initialServerId;
        if (scoreState) prismaData.scoreState = scoreState as any;

        return await this.deps.matchRepository.updateWithVersion(id, expectedVersion, prismaData as Prisma.MatchUpdateInput, tx);
      } catch (error: any) {
        if (error?.code === 'P2025') return { error: 'VERSION_CONFLICT' } as const;
        throw error;
      }
    });
  }
}

export function createMatchService(deps: MatchServiceDependencies): MatchService {
  return new MatchService(deps);
}
