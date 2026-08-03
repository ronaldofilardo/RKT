import { NextRequest, NextResponse } from "next/server";
import { withRLSHandler, getRLSUser } from "@/lib/auth";
import { listSuspendedSessions } from "@/services/sessionService";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  return withRLSHandler(request, "SPECTATOR", async () => {
    try {
      const user = getRLSUser();
      if (!user) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      logger.info("[suspended-sessions] listing start", user.id);
      const suspended = await listSuspendedSessions(user.id);
      logger.info("[suspended-sessions] listing done", suspended.length);

      logger.info("[suspended-sessions] mapping sessions", suspended.length);
      const matchesFromSessions = suspended
        .map((session) => {
          const m = session.match;
          const sessionSnapshotStr = session.matchStateSnapshot ?? null;
          const matchScoreState = m.scoreState
            ? typeof m.scoreState === "string"
              ? m.scoreState
              : JSON.stringify(m.scoreState)
            : null;

          const snapshotStr: string | null = sessionSnapshotStr ?? matchScoreState ?? null;
          let snapshot: unknown = null;
          try {
            snapshot = snapshotStr ? JSON.parse(snapshotStr) : null;
          } catch (e) {
            logger.warn("[suspended-sessions] snapshot parse failed (session):", e);
          }

          return {
            id: m.id,
            player1: m.player1,
            player2: m.player2,
            state: m.state,
            format: m.format,
            sportType: m.sportType,
            scheduledAt: m.scheduledAt?.toISOString(),
            suspendedSessionId: session.id,
            matchStateSnapshot: snapshotStr,
            scoreState: snapshot,
            snapshotStatus: "IN_SYNC" as const,
            snapshotPointCount: 0,
            bankPointCount: 0,
          };
        })
        .filter(Boolean);
      logger.info("[suspended-sessions] sessions mapped", matchesFromSessions.length);

      const matches = matchesFromSessions;
      logger.info("[suspended-sessions] returning", matches.length);

      return NextResponse.json({ matches });
    } catch (error) {
      logger.error("[GET /api/matches/suspended-sessions] Error:", error);
      return NextResponse.json(
        {
          error: "INTERNAL_SERVER_ERROR",
          message: "Erro ao listar sessões suspensas",
        },
        { status: 500 },
      );
    }
  });
}
