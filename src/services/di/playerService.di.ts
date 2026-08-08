/**
 * Player service - DI-based implementation.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { Rankings } from '@/schemas/contracts';
import type { IPlayerRepository } from '@/infrastructure/ports/player.repository.port';

export interface PlayerServiceDependencies {
  playerRepository: IPlayerRepository;
}

export class PlayerService {
  constructor(private readonly deps: PlayerServiceDependencies) {}

  async listPlayers(cursor?: string | null, limit = 20, userId?: string | null) {
    return this.deps.playerRepository.list(cursor, limit, userId);
  }

  async findPlayerByEmail(email: string) {
    return this.deps.playerRepository.findByEmail(email);
  }

  async getPlayerById(id: string) {
    return this.deps.playerRepository.findById(id);
  }

  async updatePlayer(id: string, data: { name?: string; gender?: string; age?: number; birthDate?: Date; dominance?: string; backhand?: string; ranking?: number; rankings?: Rankings }) {
    return this.deps.playerRepository.update(id, data);
  }

  async createPlayer(data: { name: string; email?: string; passwordHash?: string; gender?: string; age?: number; birthDate?: Date; dominance?: string; backhand?: string; ranking?: number; rankings?: Rankings; createdByUserId?: string }) {
    return this.deps.playerRepository.create(data);
  }
}

export function createPlayerService(deps: PlayerServiceDependencies): PlayerService {
  return new PlayerService(deps);
}
