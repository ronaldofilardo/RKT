import type { UserSearchResult } from './types';

export async function patchUser(userId: string, data: any): Promise<void> {
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar usuário');
}

export async function patchTrainingCenter(ctId: string, data: any): Promise<void> {
  const res = await fetch(`/api/training-centers/${ctId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Falha ao atualizar clube');
}

/**
 * F4 — Busca um usuário por CPF ou e-mail para emissão de senha provisória.
 * Usa a rota existente GET /api/users?q=<termo> (campo cpf ou email).
 */
export async function searchUserByCpfOrEmail(query: string): Promise<UserSearchResult[]> {
  const res = await fetch(`/api/users?q=${encodeURIComponent(query.trim())}`);
  if (!res.ok) throw new Error('Falha ao buscar usuário');
  const data = await res.json();
  return data.items ?? [];
}

/**
 * F4 — Emite senha provisória para o userId encontrado.
 * Reutiliza a rota POST /api/support/password-resets já existente.
 */
export async function issuePasswordReset(userId: string): Promise<{ token: string; expiresAt: string }> {
  const res = await fetch('/api/support/password-resets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || 'Erro ao gerar link de senha');
  return { token: data.token, expiresAt: data.expiresAt };
}
