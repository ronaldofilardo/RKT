import { logger } from "@/lib/logger";
import type { PersistStateOptions, VersionConflictPayload } from "./persistence.types";
import type { PersistResult } from "./useScoringHandlers.persistence";

export async function readConflict(response: Response): Promise<VersionConflictPayload> {
  try {
    return (await response.json()) as VersionConflictPayload;
  } catch {
    return {};
  }
}

export async function handleVersionConflict(
  label: string,
  options: PersistStateOptions,
  currentMatch: { version?: number | null },
  conflict: VersionConflictPayload,
): Promise<PersistResult> {
  const { setError, fetchMatch } = options;
  logger.persist.conflict(label, conflict.currentVersion, currentMatch.version);

  if (!fetchMatch) {
    setError("Conflito de versão: re-sincronize o placar manualmente");
    return { success: false, needsResync: true, conflict: true };
  }

  try {
    await fetchMatch(true);
  } catch (refetchErr) {
    logger.persist.refetchFailed(label, refetchErr);
    setError("Conflito de versão: re-sincronize o placar manualmente");
    return { success: false, needsResync: true, conflict: true };
  }

  setError(
    label === "undo"
      ? "Outro dispositivo atualizou o placar. Sincronizado com a versão mais recente."
      : "Conflito de versão resolvido: placar re-sincronizado.",
  );
  return { success: false, needsResync: true, conflict: true };
}
