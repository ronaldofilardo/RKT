/**
 * Validação rigorosa contra vulnerabilidades de Open Redirect (CWE-601).
 * Garante que o redirecionamento permaneça estritamente no mesmo domínio e origem relativa.
 */
export function sanitizeNextRedirect(rawNext: string | null | undefined, fallback: string): string {
  if (!rawNext || typeof rawNext !== 'string') {
    return fallback;
  }

  const trimmed = rawNext.trim();

  // Bloqueia tentativas de protocolo absoluto (http:, https:, javascript:, data:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  // Bloqueia protocolo relativo (//evil.com) ou barra invertida (/\\evil.com ou \evil.com)
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return fallback;
  }

  // Deve iniciar estritamente com uma única barra relativa
  if (!trimmed.startsWith('/')) {
    return fallback;
  }

  // Bloqueia caracteres de controle ou carriage return / newline injection (%0d, %0a, etc.)
  if (/[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  // Tenta analisar com URL para garantir que não resulte em origin externo
  try {
    const dummyBase = 'https://rkt.local';
    const parsed = new URL(trimmed, dummyBase);
    if (parsed.origin !== dummyBase) {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

