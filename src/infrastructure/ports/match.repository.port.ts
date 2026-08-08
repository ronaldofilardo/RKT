/**
 * Match repository port.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 * @see docs/REFACTOR_QUEUE.md F3
 */

import type { Match, Prisma } from '@prisma/client';
import type { MatchState, MatchFormat } from '@/schemas/contracts';
import type { TransactionClient } from './uow.port';

export type { TransactionClient };

export interface MatchListingOptions {
  state?: MatchState | string | null;
  cursor?: string | null;
  limit?: number;
}

export type MatchUpsertInput = {
  format: MatchFormat;
  sportType?: string;
  courtType?: string | null;
  nickname?: string | null;
  visibility?: string;
  openForAnnotation?: boolean;
  tournamentName?: string | null;
  category?: string | null;
  round?: string | null;
  roundName?: string | null;
  bracketType?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  player1Id: string;
  player2Id: string;
  initialServerId?: string;
  scheduledAt?: Date | null;
  createdByUserId?: string;
};

export interface IMatchRepository {
  list(options?: MatchListingOptions): Promise<Partial<Match>[]>;
  findById(id: string): Promise<Partial<Match> | null>;
  findAbandonedSessionSnapshot(matchId: string): Promise<unknown | null>;
  create(input: MatchUpsertInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }>;
  findFirstForUpdate(id: string): Promise<(Match & { pointLog: { id: string }[]; annotationSessions: { id: string }[] }) | null>;
  findFirstWithPlayers(id: string): Promise<(Match & { player1: unknown; player2: unknown }) | null>;
  update(id: string, data: Prisma.MatchUpdateInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }>;
  updateWithVersion(id: string, whereVersion: number | undefined, data: Prisma.MatchUpdateInput, tx?: TransactionClient): Promise<Match & { player1: unknown; player2: unknown }>;
  hardDeleteCascade(id: string, tx: TransactionClient): Promise<void>;
  softDelete(id: string, data: { deletedAt: Date; deletedBy?: string; finishNote?: string }): Promise<void>;
  findMatchForSession(matchId: string): Promise<{ state: string; openForAnnotation: boolean; version: number; scoreState: unknown } | null>;
}
