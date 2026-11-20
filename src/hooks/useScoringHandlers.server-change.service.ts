import { logger } from "@/lib/logger";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import { isInitialServerCorrectionWindow } from "@/core/scoring/engine-from-serialized";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { ScoreAction } from "@/hooks/useScoreReducer";
import type { MatchData } from "./useScoringHandlers.types";
import type { PersistStateFn } from "./useScoringHandlers.persist";

interface ServerChangeServiceDeps {
  match: MatchData | null;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  persistState: PersistStateFn;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  setScoreState?: React.Dispatch<ScoreAction>;
  setMatch?: React.Dispatch<React.SetStateAction<MatchData | null>>;
}

export interface ServerChangeResult {
  success: boolean;
}

/**
 * Correção manual do sacador do game atual (tolerância a erro do anotador).
 * Aplica a troca no engine e persiste como edição manual para que a
 * reidratação por replay de PointLogs não desfaça a correção.
 */
export function createServerChangeService({
  match,
  engineRef,
  persistState,
  fetchMatch,
  setScoreState,
  setMatch,
}: ServerChangeServiceDeps) {
  const changeGameServer = async (serverId: string): Promise<ServerChangeResult> => {
    const engine = engineRef.current;
    if (!engine || !match) return { success: false };

    try {
      engine.setGameServer(serverId);
    } catch (err) {
      logger.error("[changeGameServer] Troca de sacador rejeitada:", err);
      return { success: false };
    }

    const state = engine.getState() as ScoringState;
    if (match.matchType !== 'DOUBLES') {
      (state as unknown as { singlesServerLocked?: boolean }).singlesServerLocked = true;
    }

    let initialServerId: string | undefined;
    try {
      const config = buildEngineConfig(match);
      if (isInitialServerCorrectionWindow(state, config)) {
        initialServerId = serverId;
      }
    } catch (err) {
      logger.warn("[changeGameServer] Falha ao derivar config do engine:", err);
    }

    // Atualização otimista imediata na UI local
    setScoreState?.({ type: "EDIT_CONFIRMED", payload: state });
    if (initialServerId && setMatch) {
      setMatch((prev) => (prev ? { ...prev, initialServerId } : prev));
    }

    let doublesSetupPayload: import("@/schemas/contracts").DoublesSetup | undefined;
    if (match.matchType === 'DOUBLES' && state.doubles) {
      const existingSetup = (typeof match.doublesSetup === 'object' && match.doublesSetup !== null
        ? match.doublesSetup
        : {}) as Record<string, unknown>;
      doublesSetupPayload = {
        ...existingSetup,
        serveOrder: state.doubles.serveOrder,
        receiveDeuce: state.doubles.receiveDeuce,
        changes: Array.isArray(existingSetup.changes) ? existingSetup.changes : [],
      } as import("@/schemas/contracts").DoublesSetup;
    }

    const result = await persistState(state, "server-change", {
      isManualScoreEdit: true,
      note: "Correção de sacador",
      initialServerId,
      doublesSetup: doublesSetupPayload,
    });

    if (result.success) {
      await fetchMatch(true);
    } else {
      logger.error("[changeGameServer] Falha ao persistir troca de sacador");
    }
    return { success: result.success };
  };

  return { changeGameServer };
}
