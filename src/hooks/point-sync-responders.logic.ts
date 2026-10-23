import { logger } from "@/lib/logger";
import type { PointSyncResult, VersionConflictBody, ErrorResponseBody } from "./point-sync.types";

export async function respondWithApiSuccess(res: Response): Promise<PointSyncResult> {
  try {
    const data = await res.json();
    return {
      success: true,
      needsResync: false,
      serverResponse: data,
    };
  } catch (err) {
    logger.point.parseResponseError(err);
    return { success: true, needsResync: false };
  }
}

export async function respondWithConflict(
  res: Response,
  pointSequenceRef: React.MutableRefObject<number>,
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  try {
    const errData = (await res.json()) as VersionConflictBody;
    if (errData.error === "SEQUENCE_CONFLICT" && errData.expectedSequence) {
      pointSequenceRef.current = errData.expectedSequence - 1;
    }
  } catch (e) {
    logger.warn("[syncPointToServer] Falha ao parsear body do 409:", e);
  }
  setError("Conflito de sequência — sincronizando...");
  return { success: false, needsResync: true };
}

export async function respondWithApiError(
  res: Response,
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  let errorMsg = `Erro ao registrar ponto (${res.status})`;
  try {
    const errData = (await res.json()) as ErrorResponseBody;
    logger.point.responseError(res.status, errData);
    if (errData.error) {
      errorMsg = `Erro: ${errData.error} — ${errData.message || "sincronizando..."}`;
    }
  } catch (e) {
    const text = await res.text();
    logger.point.responseErrorText(res.status, text);
  }
  setError(errorMsg);
  return { success: false, needsResync: true };
}

export async function respondUnauthorized(
  setError: (msg: string) => void,
): Promise<PointSyncResult> {
  setError("Sessão expirada — o ponto foi salvo localmente. Faça login novamente para sincronizar.");
  return { success: false, needsResync: false, needsLogin: true };
}

export function reportFetchFailure(err: unknown, setError: (msg: string) => void): PointSyncResult {
  if (err instanceof Error && err.name === "AbortError") {
    logger.point.requestTimeout();
    setError("Tempo esgotado — sincronizando placar...");
  } else {
    logger.point.requestError(err);
    setError("Erro de conexão — sincronizando...");
  }
  return { success: false, needsResync: true };
}
