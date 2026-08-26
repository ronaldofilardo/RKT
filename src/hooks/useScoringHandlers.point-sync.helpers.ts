import type { PointFlow, ScoringState } from '@/core/scoring/types';
import type { QueuedAction } from '@/schemas/contracts';
import { logger } from '@/lib/logger';

export interface ServerResponse {
  scoreState?: ScoringState;
  version?: number;
  pointLogId?: string;
}

export interface VersionConflictBody {
  error?: string;
  expectedSequence?: number;
}

export interface ErrorResponseBody {
  error?: string;
  message?: string;
}

function getPointIdentity(flow: PointFlow, sequenceNumber: number) {
  return {
    winnerId: flow.winnerId,
    type: flow.type,
    serverId: flow.serverId,
    timestamp: flow.timestamp ?? Date.now(),
    sequenceNumber,
  };
}

function getRallyFields(flow: PointFlow) {
  return {
    rallyDetails: flow.rallyDetails ?? undefined,
    rallyLength: flow.rallyLength ?? undefined,
  };
}

function getServeFields(flow: PointFlow) {
  return {
    isFirstServe: flow.isFirstServe ?? undefined,
    isSecondServe: flow.isSecondServe ?? undefined,
    firstFaultDetail: flow.firstFaultDetail ?? undefined,
  };
}

function getPointAnnotations(flow: PointFlow) {
  return { ...getRallyFields(flow), ...getServeFields(flow) };
}

export function createPointPayload(flow: PointFlow, sequenceNumber: number) {
  return { ...getPointIdentity(flow, sequenceNumber), ...getPointAnnotations(flow) };
}

export function readSuccessfulResponse(data: unknown) {
  return { success: true, needsResync: false, serverResponse: data as ServerResponse };
}

export async function handleConflictResponse(
  response: Response,
  pointSequenceRef: React.MutableRefObject<number>,
  setError: (error: string) => void,
) {
  try {
    const errorData = (await response.json()) as VersionConflictBody;
    if (errorData.error === 'SEQUENCE_CONFLICT' && errorData.expectedSequence) {
      pointSequenceRef.current = errorData.expectedSequence - 1;
    }
  } catch (error) {
    logger.warn('[syncPointToServer] Falha ao parsear body do 409:', error);
  }
  setError('Conflito de sequência — sincronizando...');
  return { success: false, needsResync: true };
}

export async function handleErrorResponse(
  response: Response,
  setError: (error: string) => void,
) {
  let errorMsg = `Erro ao registrar ponto (${response.status})`;
  try {
    const errorData = (await response.json()) as ErrorResponseBody;
    logger.point.responseError(response.status, errorData);
    if (errorData.error) {
      errorMsg = `Erro: ${errorData.error} — ${errorData.message || 'sincronizando...'}`;
    }
  } catch (error) {
    const text = await response.text();
    logger.point.responseErrorText(response.status, text);
  }
  setError(errorMsg);
  return { success: false, needsResync: true };
}

export function handleRequestError(
  error: unknown,
  setError: (error: string) => void,
) {
  if (error instanceof Error && error.name === 'AbortError') {
    logger.point.requestTimeout();
    setError('Tempo esgotado ao registrar ponto — verifique sua conexão');
  } else {
    logger.point.requestError(error);
    setError('Erro de conexão ao registrar ponto');
  }
  return { success: false, needsResync: true };
}

export async function enqueueOfflinePoint(
  enqueue: (action: Omit<QueuedAction, 'id' | 'status' | 'retries'>) => Promise<QueuedAction>,
  matchId: string,
  flow: PointFlow,
): Promise<QueuedAction> {
  return enqueue({ matchId, type: 'POINT', payload: flow as never, timestamp: Date.now() });
}
