/**
 * User repository port (admin-only — `Player` rows with elevated roles).
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { Role } from '@/schemas/contracts';

export type UserCreateInput = {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  club?: string | null;
};

export type UserUpdateInput = {
  name?: string;
  role?: Role;
  club?: string | null;
};

export interface IUserRepository {
  listAll(options?: { cursor?: string; limit?: number; role?: Role }): Promise<unknown[]>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  create(data: UserCreateInput): Promise<unknown>;
  findById(id: string): Promise<unknown | null>;
  update(id: string, data: UserUpdateInput): Promise<unknown>;
  delete(id: string): Promise<void>;
}
