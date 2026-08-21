import { NextRequest, NextResponse } from "next/server";
import { withRLSHandler, getRLSUser } from "@/lib/auth";
import { listSuspendedSessions } from "@/services/sessionService";
import { logger } from "@/lib/logger";
import { mapSuspendedSession } from './route.helpers';

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
      const matchesFromSessions = suspended.map(mapSuspendedSession);
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
