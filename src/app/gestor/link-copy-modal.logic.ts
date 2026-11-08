export function buildResetLink(origin: string, token: string): string {
  return `${origin}/trocar-senha?token=${token}`;
}

export const FALLBACK_EXPIRY_TEXT = 'Este link expira em 7 dias.';

/** Formata o prazo legal do link como "Este link expira em 7 dias (válido até DD/MM/AAAA às HH:mm)". */
export function formatLinkExpiry(expiresAt?: string): string {
  if (!expiresAt) return FALLBACK_EXPIRY_TEXT;

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return FALLBACK_EXPIRY_TEXT;

  const day = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `Este link expira em 7 dias (válido até ${day} às ${time})`;
}
