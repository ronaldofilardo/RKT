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
  overrideReceiverId?: string | null,
): ResolveActivePlayersResult {
  let activeServerId: string | null = null;
  let activeReceiverId: string | null = null;
  if (effectiveScoreState && match) {
    try {
      const engineConfig = buildEngineConfig(match);
      if (engineConfig.doubles) {
        activeServerId = getServingMemberId(effectiveScoreState, engineConfig.doubles);
        activeReceiverId = getReceiverMemberId(
          effectiveScoreState,
          engineConfig.doubles,
          overrideReceiverId ?? undefined,
        );
      } else {
        const isPlayer1Serving = effectiveScoreState.server === "player1";
        activeServerId = isPlayer1Serving ? match.player1.id : match.player2.id;
        activeReceiverId = isPlayer1Serving ? match.player2.id : match.player1.id;
      }
    } catch {
      activeServerId = null;
      activeReceiverId = null;
    }
  }
  return { activeServerId, activeReceiverId };
}
