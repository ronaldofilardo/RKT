export interface CircleTemplateParams {
  createdByUserId: string;
  athletePlayerId?: string | null;
  followedPlayerIds?: readonly string[] | null;
  guardianOfPlayerIds?: readonly string[] | null;
}

/**
 * Monta a condição para cartazes do círculo (onde o usuário é atleta participante,
 * treinador particular de participante ou responsável legal), exibidos em Minhas Partidas
 * apenas enquanto o usuário ainda não tiver criado uma anotação derivada própria.
 */
export function buildCircleTemplateCondition({
  createdByUserId,
  athletePlayerId,
  followedPlayerIds,
  guardianOfPlayerIds,
}: CircleTemplateParams): Record<string, unknown> | null {
  const playerIds = [
    athletePlayerId,
    ...(followedPlayerIds ?? []),
    ...(guardianOfPlayerIds ?? []),
  ].filter(Boolean) as string[];

  if (playerIds.length === 0) return null;

  return {
    isTemplate: true,
    createdByUserId: { not: createdByUserId },
    eventScope: { in: ['PUBLIC', 'PRIVATE_CLUB', 'PRIVATE_COACH', 'PRIVATE_PLAYERS'] },
    annotations: {
      none: {
        createdByUserId,
        deletedAt: null,
        state: { not: 'CANCELLED' },
      },
    },
    OR: [
      { player1Id: { in: playerIds } },
      { player2Id: { in: playerIds } },
      { player1PartnerId: { in: playerIds } },
      { player2PartnerId: { in: playerIds } },
    ],
  };
}

