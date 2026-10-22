import { logger } from "@/lib/logger";
import type { ScoringEngine } from "@/core/scoring/engine";
import type { DoublesArrangement } from "@/core/scoring/types";
import type { MatchData } from "./useScoringHandlers.types";

interface ArrangementServiceDeps {
  match: MatchData | null;
  matchId: string;
  engineRef: React.MutableRefObject<ScoringEngine | null>;
  matchVersionRef: React.MutableRefObject<number | null>;
  tokenRef: React.MutableRefObject<string | null>;
  fetchMatch: (forceReset?: boolean) => Promise<void>;
}

export function createArrangementService({
  match,
  matchId,
  engineRef,
  matchVersionRef,
  tokenRef,
  fetchMatch,
}: ArrangementServiceDeps) {
  const postArrangement = async (
    arrangement: DoublesArrangement,
    afterSet: number,
    version: number,
  ): Promise<Response> =>
    fetch(`/api/matches/${matchId}/arrangement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(tokenRef.current
          ? { Authorization: `Bearer ${tokenRef.current}` }
          : {}),
      },
      body: JSON.stringify({
        afterSet,
        version,
        serveOrder: arrangement.serveOrder,
        serveIndex: arrangement.serveIndex,
        receiveDeuce: arrangement.receiveDeuce,
        setIndex: afterSet,
        expectedVersion: version,
      }),
    });

  const updateDoublesArrangement = async (
    arrangement: DoublesArrangement,
  ): Promise<void> => {
    if (!match || match.matchType !== "DOUBLES") return;
    try {
      const state = engineRef.current?.getState();
      const setIndex = (state?.sets.length || 1) - 1;
      const afterSet = Math.max(0, setIndex);
      const currentVersion = matchVersionRef.current ?? match.version ?? 0;

      let res = await postArrangement(arrangement, afterSet, currentVersion);

      // Se houver conflito de versão (409) decorrente de edição anterior, reidrata do servidor e retenta
      if (res.status === 409) {
        await fetchMatch(true);
        const updatedVersion = matchVersionRef.current ?? match.version ?? 0;
        res = await postArrangement(arrangement, afterSet, updatedVersion);
      }

      if (res.ok) {
        engineRef.current?.setArrangement(arrangement);
        await fetchMatch(true);
      } else {
        logger.error(
          "[updateDoublesArrangement] Falha na API de arrangement",
          await res.text(),
        );
      }
    } catch (err) {
      logger.error("[updateDoublesArrangement] Erro de rede", err);
    }
  };

  return { updateDoublesArrangement };
}
