import type { TimelinePoint } from '@/core/scoring/types';
import type { ReportSummary } from '@/core/report/report-types';
import type { getMatch, getMatchScoreEdits } from '@/services/matchService';

type MatchForReport = NonNullable<Awaited<ReturnType<typeof getMatch>>>;
type ScoreEdits = Awaited<ReturnType<typeof getMatchScoreEdits>>;
type AdvancedStats = ReturnType<typeof import('@/core/report/compute-stats').computeAdvancedStats>;

interface ReportCommentRow {
  id: string;
  content: string;
  category: string | null;
  author: { name: string | null };
  createdAt: Date;
  audioNoteDuration: number | null;
}

/**
 * Monta o payload JSON da resposta de GET /matches/[id]/report.
 * (Função pura: todos os dados já carregados pelo handler.)
 */
export function buildReportResponse(params: {
  match: MatchForReport;
  id: string;
  responseScoreState: unknown;
  timelinePoints: TimelinePoint[];
  comments: ReportCommentRow[];
  summary: ReportSummary;
  integrity: ReturnType<typeof import('./report.integrity').buildReportIntegrity>;
  advancedStats: AdvancedStats;
  scoreEdits: ScoreEdits;
}) {
  const { match, id, responseScoreState, timelinePoints, comments, summary, integrity, advancedStats, scoreEdits } = params;

  return {
    matchId: id,
    matchType: match.matchType ?? 'SINGLES',
    player1: { id: match.player1.id, name: match.player1.name },
    player2: { id: match.player2.id, name: match.player2.name },
    player1Partner: match.player1Partner ? { id: match.player1Partner.id, name: match.player1Partner.name } : null,
    player2Partner: match.player2Partner ? { id: match.player2Partner.id, name: match.player2Partner.name } : null,
    doublesSetup: match.doublesSetup ?? null,
    format: match.format,
    sportType: match.sportType,
    courtType: match.courtType ?? null,
    tournamentName: match.tournamentName ?? null,
    clubName: match.clubName ?? null,
    category: match.category ?? null,
    round: match.round ?? null,
    bracketType: match.bracketType ?? null,
    temperature: match.temperature ?? null,
    humidity: match.humidity ?? null,
    winnerId: match.winnerId ?? null,
    finishReason: match.finishReason ?? null,
    finishNote: match.finishNote ?? null,
    details: match.details ?? null,
    scoreState: responseScoreState,
    timelinePoints,
    comments: comments.map((c) => ({
      id: c.id,
      content: c.content,
      category: c.category,
      authorName: c.author.name,
      createdAt: c.createdAt.toISOString(),
      hasAudioNote: c.audioNoteDuration != null,
      audioNoteDuration: c.audioNoteDuration,
    })),
    summary,
    integrity,
    advancedStats,
    scoreEditsCount: scoreEdits.length,
    state: match.state,
    startedAt: match.startedAt,
    finishedAt: match.finishedAt,
  };
}
