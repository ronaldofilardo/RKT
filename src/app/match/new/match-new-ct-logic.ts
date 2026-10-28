export type CtOption = { id: string; name: string };

/** Carrega os CTs disponíveis do ator (memberships + athleteCtIds + coachCtIds) a partir de /api/auth/me. */
export async function loadAvailableCts(): Promise<CtOption[]> {
  const response = await fetch('/api/auth/me');
  const json = await response.json();
  const cts = new Map<string, string>();
  json?.memberships?.forEach((m: { kind: string; ctId: string | null; status: string }) => {
    if (m.kind === 'GESTOR' || m.kind === 'TREINADOR') {
      if (m.ctId) cts.set(m.ctId, m.ctId);
    }
  });
  json?.athlete?.ctIds?.forEach((id: string) => { if (id) cts.set(id, id); });
  json?.coach?.ctIds?.forEach((id: string) => { if (id) cts.set(id, id); });
  return Array.from(cts.keys()).map((id) => ({ id, name: id }));
}
