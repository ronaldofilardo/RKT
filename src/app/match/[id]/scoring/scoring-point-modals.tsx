"use client";

import { PointDetailsModal } from "@/components/scoring/PointDetailsModal";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";
import { isNoAdDecidingPoint } from "@/core/scoring/doubles";
import type { TennisFormat } from "@/core/scoring/types";

interface PointDetailsModalBlockProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState["match"]>;
}

export function PointDetailsModalBlock({
  state,
  handlers,
  derived,
  match,
}: PointDetailsModalBlockProps) {
  return (
    <PointDetailsModal
      winnerPlayerSide={
        (state.modalParams.winner as "player1" | "player2") ?? "player1"
      }
      currentServer={derived.effectiveScoreState?.server ?? "player1"}
      player1Name={match.player1.name}
      player2Name={match.player2.name}
      fontScale={state.fontScale}
      onConfirm={handlers.confirmPointDetails}
      onCancel={state.close}
      doubles={
        match.matchType === "DOUBLES"
          ? {
              player1: match.player1,
              player1Partner: match.player1Partner,
              player2: match.player2,
              player2Partner: match.player2Partner,
              activeServerId: derived.activeServerId,
              activeReceiverId: derived.activeReceiverId,
              isDecidingPoint: derived.effectiveScoreState
                ? isNoAdDecidingPoint(derived.effectiveScoreState, match.format as TennisFormat)
                : false,
            }
          : undefined
      }
    />
  );
}
