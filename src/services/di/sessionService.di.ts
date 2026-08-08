/**
 * Session service - DI-based implementation.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { AnnotationSessionStatus } from '@/schemas/contracts';
import type { ISessionRepository } from '@/infrastructure/ports/session.repository.port';
import type { IUnitOfWork } from '@/infrastructure/ports/uow.port';
import type { IMatchRepository } from '@/infrastructure/ports/match.repository.port';

export interface SessionServiceDependencies {
  sessionRepository: ISessionRepository;
  matchRepository: IMatchRepository;
  unitOfWork: IUnitOfWork;
}

export class SessionService {
  constructor(private readonly deps: SessionServiceDependencies) {}

  async listSessions(matchId: string) {
    return this.deps.sessionRepository.list(matchId);
  }

  async getSessionWithMatch(sessionId: string) {
    return this.deps.sessionRepository.findById(sessionId);
  }

  async getUserSessions(matchId: string, userId: string) {
    return this.deps.sessionRepository.listForUser(matchId, userId);
  }

  async checkMatchExists(matchId: string) {
    return this.deps.matchRepository.findMatchForSession(matchId);
  }

  async getMatchScoreState(matchId: string) {
    return this.deps.sessionRepository.findMatchScoreState(matchId);
  }

  async updateSession(sessionId: string, data: { status?: AnnotationSessionStatus; isActive?: boolean; endedAt?: Date; matchStateSnapshot?: string | null; finalStateSnapshot?: string | null }) {
    return this.deps.unitOfWork.withTransaction(async () => {
      return this.deps.sessionRepository.update(sessionId, data);
    });
  }

  async listSuspendedSessions(userId: string) {
    return this.deps.sessionRepository.listSuspendedForUser(userId);
  }

  async createEndorsement(sessionId: string, userId: string) {
    return this.deps.unitOfWork.withTransaction(async () => {
      return this.deps.sessionRepository.createEndorsement(sessionId, userId);
    });
  }

  async reactivateOrCreateSession(matchId: string, userId: string, existingSessions: unknown[]) {
    return this.deps.unitOfWork.withTransaction(async () => {
      return this.deps.sessionRepository.reactivateOrCreate(matchId, userId, existingSessions);
    });
  }
}

export function createSessionService(deps: SessionServiceDependencies): SessionService {
  return new SessionService(deps);
}
