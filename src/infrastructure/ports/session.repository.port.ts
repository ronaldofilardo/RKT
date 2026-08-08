/**
 * Annotation session repository port.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { AnnotationSessionStatus } from '@/schemas/contracts';

export interface SessionListOptions {
  matchId: string;
  annotatorUserId?: string;
  status?: AnnotationSessionStatus;
}

export type SessionUpdateInput = {
  status?: AnnotationSessionStatus;
  isActive?: boolean;
  endedAt?: Date;
  matchStateSnapshot?: string | null;
  finalStateSnapshot?: string | null;
};

export interface ISessionRepository {
  list(matchId: string): Promise<unknown[]>;
  findById(sessionId: string): Promise<unknown | null>;
  listForUser(matchId: string, userId: string): Promise<unknown[]>;
  listSuspendedForUser(userId: string): Promise<unknown[]>;
  update(sessionId: string, data: SessionUpdateInput): Promise<unknown>;
  createEndorsement(sessionId: string, userId: string): Promise<unknown>;
  reactivateOrCreate(matchId: string, userId: string, existingSessions: unknown[]): Promise<unknown>;
  findMatchForSession(matchId: string): Promise<{ state: string; openForAnnotation: boolean; version: number; scoreState: unknown } | null>;
  findMatchScoreState(matchId: string): Promise<{ scoreState: unknown } | null>;
}
