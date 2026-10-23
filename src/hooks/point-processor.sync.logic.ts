import type { PointFlow } from "@/core/scoring/types";
import type { PointProcessorDeps } from "./point-processor.types";
import type { createApplySuccessResult } from "./point-processor.success.logic";

type ApplySuccessResult = ReturnType<typeof createApplySuccessResult>;

interface PointSyncFlowDeps {
  isOnline: boolean;
  pointSync: PointProcessorDeps["pointSync"];
  enqueue: PointProcessorDeps["enqueue"];
  fetchMatch: PointProcessorDeps["fetchMatch"];
  setError: PointProcessorDeps["setError"];
  pointSequenceRef: PointProcessorDeps["pointSequenceRef"];
  applySuccessResult: ApplySuccessResult;
}

function buildClientEventId(flow: PointFlow): string {
  return flow.clientEventId ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

export function createSyncPointFlow({
  isOnline,
  pointSync,
  enqueue,
  fetchMatch,
  setError,
  pointSequenceRef,
  applySuccessResult,
}: PointSyncFlowDeps) {
  return async (
    flow: PointFlow,
    seq: number,
  ): Promise<{ handled: boolean; pointLogId?: string }> => {
    if (!isOnline) {
      const offlineClientEventId = buildClientEventId(flow);
      await pointSync.queuePointForOffline(enqueue, { ...flow, clientEventId: offlineClientEventId });
      return { handled: false };
    }

    const clientEventId = buildClientEventId(flow);
    const flowWithClientEventId: PointFlow = { ...flow, clientEventId };
    const result = await pointSync.syncPointToServer(flowWithClientEventId, seq, clientEventId);

    if (result.success && result.serverResponse?.scoreState) {
      return { handled: true, pointLogId: applySuccessResult(result.serverResponse) };
    }

    if (result.needsLogin) {
      // 401 - token expirado: não tenta novamente, apenas enfileira para offline
      // e mostra mensagem para o usuário fazer login novamente
      await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
      // O erro já foi setado pelo respondUnauthorized
      return { handled: false };
    }

    if (result.needsResync) {
      await fetchMatch(true);
      const retrySeq = ++pointSequenceRef.current;
      const retryResult = await pointSync.syncPointToServer(flowWithClientEventId, retrySeq, clientEventId);

      if (retryResult.success && retryResult.serverResponse?.scoreState) {
        setError(null);
        return { handled: true, pointLogId: applySuccessResult(retryResult.serverResponse) };
      }
      if (retryResult.needsResync) {
        await fetchMatch(true);
        // BUG FIX (perda silenciosa de anotação ACE/dupla falta/rally):
        // antes, quando as 2 tentativas online falhavam, o ponto (já
        // aplicado localmente, incluindo rallyDetails/firstFaultDetail)
        // era simplesmente descartado — fetchMatch(true) sobrescrevia o
        // estado local com o do servidor (sem o ponto) e não havia
        // nenhuma outra tentativa de reenvio. Agora o ponto é
        // reenfileirado na fila offline com o mesmo clientEventId para
        // garantir idempotência e evitar duplicação no reenvio.
        await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
        setError(
          "Falha ao sincronizar com o servidor — o ponto foi salvo neste dispositivo e será reenviado automaticamente.",
        );
      } else if (retryResult.needsLogin) {
        // 401 no retry: enfileira para offline
        await pointSync.queuePointForOffline(enqueue, flowWithClientEventId);
      }
    }

    return { handled: false };
  };
}
