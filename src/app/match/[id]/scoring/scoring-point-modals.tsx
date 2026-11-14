"use client";

import { PointDetailsModal } from "@/components/scoring/PointDetailsModal";
import type { ScoringPageState } from "./useScoringPageState";
import type { ScoringPageHandlers } from "./useScoringPageEffects";
import type { ScoringPageDerived } from "./useScoringPageDerived";
import type { ScoringAnnotationFlow } from "./use-scoring-annotation-flow";
import { isNoAdDecidingPoint } from "@/core/scoring/doubles";
import type { TennisFormat } from "@/core/scoring/types";

interface PointDetailsModalBlockProps {
  state: ScoringPageState;
  handlers: ScoringPageHandlers;
  derived: ScoringPageDerived;
  match: NonNullable<ScoringPageState["match"]>;
  annotation: ScoringAnnotationFlow;
}

export function PointDetailsModalBlock({
  state,
  handlers,
  derived,
  match,
  annotation,
}: PointDetailsModalBlockProps) {
  const winner = (annotation?.flow?.winner ?? (state.modalParams as any)?.winner ?? 'player1') as 'player1' | 'player2';

  return (
    <PointDetailsModal
      winnerPlayerSide={winner}
      currentServer={derived.effectiveScoreState?.server ?? "player1"}
      player1Name={match.player1.name}
      player2Name={match.player2.name}
      fontScale={state.fontScale}
      onConfirm={handlers.confirmPointDetails}
      onCancel={() => {
        annotation?.cancelAnnotation?.();
        state.close();
        state.toast({ type: 'info', message: 'Ponto não registrado' });
      }}
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
      howEnded={annotation?.tipo}
      whereWinner={annotation?.situacao}
    />
  );
}
