import type { ScoringState, TennisFormat } from "@/core/scoring/types";
import type { ScoringPageState } from "./useScoringPageState";
import { resolveDisplayScore } from "./resolveDisplayScore";
import { getInitialGames } from "@/core/scoring/format-rules";
import { resolveInitialServerSide, resolveServerSideFromId } from "@/lib/resolveInitialServerSide";

interface ResolveDisplayStateOptions {
  activeModal: string | null;
  scoreState: ScoringState | null;
  pendingEditScore: ScoringPageState["session"]["pendingEditScore"];
  suspendedSession: ScoringPageState["suspendedSession"];
  match: ScoringPageState["match"];
}

export function resolveDisplayState({
  activeModal,
  scoreState,
  pendingEditScore,
  suspendedSession,
  match,
}: ResolveDisplayStateOptions): ScoringState | null {
  let effectiveScoreState = resolveDisplayScore(
    activeModal,
    scoreState,
    pendingEditScore,
    suspendedSession,
  );

  if (effectiveScoreState && effectiveScoreState.sets.length === 0 && match?.format) {
    const initGames = getInitialGames(match.format as TennisFormat);
    effectiveScoreState = {
      ...effectiveScoreState,
      sets: [
        {
          player1: initGames,
          player2: initGames,
          isTiebreak: false,
          tiebreakScore: null,
        },
      ],
    };
  }

  if (effectiveScoreState && match) {
    // O `server` pode chegar como id de jogador (persistido) ou como lado.
    let resolvedServer: string = effectiveScoreState.server;
    const sideFromId = resolveServerSideFromId(resolvedServer, match);
    if (sideFromId) {
      resolvedServer = sideFromId;
    } else if (resolvedServer !== "player1" && resolvedServer !== "player2") {
      resolvedServer = resolveInitialServerSide(match);
    }

    const totalGames = (effectiveScoreState.sets ?? []).reduce(
      (acc, s) => acc + (s.player1 || 0) + (s.player2 || 0),
      0
    );
    const hasCurrentGamePoints = Boolean(
      effectiveScoreState.currentGame && (
        (effectiveScoreState.currentGame.player1 || 0) > 0 ||
        (effectiveScoreState.currentGame.player2 || 0) > 0 ||
        Boolean(effectiveScoreState.currentGame.advantage) ||
        effectiveScoreState.currentGame.secondServe
      )
    );
    const hasTiebreakPoints = Boolean(
      (effectiveScoreState.sets ?? []).some(
        (s) => s.tiebreakScore && (
          (s.tiebreakScore.player1 || 0) > 0 ||
          (s.tiebreakScore.player2 || 0) > 0
        )
      )
    );

    const isVirginState =
      totalGames === 0 &&
      !hasCurrentGamePoints &&
      !hasTiebreakPoints;

    if (isVirginState && match.initialServerId) {
      resolvedServer = match.initialServerId === match.player2.id ? "player2" : "player1";
    }

    const serverSide: "player1" | "player2" = resolvedServer === "player2" ? "player2" : "player1";
    if (effectiveScoreState.server !== serverSide) {
      effectiveScoreState = {
        ...effectiveScoreState,
        server: serverSide,
      };
    }
  }

  return effectiveScoreState;
}
