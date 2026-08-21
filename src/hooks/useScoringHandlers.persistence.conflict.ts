import { logger } from "@/lib/logger";

interface ConflictPayload {
  currentVersion?: number;
}

interface ConflictContext {
  label: string;
  currentVersion?: number | null;
  fetchMatch?: (forceEngineReset?: boolean) => Promise<void>;
  setError: (error: string | null) => void;
}

export async function handleVersionConflict(
  response: Response,
  context: ConflictContext,
): Promise<{ success: boolean; needsResync: boolean; conflict: boolean }> {
  const errorData = await response.json().catch(() => ({})) as ConflictPayload;
  logger.persist.conflict(context.label, errorData.currentVersion, context.currentVersion);

  if (!context.fetchMatch) {
    context.setError("Conflito de versão: re-sincronize o placar manualmente");
    return { success: false, needsResync: true, conflict: true };
  }

  try {
    await context.fetchMatch(true);
  } catch (refetchErr) {
    logger.persist.refetchFailed(context.label, refetchErr);
    context.setError("Conflito de versão: re-sincronize o placar manualmente");
    return { success: false, needsResync: true, conflict: true };
  }

  context.setError(
    context.label === "undo"
      ? "Outro dispositivo atualizou o placar. Sincronizado com a versão mais recente."
      : "Conflito de versão resolvido: placar re-sincronizado.",
  );
  return { success: false, needsResync: true, conflict: true };
}
