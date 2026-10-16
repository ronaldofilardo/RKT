"use client";

import type { ScoringEngine } from "@/core/scoring/engine";
import type { MatchData } from "./useScoringHandlers";

export interface ServerResolutionConfig {
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  match: MatchData | null;
}

export function createServerResolutionService(config: ServerResolutionConfig) {
  const { engineRef, match } = config;

  const getServerId = (): string => {
    const state = engineRef.current?.getState();
    if (!state) {
      return match?.initialServerId || match?.player1.id || "";
    }
    return state.server === "player1" ? match?.player1.id || "" : match?.player2.id || "";
  };

  const getWinnerId = (isServer: boolean): string => {
    const serverId = getServerId();
    if (!match) return serverId;
    const opponentId = serverId === match.player1.id ? match.player2.id : match.player1.id;
    return isServer ? serverId : (opponentId || "");
  };

  return {
    getServerId,
    getWinnerId,
  };
}

export const createServerHelpersService = createServerResolutionService;
export type ServerHelpersConfig = ServerResolutionConfig;