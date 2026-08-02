import type { MutableRefObject } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { MatchData } from "./useScoringHandlers.types";

interface ServerHelpersOptions {
  engineRef: MutableRefObject<ScoringEngine | null>;
  match: MatchData | null;
}

export function createServerHelpers(options: ServerHelpersOptions) {
  const { engineRef, match } = options;

  const getServerId = (): string => {
    if (!engineRef.current || !match) return "";
    const s = engineRef.current.getState().server;
    return s === "player1" ? match.player1.id : match.player2.id;
  };

  const getWinnerId = (isServer: boolean): string => {
    if (!engineRef.current || !match) return "";
    const s = engineRef.current.getState().server;
    if (isServer) {
      return s === "player1" ? match.player1.id : match.player2.id;
    }
    return s === "player1" ? match.player2.id : match.player1.id;
  };

  return { getServerId, getWinnerId };
}