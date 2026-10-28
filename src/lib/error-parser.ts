/**
 * Traduz qualquer resposta/exceção de API em texto claro, acionável e acolhedor em português.
 * Puro: sem efeitos colaterais, < 100 linhas (R-03).
 */
export function extractErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado. Tente novamente.'): string {
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    if (/failed to fetch/i.test(error.message)) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
    }
    return error.message;
  }

  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;

    if (typeof e.message === 'string' && e.message !== e.code) {
      return e.message;
    }

    const details = e.details as Record<string, unknown> | undefined;
    if (details && typeof details === 'object') {
      const fieldErrors = details.fieldErrors as Record<string, string[]> | undefined;
      if (fieldErrors) {
        const [field, msgs] = Object.entries(fieldErrors)[0] ?? [];
        if (field && msgs?.[0]) {
          return `${field}: ${msgs[0]}`;
        }
      }
    }

    if (typeof e.code === 'string') {
      const dicionario: Record<string, string> = {
        VALIDATION_ERROR: 'Dados inválidos. Verifique os campos preenchidos.',
        CONFLICT: 'Este e-mail ou CPF já está cadastrado no sistema.',
        NOT_FOUND: 'O registro solicitado não foi encontrado.',
        FORBIDDEN: 'Ação não permitida para o seu perfil de acesso.',
        UNAUTHORIZED: 'Sessão expirada. Faça login novamente.',
        INTERNAL_ERROR: 'Não conseguimos processar esta ação no momento. Nossa equipe foi notificada.',
        INVALID_JSON: 'Dados da requisição incompletos. Atualize a página e tente novamente.',
        CLUBE_SUSPENSO: 'Este clube encontra-se temporariamente suspenso pelo suporte.',
      };
      const traducao = dicionario[e.code];
      if (traducao) return traducao;
    }
  }

  return fallback;
}
