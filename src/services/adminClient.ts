/**
 * Cliente HTTP das rotas de administração consumidas pela UI.
 * Extrai o I/O dos componentes (R-04) seguindo o padrão de
 * `annotationSessionService`.
 */

/** Usuário retornado pelas rotas de admin. */
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  role: string;
  club: string | null;
  createdAt: string;
}

interface AdminClientConfig {
  baseUrl: string;
}

async function requestJson<T>(
  baseUrl: string,
  endpoint: string,
  options: RequestInit,
  errorMessage: string,
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) throw new Error(errorMessage);
  return response.json();
}

export interface AdminUserListResponse {
  data?: { users?: AdminUser[] };
  users?: AdminUser[];
}

function createAdminClient(config: AdminClientConfig) {
  const { baseUrl } = config;

  return {
    listUsers: (token: string | null): Promise<AdminUserListResponse> =>
      requestJson(
        baseUrl,
        "/admin/users",
        { headers: { authorization: `Bearer ${token}` } },
        "Erro ao carregar usuários",
      ),

    updateUserRole: (
      userId: string,
      role: string,
      token: string | null,
    ): Promise<unknown> =>
      requestJson(
        baseUrl,
        `/admin/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        },
        "Erro ao atualizar role",
      ),

    deleteUser: (userId: string, token: string | null): Promise<unknown> =>
      requestJson(
        baseUrl,
        `/admin/users/${userId}`,
        { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
        "Erro ao excluir usuário",
      ),
  };
}

export const adminClient = createAdminClient({ baseUrl: "/api" });
