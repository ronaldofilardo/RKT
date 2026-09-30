"use client";

import { useState, useCallback, useMemo } from "react";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { ScoringState, TimelinePoint } from "@/core/scoring/types";
import type { MatchData } from "@/hooks/useScoringHandlers";
import {
  enrichPointsFromHistory,
  enrichTimelineWithAudio,
  type PointLogAudioMeta,
} from "@/components/scoring/timeline-utils";

export interface MatchCommentData {
  id: string;
  content: string;
  category?: string | null;
  authorName: string;
  createdAt: string;
  hasAudioNote?: boolean;
  audioNoteDuration?: number | null;
}

export interface UseScoringTimelineSyncParams {
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

  const fetchTimelinePoints = useCallback(async () => {
    if (!matchId) return;
    try {
      const token = tokenRef.current;
      const res = await fetch(`/api/matches/${matchId}/report`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.timelinePoints)) {
          setServerTimelinePoints(data.timelinePoints);
        }
      }
    } catch {
      // Silently fail — fallback to engine history
    }
  }, [matchId, tokenRef]);

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
      const hasSegmentBreaks = serverTimelinePoints.some(p => p.segmentBreak !== undefined);
      // Se o histórico local foi zerado por edição de placar ou o servidor possui mais pontos/quebras
      if (hasSegmentBreaks || serverTimelinePoints.length >= localEnriched.length) {
        const serverWithAudio = enrichTimelineWithAudio(serverTimelinePoints, pointLogAudioMeta);

        let lastBreakIndex = -1;
        for (let i = serverTimelinePoints.length - 1; i >= 0; i--) {
          if (serverTimelinePoints[i].segmentBreak !== undefined) {
            lastBreakIndex = i;
            break;
          }
        }

        const serverPointsInCurrentSegment = lastBreakIndex >= 0
          ? serverTimelinePoints.length - lastBreakIndex
          : (localEnriched.length === 0 ? serverTimelinePoints.length : 0);

        if (localEnriched.length > serverPointsInCurrentSegment) {
          const newLocalPoints = localEnriched.slice(serverPointsInCurrentSegment);
          return [...serverWithAudio, ...newLocalPoints];
        }

        return serverWithAudio;
      }
    }

    return localEnriched;
  }, [match, engineTick, scoreState, pointLogAudioMeta, serverTimelinePoints, engineRef]);

  const fetchPointLogAudioMeta = useCallback(async () => {
    if (!match) return;
    try {
      const token = tokenRef.current;
      const res = await fetch(`/api/matches/${matchId}/point-logs-meta`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPointLogAudioMeta(data.pointLogs ?? []);
      }
    } catch {
      // Silently fail — audio is non-critical
    }
  }, [match, matchId, tokenRef]);

  const fetchComments = useCallback(async () => {
    if (!match) return;
    try {
      const token = tokenRef.current;
      const res = await fetch(`/api/matches/${matchId}/comments?limit=100`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // Silently fail — comments are non-critical
    }
  }, [match, matchId, tokenRef]);

  return {
    timelinePoints,
    fetchTimelinePoints,
    fetchPointLogAudioMeta,
    comments,
    setComments,
    fetchComments,
  };
}
