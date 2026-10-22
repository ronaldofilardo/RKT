import type { ScoreboardUIState } from "@/hooks/useScoreboardUIState";

type FirstServeError = ScoreboardUIState["firstServeError"];

export function isSecondServePhase(
  serveErrorState: Pick<ScoreboardUIState, "serveStep" | "firstServeError">,
): boolean {
  return serveErrorState.serveStep === "second" || serveErrorState.firstServeError !== null;
}

export function buildFirstFaultDetail(firstServeError: FirstServeError) {
  if (!firstServeError) return undefined;
  return {
    errorType: firstServeError.errorType,
    serveEffect: firstServeError.serveEffect,
    direction: firstServeError.direction,
  };
}
