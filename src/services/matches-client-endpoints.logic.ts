import { requestWithFallback, fetchReport, fetchAudioBlob } from "./matches-client-request.logic";
import type { TimelinePoint } from "@/core/scoring/types";

type MatchesClientConfig = { baseUrl: string };

export function createMatchEndpoints({ baseUrl }: MatchesClientConfig) {
  return {
    getReportTimeline: (
      matchId: string,
    ): Promise<{ timelinePoints?: TimelinePoint[] }> =>
      requestWithFallback(
        baseUrl,
        `/matches/${matchId}/report`,
        { headers: {} },
        "Erro ao carregar timeline do relatório",
      ),

    startMatch: (
      matchId: string,
      body: { state: string; initialServerId?: string; doublesSetup?: unknown; scoreState?: unknown },
    ): Promise<unknown> =>
      requestWithFallback(
        baseUrl,
        `/matches/${matchId}/state`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        "Erro ao iniciar partida",
      ),

    updateMatchInfo: (
      matchId: string,
      payload: Record<string, unknown>,
    ): Promise<unknown> =>
      requestWithFallback(
        baseUrl,
        `/matches/${matchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        "Erro ao atualizar informações da partida",
      ),

    getMatch: (matchId: string, token?: string | null): Promise<unknown> =>
      requestWithFallback(
        baseUrl,
        `/matches/${matchId}`,
        {
          headers: token ? { authorization: `Bearer ${token}` } : {},
        },
        `Erro ao buscar partida`,
      ),

    /** Lista de partidas; repassa o `signal` para cancelamento em unmount. */
    listMatches: async (signal?: AbortSignal): Promise<unknown> => {
      const response = await fetch(`${baseUrl}/matches`, { signal });
      return response.json();
    },
  };
}

export function createReportEndpoints({ baseUrl }: MatchesClientConfig) {
  return {
    /** Relatório completo; sinaliza 401 para o chamador redirecionar ao login. */
    getReport: (matchId: string, signal?: AbortSignal): Promise<unknown> =>
      fetchReport(baseUrl, matchId, signal),

    /** Áudio de anotação ou de ponto (blob). */
    getAudio: (
      matchId: string,
      options: { pointId?: string; commentId?: string; token?: string | null; signal?: AbortSignal },
    ): Promise<Blob> => fetchAudioBlob(baseUrl, matchId, options),
  };
}
