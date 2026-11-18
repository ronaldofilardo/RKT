import type { StaffIndicationInput } from '@/schemas/guardian';

export interface GuardianSignupPayload {
  name: string;
  identifier: string;
  password: string;
  role: 'RESPONSAVEL';
  origem?: string;
  guardianProfile: Record<string, unknown>;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

async function postJson<T>(url: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, message: data?.message || data?.error || 'Erro ao salvar. Tente novamente.' };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: 'Sem conexão. Verifique sua internet e tente novamente.' };
  }
}

/** Cria a conta do responsável (signup atômico com auto-login). */
export function postGuardianSignup(payload: GuardianSignupPayload): Promise<ApiResult<{ playerId?: string }>> {
  return postJson<{ playerId?: string }>('/api/auth/signup', payload);
}

/** Indica a equipe técnica do menor (vínculo PENDING ou convite externo). */
export function postStaffIndication(
  playerId: string,
  indication: StaffIndicationInput,
): Promise<ApiResult<{ kind?: string; inviteUrl?: string }>> {
  return postJson<{ kind?: string; inviteUrl?: string }>('/api/guardians/me/indicate-staff', {
    playerId,
    indication,
  });
}
