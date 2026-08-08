/**
 * Composition root - wires Adapters + Ports -> Services.
 *
 * Centralized dependency injection container for the application.
 * All service instances are created and wired here with their dependencies.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 * @see docs/REFACTOR_QUEUE.md F3
 */

import { PrismaMatchRepository } from '@/infrastructure/prisma/PrismaMatchRepository';
import { PrismaPlayerRepository } from '@/infrastructure/prisma/PrismaPlayerRepository';
import { PrismaSessionRepository } from '@/infrastructure/prisma/PrismaSessionRepository';
import { PrismaUserRepository } from '@/infrastructure/prisma/PrismaUserRepository';
import { PrismaUnitOfWork } from '@/infrastructure/prisma/PrismaUnitOfWork';
import { MatchService, createMatchService } from '@/services/di/matchService.di';
import { PlayerService, createPlayerService } from '@/services/di/playerService.di';
import { SessionService, createSessionService } from '@/services/di/sessionService.di';
import { AdminService, createAdminService } from '@/services/di/adminService.di';

// Initialize repositories (adapters)
const matchRepository = new PrismaMatchRepository();
const playerRepository = new PrismaPlayerRepository();
const sessionRepository = new PrismaSessionRepository();
const userRepository = new PrismaUserRepository();
const unitOfWork = new PrismaUnitOfWork();

// Initialize services with injected dependencies
const matchService = createMatchService({
  matchRepository,
  unitOfWork,
});

const playerService = createPlayerService({
  playerRepository,
});

const sessionService = createSessionService({
  sessionRepository,
  matchRepository,
  unitOfWork,
});

const adminService = createAdminService({
  userRepository,
});

// Export singleton instances
export {
  // Services
  matchService,
  playerService,
  sessionService,
  adminService,
  // Repositories
  matchRepository,
  playerRepository,
  sessionRepository,
  userRepository,
  unitOfWork,
  // Factory functions
  createMatchService,
  createPlayerService,
  createSessionService,
  createAdminService,
  // Classes
  MatchService,
  PlayerService,
  SessionService,
  AdminService,
};
