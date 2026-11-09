import { prisma } from '@/lib/prisma';
import { ConflictError, getPrismaErrorCode } from '@/lib/errors';

/** Cria o Player mapeando apelido duplicado (P2002 em nickname) para 409. */
export async function createPlayerRow(args: Parameters<typeof prisma.player.create>[0]) {
  try {
    return await prisma.player.create(args);
  } catch (error) {
    if (getPrismaErrorCode(error) === 'P2002') {
      throw new ConflictError('Apelido já está em uso', { code: 'NICKNAME_TAKEN' });
    }
    throw error;
  }
}
