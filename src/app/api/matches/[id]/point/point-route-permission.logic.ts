import type { Prisma } from '@prisma/client';
import { TransactionError } from './point-route-errors';

/**
 * Valida se o usuário atual pode registrar pontos em uma anotação.
 * Escrita é estrita ao dono da anotação (`createdByUserId === currentUserId`)
 * e proibida em cartazes (`isTemplate === true`).
 */
export async function validateMatchAnnotatorPermission(
  match: {
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string | null;
    player2PartnerId?: string | null;
    createdByUserId?: string | null;
    openForAnnotation?: boolean | null;
    isTemplate?: boolean | null;
  },
  _id: string,
  currentUserId?: string,
  _currentUserRole?: string,
  _tx?: Prisma.TransactionClient,
  _athletePlayerId?: string | null,
): Promise<void> {
  if (match.isTemplate) {
    throw new TransactionError(
      'Cartazes não aceitam marcação direta; crie sua anotação derivada',
      403,
      'FORBIDDEN',
    );
  }

  if (currentUserId && match.createdByUserId === currentUserId) {
    return;
  }

  throw new TransactionError(
    'Apenas o anotador dono da partida pode registrar pontos',
    403,
    'FORBIDDEN',
  );
}
