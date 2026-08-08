/**
 * Unit of Work port — transactional boundary abstraction.
 *
 * Replaces inline `prisma.$transaction(fn)` calls scattered in services and
 * routes. Adapters wrap the underlying ORM's transaction primitive so call-sites
 * stay ORM-agnostic.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { PrismaClient } from '@prisma/client';

export type TransactionClient = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];

export interface IUnitOfWork {
  withTransaction<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T>;
}
