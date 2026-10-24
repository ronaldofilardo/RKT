import { logger } from "@/lib/logger";
import type { AbandonDeps } from "./useSessionManager.abandon.types";

/**
 * Ramo "partida em andamento": POST .../abandon com keepalive. Em caso de
 * falha de rede, enfileira na pending-abandon queue para retry posterior.
 */
export async function abandonActiveSession(
  mid: string,
  sid: string,
  stateSnapshot: string,
  token: string | null,
  deps: AbandonDeps,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/matches/${mid}/sessions/${sid}/abandon`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",          },
      body: JSON.stringify({ matchStateSnapshot: stateSnapshot }),
    });

    if (!response.ok) {
      throw new Error(`abandon POST failed: ${response.status}`);
    }
    return true;
  } catch (fetchErr) {
    logger.warn(
      "[abandonCurrentSession] falha ao marcar sessão como abandonada, agendando retry:",
      fetchErr
    );
    deps.enqueuePendingAbandon({
      matchId: mid,
      sessionId: sid,
      matchStateSnapshot: stateSnapshot,
      token,
      createdAt: Date.now(),
    });
    deps.toast({
      type: "info",
      message:
        "Não foi possível confirmar o encerramento da anotação agora (sem conexão). Vamos tentar novamente automaticamente.",
    });
    return false;
  }
}
