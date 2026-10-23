import type { Prisma } from '@prisma/client';
import { TransactionError } from './point-route-errors';

export async function validateMatchAnnotatorPermission(
  match: {
    player1Id: string;
    player2Id: string;
    player1PartnerId?: string | null;
    player2PartnerId?: string | null;
    createdByUserId?: string | null;
    openForAnnotation?: boolean | null;
  },
  id: string,
  currentUserId?: string,
  currentUserRole?: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const isPrivilegedStaff = currentUserRole === 'ADMIN';
  const isPlayer =
    match.player1Id === currentUserId ||
    match.player2Id === currentUserId ||
    match.player1PartnerId === currentUserId ||
    match.player2PartnerId === currentUserId ||
    match.createdByUserId === currentUserId;

  if (isPrivilegedStaff || isPlayer || match.openForAnnotation === true) {
    return;
  }

  // Detecção em runtime: o modelo pode ausentar em clientes Prisma desatualizados.
  const txWithSessions = tx as unknown as {
    matchAnnotationSession?: {
      findFirst: (args: {
        where: { matchId?: string; isActive: boolean; annotatorUserId?: string };
      }) => Promise<unknown>;
    };
  };
  const sessionModel = txWithSessions.matchAnnotationSession;
  const hasSessionModel = typeof sessionModel?.findFirst === 'function';
  const activeSession = hasSessionModel
    ? await sessionModel.findFirst({
        where: { matchId: id, isActive: true, annotatorUserId: currentUserId },
      })
    : null;

  if (hasSessionModel && !activeSession) {
    throw new TransactionError(
      'Apenas os jogadores, equipe técnica ou o anotador da sessão ativa podem registrar pontos',
      403,
      'FORBIDDEN',
    );
  }
}
