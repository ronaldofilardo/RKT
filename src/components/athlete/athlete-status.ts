import type { AthleteStatus } from './athlete-table.types';

/**
 * Deriva o status exibido na coluna "Status" a partir do User vinculado ao Player:
 * sem conta · senha provisória pendente · ativo.
 */
export function athleteStatusOf(
  user: { mustChangePassword: boolean } | null | undefined,
): AthleteStatus {
  if (!user) return 'NO_ACCOUNT';
  return user.mustChangePassword ? 'PASSWORD_PENDING' : 'ACTIVE';
}
