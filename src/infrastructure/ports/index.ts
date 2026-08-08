/**
 * Repository & UoW ports (composition root entry barrel).
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

export type { IMatchRepository, MatchListingOptions, MatchUpsertInput } from './match.repository.port';
export type { IPlayerRepository, PlayerUpsertInput, PlayerUpdateInput } from './player.repository.port';
export type { ISessionRepository, SessionListOptions, SessionUpdateInput } from './session.repository.port';
export type { IUserRepository, UserCreateInput, UserUpdateInput } from './user.repository.port';
export type { IUnitOfWork, TransactionClient } from './uow.port';
