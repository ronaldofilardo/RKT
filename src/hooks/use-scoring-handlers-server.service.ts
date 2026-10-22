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
    if (engineRef.current) {
      const doublesServer = engineRef.current.getServingMemberId();
      if (doublesServer) return doublesServer;
    }
    const state = engineRef.current?.getState();
    if (!state) {
      return match?.initialServerId || match?.player1.id || "";
    }
    return state.server === "player1" ? match?.player1.id || "" : match?.player2.id || "";
  };

  const getWinnerId = (isServer: boolean): string => {
    const state = engineRef.current?.getState();
    const serverSide = state ? state.server : (match?.initialServerId === match?.player2.id ? "player2" : "player1");
    if (!match) return "";

    const winningSide = isServer ? serverSide : (serverSide === "player1" ? "player2" : "player1");
    return winningSide === "player1" ? match.player1.id : match.player2.id;
  };

  return {
    getServerId,
    getWinnerId,
  };
}

export const createServerHelpersService = createServerResolutionService;
export type ServerHelpersConfig = ServerResolutionConfig;