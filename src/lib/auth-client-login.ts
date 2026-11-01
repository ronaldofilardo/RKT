export interface SessionContextOption {
  id: string;
  label: string;
  role: string;
  type: 'CT' | 'PARTICULAR' | 'PLATAFORMA';
}

export interface LoginResponse {
  accessToken?: string;
  requireContext?: boolean;
  availableContexts?: SessionContextOption[];
  activeContextId?: string | null;
  user: {
    id: string;
    role?: string;
    profile?: string;
    name?: string;
    email?: string;
    cpf?: string;
    mustChangePassword?: boolean;
  };
}

/**
 * POST /api/auth/login.
 * Extrai o I/O da página de login (R-04). Lança `Error` com a mensagem do
 * servidor quando a resposta não for ok.
 */
export async function loginRequest(payload: {
  identifier?: string;
  email?: string;
  password: string;
  contextId?: string;
}): Promise<LoginResponse> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
      code?: string;
      data?: { message?: string; error?: string; code?: string };
    };
    const errorMsg =
      data.message ||
      data.data?.message ||
      data.error ||
      'Erro ao fazer login';
    const err = new Error(errorMsg);
    (err as any).code = data.code || data.data?.code || data.error;
    throw err;
  }

  return res.json();
}
