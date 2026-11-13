import type { ExternalAthlete, MembershipItem, UserItem } from './types';

export type AvulsosFilter = 'ATLETAS' | 'TREINADORES' | 'ESPECTADORES';

export interface AvulsosGroups {
  /** Atletas cadastrados em partidas sem conta no sistema (aba Externos). */
  atletas: ExternalAthlete[];
  /** Contas de atleta sem vínculo a nenhum clube (PlayerCT). */
  atletasComConta: UserItem[];
  /** Contas TREINADOR sem vínculo ativo a um CT. */
  treinadores: UserItem[];
  /** Usuários sem vínculo a CT e sem conta de atleta. */
  espectadores: UserItem[];
}

/**
 * Separa as contas avulsas nos três grupos filtrados pelos cards da aba
 * "Contas Avulsas". Contas de atleta são excluídas dos espectadores e os
 * administradores nunca entram em nenhuma lista.
 */
export function splitAvulsos(
  athletes: ExternalAthlete[],
  users: UserItem[],
  memberships: MembershipItem[],
): AvulsosGroups {
  const comVinculo = new Set(memberships.map((m) => m.userId));
  const treinadorVinculo = new Set(
    memberships.filter((m) => m.kind === 'TREINADOR').map((m) => m.userId),
  );
  const comCtAtivo = new Set(
    memberships
      .filter((m) => m.kind === 'TREINADOR' && m.ctId && m.status === 'ACTIVE')
      .map((m) => m.userId),
  );
  const isStaff = (u: UserItem) => u.role === 'ADMIN';

  return {
    atletas: athletes,
    atletasComConta: users.filter((u) => u.hasPlayer && !u.hasPlayerCt && !isStaff(u)),
    treinadores: users.filter((u) => treinadorVinculo.has(u.id) && !comCtAtivo.has(u.id)),
    espectadores: users.filter(
      (u) => !comVinculo.has(u.id) && !u.hasPlayer && !isStaff(u),
    ),
  };
}
