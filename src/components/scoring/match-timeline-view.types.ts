import type { TimelinePoint } from '@/core/scoring/types';
import type { TimelineDoublesConfig } from './timeline-row.logic';

export interface MatchTimelineViewProps {
  points: TimelinePoint[];
  player1Name: string;
  player2Name: string;
  matchId: string;
  hideFilters?: boolean;
  showFinalResult?: boolean;
  scoreState?: unknown;
  doubles?: TimelineDoublesConfig;
  matchInfo?: import('./timeline-match-info').MatchInfoData | null;
  comments?: Array<{
    id: string;
    content: string;
    category?: string | null;
    authorName: string;
    createdAt: string;
    hasAudioNote?: boolean;
    audioNoteDuration?: number | null;
  }>;
}
