import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { listSuspendedSessions } from "@/services/sessionService";
import { prisma } from "@/lib/prisma";
import { computeSnapshotStatus } from "@/lib/snapshot-utils";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const suspended = await listSuspendedSessions(user.id);

    console.log(
      "[suspended-sessions API] sessions found:",
      JSON.stringify(
        suspended.map((s) => ({
          sessionId: s.id,
          status: s.status,
          isActive: s.isActive,
          matchId: s.match?.id,
          matchState: s.match?.state,
          hasSnapshot: !!s.matchStateSnapshot,
        })),
        null,
        2,
      ),
    );

    const suspendedMatchIds = new Set(suspended.map((s) => s.match.id));
    
    console.log('[suspended-sessions API] user.id:', user.id, 'suspendedMatchIds:', [...suspendedMatchIds]);
    
    // Buscar todas as partidas IN_PROGRESS (não filtrar por player1/player2 pois o anotador pode não ser jogador)
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
        includeLet: true,
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } },
      },
    });
    
    const matchesFromSessions = suspended
      .map((session) => {
        const m = session.match;
        const sessionSnapshotStr = session.matchStateSnapshot ?? null;
        const matchScoreState = m.scoreState
          ? typeof m.scoreState === "string"
            ? m.scoreState
            : JSON.stringify(m.scoreState)
          : null;

        let snapshotStr: string | null = sessionSnapshotStr ?? matchScoreState ?? null;
        let snapshot = null;
        try {
          snapshot = snapshotStr ? JSON.parse(snapshotStr) : null;
        } catch {}

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
          snapshotStatus: "IN_SYNC",
          snapshotPointCount: 0,
          bankPointCount: 0,
        };
      })
      .filter(Boolean);

    const matchesFromInProgress = allMatches.map((m) => {
      const scoreStateStr = m.scoreState
        ? typeof m.scoreState === "string"
          ? m.scoreState
          : JSON.stringify(m.scoreState)
        : null;
      
      console.log('[suspended-sessions API] match', m.id, 'scoreState:', m.scoreState, 'scoreStateStr:', scoreStateStr);
      
      let snapshot = null;
      try {
        snapshot = scoreStateStr ? JSON.parse(scoreStateStr) : null;
        console.log('[suspended-sessions API] parsed snapshot:', snapshot);
      } catch (e) {
        console.log('[suspended-sessions API] failed to parse:', e);
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
        snapshotStatus: "IN_SYNC",
        snapshotPointCount: 0,
        bankPointCount: 0,
      };
    });

    const matches = [...matchesFromSessions, ...matchesFromInProgress];

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[GET /api/matches/suspended-sessions] Error:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
        message: "Erro ao listar sessões suspensas",
      },
      { status: 500 },
    );
  }
}
