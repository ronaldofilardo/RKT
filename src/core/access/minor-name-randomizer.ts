import { createHmac } from 'crypto';

export const DEFAULT_SPECTATOR_SALT = 'RKT_SPECTATOR_SALT';

/**
 * Gera um identificador anonimizado estável para um atleta menor dentro do contexto de uma partida.
 * Exemplo de retorno: "Atleta #8F2A7B" (código de 6 caracteres hexadecimais).
 */
export function randomizeMinorPlayerName(
  matchId: string,
  playerId: string,
  salt?: string,
): string {
  const activeSalt = salt ?? process.env.SPECTATOR_SALT ?? DEFAULT_SPECTATOR_SALT;
  const hash = createHmac('sha256', activeSalt)
    .update(`${matchId}:${playerId}`)
    .digest('hex');
  const code = hash.slice(0, 6).toUpperCase();
  return `Atleta #${code}`;
}
