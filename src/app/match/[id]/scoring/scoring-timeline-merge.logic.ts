import type { TimelinePoint } from "@/core/scoring/types";

/**
 * Decide entre pontos do servidor (que respeitam segmentos pós-edição de
 * placar) + novos pontos locais, ou somente servidor; caso contrário,
 * mantém o histórico local enriquecido.
 */
export function mergeServerAndLocalTimeline(
  serverEnriched: TimelinePoint[],
  serverTimelinePoints: TimelinePoint[],
  localEnriched: TimelinePoint[],
): TimelinePoint[] {
  const hasSegmentBreaks = serverTimelinePoints.some(p => p.segmentBreak !== undefined);
  // Se o histórico local foi zerado por edição de placar ou o servidor possui mais pontos/quebras
  if (hasSegmentBreaks || serverTimelinePoints.length >= localEnriched.length) {
    let lastBreakIndex = -1;
    for (let i = serverTimelinePoints.length - 1; i >= 0; i--) {
      if (serverTimelinePoints[i].segmentBreak !== undefined) {
        lastBreakIndex = i;
        break;
      }
    }

    const serverPointsInCurrentSegment = lastBreakIndex >= 0
      ? serverTimelinePoints.length - lastBreakIndex
      : serverTimelinePoints.length;

    if (localEnriched.length > serverPointsInCurrentSegment) {
      const newLocalPoints = localEnriched.slice(serverPointsInCurrentSegment);
      return [...serverEnriched, ...newLocalPoints];
    }

    return serverEnriched;
  }

  return localEnriched;
}
