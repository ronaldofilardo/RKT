import { createHmac } from 'crypto';

export const DEFAULT_SPECTATOR_SALT = 'RKT_SPECTATOR_SALT';

/**
 * Gera um pseudônimo estável para um atleta menor dentro do contexto de uma partida.
 * Exemplo de retorno: "Atleta #8F2A"
 */
export function randomizeMinorPlayerName(
  matchId: string,
  playerId: string,
  salt = DEFAULT_SPECTATOR_SALT,
): string {
  const hash = createHmac('sha256', salt)
    .update(`${matchId}:${playerId}`)
    .digest('hex');
  const code = hash.slice(0, 4).toUpperCase();
  return `Atleta #${code}`;
}
