import type { Athlete } from "@/app/dashboard/dashboard.types";

/**
 * Cliente HTTP das rotas de jogadores consumidas pela UI.
 * Extrai o I/O dos componentes (R-04) seguindo o padrão de
 * `annotationSessionService`.
 */

interface PlayersClientConfig {
  baseUrl: string;
}

async function requestJson<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
  fallbackMessage: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(data?.message || fallbackMessage);
  }
  return response.json();
}

export interface PlayerListResponse {
  data?: { players?: Athlete[] };
  players?: Athlete[];
}

/** Resposta de criação: o dado pode vir em `data` ou no topo do corpo. */
export type CreatedPlayer = Partial<Athlete> & { id: string; name: string };
export type CreatedPlayerResponse = CreatedPlayer & { data?: CreatedPlayer };

function createPlayersClient(config: PlayersClientConfig) {
  const { baseUrl } = config;

  return {
    list: (userId: string, token: string | null): Promise<PlayerListResponse> =>
      requestJson(
        baseUrl,
        `/players?userId=${encodeURIComponent(userId)}`,
        { headers: { authorization: `Bearer ${token}` } },
        "Erro ao carregar atletas",
      ),

    update: (
      playerId: string,
      payload: unknown,
      token: string | null,
    ): Promise<unknown> =>
      requestJson(
        baseUrl,
        `/players/${playerId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
        "Erro ao salvar",
      ),

    remove: (playerId: string, token: string | null): Promise<unknown> =>
      requestJson(
        baseUrl,
        `/players/${playerId}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
        "Erro ao excluir atleta",
      ),

    create: (
      payload: unknown,
      token: string | null,
      userId: string | null,
    ): Promise<CreatedPlayerResponse> =>
      requestJson(
        baseUrl,
        "/players",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
            "x-user-id": userId || "",
          },
          body: JSON.stringify(payload),
        },
        "Erro ao criar atleta",
      ),
  };
}

export const playersClient = createPlayersClient({ baseUrl: "/api" });
