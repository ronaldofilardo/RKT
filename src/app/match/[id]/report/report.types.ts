import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import type { ReportSummary } from '@/core/report/report-types';
import type { ReportIntegrity } from '@/core/report/report-types';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';

export interface ReportData {
  matchId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  format: TennisFormat;
  matchType?: 'SINGLES' | 'DOUBLES';
  player1Partner?: { id: string; name: string } | null;
  player2Partner?: { id: string; name: string } | null;
  doublesSetup?: unknown;
  sportType?: string;
  courtType?: string | null;
  clubName?: string | null;
  tournamentName?: string | null;
  category?: string | null;
  round?: string | null;
  bracketType?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  winnerId?: string | null;
  finishReason?: string | null;
  finishNote?: string | null;
  details?: string | null;
  scoreState: unknown;
  timelinePoints: TimelinePoint[];
  summary: ReportSummary;
  comments?: Array<{
    id: string;
    content: string;
    category?: string | null;
    authorName: string;
    createdAt: string;
    hasAudioNote?: boolean;
    audioNoteDuration?: number | null;
  }>;
  advancedStats?: AdvancedMatchStats;
  integrity?: ReportIntegrity;
  scoreEditsCount?: number;
  state: string;
  startedAt: string | null;
  finishedAt: string | null;
}
