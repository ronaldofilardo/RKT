export interface LoginResponse {
  accessToken?: string;
  user: {
    id: string;
    role: string;
    profile?: string;
    name?: string;
    email?: string;
    cpf?: string;
  };
}

/**
 * POST /api/auth/login.
 * Extrai o I/O da página de login (R-04). Lança `Error` com a mensagem do
 * servidor (ou a mensagem padrão) quando a resposta não é ok.
 */
export async function loginRequest(payload: {
  identifier?: string;
  email?: string;
  password: string;
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
    };
    throw new Error(data.message || data.error || 'Erro ao fazer login');
  }

  return res.json();
}
