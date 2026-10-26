import type { Permission } from './permissions';
import { PROFILE_MATRIX } from './profile-matrix';
import { getProfiles } from './profiles';
import { inScope } from './scope';
import type { Actor, Decision, DecisionReason, Resource } from './types';

function decide(allow: boolean, reason: DecisionReason): Decision {
  return { allow, reason };
}

/**
 * Autorização central. Nega por padrão; `reason` serve só para log
 * (nunca devolver ao cliente). Permissão = união dos perfis ativos.
 */
export function can(
  actor: Actor | null | undefined,
  action: Permission,
  resource?: Resource,
): Decision {
  if (!actor || !actor.isActive) return decide(false, 'inactive');
  let hasPermission = false;
  for (const profile of getProfiles(actor)) {
    const scopes = PROFILE_MATRIX[profile][action];
    if (!scopes) continue;
    hasPermission = true;
    if (scopes.some((s) => inScope(actor, profile, s, resource))) {
      return decide(true, 'ok');
    }
  }
  return decide(false, hasPermission ? 'out-of-scope' : 'no-permission');
}
