import { createMatchRequest } from './new-match-submit.helpers';

export async function submitOnlineMatch(payload: Record<string, unknown>) {
  const { response, data } = await createMatchRequest(payload);
  // A API (src/app/api/matches/route.ts) responde 409 com { error: 'CONFLICT', message, details }
  // para partida duplicada (nunca 'DUPLICATE_MATCH' em `data.code` — esse campo/valor não existem
  // na resposta real). A checagem antiga nunca era verdadeira, então o fluxo de "partida duplicada,
  // deseja continuar mesmo assim?" nunca era acionado e o 409 virava um Error genérico não tratado.
  if (response.status === 409 && data.error === 'CONFLICT') return { duplicate: true, data };
  if (!response.ok) throw new Error(data.message || 'Erro ao criar partida');
  return { duplicate: false, data };
}
