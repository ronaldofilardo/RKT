import { logger } from "@/lib/logger";
import type { TimelinePoint } from "@/core/scoring/types";
import type { MatchData } from "@/hooks/useScoringHandlers";
import type { PointLogAudioMeta } from "@/components/scoring/timeline.logic";

type FetcherDeps = {
  matchId: string;
  match: MatchData | null;
  tokenRef: React.MutableRefObject<string | null>;
  setServerTimelinePoints: (points: TimelinePoint[] | null) => void;
  setPointLogAudioMeta: (meta: PointLogAudioMeta[]) => void;
  setComments: (comments: unknown[]) => void;
};

export function createTimelineFetchers(deps: FetcherDeps) {
  const { matchId, match, tokenRef, setServerTimelinePoints, setPointLogAudioMeta, setComments } = deps;

  const fetchTimelinePoints = async () => {
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
    } catch (error) {
      logger.warn('[TIMELINE SYNC] Falha ao carregar timeline do servidor; usando history do engine:', error);
    }
  };

  const fetchPointLogAudioMeta = async () => {
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
    } catch (error) {
      logger.warn('[TIMELINE SYNC] Falha ao carregar metadados de áudio; mantendo lista vazia:', error);
    }
  };

  const fetchComments = async () => {
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
    } catch (error) {
      logger.warn('[TIMELINE SYNC] Falha ao carregar comentários; mantendo lista vazia:', error);
    }
  };

  return { fetchTimelinePoints, fetchPointLogAudioMeta, fetchComments };
}
