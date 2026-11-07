import { logger } from "@/lib/logger";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import { isInitialServerCorrectionWindow } from "@/core/scoring/engine-from-serialized";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers.types";
import type { PersistStateFn } from "./useScoringHandlers.persist";

interface ServerChangeServiceDeps {
  match: MatchData | null;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  persistState: PersistStateFn;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
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

    const result = await persistState(state, "server-change", {
      isManualScoreEdit: true,
      note: "Correção de sacador",
      initialServerId,
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
