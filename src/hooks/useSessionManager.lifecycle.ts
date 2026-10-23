"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ToastType } from "@/components/Toast";
import { renewSession } from "@/services/annotationSessionService";
import { enqueuePendingAbandon } from "./useSessionManager.pending-abandon";
import { abandonCurrentSession as abandonSession } from "./useSessionManager.abandon";

interface SessionLifecycleRefs {
  matchId: string;
  matchVersion: number | undefined;
  sessionIdRef: MutableRefObject<string | null>;
  engineRef: MutableRefObject<ScoringEngine | null>;
  tokenRef: MutableRefObject<string | null>;
  toast: (args: { type: ToastType; message: string }) => void;
}

/**
 * Efeitos de ciclo de vida da sessão de anotação:
 * - beforeunload/pagehide: abandona a sessão ativa ao sair, com snapshot do estado.
 * - Renovação deslizante (sliding window): renewSession a cada 5 minutos
 *   enquanto a aba está visível.
 *
 * Extraído de useSessionManager.ts para manter a fachada ≤100L (R-03).
 */
export function useSessionLifecycleEffects({
  matchId,
  matchVersion,
  sessionIdRef,
  engineRef,
  tokenRef,
  toast,
}: SessionLifecycleRefs) {
  // Ref evita re-inscrever os listeners a cada mudança de versão da partida.
  const matchVersionRef = useRef(matchVersion);
  matchVersionRef.current = matchVersion;

  useEffect(() => {
    let abandoned = false;
    const doAbandon = () => {
      if (abandoned) return;
      const sid = sessionIdRef.current;
      if (!sid) return;
      const state = engineRef.current?.getState();
      if (!state || state.isFinished) return;
      abandoned = true;
      const snapshot = engineRef.current?.serialize() ?? JSON.stringify(state);
      sessionStorage.setItem("last_abandon_timestamp", Date.now().toString());
      const token = tokenRef.current ?? sessionStorage.getItem("access_token");
      abandonSession(
        { sessionId: sid, matchId, engine: engineRef.current!, token, matchVersion: matchVersionRef.current },
        { enqueuePendingAbandon, toast },
        snapshot,
      ).catch(() => {});
    };
    window.addEventListener("beforeunload", doAbandon);
    window.addEventListener("pagehide", doAbandon);
    return () => {
      window.removeEventListener("beforeunload", doAbandon);
      window.removeEventListener("pagehide", doAbandon);
      doAbandon();
    };
  }, [matchId, sessionIdRef, engineRef, tokenRef, toast]);

  // Renovação deslizante de sessão (Sliding Window)
  useEffect(() => {
    if (!matchId) return;

    const intervalId = setInterval(() => {
      const sid = sessionIdRef.current;
      if (sid && document.visibilityState !== "hidden") {
        renewSession(matchId, sid).catch(() => {});
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(intervalId);
  }, [matchId, sessionIdRef]);
}
