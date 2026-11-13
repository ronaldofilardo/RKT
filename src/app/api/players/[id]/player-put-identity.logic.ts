import { prisma } from '@/lib/prisma';
import { cleanCpf, getCpfLast2, hashCpf } from '@/core/athlete/cpf';

interface IdentityUpdateParams {
  /** Conta de acesso ligada ao atleta (null quando o Player não tem User). */
  userId: string | null;
  name?: string;
  cpf?: string;
}

/**
 * Sincroniza nome/CPF do atleta.
 * - Com conta (User): grava no User e não toca nos campos de CPF do Player.
 * - Sem conta: devolve os campos de CPF (texto + hash + 2 dígitos) para o Player.
 */
export async function buildIdentityUpdate({ userId, name, cpf }: IdentityUpdateParams) {
  const digits = cpf ? cleanCpf(cpf) : '';

  if (userId) {
    if (name !== undefined || digits) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(digits ? { cpf: digits } : {}),
        },
      });
    }
    return {};
  }

  if (!digits) return {};
  return {
    cpf: digits,
    cpfHash: hashCpf(digits, process.env.CPF_HASH_PEPPER ?? ''),
    cpfLast2: getCpfLast2(digits),
  };
}
