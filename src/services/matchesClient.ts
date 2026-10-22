import type { TimelinePoint } from "@/core/scoring/types";

/**
 * Cliente HTTP das rotas de partida consumidas pela UI.
 * Extrai o I/O dos componentes (R-04) seguindo o padrão de
 * `annotationSessionService`.
 */

interface MatchesClientConfig {
  baseUrl: string;
}

async function requestWithFallback<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    throw new Error(errorData.message || errorData.error || fallbackMessage);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function createMatchesClient(config: MatchesClientConfig) {
  const { baseUrl } = config;

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

    /** Relatório completo; sinaliza 401 para o chamador redirecionar ao login. */
    getReport: async (
      matchId: string,
      signal?: AbortSignal,
    ): Promise<unknown> => {
      const response = await fetch(`${baseUrl}/matches/${matchId}/report`, {
        signal,
      });
      if (response.status === 401) {
        throw new UnauthorizedError();
      }
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || "Erro ao carregar relatório");
      }
      return response.json();
    },

    /** Lista de partidas; repassa o `signal` para cancelamento em unmount. */
    listMatches: async (signal?: AbortSignal): Promise<unknown> => {
      const response = await fetch(`${baseUrl}/matches`, { signal });
      return response.json();
    },

    /** Áudio de anotação ou de ponto (blob). */
    getAudio: async (
      matchId: string,
      options: { pointId?: string; commentId?: string; token?: string | null; signal?: AbortSignal },
    ): Promise<Blob> => {
      const path = options.commentId
        ? `/matches/${matchId}/comments/${options.commentId}/audio`
        : `/matches/${matchId}/point/${options.pointId}/audio`;
      const response = await fetch(`${baseUrl}${path}`, {
        headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
        signal: options.signal,
      });
      if (!response.ok) throw new Error("Erro ao carregar áudio");
      return response.blob();
    },
  };
}

/** Erro dedicado para respostas 401 (sessão expirada). */
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export const matchesClient = createMatchesClient({ baseUrl: "/api" });
