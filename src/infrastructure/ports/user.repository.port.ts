/**
 * User repository port (users table — ADMIN and ANNOTATOR accounts).
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { Role } from '@/schemas/contracts';

export type UserCreateInput = {
  name: string;
  email: string;
  cpf: string;
  passwordHash: string;
  role: Role;
  club?: string | null;
};

export type UserUpdateInput = {
  name?: string;
  email?: string;
  cpf?: string;
  role?: Role;
  club?: string | null;
  isActive?: boolean;
};

export interface IUserRepository {
  listAll(options?: { cursor?: string; limit?: number; role?: Role }): Promise<unknown[]>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  findByCpf(cpf: string): Promise<{ id: string } | null>;
  findByIdentifier(identifier: string): Promise<{
    id: string;
    name: string;
    email: string;
    cpf: string;
    role: Role;
    passwordHash: string;
    isActive: boolean;
  } | null>;
  create(data: UserCreateInput): Promise<unknown>;
  findById(id: string): Promise<unknown | null>;
  update(id: string, data: UserUpdateInput): Promise<unknown>;
  delete(id: string): Promise<void>;
}
