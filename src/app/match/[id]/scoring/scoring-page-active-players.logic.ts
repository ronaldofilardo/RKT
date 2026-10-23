import type { ScoringState } from "@/core/scoring/types";
import type { ScoringPageState } from "./useScoringPageState";
import { buildEngineConfig } from "@/core/scoring/engine-config";
import { getServingMemberId, getReceiverMemberId } from "@/core/scoring/doubles";

interface ResolveActivePlayersResult {
  activeServerId: string | null;
  activeReceiverId: string | null;
}

export function resolveActivePlayers(
  effectiveScoreState: ScoringState | null,
  match: ScoringPageState["match"],
): ResolveActivePlayersResult {
  let activeServerId: string | null = null;
  let activeReceiverId: string | null = null;
  if (effectiveScoreState && match) {
    try {
      const engineConfig = buildEngineConfig(match);
      if (engineConfig.doubles) {
        activeServerId = getServingMemberId(effectiveScoreState, engineConfig.doubles);
        activeReceiverId = getReceiverMemberId(effectiveScoreState, engineConfig.doubles);
      }
    } catch {
      activeServerId = null;
      activeReceiverId = null;
    }
  }
  return { activeServerId, activeReceiverId };
}
