import { NextRequest, NextResponse } from 'next/server';
import { can, type Actor, type Permission, type Resource } from '@/core/access';
import { getActor } from '@/services/accessService';
import { getAccessUserFromRequest } from './auth-credentials.logic';
import { logger } from './logger';
import { runWithRLS, type RLSUser } from './rls-context';

export interface AccessContext {
  user: RLSUser;
  actor: Actor;
}

type ResolveResource = (user: RLSUser) => Promise<Resource | undefined> | Resource | undefined;

function deny(status: 401 | 403, message: string): NextResponse {
  return NextResponse.json({ error: 'FORBIDDEN', message }, { status });
}

/**
 * Guarda das rotas novas: autentica (com `sv`), monta o ator, aplica `can()`.
 * O motivo da negação vai só para o log, nunca para o cliente.
 */
export async function withAccessHandler<T extends Response = NextResponse>(
  request: NextRequest,
  action: Permission,
  resolveResource: ResolveResource | null,
  handler: (ctx: AccessContext) => Promise<T>,
): Promise<Response | T> {
  const user = await getAccessUserFromRequest(request);
  if (!user) return deny(401, 'Token de acesso requerido');

  const actor = await getActor(user.id);
  if (!actor) return deny(401, 'Token de acesso requerido');

  const resource = resolveResource ? await resolveResource(user) : undefined;
  const decision = can(actor, action, resource);
  if (!decision.allow) {
    logger.warn(`[ACCESS] negado ${action} user=${user.id} motivo=${decision.reason}`);
    return deny(403, 'Ação não permitida');
  }

  return runWithRLS(legacyRlsUser(user), () => handler({ user, actor }));
}

/** O contexto RLS legado só aceita ADMIN|ANNOTATOR; contas sem claim legado usam ANNOTATOR sem privilégio extra (RLS é reforço, §3.6). */
function legacyRlsUser(user: RLSUser): RLSUser {
  return user.role === 'ADMIN' ? user : { id: user.id, role: 'ANNOTATOR' };
}
