import { createMatchRequest } from './new-match-submit.helpers';

export async function submitOnlineMatch(payload: Record<string, unknown>) {
  const { response, data } = await createMatchRequest(payload);
  if (response.status === 409 && data.code === 'DUPLICATE_MATCH') return { duplicate: true, data };
  if (!response.ok) throw new Error(data.message || 'Erro ao criar partida');
  return { duplicate: false, data };
}
