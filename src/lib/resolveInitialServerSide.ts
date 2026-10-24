export interface MatchServerSidesInput {
  initialServerId?: string | null;
  player1Id?: string | null;
  player2Id?: string | null;
  player1PartnerId?: string | null;
  player2PartnerId?: string | null;
  player1?: { id: string } | null;
  player2?: { id: string } | null;
}

/**
 * Determina o lado sacador ("player1" | "player2") a partir de um id de jogador
 * considerando tanto partidas de simples quanto de duplas.
 */
export function resolveServerSideFromId(
  serverId: string | null | undefined,
  match: MatchServerSidesInput | null | undefined,
): "player1" | "player2" | null {
  if (!serverId || !match) return null;

  const p1Id = match.player1Id ?? match.player1?.id;
  const p2Id = match.player2Id ?? match.player2?.id;
  const p1PartnerId = match.player1PartnerId;
  const p2PartnerId = match.player2PartnerId;

  if (serverId === p2Id || (p2PartnerId && serverId === p2PartnerId)) {
    return "player2";
  }
  if (serverId === p1Id || (p1PartnerId && serverId === p1PartnerId)) {
    return "player1";
  }

  return null;
}

/**
 * Resolve o lado sacador inicial ("player1" | "player2") de uma partida,
 * considerando duplas (player1PartnerId / player2PartnerId).
 */
export function resolveInitialServerSide(
  match: MatchServerSidesInput | null | undefined,
): "player1" | "player2" {
  if (!match) return "player1";
  const resolved = resolveServerSideFromId(match.initialServerId, match);
  return resolved ?? "player1";
}