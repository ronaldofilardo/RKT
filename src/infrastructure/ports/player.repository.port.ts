/**
 * Player repository port.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { Player } from '@prisma/client';
import type { Rankings } from '@/schemas/contracts';

export type PlayerUpsertInput = {
  name: string;
  email?: string;
  passwordHash?: string;
  gender?: string;
  age?: number;
  birthDate?: Date;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Rankings;
  createdByUserId?: string;
};

export type PlayerUpdateInput = {
  name?: string;
  gender?: string;
  age?: number;
  birthDate?: Date;
  dominance?: string;
  backhand?: string;
  ranking?: number;
  rankings?: Rankings;
};

export interface IPlayerRepository {
  list(cursor?: string | null, limit?: number, userId?: string | null): Promise<Partial<Player>[]>;
  findByEmail(email: string): Promise<{ id: string; name: string; email: string; role: string; passwordHash: string } | null>;
  findById(id: string): Promise<Partial<Player> | null>;
  update(id: string, data: PlayerUpdateInput): Promise<Partial<Player>>;
  create(data: PlayerUpsertInput): Promise<Partial<Player>>;
}
