import { logger } from "@/lib/logger";
import type { Dispatch, SetStateAction } from "react";
import type { MatchData } from "./useScoringHandlers.types";

interface SetupConfirmServiceDeps {
  matchId: string;
  match: MatchData | null;
  tokenRef: React.MutableRefObject<string | null>;
  fetchMatch: (forceEngineReset?: boolean) => Promise<void>;
  close: () => void;
  setSetupLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
}

export function createSetupConfirmService({
  matchId,
  match,
  tokenRef,
  fetchMatch,
  close,
  setSetupLoading,
  setError,
}: SetupConfirmServiceDeps) {
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
