export interface PlayerColors {
  p1: string;
  p2: string;
  p1Border: string;
  p2Border: string;
}

export const MATCH_WINNER_TEXT = 'text-emerald-800 dark:text-telemetry-volt font-black';
export const NEUTRAL_TEXT = 'text-telemetry-text-primary';
export const WINNER_BORDER = 'border-l-telemetry-volt';
export const NEUTRAL_BORDER = 'border-l-white/10';

export const DEFAULT_PLAYER_COLORS: PlayerColors = {
  p1: NEUTRAL_TEXT,
  p2: NEUTRAL_TEXT,
  p1Border: NEUTRAL_BORDER,
  p2Border: NEUTRAL_BORDER,
};

export interface PlayerColorSource {
  state?: string | null;
  winnerId?: string | null;
  player1: { id: string };
  player2: { id: string };
  matchType?: string | null;
  player1Partner?: { id: string } | null;
  player2Partner?: { id: string } | null;
  scoreState?: unknown;
  initialServerId?: string | null;
  timelinePoints?: Array<{ server?: string | null; serverId?: string | null }>;
}

function extractServerAndSets(raw: unknown): { server: string | null; setsWon: { player1: number; player2: number } | null } {
  if (!raw) return { server: null, setsWon: null };
  let s: any = raw;
  if (typeof s === 'string') {
    try {
      const parsed = JSON.parse(s);
      s = parsed?.state ?? parsed;
    } catch {
      return { server: null, setsWon: null };
    }
  } else if (s?.state) {
    s = s.state;
  }
  return { server: s?.server ?? null, setsWon: s?.setsWon ?? null };
}

export function resolvePlayerColors(report: PlayerColorSource | null | undefined): PlayerColors {
  if (!report) return DEFAULT_PLAYER_COLORS;
  const { server: stateServer, setsWon } = extractServerAndSets(report.scoreState);

  if (report.state === 'FINISHED') {
    const p1Won =
      Boolean(report.winnerId && (report.winnerId === report.player1.id || report.winnerId === report.player1Partner?.id)) ||
      Boolean(setsWon && setsWon.player1 > setsWon.player2);
    const p2Won =
      Boolean(report.winnerId && (report.winnerId === report.player2.id || report.winnerId === report.player2Partner?.id)) ||
      Boolean(setsWon && setsWon.player2 > setsWon.player1);

    return {
      p1: p1Won ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
      p2: p2Won ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
      p1Border: p1Won ? WINNER_BORDER : NEUTRAL_BORDER,
      p2Border: p2Won ? WINNER_BORDER : NEUTRAL_BORDER,
    };
  }

  const lastPoint = Array.isArray(report.timelinePoints) && report.timelinePoints.length > 0
    ? report.timelinePoints[report.timelinePoints.length - 1] : null;
  const s = stateServer || lastPoint?.server || lastPoint?.serverId || report.initialServerId;
  const isP1Server = s === 'player1' || Boolean(s && (s === report.player1.id || s === report.player1Partner?.id));
  const isP2Server = s === 'player2' || Boolean(s && (s === report.player2.id || s === report.player2Partner?.id));

  return {
    p1: isP1Server ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
    p2: isP2Server ? MATCH_WINNER_TEXT : NEUTRAL_TEXT,
    p1Border: isP1Server ? WINNER_BORDER : NEUTRAL_BORDER,
    p2Border: isP2Server ? WINNER_BORDER : NEUTRAL_BORDER,
  };
}

