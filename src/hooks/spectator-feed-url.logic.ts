/**
 * Monta a URL do feed de acompanhamento preservando `rev` (evita reenvio de
 * pontos) e o token de visualização presente na query string da página.
 */
export function buildSpectatorFeedUrl(matchId: string, rev: string): string {
  const params = new URLSearchParams();
  if (rev) params.set('rev', rev);
  if (typeof window !== 'undefined') {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) params.set('token', token);
  }
  const qs = params.toString();
  return `/api/spectate/${matchId}/feed${qs ? `?${qs}` : ''}`;
}
