/**
 * Admin service - DI-based implementation.
 *
 * @see docs/adr/ADR-0004-repository-pattern.md
 */

import type { Role } from '@/schemas/contracts';
import type { IUserRepository } from '@/infrastructure/ports/user.repository.port';
import bcrypt from 'bcryptjs';

export interface AdminServiceDependencies {
  userRepository: IUserRepository;
}

export class AdminService {
  constructor(private readonly deps: AdminServiceDependencies) {}

  async listAllUsers(options?: { cursor?: string; limit?: number; role?: Role }) {
    return this.deps.userRepository.listAll(options);
  }

  async createUser(data: { name: string; email: string; cpf: string; password: string; role: Role; club?: string }) {
    const existingEmail = await this.deps.userRepository.findByEmail(data.email);
    if (existingEmail) return { error: 'EMAIL_ALREADY_EXISTS' };

    const existingCpf = await this.deps.userRepository.findByCpf(data.cpf);
    if (existingCpf) return { error: 'CPF_ALREADY_EXISTS' };

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.deps.userRepository.create({
      name: data.name,
      email: data.email,
      cpf: data.cpf,
      passwordHash,
      role: data.role,
      club: data.club,
    });
  }

  async updateUser(id: string, data: { name?: string; email?: string; cpf?: string; role?: Role; club?: string | null; isActive?: boolean }) {
    const user = await this.deps.userRepository.findById(id);
    if (!user) return { error: 'USER_NOT_FOUND' };
    return this.deps.userRepository.update(id, data);
  }

  async deleteUser(id: string) {
    const user = await this.deps.userRepository.findById(id);
    if (!user) return { error: 'USER_NOT_FOUND' };
    await this.deps.userRepository.delete(id);
    return { success: true };
  }
}

export function createAdminService(deps: AdminServiceDependencies): AdminService {
  return new AdminService(deps);
}
