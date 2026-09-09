"use client";
import { logger } from "@/lib/logger";
import type { ScoringState } from "@/core/scoring/types";
import type { ToastType } from "@/components/Toast";
import type { PendingAbandon } from "./useSessionManager.pending-abandon";

export interface AbandonContext {
  sessionId: string;
  matchId: string;
  engine: { getState(): Readonly<ScoringState>; serialize(): string };
  token: string | null;
  matchVersion?: number;
}

export interface AbandonDeps {
  enqueuePendingAbandon: (entry: PendingAbandon) => void;
  toast: (args: { type: ToastType; message: string }) => void;
}

/**
 * Encerra a sessão de anotação ativa.
 *
 * Duas ramificações:
 *  - Partida finalizada (isFinished): PATCH /state (FINISHED) + PATCH /session (COMPLETED).
 *  - Partida em andamento: POST .../abandon com keepalive. Em caso de falha de rede,
 *    enfileira na pending-abandon queue para retry posterior.
 *
 * Extraído de useSessionManager.ts (2026-09-09) para permitir testes unitários isolados.
 */
export async function abandonCurrentSession(
  ctx: AbandonContext,
  deps: AbandonDeps,
  snapshot?: string,
): Promise<boolean> {
  const { sessionId: sid, matchId: mid, engine, token, matchVersion } = ctx;
  if (!sid || !mid) return false;
  if (!engine) return false;

  try {
    const state = engine.getState();
    const isFinished = state.isFinished;
    const stateSnapshot = snapshot ?? engine.serialize();
    if (isFinished) {
      const stateResponse = await fetch(`/api/matches/${mid}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          state: "FINISHED",
          scoreState: state,
          ...(matchVersion !== undefined ? { version: matchVersion } : {}),
        }),
      });

      if (stateResponse.status === 409) {
        logger.warn(
          "[abandonCurrentSession] Conflito de versão (409) ao finalizar — outro dispositivo já atualizou o placar. Match já FINISHED ou estado divergente; session não fechada.",
        );
        return false;
      }

      if (!stateResponse.ok) {
        throw new Error(`state PATCH failed: ${stateResponse.status}`);
      }

      try {
        const sessionResponse = await fetch(`/api/matches/${mid}/sessions/${sid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "COMPLETED",
            finalState: state,
          }),
        });
        if (!sessionResponse.ok) {
          logger.warn(
            `[abandonCurrentSession] session PATCH failed (${sessionResponse.status}); match already FINISHED — leaving session open`
          );
        }
      } catch (sessionErr) {
        logger.warn(
          "[abandonCurrentSession] session PATCH exception; match already FINISHED — leaving session open",
          sessionErr
        );
      }
      return true;
    } else {
      try {
        const response = await fetch(`/api/matches/${mid}/sessions/${sid}/abandon`, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
  } catch (e) {
    logger.error("[abandonCurrentSession] Error:", e);
    return false;
  }
}
