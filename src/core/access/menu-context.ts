import type { CtStatus, MeAccess, MenuContext } from './menu-types';

/** Formato de GET /api/auth/me consumido pelo menu (campos novos são opcionais). */
export interface MeResponseLike extends Partial<MeAccess> {
  user: { role?: string; mustChangePassword: boolean };
  memberships: { kind: string; ctId: string | null; status: string }[];
  ctStatus: CtStatus | null;
}

/**
 * Converte a resposta de /api/auth/me em `MenuContext`.
 * /me só responde para conta ativa (guarda de sessão), então `isActive` é true.
 * Resposta antiga (sem os campos novos) cai em valores seguros: sem seções extras.
 */
export function menuContextFromMe(me?: Partial<MeResponseLike> | null): MenuContext {
  const memberships = me?.memberships || [];
  const gestorCtIds = memberships
    .filter((m) => m?.kind === 'GESTOR' && m?.status === 'ACTIVE' && !!m?.ctId)
    .map((m) => m.ctId as string);

  return {
    isActive: true,
    mustChangePassword: Boolean(me?.user?.mustChangePassword),
    canOperate: me?.canOperate ?? false,
    isAdmin: me?.isAdmin ?? me?.user?.role === 'ADMIN',
    isSuporte: me?.isSuporte ?? false,
    gestor: gestorCtIds.length ? { ctIds: gestorCtIds, ctStatus: me?.ctStatus ?? null } : null,
    coach: me?.coach ?? null,
    athlete: me?.athlete ?? null,
  };
}
