import { logger } from "@/lib/logger";
import type { ScoringHandlersContext } from "./useScoringHandlers.types";

interface SetupConfirmServiceDeps {
  ctx: ScoringHandlersContext;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
}

export function createSetupConfirmService({
  ctx,
  fetchMatch,
}: SetupConfirmServiceDeps) {
  const { matchId, match, tokenRef, close, setSetupLoading, setError } = ctx;
  const confirmMatchSetup = async (serverId: string): Promise<void> => {
    if (!match) return;
    setSetupLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/state`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${tokenRef.current}`,
        },
        body: JSON.stringify({
          state: "IN_PROGRESS",
          initialServerId: serverId,
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
