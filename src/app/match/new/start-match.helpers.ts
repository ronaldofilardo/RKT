export async function startMatch(createdMatchId: string, serverId: string) {
  const accessToken = sessionStorage.getItem('access_token');
  const response = await fetch(`/api/matches/${createdMatchId}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ state: 'IN_PROGRESS', initialServerId: serverId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'Erro ao iniciar partida');
}
