import { NextRequest, NextResponse } from "next/server";
import { withRLSHandler, getRLSUser } from "@/lib/auth";
import { listSuspendedSessions } from "@/services/sessionService";
import { prisma } from "@/lib/prisma";
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

      const suspendedMatchIds = new Set(suspended.map((s) => s.match.id));
      logger.session.listing(user.id, [...suspendedMatchIds]);

      logger.info("[suspended-sessions] querying in-progress matches", [...suspendedMatchIds].length > 0 ? [...suspendedMatchIds] : "none");
      const allMatches = await prisma.match.findMany({
        where: {
          state: "IN_PROGRESS",
          id: { notIn: suspendedMatchIds.size > 0 ? [...suspendedMatchIds] : ["__never__"] },
        },
        select: {
          id: true,
          state: true,
          format: true,
          sportType: true,
          scheduledAt: true,
          scoreState: true,
          category: true,
          player1: { select: { id: true, name: true } },
          player2: { select: { id: true, name: true } },
        },
      });
      logger.info("[suspended-sessions] in-progress matches loaded", allMatches.length);

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

      logger.info("[suspended-sessions] mapping in-progress", allMatches.length);
      const matchesFromInProgress = allMatches.map((m) => {
        const scoreStateStr = m.scoreState
          ? typeof m.scoreState === "string"
            ? m.scoreState
            : JSON.stringify(m.scoreState)
          : null;

        logger.session.snapshotLoading(m.id, m.scoreState, scoreStateStr ?? "null");

        let snapshot: unknown = null;
        try {
          snapshot = scoreStateStr ? JSON.parse(scoreStateStr) : null;
          logger.session.snapshotParsed(snapshot);
        } catch (e) {
          logger.session.snapshotParseFailed(e);
        }

        return {
          id: m.id,
          player1: m.player1,
          player2: m.player2,
          state: m.state,
          format: m.format,
          sportType: m.sportType,
          scheduledAt: m.scheduledAt?.toISOString(),
          suspendedSessionId: null,
          matchStateSnapshot: scoreStateStr,
          scoreState: snapshot,
          snapshotStatus: "IN_SYNC" as const,
          snapshotPointCount: 0,
          bankPointCount: 0,
        };
      });
      logger.info("[suspended-sessions] in-progress mapped", matchesFromInProgress.length);

      const matches = [...matchesFromSessions, ...matchesFromInProgress];
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
