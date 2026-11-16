import { isMinor } from './age';
import { randomizeMinorPlayerName } from './minor-name-randomizer';

export interface ResolvePlayerDisplayNameParams {
  player: {
    id: string;
    name: string;
    birthDate?: Date | string | null;
  };
  matchId: string;
  isDirectlyInvolved: boolean;
  now?: Date;
}

/**
 * Resolve o nome de exibição de um atleta para um visualizador:
 * - Se for maior de idade -> nome real.
 * - Se for menor e o visualizador estiver diretamente envolvido -> nome real.
 * - Se for menor e o visualizador NÃO estiver diretamente envolvido -> nome randomizado estável.
 */
export function resolvePlayerDisplayName(params: ResolvePlayerDisplayNameParams): string {
  const { player, matchId, isDirectlyInvolved, now = new Date() } = params;
  const birth = player.birthDate ? new Date(player.birthDate) : null;
  const minor = isMinor(birth, now);

  if (!minor) {
    return player.name;
  }

  if (isDirectlyInvolved) {
    return player.name;
  }

  return randomizeMinorPlayerName(matchId, player.id);
}
