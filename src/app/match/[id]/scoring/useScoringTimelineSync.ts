"use client";

import { useState, useMemo } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, TimelinePoint } from "@/core/scoring/types";
import type { MatchData } from "@/hooks/useScoringHandlers";
import {
  enrichPointsFromHistory,
  enrichTimelineWithAudio,
  type PointLogAudioMeta,
} from "@/components/scoring/timeline.logic";
import { createTimelineFetchers } from "./scoring-timeline-sync-fetches.logic";
import { mergeServerAndLocalTimeline } from "./scoring-timeline-merge.logic";

export interface MatchCommentData {
  id: string;
  content: string;
  category?: string | null;
  authorName: string;
  createdAt: string;
  hasAudioNote?: boolean;
  audioNoteDuration?: number | null;
}

interface UseScoringTimelineSyncParams {
  matchId: string;
  match: MatchData | null;
  scoreState: ScoringState | null;
  engineRef: React.MutableRefObject<ReturnType<typeof ScoringEngine.fromSerialized> | null>;
  engineTick: number | null;
  tokenRef: React.MutableRefObject<string | null>;
}

export function useScoringTimelineSync({
  matchId,
  match,
  scoreState,
  engineRef,
  engineTick,
  tokenRef,
}: UseScoringTimelineSyncParams) {
  const [pointLogAudioMeta, setPointLogAudioMeta] = useState<PointLogAudioMeta[]>([]);
  const [serverTimelinePoints, setServerTimelinePoints] = useState<TimelinePoint[] | null>(null);
  const [comments, setComments] = useState<MatchCommentData[]>([]);

  const fetchers = useMemo(
    () =>
      createTimelineFetchers({
        matchId,
        match,
        tokenRef,
        setServerTimelinePoints,
        setPointLogAudioMeta: (meta) => setPointLogAudioMeta(meta),
        setComments: (list) => setComments(list as MatchCommentData[]),
      }),
    [matchId, match, tokenRef],
  );

  const timelinePoints: TimelinePoint[] = useMemo(() => {
    if (!match) return [];
    // Referencia engineTick e scoreState para recalcular a timeline a cada novo ponto do engine
    if (engineTick === -1 && !scoreState) return [];

    const localHistory = engineRef.current ? engineRef.current.getPointHistory() : [];
    const localEnriched = enrichTimelineWithAudio(
      enrichPointsFromHistory(
        localHistory,
        match.player1.id,
        match.player2.id,
      ),
      pointLogAudioMeta,
    );

    // Se temos pontos reconstruídos pelo servidor que respeitam os segmentos (após edição de placar):
    if (serverTimelinePoints && serverTimelinePoints.length > 0) {
      const serverEnriched = enrichTimelineWithAudio(serverTimelinePoints, pointLogAudioMeta);
      return mergeServerAndLocalTimeline(serverEnriched, serverTimelinePoints, localEnriched);
    }

    return localEnriched;
  }, [match, engineTick, scoreState, pointLogAudioMeta, serverTimelinePoints, engineRef]);

  return {
    timelinePoints,
    fetchTimelinePoints: fetchers.fetchTimelinePoints,
    fetchPointLogAudioMeta: fetchers.fetchPointLogAudioMeta,
    comments,
    setComments,
    fetchComments: fetchers.fetchComments,
  };
}
