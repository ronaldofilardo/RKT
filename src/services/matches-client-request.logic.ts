/** Erro dedicado para respostas 401 (sessão expirada). */
export class UnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export async function requestWithFallback<T>(
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

export async function fetchReport(
  baseUrl: string,
  matchId: string,
  signal?: AbortSignal,
): Promise<unknown> {
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
}

export async function fetchAudioBlob(
  baseUrl: string,
  matchId: string,
  options: { pointId?: string; commentId?: string; token?: string | null; signal?: AbortSignal },
): Promise<Blob> {
  const path = options.commentId
    ? `/matches/${matchId}/comments/${options.commentId}/audio`
    : `/matches/${matchId}/point/${options.pointId}/audio`;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: options.token ? { authorization: `Bearer ${options.token}` } : {},
    signal: options.signal,
  });
  if (!response.ok) throw new Error("Erro ao carregar áudio");
  return response.blob();
}
