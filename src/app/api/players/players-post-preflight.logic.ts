import { prisma } from '@/lib/prisma';
import type { Actor } from '@/core/access';

export type CreatingProfile = 'ATLETA' | 'GESTOR' | 'TREINADOR';

/** Perfil a partir do qual o ator está criando o jogador (regras de negócio do POST /players). */
export function actorCreatingProfile(actor: Actor): CreatingProfile | null {
  const isGestor = actor.memberships.some((m) => m.kind === 'GESTOR' && m.status === 'ACTIVE' && !!m.ctId);
  if (isGestor) return 'GESTOR';
  const isTreinador = actor.memberships.some((m) => m.kind === 'TREINADOR' && m.status === 'ACTIVE');
  if (isTreinador) return 'TREINADOR';
  const isPlatformAdmin = actor.memberships.some((m) => m.kind === 'PLATAFORMA' && m.preset === 'ADMIN');
  if (isPlatformAdmin) return 'GESTOR';
  if (actor.athletePlayerId) return 'ATLETA';
  return null;
}

/** Nome do CT como fallback do campo `club` quando o cadastro não informa clube. */
export async function fetchClubNameForCt(ctId: string): Promise<string | null> {
  try {
    const ct = await prisma.trainingCenter.findUnique({
      where: { id: ctId },
      select: { name: true },
    });
    return ct?.name ?? null;
  } catch {
    return null; // Fallback silencioso
  }
}
