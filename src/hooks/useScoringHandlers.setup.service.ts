import { logger } from "@/lib/logger";
import type { DoublesSetup } from "@/schemas/contracts";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";

interface SetupConfirmServiceDeps {
  ctx: ScoringHandlersContext;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
}

export function createSetupConfirmService({
  ctx,
  fetchMatch,
}: SetupConfirmServiceDeps) {
  const { matchId, match, tokenRef, close, setSetupLoading, setError, setMatch } = ctx;
  const confirmMatchSetup = async (serverId: string, doublesSetup?: DoublesSetup): Promise<void> => {
    if (!match) return;
    setSetupLoading(true);
    try {
      const effectiveDoublesSetup = doublesSetup ?? (match.doublesSetup as DoublesSetup | undefined);
      setMatch((prev) =>
        prev
          ? {
              ...prev,
              state: "IN_PROGRESS",
              initialServerId: serverId,
              doublesSetup: effectiveDoublesSetup ?? prev.doublesSetup,
            }
          : prev,
      );

      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(tokenRef.current ? { authorization: `Bearer ${tokenRef.current}` } : {}),
        },
        body: JSON.stringify({
          state: "IN_PROGRESS",
          initialServerId: serverId,
          ...(effectiveDoublesSetup ? { doublesSetup: effectiveDoublesSetup } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      close();
      await fetchMatch(true);
    } catch (err) {
      logger.error("[confirmMatchSetup]", err);
      setError("Erro ao iniciar partida");
    } finally {
      setSetupLoading(false);
    }
  };

  return { confirmMatchSetup };
}
