import type { EndSessionInput } from '@/schemas/contracts';

const VALID_STATUSES = ['COMPLETED', 'ABANDONED', 'IN_PROGRESS'] as const;

export function isValidSessionStatus(status: string): boolean {
  return (VALID_STATUSES as readonly string[]).includes(status);
}

export function serializeSessionState(state: unknown): string | null {
  if (!state) return null;
  return typeof state === 'string' ? state : JSON.stringify(state);
}

export function buildSessionUpdateData(
  status: string,
  input: EndSessionInput,
  matchState: unknown,
): Record<string, unknown> {
  const updateData: Record<string, unknown> = { status };
  const finalState = input.finalState || matchState;

  if (status === 'IN_PROGRESS') {
    updateData.isActive = true;
  }
  if (status === 'ABANDONED') {
    updateData.isActive = false;
    updateData.matchStateSnapshot = serializeSessionState(finalState);
  }
  if (status === 'COMPLETED') {
    updateData.isActive = false;
    updateData.endedAt = new Date();
    updateData.finalStateSnapshot = serializeSessionState(finalState);
  }
  return updateData;
}
