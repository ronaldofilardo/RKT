const NETWORK_MESSAGE = 'Serviço temporariamente indisponível. Verifique sua conexão.';

const CODE_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'Não encontramos uma conta com este e-mail ou CPF.',
  INVALID_PASSWORD: 'Senha incorreta. Verifique os dados digitados.',
};

interface LoginErrorLike {
  message?: string;
  code?: string;
  status?: number;
}

/** Traduz códigos técnicos da API de login para mensagens acionáveis ao usuário. */
export function humanizeLoginError(error: unknown): string {
  const err = (error ?? {}) as LoginErrorLike;

  if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
  if (typeof err.status === 'number' && err.status >= 500) return NETWORK_MESSAGE;
  if (error instanceof TypeError) return NETWORK_MESSAGE;

  return err.message || 'Erro ao fazer login';
}
