import { prisma } from '@/lib/prisma';

export interface AnonymizeResult {
  userId: string;
  playerId?: string | null;
}

/**
 * Anonimiza dados civis de User e Player vinculado (Art. 18 LGPD).
 * Preserva integridade das partidas: não remove registros, apenas ofusca
 * dados pessoais. Histórico do adversário permanece intacto.
 * R-03: <= 100 linhas.
 */
export async function anonymizeUserAndPlayer(userId: string): Promise<AnonymizeResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, athleteProfile: { select: { id: true } } },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  const playerId = user.athleteProfile?.id ?? null;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: 'Atleta Anonimizado',
        email: `anonymized_${userId}@rkt.internal`,
        cpf: null,
        isActive: false,
        canOperate: false,
      },
    }),
    ...(playerId
      ? [
          prisma.player.update({
            where: { id: playerId },
            data: {
              name: 'Atleta Anonimizado',
              email: null,
              cpf: null,
              birthDate: new Date(1900, 0, 1),
            },
          }),
        ]
      : []),
  ]);

  return { userId, playerId };
}
