/**
 * Prisma repository & UoW adapters — composition barrel.
 *
 * Exports concrete adapter classes and ready-to-use singletons backed by the
 * shared `prisma` client (`src/lib/prisma.ts`).
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import { PrismaMatchRepository } from './PrismaMatchRepository';
import { PrismaPlayerRepository } from './PrismaPlayerRepository';
import { PrismaSessionRepository } from './PrismaSessionRepository';
import { PrismaUserRepository } from './PrismaUserRepository';
import { PrismaUnitOfWork } from './PrismaUnitOfWork';

export { PrismaMatchRepository, PrismaPlayerRepository, PrismaSessionRepository, PrismaUserRepository, PrismaUnitOfWork };
