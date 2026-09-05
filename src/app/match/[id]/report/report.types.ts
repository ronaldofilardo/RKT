import type { TimelinePoint, TennisFormat } from '@/core/scoring/types';
import type { ReportSummary } from '@/core/report/report-types';
import type { ReportIntegrity } from '@/core/report/report-types';
import type { AdvancedMatchStats } from '@/core/report/compute-stats';

export interface ReportData {
  matchId: string;
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  format: TennisFormat;
  sportType?: string;
  courtType?: string | null;
  tournamentName?: string | null;
  category?: string | null;
  round?: string | null;
  bracketType?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  winnerId?: string | null;
  finishReason?: string | null;
  finishNote?: string | null;
  scoreState: unknown;
  timelinePoints: TimelinePoint[];
  summary: ReportSummary;
  advancedStats?: AdvancedMatchStats;
  integrity?: ReportIntegrity;
  scoreEditsCount?: number;
  state: string;
  startedAt: string | null;
  finishedAt: string | null;
}
