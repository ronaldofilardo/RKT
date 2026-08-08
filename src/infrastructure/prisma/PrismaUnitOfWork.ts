/**
 * Prisma adapter for `IUnitOfWork`.
 *
 * Wraps `prisma.$transaction(fn)` interactive transaction API. Non-interactive
 * array form (`$transaction([op1, op2, ...])`) is not supported here — callers
 * needing batch semantics should pass the array via a different adapter or
 * encode ordering via interactive callbacks.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { prisma } from '@/lib/prisma';
import type { IUnitOfWork } from '../ports/uow.port';
import type { TransactionClient } from '../ports/match.repository.port';

export class PrismaUnitOfWork implements IUnitOfWork {
  async withTransaction<T>(work: (tx: TransactionClient) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => work(tx as unknown as TransactionClient));
  }
}
