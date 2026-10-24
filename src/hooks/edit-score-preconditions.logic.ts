import { getPendingPointsCountForMatch } from "./offline-match-sync-pending.logic";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";

export type PreconditionResult = { proceed: true } | { proceed: false; reason: string };

/**
 * Valida pré-condições para edição de placar: ocupado, conectividade e fila offline.
 */
export async function checkEditScorePreconditions(
  options: ExecuteEditScoreOptions,
): Promise<PreconditionResult> {
  const { ctx, matchId } = options;

  if (ctx.isProcessingRef?.current) {
    return { proceed: false, reason: "busy" };
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { proceed: false, reason: "Sem conexão: editar o placar exige internet." };
  }

  const pendingCount = await getPendingPointsCountForMatch(matchId);
  if (pendingCount > 0) {
    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const confirmed = window.confirm(
        `Há ${pendingCount} ponto(s) pendente(s) na fila offline. A edição manual substituirá o placar e descartará esses pontos. Deseja prosseguir?`,
      );
      if (!confirmed) {
        return { proceed: false, reason: "Operação cancelada para preservar a fila offline." };
      }
    }
  }

  return { proceed: true };
}
