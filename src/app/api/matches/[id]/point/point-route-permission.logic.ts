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
  athletePlayerId?: string | null,
): Promise<void> {
  const isPrivilegedStaff = currentUserRole === 'ADMIN';
  const isPlayer =
    match.player1Id === athletePlayerId ||
    match.player2Id === athletePlayerId ||
    match.player1PartnerId === athletePlayerId ||
    match.player2PartnerId === athletePlayerId ||
    match.createdByUserId === currentUserId;

  if (isPrivilegedStaff || isPlayer) {
    return;
  }

  // Falha fechada: se o modelo de sessão não estiver disponível, nega o acesso.
  const txWithSessions = tx as unknown as {
    matchAnnotationSession?: {
      findFirst: (args: {
        where: { matchId?: string; isActive: boolean; annotatorUserId?: string };
      }) => Promise<unknown>;
    };
  };
  const sessionModel = txWithSessions.matchAnnotationSession;
  const hasSessionModel = typeof sessionModel?.findFirst === 'function';
  if (!hasSessionModel) {
    throw new TransactionError(
      'Apenas os jogadores, equipe técnica ou o anotador da sessão ativa podem registrar pontos',
      403,
      'FORBIDDEN',
    );
  }

  const activeSession = await sessionModel.findFirst({
    where: { matchId: id, isActive: true, annotatorUserId: currentUserId },
  });

  if (!activeSession) {
    throw new TransactionError(
      'Apenas os jogadores, equipe técnica ou o anotador da sessão ativa podem registrar pontos',
      403,
      'FORBIDDEN',
    );
  }
}
