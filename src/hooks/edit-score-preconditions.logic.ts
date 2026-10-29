import { getPendingPointsCountForMatch } from "./offline-match-sync-pending.logic";
import type { ExecuteEditScoreOptions } from "./useSessionManager.edit-score.types";

export type PreconditionResult = { proceed: true } | { proceed: false; reason: string };

/**
 * Valida pré-condições para edição de placar: ocupado, conectividade e fila offline.
 *
 * ste-exception R-29: window.confirm mantido como fallback quando onConfirm não é
 * fornecido. A migração para AlertDialog requer refatoração do componente chamador
 * para gerenciar estado de dialog aberto/fechado.
 */
export async function checkEditScorePreconditions(
  options: ExecuteEditScoreOptions & { onConfirm?: (message: string) => Promise<boolean> },
): Promise<PreconditionResult> {
  const { ctx, matchId, onConfirm } = options;

  if (ctx.isProcessingRef?.current) {
    return { proceed: false, reason: "busy" };
  }

  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { proceed: false, reason: "Sem conexão: editar o placar exige internet." };
  }

  const pendingCount = await getPendingPointsCountForMatch(matchId);
  if (pendingCount > 0) {
    if (onConfirm) {
      const confirmed = await onConfirm(
        `Há ${pendingCount} ponto(s) pendente(s) na fila offline. A edição manual substituirá o placar e descartará esses pontos. Deseja prosseguir?`,
      );
      if (!confirmed) {
        return { proceed: false, reason: "Operação cancelada para preservar a fila offline." };
      }
    } else if (typeof window !== "undefined" && typeof window.confirm === "function") {
      const confirmed = window.confirm(
        `Há ${pendingCount} ponto(s) pendente(s) na fila offline. A edição manual substituirá o placar e descartará esses pontos. Deseja prosseguir?`,
      );
      if (!confirmed) {
        return { proceed: false, reason: "Operação cancelada para preservar a fila offline." };
      }
    } else {
      return { proceed: false, reason: "Confirmação requerida mas não disponível" };
    }
  }

  return { proceed: true };
}
